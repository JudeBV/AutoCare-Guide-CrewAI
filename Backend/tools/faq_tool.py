"""Custom FAQ Search Tool for AutoCare Guide CrewAI Backend with Semantic Indexing, Category Restriction, and Candidate Re-ranking."""

import json
import math
import os
import re
from typing import List, Dict, Any, Optional, Type, Tuple
import numpy as np
from pydantic import BaseModel, Field
from crewai.tools import BaseTool


class FAQSearchInput(BaseModel):
    """Input schema for FAQSearchTool supporting category-restricted semantic search."""
    query: str = Field(..., description="The user question or search query to find in the AutoCare FAQ dataset.")
    category: Optional[str] = Field(default=None, description="Optional suggested category to restrict search candidates.")
    request_type: Optional[str] = Field(default=None, description="Optional classified request type (INFORMATIONAL, VEHICLE_SYMPTOM, COMPLAINT, etc.).")


class FAQSearchTool(BaseTool):
    """Custom search tool for looking up vehicle questions in the approved 25-entry AutoCare FAQ dataset using category restriction and semantic similarity indexing."""

    name: str = "faq_search_tool"
    description: str = (
        "Searches the approved AutoCare FAQ JSON dataset using semantic indexing, category restriction, and candidate re-ranking. "
        "Supports paraphrased, conversational, shortened, and misspelled questions. "
        "Returns relevant FAQ IDs, match types, and approved answers, or returns 'no_match' if no reliable match exists. "
        "Does not invent information or modify the dataset."
    )
    args_schema: Type[BaseModel] = FAQSearchInput
    dataset_path: str = Field(default="")

    _faqs_cache: List[Dict[str, Any]] = []
    _vocab: Dict[str, int] = {}
    _idf: np.ndarray = np.array([])
    _faq_vectors: np.ndarray = np.array([])

    def __init__(self, dataset_path: Optional[str] = None, **kwargs):
        if dataset_path:
            kwargs["dataset_path"] = dataset_path
        super().__init__(**kwargs)

        if not self.dataset_path:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            possible_paths = [
                os.path.join(base_dir, "Data", "autocare-faq.json"),
                os.path.join(os.getcwd(), "Backend", "Data", "autocare-faq.json"),
                os.path.join(os.getcwd(), "Data", "autocare-faq.json"),
            ]
            for path in possible_paths:
                if os.path.exists(path):
                    self.dataset_path = path
                    break

        self._build_semantic_index()

    def _load_faqs(self) -> List[Dict[str, Any]]:
        """Safely read and parse the FAQ dataset without modifying it."""
        if self._faqs_cache:
            return self._faqs_cache
        if not self.dataset_path or not os.path.exists(self.dataset_path):
            return []
        try:
            with open(self.dataset_path, "r", encoding="utf-8") as f:
                data = json.load(f)
                self._faqs_cache = data.get("faqs", [])
                return self._faqs_cache
        except Exception:
            return []

    def _normalize_text(self, text: str) -> str:
        """Perform text normalization: lowercasing, punctuation removal, typo correction, and term expansion."""
        t = text.lower().strip()
        t = re.sub(r"[^\w\s]", " ", t)

        typo_map = {
            r"\bmaintainence\b": "maintenance",
            r"\bmaintainance\b": "maintenance",
            r"\bmaintenence\b": "maintenance",
            r"\blicence\b": "license",
            r"\btire\b": "tyre",
            r"\btires\b": "tyres",
            r"\baircon\b": "ac",
            r"\bair-conditioner\b": "ac",
            r"\bair conditioning\b": "ac",
            r"\bair conditioner\b": "ac",
            r"\bservicing\b": "service",
            r"\bservices\b": "service",
            r"\bsponge\b": "spongy",
            r"\bcolor\b": "colour",
            r"\bworkshop\b": "service centre",
            r"\bgarage\b": "service centre",
        }
        for pattern, replacement in typo_map.items():
            t = re.sub(pattern, replacement, t)

        t = re.sub(r"\s+", " ", t).strip()
        return t

    def _extract_features(self, text: str) -> List[str]:
        """Extract word n-grams and character 3-grams for semantic representation."""
        norm_text = self._normalize_text(text)
        words = [w for w in re.findall(r"\b\w+\b", norm_text) if len(w) > 1]
        features = list(words)
        
        # Word bigrams
        for i in range(len(words) - 1):
            features.append(f"{words[i]}_{words[i+1]}")
            
        # Character 3-grams
        clean_compact = "".join(words)
        for i in range(len(clean_compact) - 2):
            features.append(f"c3:{clean_compact[i:i+3]}")
            
        return features

    def _build_semantic_index(self):
        """Build TF-IDF semantic vector index at startup for instant vector similarity lookup."""
        faqs = self._load_faqs()
        if not faqs:
            return

        documents = []
        for faq in faqs:
            # Combine all semantic fields for indexing
            doc_text = " ".join([
                faq.get("question", ""),
                " ".join(faq.get("alternate_questions", [])),
                " ".join(faq.get("keywords", [])),
                faq.get("category", ""),
                faq.get("answer", "")
            ])
            documents.append(self._extract_features(doc_text))

        # Build vocabulary
        vocab = {}
        for doc in documents:
            for feat in doc:
                if feat not in vocab:
                    vocab[feat] = len(vocab)
        self._vocab = vocab

        num_docs = len(documents)
        num_feats = len(vocab)
        if num_feats == 0:
            return

        # Compute Document Frequency (DF) and IDF
        df = np.zeros(num_feats, dtype=np.float32)
        for doc in documents:
            unique_feats = set(doc)
            for feat in unique_feats:
                df[vocab[feat]] += 1.0

        self._idf = np.log((num_docs + 1.0) / (df + 1.0)) + 1.0

        # Build TF-IDF document vectors
        self._faq_vectors = np.zeros((num_docs, num_feats), dtype=np.float32)
        for doc_idx, doc in enumerate(documents):
            tf = {}
            for feat in doc:
                tf[feat] = tf.get(feat, 0) + 1
            for feat, count in tf.items():
                feat_idx = vocab[feat]
                self._faq_vectors[doc_idx, feat_idx] = count * self._idf[feat_idx]
            norm = np.linalg.norm(self._faq_vectors[doc_idx])
            if norm > 0:
                self._faq_vectors[doc_idx] /= norm

    def _compute_query_vector(self, query: str) -> np.ndarray:
        """Vectorize incoming query using cached vocabulary and IDF weights."""
        if not self._vocab:
            return np.array([])
        vec = np.zeros(len(self._vocab), dtype=np.float32)
        features = self._extract_features(query)
        tf = {}
        for feat in features:
            if feat in self._vocab:
                tf[feat] = tf.get(feat, 0) + 1
        for feat, count in tf.items():
            feat_idx = self._vocab[feat]
            vec[feat_idx] = count * self._idf[feat_idx]
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec /= norm
        return vec

    def _is_out_of_scope(self, query: str) -> bool:
        """Detect obvious non-automotive or out-of-scope topics."""
        q_lower = query.lower()
        out_of_scope_phrases = [
            "driving licence", "driving license", "renew driving", "renew my licence",
            "renew my license", "paint my car", "colour should i paint", "what colour should i",
            "insurance cost", "buy a car", "sell my car", "cooking", "weather"
        ]
        return any(phrase in q_lower for phrase in out_of_scope_phrases)

    def search_faqs(self, query: str, category: Optional[str] = None, request_type: Optional[str] = None) -> str:
        """Execute category-restricted semantic search and candidate re-ranking."""
        if self._is_out_of_scope(query):
            return json.dumps({
                "matched_faq_ids": [],
                "status": "no_match",
                "match_type": "NO_MATCH",
                "message": "Query is out of scope for AutoCare technical FAQ dataset."
            })

        faqs = self._load_faqs()
        if not faqs:
            return json.dumps({
                "matched_faq_ids": [],
                "status": "no_match",
                "match_type": "NO_MATCH",
                "reason": "FAQ dataset empty or missing"
            })

        # Category mapping for normalized matching
        category_map = {
            "Dashboard Warning Lights": ["Dashboard Warning Lights", "dashboard"],
            "Scheduled Maintenance": ["Scheduled Maintenance", "service_interval", "maintenance"],
            "Brakes and Safety": ["Brakes and Safety", "braking", "brakes"],
            "Tyres": ["Tyres", "tires", "tyre"],
            "Air Conditioning": ["Air Conditioning", "ac", "cooling"],
            "Battery": ["Battery", "electrical"],
            "Service Appointments": ["Service Appointments", "workshop"],
            "Billing and Complaints": ["Billing and Complaints", "billing", "complaints"],
            "Warranty": ["Warranty", "warranty_claim"]
        }

        norm_query = self._normalize_text(query)
        q_vec = self._compute_query_vector(query)

        # Stage 3: Category Restriction Filter
        candidate_faqs = []
        for faq_idx, faq in enumerate(faqs):
            faq_cat = faq.get("category", "")
            
            # Rule for COMPLAINT request type
            if request_type == "COMPLAINT":
                # Search complaint/billing/warranty FAQs only
                if faq_cat not in ["Billing and Complaints", "Warranty"]:
                    continue
            elif category and category not in ["clarification", "general", "out_of_scope", "policy_violation"]:
                # If specific category provided, verify candidate compatibility
                cat_match = False
                for target_cat, keywords in category_map.items():
                    if target_cat.lower() in category.lower():
                        if faq_cat == target_cat or any(k in faq_cat.lower() for k in keywords):
                            cat_match = True
                            break
                if not cat_match and faq_cat != category:
                    continue

            candidate_faqs.append((faq_idx, faq))

        if not candidate_faqs:
            # Fallback to all FAQs if category filter yielded no candidates and not a strict complaint
            if request_type != "COMPLAINT":
                candidate_faqs = list(enumerate(faqs))
            else:
                return json.dumps({
                    "matched_faq_ids": [],
                    "status": "no_match",
                    "match_type": "NO_MATCH",
                    "message": "No relevant complaint FAQ found matching query."
                })

        # Stage 4: Semantic Similarity Scoring
        candidates = []
        for faq_idx, faq in candidate_faqs:
            sim_score = 0.0
            if len(q_vec) > 0 and len(self._faq_vectors) > faq_idx:
                sim_score = float(np.dot(q_vec, self._faq_vectors[faq_idx]))

            # Boost exact / alternate question subphrase matches
            norm_q = self._normalize_text(faq.get("question", ""))
            norm_alts = [self._normalize_text(alt) for alt in faq.get("alternate_questions", [])]

            match_type = "SEMANTIC"
            if norm_query == norm_q or norm_query in norm_q or norm_q in norm_query:
                sim_score += 0.5
                match_type = "EXACT"
            elif any(norm_query == alt or norm_query in alt or alt in norm_query for alt in norm_alts):
                sim_score += 0.4
                match_type = "ALTERNATE_QUESTION"

            candidates.append({
                "id": faq.get("id", ""),
                "category": faq.get("category", ""),
                "question": faq.get("question", ""),
                "answer": faq.get("answer", ""),
                "score": sim_score,
                "match_type": match_type
            })

        # Sort candidate pool by semantic score
        candidates.sort(key=lambda x: x["score"], reverse=True)

        # Stage 5: Candidate Re-Ranking & Match Selection
        top_candidates = candidates[:3]
        
        # Check minimum semantic relevance threshold
        MIN_SEMANTIC_THRESHOLD = 0.18
        valid_candidates = [c for c in top_candidates if c["score"] >= MIN_SEMANTIC_THRESHOLD]

        if not valid_candidates:
            return json.dumps({
                "matched_faq_ids": [],
                "status": "no_match",
                "match_type": "NO_MATCH",
                "message": "No reliable FAQ match found meeting semantic relevance threshold."
            })

        best_match = valid_candidates[0]
        selected = [best_match]

        # Multi-match rule: include 2nd match only if score is very close and category matches
        if len(valid_candidates) > 1:
            second = valid_candidates[1]
            if second["score"] >= 0.85 * best_match["score"] and second["category"] == best_match["category"]:
                selected.append(second)

        matched_ids = [m["id"] for m in selected]

        return json.dumps({
            "matched_faq_ids": matched_ids,
            "status": "match_found",
            "match_type": best_match["match_type"],
            "matches": [
                {
                    "id": m["id"],
                    "category": m["category"],
                    "question": m["question"],
                    "answer": m["answer"],
                    "match_type": m["match_type"]
                }
                for m in selected
            ]
        }, indent=2)

    def _run(self, query: str, **kwargs) -> str:
        """Tool execution endpoint."""
        category = kwargs.get("category")
        request_type = kwargs.get("request_type")
        return self.search_faqs(query, category=category, request_type=request_type)

