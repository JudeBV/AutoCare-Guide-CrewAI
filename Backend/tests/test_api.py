"""Unit tests for FastAPI bridge endpoints."""

import pytest
from fastapi.testclient import TestClient
from api import app

client = TestClient(app)


def test_root_endpoint():
    """Test GET / returns API metadata and running status."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "name": "AutoCare Guide API",
        "status": "running"
    }


def test_health_endpoint():
    """Test GET /health returns status ok without LLM call."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data == {
        "status": "ok"
    }


def test_chat_missing_message():
    """Test POST /chat rejects request missing 'message' field with 422."""
    response = client.post("/chat", json={})
    assert response.status_code == 422


def test_chat_empty_message():
    """Test POST /chat rejects empty or whitespace message with 422."""
    response = client.post("/chat", json={"message": "   "})
    assert response.status_code == 422


def test_chat_valid_structure():
    """Test POST /chat processes valid message and returns AutoCareResponse structure."""
    response = client.post("/chat", json={"message": "What does the orange check-engine light mean?"})
    assert response.status_code == 200
    data = response.json()

    assert "decision" in data
    assert "category" in data
    assert "confidence_level" in data
    assert "matched_faq_ids" in data
    assert "evidence" in data
    assert "assumptions" in data
    assert "conflicts" in data
    assert "escalation_destination" in data
    assert "reason" in data
    assert "response" in data

    assert data["decision"] == "ANSWER"
    assert data["category"] == "Dashboard Warning Lights"
    assert data["confidence_level"] == "HIGH"
    assert data["matched_faq_ids"] == ["AC-FAQ-001"]
    assert "AC-FAQ-004" not in data["matched_faq_ids"]
    assert data["escalation_destination"] is None
