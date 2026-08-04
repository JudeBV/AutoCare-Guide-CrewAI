"""Pydantic Models and Data Schemas for AutoCare Guide CrewAI Backend."""

from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class RequestType(str, Enum):
    """Supported request types for Stage 1 query understanding."""
    INFORMATIONAL = "INFORMATIONAL"
    VEHICLE_SYMPTOM = "VEHICLE_SYMPTOM"
    COMPLAINT = "COMPLAINT"
    EMERGENCY = "EMERGENCY"
    UNSAFE_REQUEST = "UNSAFE_REQUEST"
    ILLEGAL_REQUEST = "ILLEGAL_REQUEST"
    SECURITY_OR_PROMPT_INJECTION = "SECURITY_OR_PROMPT_INJECTION"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"
    UNCLEAR = "UNCLEAR"


class DecisionLabel(str, Enum):
    """Supported decision labels for classification and escalation routing."""
    ANSWER = "ANSWER"
    CLARIFY = "CLARIFY"
    ESCALATE_SERVICE = "ESCALATE_SERVICE"
    ESCALATE_SUPPORT = "ESCALATE_SUPPORT"
    ESCALATE_EMERGENCY = "ESCALATE_EMERGENCY"
    REFUSE_UNSAFE = "REFUSE_UNSAFE"
    REFUSE_ILLEGAL = "REFUSE_ILLEGAL"
    REFUSE_UNAUTHORISED = "REFUSE_UNAUTHORISED"
    REFUSE_SECURITY = "REFUSE_SECURITY"
    OUT_OF_SCOPE = "OUT_OF_SCOPE"


class EvidenceType(str, Enum):
    """Supported evidence types for fact-versus-assumption separation."""
    FACT = "FACT"
    INFERENCE = "INFERENCE"
    ASSUMPTION = "ASSUMPTION"
    CONFLICT = "CONFLICT"


class ConfidenceLevel(str, Enum):
    """Supported evidence-based confidence levels."""
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"
    CONTRADICTORY = "CONTRADICTORY"


class EvidenceItem(BaseModel):
    """Detailed evidence item backing an important insight."""
    insight: str = Field(..., description="Key insight or observation")
    evidence_type: str = Field(..., description="Fact vs assumption type: FACT, INFERENCE, ASSUMPTION, CONFLICT")
    confidence_level: str = Field(..., description="Confidence rating: HIGH, MEDIUM, LOW, CONTRADICTORY")
    source: str = Field(..., description="Source of evidence: e.g. User message, AC-FAQ-001, autocare-policies.json, Insufficient information")
    reason: str = Field(..., description="Rationale connecting the evidence to the insight")
    review_guidance: str = Field(..., description="Guidance for human reviewer, tester, or UX specialist")


class QueryUnderstanding(BaseModel):
    """Structured Stage 1 query understanding output schema."""
    original_query: str = Field(..., description="The user's verbatim input query")
    normalized_query: str = Field(..., description="Corrected, standardized representation of user query preserving exact original meaning")
    request_type: str = Field(..., description="Classified request type: INFORMATIONAL, VEHICLE_SYMPTOM, COMPLAINT, EMERGENCY, UNSAFE_REQUEST, ILLEGAL_REQUEST, SECURITY_OR_PROMPT_INJECTION, OUT_OF_SCOPE, UNCLEAR")
    user_goal: str = Field(..., description="Clear summary of what the user is trying to accomplish")
    suggested_category: str = Field(..., description="Primary vehicle or service topic category")
    safety_signals: List[str] = Field(default_factory=list, description="Extracted safety-critical signals or hazards")
    complaint_signals: List[str] = Field(default_factory=list, description="Extracted dissatisfaction or repeated service visit signals")
    ambiguities: List[str] = Field(default_factory=list, description="Unresolved or missing diagnostic details")
    classification_confidence: str = Field(default="HIGH", description="Confidence level of classification: HIGH, MEDIUM, LOW, CONTRADICTORY")


class AutoCareResponse(BaseModel):
    """Standardized final response structure for the AutoCare Guide assistant."""
    decision: str = Field(
        ...,
        description="Final decision label (e.g. ANSWER, CLARIFY, ESCALATE_EMERGENCY, REFUSE_UNSAFE, OUT_OF_SCOPE)"
    )
    request_type: Optional[str] = Field(
        default=None,
        description="Stage 1 request type classification (e.g. INFORMATIONAL, VEHICLE_SYMPTOM, COMPLAINT, EMERGENCY, UNSAFE_REQUEST, OUT_OF_SCOPE)"
    )
    category: str = Field(
        ...,
        description="Category of the user request (e.g. Dashboard Warning Lights, Braking System, emergency, policy_violation)"
    )
    confidence_level: str = Field(
        ...,
        description="Evidence-based confidence level: HIGH, MEDIUM, LOW, or CONTRADICTORY"
    )
    matched_faq_ids: List[str] = Field(
        default_factory=list,
        description="List of matched FAQ IDs from autocare-faq.json, or empty list if none match"
    )
    evidence: List[EvidenceItem] = Field(
        default_factory=list,
        description="List of structured evidence items supporting the response (at least one required)"
    )
    assumptions: List[str] = Field(
        default_factory=list,
        description="List of assumptions made when evidence is incomplete (may be empty)"
    )
    conflicts: List[str] = Field(
        default_factory=list,
        description="List of conflicts or contradictions identified (may be empty)"
    )
    escalation_destination: Optional[str] = Field(
        default=None,
        description="Target destination for escalations (e.g. service_advisor, customer_support, emergency_services) or null"
    )
    reason: str = Field(
        ...,
        description="Clear rationale explaining the triage classification and routing decision"
    )
    response: str = Field(
        ...,
        description="Final customer-facing response following tone and safety policies"
    )
    query_understanding: Optional[QueryUnderstanding] = Field(
        default=None,
        description="Structured Stage 1 query understanding representation"
    )


class AutoCareFlowState(BaseModel):
    """State model maintained across CrewAI Flow execution steps."""
    user_message: str = ""
    query_understanding: Optional[QueryUnderstanding] = None
    request_type: str = RequestType.INFORMATIONAL.value
    decision: str = DecisionLabel.ANSWER.value
    category: str = "general"
    confidence_level: str = ConfidenceLevel.HIGH.value
    matched_faq_ids: List[str] = Field(default_factory=list)
    retrieved_faqs: List[dict] = Field(default_factory=list)
    evidence: List[EvidenceItem] = Field(default_factory=list)
    assumptions: List[str] = Field(default_factory=list)
    conflicts: List[str] = Field(default_factory=list)
    escalation_destination: Optional[str] = None
    reason: str = ""
    draft_response: str = ""
    final_response: Optional[AutoCareResponse] = None

