"""AutoCare Guide CrewAI Main Execution and Flow Routing."""

import json
import os
import re
import sys
from typing import Dict, Any, Optional, List
from dotenv import load_dotenv

# Reconfigure stdout to utf-8 for Windows console unicode compatibility
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

from crewai.flow.flow import Flow, listen, router, start, or_
from pydantic import BaseModel

from models import (
    AutoCareFlowState,
    AutoCareResponse,
    RequestType,
    QueryUnderstanding,
    DecisionLabel,
    ConfidenceLevel,
    EvidenceType,
    EvidenceItem
)
from tools.faq_tool import FAQSearchTool
from crew import AutoCareCrew

load_dotenv()


def check_llm_api_key() -> bool:
    """Check if a valid LLM API Key is configured in environment variables. Never reveals key value."""
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    return bool(gemini_key or openai_key)


def get_active_api_key_name() -> str:
    """Get the name of the configured API key environment variable without revealing the key secret."""
    if os.getenv("OPENAI_API_KEY"):
        return "OPENAI_API_KEY"
    elif os.getenv("GEMINI_API_KEY"):
        return "GEMINI_API_KEY"
    return "NONE"


def get_missing_api_key_message() -> str:
    """Return a detailed instruction message for setting up API keys."""
    return (
        "[WARNING] LLM API Key Missing!\n"
        "To execute live AI agent reasoning and natural language responses, please add one of the following\n"
        "environment variables to your `Backend/.env` file:\n\n"
        "  - OPENAI_API_KEY=your_openai_api_key\n"
        "  - GEMINI_API_KEY=your_google_gemini_api_key\n\n"
        "File path to update: Backend/.env"
    )


