"""Unit tests for custom FAQSearchTool behavior and subject precision."""

import json
import os
import pytest
from tools.faq_tool import FAQSearchTool

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "Data")
FAQ_PATH = os.path.join(DATA_DIR, "autocare-faq.json")


def test_faq_search_tool_initialization():
    """Verify tool initializes and finds dataset path."""
    tool = FAQSearchTool(dataset_path=FAQ_PATH)
    assert tool.name == "faq_search_tool"
    assert os.path.exists(tool.dataset_path)


def test_faq_search_tool_check_engine_single_match():
    """Test searching check engine query returns ONLY AC-FAQ-001, excluding AC-FAQ-004."""
    tool = FAQSearchTool(dataset_path=FAQ_PATH)
    result_str = tool._run("What does the orange check-engine light mean?")
    res = json.loads(result_str)

    assert res.get("status") == "match_found"
    matched_ids = res.get("matched_faq_ids", [])
    assert matched_ids == ["AC-FAQ-001"]
    assert "AC-FAQ-004" not in matched_ids


def test_faq_search_tool_tyre_pressure_match():
    """Test searching tyre pressure query returns AC-FAQ-004, excluding AC-FAQ-001."""
    tool = FAQSearchTool(dataset_path=FAQ_PATH)
    result_str = tool._run("What does the tyre-pressure warning light mean?")
    res = json.loads(result_str)

    assert res.get("status") == "match_found"
    matched_ids = res.get("matched_faq_ids", [])
    assert "AC-FAQ-004" in matched_ids
    assert "AC-FAQ-001" not in matched_ids


def test_faq_search_tool_soft_brake_pedal_match():
    """Test searching soft brake pedal returns AC-FAQ-010."""
    tool = FAQSearchTool(dataset_path=FAQ_PATH)
    result_str = tool._run("What should I do if the brake pedal feels soft or spongy?")
    res = json.loads(result_str)

    assert res.get("status") == "match_found"
    matched_ids = res.get("matched_faq_ids", [])
    assert "AC-FAQ-010" in matched_ids


def test_faq_search_tool_vague_noise_no_match():
    """Test searching vague noise query returns no_match."""
    tool = FAQSearchTool(dataset_path=FAQ_PATH)
    result_str = tool._run("My car is making a strange noise.")
    res = json.loads(result_str)

    assert res.get("status") == "no_match"
    assert res.get("matched_faq_ids") == []


def test_faq_search_tool_read_only_protection():
    """Verify tool does not alter the underlying JSON dataset file."""
    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        content_before = f.read()

    tool = FAQSearchTool(dataset_path=FAQ_PATH)
    tool._run("oil change frequency synthetic oil")

    with open(FAQ_PATH, "r", encoding="utf-8") as f:
        content_after = f.read()

    assert content_before == content_after, "FAQ dataset file was mutated!"
