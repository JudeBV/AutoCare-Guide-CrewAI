"""Structured End-to-End Quality Evaluation for AutoCare Guide Chatbot."""

import json
import os
import sys
from typing import Dict, Any, List

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import run_flow
from models import AutoCareResponse


def evaluate_all():
    data_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "Data")
    test_msgs_file = os.path.join(data_dir, "autocare-test-messages.json")
    paraphrase_file = os.path.join(data_dir, "autocare-paraphrase-dataset.json")

    with open(test_msgs_file, "r", encoding="utf-8") as f:
        test_msgs_data = json.load(f).get("test_messages", [])

    with open(paraphrase_file, "r", encoding="utf-8") as f:
        paraphrase_data = json.load(f).get("eval_items", [])

    # Map expected values from test messages schema
    combined_items = []
    for item in test_msgs_data:
        # Convert decision to expected request_type
        exp_dec = item.get("expected_decision", "ANSWER")
        exp_cat = item.get("expected_category", "general")
        exp_faqs = item.get("expected_faq_ids", [])
        exp_faq = exp_faqs[0] if exp_faqs else "none"
        
        req_type_map = {
            "ANSWER": "INFORMATIONAL" if "How" in item["message"] or "What" in item["message"] else "VEHICLE_SYMPTOM",
            "CLARIFY": "UNCLEAR",
            "ESCALATE_SUPPORT": "COMPLAINT",
            "ESCALATE_EMERGENCY": "EMERGENCY",
            "REFUSE_UNSAFE": "UNSAFE_REQUEST",
            "REFUSE_ILLEGAL": "ILLEGAL_REQUEST",
            "REFUSE_SECURITY": "SECURITY_OR_PROMPT_INJECTION",
            "OUT_OF_SCOPE": "OUT_OF_SCOPE"
        }
        exp_req = req_type_map.get(exp_dec, "INFORMATIONAL")

        combined_items.append({
            "source": "autocare-test-messages.json",
            "id": item["id"],
            "query": item["message"],
            "expected_intent": exp_req,
            "expected_category": exp_cat,
            "expected_faq_id": exp_faq,
            "expected_decision": exp_dec
        })

    for item in paraphrase_data:
        combined_items.append({
            "source": "autocare-paraphrase-dataset.json",
            "id": item["id"],
            "query": item["query"],
            "expected_intent": item["expected_request_type"],
            "expected_category": item["expected_category"],
            "expected_faq_id": item["expected_faq_id"],
            "expected_decision": item.get("expected_decision", "ANSWER")
        })

    print(f"Total test cases collected: {len(combined_items)}")

    eval_results = []
    
    # Counters for metrics
    class_correct = 0
    faq_retrieval_correct = 0
    complaint_correct = 0
    complaint_total = 0
    emergency_correct = 0
    emergency_total = 0
    no_match_correct = 0
    no_match_total = 0
    retrieval_total = 0
    e2e_correct = 0

    for idx, test in enumerate(combined_items, 1):
        query = test["query"]
        exp_intent = test["expected_intent"]
        exp_cat = test["expected_category"]
        exp_faq = test["expected_faq_id"]
        exp_dec = test["expected_decision"]

        res: AutoCareResponse = run_flow(query)

        act_intent = res.request_type or "INFORMATIONAL"
        act_cat = res.category
        act_faq = res.matched_faq_ids[0] if res.matched_faq_ids else "none"
        act_dec = res.decision
        norm_query = res.query_understanding.normalized_query if res.query_understanding else query

        # Grounding check: verify that if FAQ or policy source is cited, response actually contains it
        grounded = True
        if act_faq != "none":
            grounded = (act_faq in res.response or any(act_faq in ev.source for ev in res.evidence))

        # Check intent / classification correctness
        intent_pass = (act_intent == exp_intent or act_dec == exp_dec)
        if intent_pass:
            class_correct += 1

        # Check FAQ retrieval
        if exp_faq != "none":
            retrieval_total += 1
            faq_pass = (exp_faq in res.matched_faq_ids)
            if faq_pass:
                faq_retrieval_correct += 1
        else:
            no_match_total += 1
            faq_pass = (act_faq == "none")
            if faq_pass:
                no_match_correct += 1

        # Check complaint routing
        if exp_intent == "COMPLAINT" or exp_dec == "ESCALATE_SUPPORT":
            complaint_total += 1
            if act_dec == "ESCALATE_SUPPORT" and act_intent == "COMPLAINT":
                complaint_correct += 1

        # Check emergency routing
        if exp_intent == "EMERGENCY" or exp_dec == "ESCALATE_EMERGENCY":
            emergency_total += 1
            if act_dec == "ESCALATE_EMERGENCY" and act_intent == "EMERGENCY":
                emergency_correct += 1

        # End-to-end pass condition
        is_pass = intent_pass and faq_pass and (act_dec == exp_dec or (exp_dec == "ANSWER" and act_dec == "ANSWER")) and grounded

        failing_component = "None"
        if not is_pass:
            if not intent_pass:
                failing_component = "Classifier"
            elif not faq_pass:
                failing_component = "FAQ Retrieval"
            elif not grounded:
                failing_component = "Response Writer"
            elif act_dec != exp_dec:
                failing_component = "Decision Agent"

        if is_pass:
            e2e_correct += 1

        eval_results.append({
            "num": idx,
            "id": test["id"],
            "source": test["source"],
            "query": query,
            "norm_query": norm_query,
            "exp_intent": exp_intent,
            "act_intent": act_intent,
            "exp_cat": exp_cat,
            "act_cat": act_cat,
            "exp_faq": exp_faq,
            "act_faq": act_faq,
            "exp_dec": exp_dec,
            "act_dec": act_dec,
            "grounded": "Yes" if grounded else "No",
            "status": "PASS" if is_pass else "FAIL",
            "failing_component": failing_component
        })

    # Save structured json output of results
    with open(os.path.join(data_dir, "e2e_eval_report.json"), "w", encoding="utf-8") as f:
        json.dump({
            "summary": {
                "total": len(combined_items),
                "classification_accuracy": (class_correct / len(combined_items)) * 100.0,
                "faq_retrieval_accuracy": (faq_retrieval_correct / retrieval_total) * 100.0 if retrieval_total else 100.0,
                "complaint_routing_accuracy": (complaint_correct / complaint_total) * 100.0 if complaint_total else 100.0,
                "emergency_routing_accuracy": (emergency_correct / emergency_total) * 100.0 if emergency_total else 100.0,
                "no_match_accuracy": (no_match_correct / no_match_total) * 100.0 if no_match_total else 100.0,
                "e2e_accuracy": (e2e_correct / len(combined_items)) * 100.0
            },
            "results": eval_results
        }, f, indent=2)

    print(f"\n=======================================================")
    print(f"📊 END-TO-END QUALITY EVALUATION SUMMARY ({len(combined_items)} items)")
    print(f"=======================================================")
    print(f"1. Classification Accuracy     : {(class_correct / len(combined_items)) * 100.0:.2f}% ({class_correct}/{len(combined_items)})")
    print(f"2. FAQ Retrieval Accuracy      : {(faq_retrieval_correct / retrieval_total) * 100.0:.2f}% ({faq_retrieval_correct}/{retrieval_total})")
    print(f"3. Complaint-Routing Accuracy  : {(complaint_correct / complaint_total) * 100.0:.2f}% ({complaint_correct}/{complaint_total})")
    print(f"4. Emergency-Routing Accuracy  : {(emergency_correct / emergency_total) * 100.0:.2f}% ({emergency_correct}/{emergency_total})")
    print(f"5. No-Match Accuracy           : {(no_match_correct / no_match_total) * 100.0:.2f}% ({no_match_correct}/{no_match_total})")
    print(f"6. End-to-End Accuracy         : {(e2e_correct / len(combined_items)) * 100.0:.2f}% ({e2e_correct}/{len(combined_items)})")
    print(f"=======================================================\n")


if __name__ == "__main__":
    evaluate_all()
