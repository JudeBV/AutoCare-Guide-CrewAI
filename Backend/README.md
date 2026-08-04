# AutoCare Guide CrewAI Backend & FastAPI Bridge

The **AutoCare Guide Backend** is an AI-powered customer support and safety triage system built with **CrewAI**, **FastAPI**, and **Python 3.12**. It intelligently handles user automotive queries by classifying requests, searching an approved 25-entry FAQ dataset, enforcing safety and policy rules, separating facts from assumptions, calculating evidence-based confidence levels, and exposing a REST API bridge for frontend clients (such as Angular).

---

## 🌟 Key Features

1. **4-Agent CrewAI Architecture**:
   - **Classifier Agent**: Categorizes queries into standard FAQs, complaints, emergencies, illegal requests, prompt injections, or out-of-scope topics. Assigns preliminary evidence and confidence levels.
   - **FAQ Retrieval Agent**: Uses a custom read-only tool to search `Backend/Data/autocare-faq.json` and returns matched FAQ IDs or `no_match`.
   - **Response-Writing Agent**: Formulates empathetic responses, placing emergency steps at the top of urgent messages and asking focused clarification questions when confidence is low.
   - **Escalation/Decision Agent**: Performs final review, resolves conflicts, and outputs the standardized `AutoCareResponse` JSON object with detailed evidence and review guidance.

2. **FastAPI REST Bridge**:
   - `GET /` — Returns API name and running status.
   - `GET /health` — Fast health check endpoint (independent of LLM/CrewAI calls).
   - `POST /chat` — Validates user messages, asynchronously delegates execution to the CrewAI Flow via `asyncio.to_thread`, and returns structured JSON responses.
   - **CORS Support**: Configured for `http://localhost:4200` (Angular) with `CORS_ORIGINS` environment variable support.

3. **Evidence-Based Confidence & Fact/Assumption Separation**:
   - **Confidence Levels**: `HIGH`, `MEDIUM`, `LOW`, `CONTRADICTORY`.
   - **Evidence Types**: `FACT`, `INFERENCE`, `ASSUMPTION`, `CONFLICT`.
   - Cites exact sources (`User message`, `AC-FAQ-001`, `autocare-policies.json`, etc.) for every key insight.

4. **Strict Safety & Guardrails**:
   - Never guarantees vehicle safety or gives unconfirmed diagnoses.
   - Rejects illegal requests, odometer tampering, and prompt injections.
   - Protects customer credentials (passwords, PINs, CVVs).

---

## 📁 Directory Structure

```text
Backend/
├── Data/
│   ├── autocare-faq.json           # 25 Approved FAQ entries
│   ├── autocare-policies.json      # Safety, triage, evidence & confidence policies
│   └── autocare-test-messages.json # 25 Standardized test scenarios with expected_confidence_level
├── config/
│   ├── agents.yaml                 # CrewAI agent roles & backstories
│   └── tasks.yaml                  # CrewAI task specifications
├── tools/
│   ├── __init__.py
│   └── faq_tool.py                 # Custom FAQSearchTool
├── tests/
│   ├── test_api.py                 # FastAPI endpoint & validation unit tests
│   ├── test_data_validation.py     # Data file & reference integrity tests
│   ├── test_faq_tool.py            # Custom tool unit tests
│   └── test_flow_structure.py      # Flow routing, evidence, & Pydantic model tests
├── .env.example                    # Environment variable template
├── .gitignore                      # Git exclusion rules
├── api.py                          # FastAPI application & CORS bridge
├── crew.py                         # CrewAI Crew definition
├── main.py                         # CrewAI Flow & routing logic
├── models.py                       # Pydantic schemas (AutoCareResponse, EvidenceItem)
├── pyproject.toml                  # Python package configuration
└── README.md                       # Documentation
```

---

## 🚀 Setup & Installation Instructions

### Prerequisites
- **Python 3.12** installed
- **uv** package runner (or standard `pip` / `venv`)

### Step 1: Create and Activate Virtual Environment

Using `uv`:
```bash
cd Backend
uv venv --python 3.12 .venv
.venv\Scripts\activate      # Windows (PowerShell: .venv\Scripts\Activate.ps1)
# source .venv/bin/activate # Linux / macOS
```

### Step 2: Install Dependencies

```bash
uv pip install -e .
# or
pip install -r pyproject.toml
```

### Step 3: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and set your API keys and CORS origins:
   ```env
   OPENAI_API_KEY=your_actual_openai_api_key
   CORS_ORIGINS=http://localhost:4200
   ```

---

## 🌐 Running the FastAPI Bridge Server

To start the FastAPI server locally with Uvicorn:

```bash
uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

- **Local API Base URL**: [http://127.0.0.1:8000](http://127.0.0.1:8000)
- **Interactive OpenAPI (Swagger) Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Alternative ReDoc Documentation**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🧪 Running Automated Tests

To execute all unit tests (including API endpoints, data validation, and flow routing):

```bash
pytest tests/ -v
```

Output:
```text
======================= 20 passed, 1 warning in 10.26s =======================
```

---

## 🚗 Sample Output JSON Structure (`POST /chat`)

```json
{
  "decision": "ANSWER",
  "category": "Dashboard Warning Lights",
  "confidence_level": "HIGH",
  "matched_faq_ids": [
    "AC-FAQ-001"
  ],
  "evidence": [
    {
      "insight": "User is asking about an orange check-engine warning light.",
      "evidence_type": "FACT",
      "confidence_level": "HIGH",
      "source": "User message and AC-FAQ-001",
      "reason": "The user's question directly matches the approved FAQ dataset.",
      "review_guidance": "No additional review is required for the general FAQ response."
    }
  ],
  "assumptions": [],
  "conflicts": [],
  "escalation_destination": null,
  "reason": "Direct informational query matching approved FAQ dataset.",
  "response": "Based on AutoCare policy [AC-FAQ-001]: The orange check-engine light indicates..."
}
```