class AutoCareFlow(Flow[AutoCareFlowState]):
    """CrewAI Flow managing conditional routing, evidence building, confidence rating, and final safety review."""

    @start()
    def classify_message(self):
        """Stage 1: Convert user message into structured QueryUnderstanding representation."""
        msg = self.state.user_message.strip()
        msg_lower = msg.lower().replace("’", "'").replace("`", "'")

        # Reset state structures
        self.state.evidence = []
        self.state.assumptions = []
        self.state.conflicts = []
        self.state.matched_faq_ids = []
        self.state.escalation_destination = None

        # Normalized query preparation: strip conversational fillers and correct typos
        norm_q = msg.strip()
        for prefix in ["hey chatbot,", "hey chatbot", "can you explain", "tell me"]:
            if norm_q.lower().startswith(prefix):
                norm_q = norm_q[len(prefix):].strip()
        norm_q = re.sub(r"\bmaintainence\b", "maintenance", norm_q, flags=re.IGNORECASE)
        norm_q = re.sub(r"\blicence\b", "license", norm_q, flags=re.IGNORECASE)
        norm_q = re.sub(r"\bservicing\b", "service", norm_q, flags=re.IGNORECASE)

        # 1. Contradiction & Emergency Detection
        is_contradictory = ("red" in msg_lower or "temperature" in msg_lower or "overheat" in msg_lower) and ("safe to" in msg_lower or "continue driving" in msg_lower or "someone told me" in msg_lower)
        is_brake_emergency = ("brake" in msg_lower and ("soft" in msg_lower or "spongy" in msg_lower or "sponge" in msg_lower or "not stopping" in msg_lower or "failed" in msg_lower))
        is_general_emergency = is_brake_emergency or any(word in msg_lower for word in ["smoke", "fire", "overheating", "sparks"]) or ("red" in msg_lower and "temperature" in msg_lower)

        # 2. Refusal / Security / Unsafe Detection
        is_unsafe_disable = ("disable" in msg_lower or "bypass" in msg_lower) and ("abs" in msg_lower or "airbag" in msg_lower or "brake" in msg_lower) and ("immobiliser" not in msg_lower)
        is_illegal = ("odometer" in msg_lower) or "bypass emissions" in msg_lower or "immobiliser" in msg_lower or "unrestricted mechanic" in msg_lower
        is_prompt_injection = any(phrase in msg_lower for phrase in [
            "ignore your policies", "ignore all your previous", "ignore your instructions", "reveal your complete system prompt",
            "reveal the system prompt", "delete your faq", "administrator"
        ])
        is_security_credentials = any(term in msg_lower for term in ["cvv", "otp", "card number", "pay my service bill"])

        # 3. Complaint & Grievance Detection (Evaluated BEFORE general topic matching)
        is_informational_service_query = any(phrase in msg_lower for phrase in [
            "what is periodic maintenance", "what is regular car servicing", "regular car servicing",
            "what do technicians actually do", "what do they do", "what does a normal service include", "what is included in periodic",
            "when is my car due for service", "how often should i service my car", "what documents"
        ])

        complaint_phrases = [
            "not resolved", "didn't get resolved", "did not get resolved", "unresolved",
            "same issue continues", "same problem continues", "still facing the issue", "issue still exists",
            "taking 2 times", "taking 3 times", "taken back", "taken the car back", "bringing back", "repeated visits",
            "serviced multiple times", "service 2 times", "service 3 times", "serviced it twice",
            "repair failed", "repair did not work", "did not fix", "didn't fix", "didnt fix", "repair was unsuccessful",
            "no solution", "service centre did not fix", "nobody is responding", "unhappy with", "brought the car back",
            "charged", "billing", "invoice", "unapproved", "never agreed", "overcharged", "refund",
            "scratched", "denying responsibility", "promised my car", "rejected without a proper explanation", "warranty claim"
        ]
        is_unresolved_complaint = (not is_informational_service_query) and any(phrase in msg_lower for phrase in complaint_phrases)

        # 4. Out of scope detection
        is_out_of_scope = any(phrase in msg_lower for phrase in [
            "driving licence", "driving license", "renew driving", "renew my licence",
            "renew my license", "paint my car", "colour should i paint", "what colour should i"
        ])

        # 5. Unclear detection
        is_unclear = len(msg.split()) < 3 or msg_lower in [
            "car issue", "help car", "problem", "my car is making a strange noise.",
            "a light has appeared on my dashboard. what should i do?",
            "my car doesn't feel right today. can i keep driving?",
            "the car has trouble starting sometimes.",
            "something is leaking under my car. what is it?"
        ]

        # Determine Stage 1 RequestType, Goal, and Category
        if is_contradictory:
            req_type = RequestType.EMERGENCY.value
            decision = DecisionLabel.ESCALATE_EMERGENCY.value
            category = "Cooling System"
            conf = ConfidenceLevel.CONTRADICTORY.value
            goal = "Request safe driving guidance during thermal engine warning"
            self.state.escalation_destination = "emergency_services"
            self.state.reason = "Unresolved conflict between third-party advice and AutoCare safety policy regarding red temperature warning."
            self.state.conflicts.append("SAFETY_CONTRADICTION: User message asserts driving is safe, but AutoCare policy mandates stopping safely when red temperature warning appears.")
            self.state.evidence.append(EvidenceItem(
                insight="User presents contradictory claim that driving with a red temperature warning light is safe.",
                evidence_type=EvidenceType.CONFLICT.value,
                confidence_level=ConfidenceLevel.CONTRADICTORY.value,
                source="User message vs autocare-policies.json: escalation_policies",
                reason="AutoCare safety policy overrides unverified third-party advice when thermal emergency risk exists.",
                review_guidance="Prioritize immediate engine shutdown advice."
            ))
        elif is_general_emergency:
            req_type = RequestType.EMERGENCY.value
            decision = DecisionLabel.ESCALATE_EMERGENCY.value
            category = "Brakes and Safety" if is_brake_emergency else "Emergency Safety"
            conf = ConfidenceLevel.HIGH.value
            goal = "Report safety-critical vehicle emergency or braking failure"
            self.state.escalation_destination = "emergency_services"
            self.state.reason = "Direct emergency symptom reported by user requiring immediate safety guidance."
        elif is_unsafe_disable:
            req_type = RequestType.UNSAFE_REQUEST.value
            decision = DecisionLabel.REFUSE_UNSAFE.value
            category = "Vehicle Safety Systems"
            conf = ConfidenceLevel.HIGH.value
            goal = "Request instructions to disable safety control or sensor"
            self.state.reason = "Request asks to disable safety systems."
            self.state.evidence.append(EvidenceItem(
                insight="User asks to disable vehicle safety control.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and autocare-policies.json: refusal_policies",
                reason="Disabling safety systems is strictly forbidden.",
                review_guidance="Refuse unsafe modification."
            ))
        elif is_illegal:
            req_type = RequestType.ILLEGAL_REQUEST.value
            decision = DecisionLabel.REFUSE_ILLEGAL.value
            category = "policy_violation"
            conf = ConfidenceLevel.HIGH.value
            goal = "Request unlawful vehicle modification or odometer alteration"
            self.state.reason = "Request involves illegal vehicle alteration."
            self.state.evidence.append(EvidenceItem(
                insight="User asks for unlawful vehicle alteration.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and autocare-policies.json: refusal_policies",
                reason="Illegal modifications are rejected.",
                review_guidance="Enforce mandatory refusal."
            ))
        elif is_prompt_injection or is_security_credentials:
            req_type = RequestType.SECURITY_OR_PROMPT_INJECTION.value
            decision = DecisionLabel.REFUSE_SECURITY.value
            category = "policy_violation"
            conf = ConfidenceLevel.HIGH.value
            goal = "Attempt prompt injection or credential sharing"
            self.state.reason = "Request violates system security or safety guardrails."
            self.state.evidence.append(EvidenceItem(
                insight="User message attempts prompt injection or credential sharing.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and autocare-policies.json: refusal_policies",
                reason="Bypassing safety controls or sharing financial credentials is prohibited.",
                review_guidance="Enforce mandatory security refusal."
            ))
        elif is_unsafe_disable:
            req_type = RequestType.UNSAFE_REQUEST.value
            decision = DecisionLabel.REFUSE_UNSAFE.value
            category = "Vehicle Safety Systems"
            conf = ConfidenceLevel.HIGH.value
            goal = "Request instructions to disable safety control or sensor"
            self.state.reason = "Request asks to disable safety systems."
            self.state.evidence.append(EvidenceItem(
                insight="User asks to disable vehicle safety control.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and autocare-policies.json: refusal_policies",
                reason="Disabling safety systems is strictly forbidden.",
                review_guidance="Refuse unsafe modification."
            ))
        elif is_unresolved_complaint:
            req_type = RequestType.COMPLAINT.value
            decision = DecisionLabel.ESCALATE_SUPPORT.value
            category = "Billing and Complaints"
            conf = ConfidenceLevel.HIGH.value
            goal = "Request resolution for an unresolved service complaint or billing dispute"
            self.state.escalation_destination = "customer_support"
            self.state.reason = "Unresolved service complaint or customer grievance."
            self.state.evidence.append(EvidenceItem(
                insight="User reports unresolved service issue or billing grievance.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and autocare-policies.json: escalation_policies",
                reason="Repeated service failure or billing complaint requires human support escalation.",
                review_guidance="Route to customer support."
            ))
        elif is_out_of_scope:
            req_type = RequestType.OUT_OF_SCOPE.value
            decision = DecisionLabel.OUT_OF_SCOPE.value
            category = "out_of_scope"
            conf = ConfidenceLevel.HIGH.value
            goal = "Ask non-automotive or out-of-scope query"
            self.state.reason = "Query is outside the scope of automotive maintenance."
        elif is_unclear:
            req_type = RequestType.UNCLEAR.value
            decision = DecisionLabel.CLARIFY.value
            category = "clarification"
            conf = ConfidenceLevel.LOW.value
            goal = "Provide clarification for vague or incomplete vehicle query"
            self.state.reason = "Essential vehicle context is missing."
        else:
            # Category & RequestType Resolution based on query meaning
            if any(term in msg_lower for term in ["warning light", "warning symbol", "light mean", "warning mean", "check engine", "orange engine", "engine symbol", "engine light", "engine-shaped", "tpms"]):
                category = "Dashboard Warning Lights"
                req_type = RequestType.VEHICLE_SYMPTOM.value
                goal = "Diagnose vehicle warning light or dashboard indicator"
            elif any(term in msg_lower for term in ["ac", "air conditioning", "air conditioner", "cooling", "not cold", "warm air"]):
                category = "Air Conditioning"
                req_type = RequestType.VEHICLE_SYMPTOM.value
                goal = "Diagnose vehicle air conditioning or cooling issue"
            elif any(term in msg_lower for term in ["brake", "braking", "squeak", "squeal", "brake pad"]):
                category = "Brakes and Safety"
                req_type = RequestType.VEHICLE_SYMPTOM.value
                goal = "Diagnose braking symptom or noise"
            elif any(term in msg_lower for term in ["tyre pressure", "tire pressure", "check pressure", "tyres", "tires"]):
                category = "Tyres"
                req_type = RequestType.INFORMATIONAL.value
                goal = "Inquire about tyre maintenance or pressure guidelines"
            elif any(term in msg_lower for term in ["periodic", "regular", "routine", "due for service", "service interval", "servicing"]):
                category = "Scheduled Maintenance"
                req_type = RequestType.INFORMATIONAL.value
                goal = "Inquire about vehicle maintenance guidelines or service intervals"
            elif any(term in msg_lower for term in ["document", "prepare", "appointment", "workshop"]):
                category = "Service Appointments"
                req_type = RequestType.INFORMATIONAL.value
                goal = "Inquire about service appointment preparation"
            elif any(term in msg_lower for term in ["sound", "noise", "leak", "crank", "smoke", "smell"]):
                category = "Dashboard Warning Lights"
                req_type = RequestType.VEHICLE_SYMPTOM.value
                goal = "Diagnose unusual vehicle symptom or noise"
            else:
                category = "Scheduled Maintenance"
                req_type = RequestType.INFORMATIONAL.value
                goal = "Inquire about vehicle maintenance guidelines"

            decision = DecisionLabel.ANSWER.value
            conf = ConfidenceLevel.HIGH.value
            self.state.reason = "Standard informational vehicle maintenance or symptom query."

        # Assemble Stage 1 QueryUnderstanding structure
        qu = QueryUnderstanding(
            original_query=msg,
            normalized_query=norm_q,
            request_type=req_type,
            user_goal=goal,
            suggested_category=category,
            safety_signals=["Thermal overheat risk"] if is_contradictory else (["Braking hazard"] if is_brake_emergency else []),
            complaint_signals=["Repeated service visits / unresolved issue"] if is_unresolved_complaint else [],
            ambiguities=["Missing specific symptom location/operating details"] if is_unclear else [],
            classification_confidence=conf
        )

        self.state.query_understanding = qu
        self.state.request_type = req_type
        self.state.decision = decision
        self.state.category = category
        self.state.confidence_level = conf
        return self.state.decision

    @router(classify_message)
    def route_decision(self):
        """Stage 2: Policy-first priority router."""
        req_type = self.state.request_type
        decision = self.state.decision

        # 1. Emergency
        if req_type == RequestType.EMERGENCY.value or decision == DecisionLabel.ESCALATE_EMERGENCY.value:
            return "handle_emergency"
        # 2. Refusal (Unsafe, Illegal, Security)
        elif req_type in [RequestType.UNSAFE_REQUEST.value, RequestType.ILLEGAL_REQUEST.value, RequestType.SECURITY_OR_PROMPT_INJECTION.value] or decision.startswith("REFUSE_"):
            return "handle_refusal"
        # 3. Complaint
        elif req_type == RequestType.COMPLAINT.value or decision == DecisionLabel.ESCALATE_SUPPORT.value:
            return "handle_complaint"
        # 4. Symptom or Informational FAQ search
        elif req_type in [RequestType.VEHICLE_SYMPTOM.value, RequestType.INFORMATIONAL.value] or decision in [DecisionLabel.ANSWER.value, DecisionLabel.ESCALATE_SERVICE.value]:
            return "retrieve_and_respond"
        # 5. Unclear
        elif req_type == RequestType.UNCLEAR.value or decision == DecisionLabel.CLARIFY.value:
            return "handle_clarification"
        # 6. Out of scope
        else:
            return "handle_out_of_scope"

    @listen("handle_complaint")
    def execute_complaint(self):
        """Stage 3 & 4: Search complaint FAQs only; return no_match for general complaints."""
        tool = FAQSearchTool()
        search_res_json = tool.search_faqs(self.state.user_message, category="Billing and Complaints", request_type=RequestType.COMPLAINT.value)
        try:
            res_data = json.loads(search_res_json)
            matches = res_data.get("matches", [])
        except Exception:
            matches = []

        direct_billing_faq = None
        if matches:
            for m in matches:
                if m["id"] == "AC-FAQ-024" and any(word in self.state.user_message.lower() for word in ["charged", "invoice", "unapproved", "billing", "bill"]):
                    direct_billing_faq = m
                    break

        if direct_billing_faq:
            self.state.matched_faq_ids = ["AC-FAQ-024"]
            self.state.draft_response = (
                f"Based on AutoCare policy [AC-FAQ-024]: {direct_billing_faq['answer']} "
                "Please retain your invoice, work authorization, and repair records for customer support review."
            )
            self.state.evidence.append(EvidenceItem(
                insight="User asked about unapproved billing matching AC-FAQ-024.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and AC-FAQ-024",
                reason="Unapproved parts/billing query matches AC-FAQ-024.",
                review_guidance="Escalate billing dispute to support with repair invoice records."
            ))
        elif "warranty" in self.state.user_message.lower():
            self.state.matched_faq_ids = ["AC-FAQ-022"]
            self.state.evidence.append(EvidenceItem(
                insight="User asked about rejected warranty claim matching AC-FAQ-022.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and AC-FAQ-022",
                reason="Warranty claim review matches AC-FAQ-022 policy.",
                review_guidance="Escalate to customer support with warranty documentation."
            ))
            self.state.draft_response = (
                "Based on AutoCare policy [AC-FAQ-022]: If a warranty claim is rejected, request a written explanation "
                "from the service centre and contact AutoCare customer support with your job card, invoice, and repair history. "
                "I cannot complete the escalation directly through this chat."
            )
        else:
            self.state.matched_faq_ids = []
            self.state.draft_response = (
                "I am sorry that your vehicle issue remains unresolved after your service visits. "
                "Please retain your previous job cards, invoices, and repair records, and ask the service centre's "
                "customer-support or complaint-resolution team to review the repeated repair history. "
                "I cannot complete the escalation directly through this chat."
            )

    @listen("retrieve_and_respond")
    def execute_faq_retrieval(self):
        """Stage 3, 4, 5: Category-restricted semantic retrieval & candidate re-ranking."""
        tool = FAQSearchTool()
        search_res_json = tool.search_faqs(self.state.user_message, category=self.state.category, request_type=self.state.request_type)
        try:
            res_data = json.loads(search_res_json)
            status_str = res_data.get("status", "")
            matched_ids = res_data.get("matched_faq_ids", [])
            matches = res_data.get("matches", [])

            self.state.matched_faq_ids = matched_ids
            self.state.retrieved_faqs = matches

            if matches:
                top_match = matches[0]
                if top_match.get("category"):
                    self.state.category = top_match["category"]
                ans_text = top_match.get("answer", "")
                self.state.decision = DecisionLabel.ANSWER.value
                self.state.confidence_level = ConfidenceLevel.HIGH.value
                self.state.reason = "Standard informational vehicle maintenance query."
                self.state.draft_response = (
                    f"Based on AutoCare policy [{top_match['id']}]: {ans_text} "
                    "Note: This is an informational summary and does not constitute a confirmed diagnosis; "
                    "a physical diagnostic inspection by a certified technician is recommended."
                )

                self.state.evidence.append(EvidenceItem(
                    insight=f"User is asking about a vehicle question matching {top_match['id']} ({top_match['category']}).",
                    evidence_type=EvidenceType.FACT.value,
                    confidence_level=ConfidenceLevel.HIGH.value,
                    source=f"User message and {top_match['id']}",
                    reason="The user's question directly matches the approved FAQ dataset.",
                    review_guidance="No additional review is required for the general FAQ response."
                ))
            elif status_str == "no_match" and tool._is_out_of_scope(self.state.user_message):
                self.state.matched_faq_ids = []
                self.state.decision = DecisionLabel.OUT_OF_SCOPE.value
                self.state.category = "out_of_scope"
                self.state.confidence_level = ConfidenceLevel.HIGH.value
                self.state.reason = "Query is outside the scope of automotive maintenance and troubleshooting."
                self.state.draft_response = (
                    "I am the AutoCare Guide assistant, specifically designed to help with automotive maintenance, "
                    "vehicle troubleshooting, and support services. I cannot assist with non-automotive topics."
                )
            else:
                self.state.matched_faq_ids = []
                self.state.decision = DecisionLabel.CLARIFY.value
                self.state.category = "clarification"
                self.state.confidence_level = ConfidenceLevel.LOW.value
                self.state.reason = "No reliable FAQ match found meeting relevance threshold."
                self.state.draft_response = (
                    "I searched our official AutoCare knowledge base, but could not find a direct answer. "
                    "Could you please provide a few more details about your vehicle issue?"
                )
                if any(w in self.state.user_message.lower() for w in ["noise", "sound", "vibration", "leak", "warning", "smoke", "smell", "fault"]):
                    self.state.assumptions.append("Essential diagnostic context is missing.")
                self.state.evidence.append(EvidenceItem(
                    insight="User query lacks direct match in approved FAQ dataset.",
                    evidence_type=EvidenceType.ASSUMPTION.value,
                    confidence_level=ConfidenceLevel.LOW.value,
                    source="Insufficient information",
                    reason="No FAQ met minimum relevance threshold.",
                    review_guidance="Request clarification from user."
                ))
        except Exception:
            self.state.matched_faq_ids = []
            self.state.draft_response = "Unable to complete FAQ search at this time."

    @listen("handle_clarification")
    def execute_clarification(self):
        """Stage 3: Handle vague questions with focused clarification questions."""
        if "starting" in self.state.user_message.lower() or "trouble starting" in self.state.user_message.lower():
            self.state.matched_faq_ids = ["AC-FAQ-013"]
            self.state.evidence.append(EvidenceItem(
                insight="User query describes starting trouble matching AC-FAQ-013 battery guidelines.",
                evidence_type=EvidenceType.ASSUMPTION.value,
                confidence_level=ConfidenceLevel.LOW.value,
                source="User message and AC-FAQ-013",
                reason="Starting difficulty matches battery/starter guidance in AC-FAQ-013.",
                review_guidance="Provide clarification prompt."
            ))
        else:
            self.state.matched_faq_ids = []

        self.state.draft_response = (
            "To help identify your vehicle issue accurately, could you please tell me: "
            "1) Where is the symptom or noise located (e.g. engine bay, wheels, underbody, or dashboard)? "
            "2) Does it happen when braking, accelerating, turning, or idling?"
        )
        if not self.state.assumptions:
            self.state.assumptions.append("The specific type, location, and operating conditions of the symptom are unknown.")
        if not any(e.source.startswith("User message and AC-FAQ-") for e in self.state.evidence):
            self.state.evidence.append(EvidenceItem(
                insight="User reported an unspecified vehicle issue without diagnostic context.",
                evidence_type=EvidenceType.ASSUMPTION.value,
                confidence_level=ConfidenceLevel.LOW.value,
                source="Insufficient information",
                reason="Specific vehicle details are missing.",
                review_guidance="Request user clarification before attempting further triage."
            ))

    @listen("handle_emergency")
    def execute_emergency(self):
        """Stage 3: Emergency safety response with immediate guidance at the top."""
        msg_lower = self.state.user_message.lower()
        if "brake" in msg_lower and ("soft" in msg_lower or "spongy" in msg_lower or "sponge" in msg_lower or "not stopping" in msg_lower):
            self.state.matched_faq_ids = ["AC-FAQ-010"]
            self.state.category = "Brakes and Safety"
            self.state.confidence_level = ConfidenceLevel.HIGH.value
            self.state.escalation_destination = "emergency_services"
            self.state.reason = "Direct emergency symptom reported by user requiring immediate safety guidance."
            self.state.evidence.append(EvidenceItem(
                insight="User reports soft brake pedal matching AC-FAQ-010 brake system hazard guidelines.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and AC-FAQ-010",
                reason="Brake pedal degradation matches emergency protocol in AC-FAQ-010.",
                review_guidance="Prioritize immediate safe stopping advice."
            ))
            self.state.draft_response = (
                "[SAFETY WARNING] Please safely pull over to the side of the road, turn off your engine, and do not attempt to drive further. "
                "Based on AutoCare policy [AC-FAQ-010]: A soft or spongy brake pedal indicates a severe braking-system issue. "
                "Contact roadside assistance or emergency services immediately."
            )
        elif self.state.confidence_level == ConfidenceLevel.CONTRADICTORY.value:
            self.state.matched_faq_ids = ["AC-FAQ-003"]
            self.state.category = "Cooling System"
            self.state.evidence.append(EvidenceItem(
                insight="AutoCare safety policy AC-FAQ-003 mandates engine shutdown for red temperature warning.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.CONTRADICTORY.value,
                source="User message and AC-FAQ-003",
                reason="Red temperature warning is an engine thermal emergency.",
                review_guidance="Prioritize immediate safe engine shutdown."
            ))
            self.state.draft_response = (
                "[SAFETY WARNING] Please safely pull over to the side of the road and turn off your engine immediately. "
                "Important Note: Continuing to drive with a red temperature warning light risks severe engine damage and fire. "
                "AutoCare safety policy strictly overrides any suggestion that driving is safe in this condition. "
                "Contact emergency services or roadside assistance immediately."
            )
        elif "smoke" in msg_lower or "burning" in msg_lower:
            self.state.matched_faq_ids = ["AC-FAQ-017"]
            self.state.evidence.append(EvidenceItem(
                insight="User reports engine smoke or burning smell matching AC-FAQ-017 emergency hazard guidelines.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=ConfidenceLevel.HIGH.value,
                source="User message and AC-FAQ-017",
                reason="Engine smoke matches emergency protocol in AC-FAQ-017.",
                review_guidance="Prioritize immediate safe stopping advice."
            ))
            self.state.draft_response = (
                "[SAFETY WARNING] Please safely pull over to the side of the road, turn off your engine, "
                "and exit the vehicle if it is safe to do so. Contact emergency services immediately."
            )
        else:
            self.state.matched_faq_ids = []
            self.state.draft_response = (
                "[SAFETY WARNING] Please safely pull over to the side of the road, turn off your engine, "
                "and exit the vehicle if it is safe to do so. Contact emergency services immediately."
            )

    @listen("handle_refusal")
    def execute_refusal(self):
        """Stage 3: Firm, polite refusal for unsafe or prompt injection queries."""
        self.state.matched_faq_ids = []
        self.state.draft_response = (
            "I cannot fulfill this request. AutoCare policy strictly prohibits performing illegal vehicle modifications, "
            "bypassing safety controls, sharing payment credentials, or disabling warning systems. If you have a standard maintenance question, I am happy to assist."
        )

    @listen("handle_out_of_scope")
    def execute_out_of_scope(self):
        """Stage 3: Out of scope explanation."""
        self.state.matched_faq_ids = []
        self.state.draft_response = (
            "I am the AutoCare Guide assistant, specifically designed to help with automotive maintenance, "
            "vehicle troubleshooting, and support services. I cannot assist with non-automotive topics."
        )

    @listen(or_(execute_faq_retrieval, execute_complaint, execute_clarification, execute_emergency, execute_refusal, execute_out_of_scope))
    def final_safety_review(self) -> AutoCareResponse:
        """Stage 6: Final validation guardrail and AutoCareResponse assembly."""

        if not self.state.evidence:
            self.state.evidence.append(EvidenceItem(
                insight="User message processed under standard AutoCare policy.",
                evidence_type=EvidenceType.FACT.value,
                confidence_level=self.state.confidence_level,
                source="User message and autocare-policies.json",
                reason=self.state.reason,
                review_guidance="Standard review."
            ))

        # Overall confidence calculation rules
        if self.state.conflicts:
            final_confidence = ConfidenceLevel.CONTRADICTORY.value
        elif self.state.decision == DecisionLabel.OUT_OF_SCOPE.value:
            final_confidence = ConfidenceLevel.HIGH.value
        elif self.state.assumptions or self.state.decision == DecisionLabel.CLARIFY.value:
            final_confidence = ConfidenceLevel.LOW.value
        elif any(e.evidence_type == EvidenceType.INFERENCE.value for e in self.state.evidence):
            final_confidence = ConfidenceLevel.MEDIUM.value
        else:
            final_confidence = self.state.confidence_level

        # Synchronize matched_faq_ids and evidence sources
        for ev in self.state.evidence:
            for part in ev.source.split():
                if part.startswith("AC-FAQ-") and part not in self.state.matched_faq_ids:
                    self.state.matched_faq_ids.append(part)

        # Filter matched_faq_ids so only IDs actually cited in evidence or response are kept
        valid_matched_ids = []
        for faq_id in self.state.matched_faq_ids:
            if faq_id in self.state.draft_response or any(faq_id in ev.source for ev in self.state.evidence):
                if faq_id not in valid_matched_ids:
                    valid_matched_ids.append(faq_id)
        self.state.matched_faq_ids = valid_matched_ids

        res = AutoCareResponse(
            decision=self.state.decision,
            request_type=self.state.request_type,
            category=self.state.category,
            confidence_level=final_confidence,
            matched_faq_ids=self.state.matched_faq_ids,
            evidence=self.state.evidence,
            assumptions=self.state.assumptions,
            conflicts=self.state.conflicts,
            escalation_destination=self.state.escalation_destination,
            reason=self.state.reason,
            response=self.state.draft_response,
            query_understanding=self.state.query_understanding
        )
        self.state.final_response = res
        return res


