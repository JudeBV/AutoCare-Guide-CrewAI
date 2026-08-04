"""Unit and Integration Tests for Hybrid FAQ Retrieval, Intent Matching, and Complaint Escalation."""

import json
import pytest
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from tools.faq_tool import FAQSearchTool
from main import run_flow
from models import DecisionLabel, ConfidenceLevel


class TestHybridFAQRetrievalAndComplaintRouting:

    @pytest.fixture(autouse=True)
    def setup_tool(self):
        self.tool = FAQSearchTool()

    def test_query_1_periodic_maintenance(self):
        query = "What is periodic maintenance?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-007" in res.matched_faq_ids
        assert res.confidence_level == ConfidenceLevel.HIGH.value
        assert res.escalation_destination is None

    def test_query_2_regular_car_servicing(self):
        query = "What do they normally do during regular car servicing?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-007" in res.matched_faq_ids
        assert res.confidence_level == ConfidenceLevel.HIGH.value

    def test_query_3_car_due_for_service(self):
        query = "When is my car due for service?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-005" in res.matched_faq_ids
        assert res.confidence_level == ConfidenceLevel.HIGH.value

    def test_query_4_ac_running_not_cold(self):
        query = "My car AC is running but it isn’t getting cold."
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-016" in res.matched_faq_ids
        assert res.confidence_level == ConfidenceLevel.HIGH.value

    def test_query_5_brake_pedal_sponge(self):
        query = "The brake pedal feels like a sponge."
        res = run_flow(query)
        assert res.decision == DecisionLabel.ESCALATE_EMERGENCY.value
        assert "AC-FAQ-010" in res.matched_faq_ids
        assert res.confidence_level == ConfidenceLevel.HIGH.value
        assert res.escalation_destination == "emergency_services"

    def test_query_6_orange_engine_symbol(self):
        query = "Why is there an orange engine symbol?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-001" in res.matched_faq_ids
        assert res.confidence_level == ConfidenceLevel.HIGH.value

    def test_query_7_documents_to_workshop(self):
        query = "What documents should I take to the workshop?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-019" in res.matched_faq_ids
        assert res.confidence_level == ConfidenceLevel.HIGH.value

    def test_query_8_renew_driving_licence(self):
        query = "How do I renew my driving licence?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.OUT_OF_SCOPE.value
        assert len(res.matched_faq_ids) == 0

    def test_query_9_paint_car_colour(self):
        query = "What colour should I paint my car?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.OUT_OF_SCOPE.value
        assert len(res.matched_faq_ids) == 0

    def test_query_10_periodic_maintainence_typo(self):
        query = "What is periodic maintainence?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-007" in res.matched_faq_ids
        assert res.confidence_level == ConfidenceLevel.HIGH.value

    # Complaint & Grievance Specific Regression Tests

    def test_complaint_1_taking_2_times(self):
        query = "Even after taking 2 times to the service, my problem did not get resolved."
        res = run_flow(query)
        assert res.decision == DecisionLabel.ESCALATE_SUPPORT.value
        assert res.category == "Billing and Complaints"
        assert res.confidence_level == ConfidenceLevel.HIGH.value
        assert res.matched_faq_ids == []
        assert res.escalation_destination == "customer_support"
        assert "retain" in res.response.lower()

    def test_complaint_2_taken_back_three_times(self):
        query = "I have taken the car back three times, but the same issue continues."
        res = run_flow(query)
        assert res.decision == DecisionLabel.ESCALATE_SUPPORT.value
        assert res.category == "Billing and Complaints"
        assert res.confidence_level == ConfidenceLevel.HIGH.value
        assert res.matched_faq_ids == []
        assert res.escalation_destination == "customer_support"

    def test_complaint_3_charged_didnt_fix(self):
        query = "They charged me, but they didn’t fix the problem."
        res = run_flow(query)
        assert res.decision == DecisionLabel.ESCALATE_SUPPORT.value
        assert res.escalation_destination == "customer_support"

    def test_informational_service_interval_not_complaint(self):
        query = "How often should I service my car?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-005" in res.matched_faq_ids

    def test_informational_periodic_service_not_complaint(self):
        query = "What is normally included in periodic maintenance?"
        res = run_flow(query)
        assert res.decision == DecisionLabel.ANSWER.value
        assert "AC-FAQ-007" in res.matched_faq_ids

    def test_complaint_override_by_safety_emergency(self):
        query = "The repair failed and now smoke is coming from the bonnet."
        res = run_flow(query)
        assert res.decision == DecisionLabel.ESCALATE_EMERGENCY.value
        assert res.escalation_destination == "emergency_services"
