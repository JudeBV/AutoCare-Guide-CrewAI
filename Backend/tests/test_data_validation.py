"""Unit tests for JSON data file validation and reference integrity."""

import json
import os
import pytest

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Data")
FAQ_PATH = os.path.join(DATA_DIR, "autocare-faq.json")
POLICIES_PATH = os.path.join(DATA_DIR, "autocare-policies.json")
TEST_MSGS_PATH = os.path.join(DATA_DIR, "autocare-test-messages.json")


def test_data_files_exist():
    """Verify all 3 required JSON data files exist in Backend/Data."""
    assert os.path.exists(FAQ_PATH), f"Missing {FAQ_PATH}"
    assert os.path.exists(POLICIES_PATH), f"Missing {POLICIES_PATH}"
    assert os.path.exists(TEST_MSGS_PATH), f"Missing {TEST_MSGS_PATH}"


def test_faq_json_validity_and_counts():
    """Validate autocare-faq.json schema, entry count, and ID uniqueness."""
    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert isinstance(data, dict), "autocare-faq.json must be a JSON object"
    faqs = data.get("faqs", [])
    assert len(faqs) == 25, f"Expected exactly 25 FAQ entries, found {len(faqs)}"

    faq_ids = [item.get("id") for item in faqs if "id" in item]
    assert len(faq_ids) == 25, "Every FAQ item must have an 'id'"
    assert len(set(faq_ids)) == 25, "All FAQ IDs must be unique"


def test_policies_json_validity():
    """Validate autocare-policies.json structure."""
    with open(POLICIES_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    assert isinstance(data, dict), "autocare-policies.json must be a JSON object"
    assert "policy_name" in data
    assert "supported_topics" in data
    assert "decision_labels" in data


def test_test_messages_validity_and_counts():
    """Validate autocare-test-messages.json schema, entry count, ID uniqueness, and FAQ ref integrity."""
    with open(TEST_MSGS_PATH, "r", encoding="utf-8") as f:
        test_data = json.load(f)

    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        faq_data = json.load(f)

    test_msgs = test_data.get("test_messages", [])
    assert len(test_msgs) == 25, f"Expected exactly 25 test messages, found {len(test_msgs)}"

    test_ids = [m.get("id") for m in test_msgs if "id" in m]
    assert len(test_ids) == 25, "Every test message must have an 'id'"
    assert len(set(test_ids)) == 25, "All test message IDs must be unique"

    valid_faq_ids = {faq.get("id") for faq in faq_data.get("faqs", [])}

    for item in test_msgs:
        ref_id = item.get("expected_faq_id") or item.get("faq_id")
        if ref_id and ref_id != "none":
            assert ref_id in valid_faq_ids, f"Test message {item['id']} references invalid FAQ ID: {ref_id}"