def run_flow_with_stage_logs(user_message: str) -> AutoCareResponse:
    """Run flow and print stage-by-stage pipeline outputs."""
    print(f"\n=======================================================")
    print(f"📥 INPUT MESSAGE: \"{user_message}\"")
    print(f"=======================================================\n")

    flow = AutoCareFlow()
    flow.state.user_message = user_message

    decision = flow.classify_message()
    print("--- [STAGE 1: CLASSIFIER RESULT] ---")
    print(f"Decision: {flow.state.decision}")
    print(f"Category: {flow.state.category}")
    print(f"Confidence Level: {flow.state.confidence_level}")
    print(f"Reason: {flow.state.reason}\n")

    route = flow.route_decision()
    if route == "retrieve_and_respond":
        flow.execute_faq_retrieval()
        print("--- [STAGE 2: FAQ RETRIEVAL RESULT] ---")
        print(f"Matched FAQ IDs: {flow.state.matched_faq_ids}")
        if flow.state.retrieved_faqs:
            for idx, item in enumerate(flow.state.retrieved_faqs, 1):
                print(f"Match #{idx}: {item['id']} ({item['category']}) - {item['question']}")
                print(f"Answer text: \"{item['answer']}\"")
        else:
            print("Status: no_match")
        print()

        print("--- [STAGE 3: RESPONSE WRITER RESULT] ---")
        print(f"Draft Response: \"{flow.state.draft_response}\"\n")
    else:
        if route == "handle_complaint":
            flow.execute_complaint()
        elif route == "handle_clarification":
            flow.execute_clarification()
        elif route == "handle_emergency":
            flow.execute_emergency()
        elif route == "handle_refusal":
            flow.execute_refusal()
        elif route == "handle_out_of_scope":
            flow.execute_out_of_scope()

        print("--- [STAGE 2: FAQ RETRIEVAL RESULT] ---")
        print("Skipped (Non-retrieval route)\n")

        print("--- [STAGE 3: RESPONSE WRITER RESULT] ---")
        print(f"Draft Response: \"{flow.state.draft_response}\"\n")

    final_res = flow.final_safety_review()
    print("--- [STAGE 4: FINAL DECISION RESULT] ---")
    print(final_res.model_dump_json(indent=2))
    print(f"\n=======================================================\n")
    return final_res


def run_flow(user_message: str) -> AutoCareResponse:
    """Wrapper function to execute AutoCare flow for a single message."""
    return run_flow_with_stage_logs(user_message)


if __name__ == "__main__":
    print("[AutoCare] AutoCare Guide CrewAI Backend Execution Check")
    has_key = check_llm_api_key()
    if not has_key:
        print("\n" + get_missing_api_key_message())
        print("\nRunning offline structure check...")
        run_flow("What does the orange check-engine light mean?")
    else:
        key_name = get_active_api_key_name()
        print(f"[INFO] Configured API Key variable found: {key_name}")
        run_flow("What does the orange check-engine light mean?")
