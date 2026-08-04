export type DecisionLabel =
  | 'ANSWER'
  | 'CLARIFY'
  | 'ESCALATE_SERVICE'
  | 'ESCALATE_SUPPORT'
  | 'ESCALATE_EMERGENCY'
  | 'REFUSE_UNSAFE'
  | 'REFUSE_ILLEGAL'
  | 'REFUSE_UNAUTHORISED'
  | 'REFUSE_SECURITY'
  | 'OUT_OF_SCOPE';

export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW' | 'CONTRADICTORY';

export interface EvidenceItem {
  insight: string;
  evidence_type: string;
  confidence_level: ConfidenceLevel;
  source: string;
  reason: string;
  review_guidance: string;
}

export interface AutoCareResponse {
  decision: DecisionLabel;
  request_type?: string;
  category: string;
  confidence_level: ConfidenceLevel;
  matched_faq_ids: string[];
  evidence: EvidenceItem[];
  assumptions: string[];
  conflicts: string[];
  escalation_destination: string | null;
  reason: string;
  response: string;
  query_understanding?: any;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  responseData?: AutoCareResponse;
  feedback?: 'helpful' | 'unhelpful';
  feedbackReasons?: string[];
  feedbackAcknowledged?: boolean;
  isEditing?: boolean;
  isError?: boolean;
  originalQuery?: string;
}
