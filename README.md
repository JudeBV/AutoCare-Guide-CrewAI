# 🚘 AutoCare-Chatbot

An AI-powered automotive customer support, triage, and safety guidance chatbot platform built with **CrewAI**, **FastAPI**, and **Angular 19**.

---

## 🏗️ Architecture Overview

The system consists of two main components:

1. **[Backend](./Backend/README.md)** (`Python 3.12` / `CrewAI` / `FastAPI`)
   - **4-Agent CrewAI Architecture**: Classifier Agent, FAQ Retrieval Agent, Response-Writing Agent, and Escalation/Decision Agent.
   - **Evidence & Policy Guardrails**: Separates facts from assumptions, evaluates confidence levels, and enforces strict automotive safety policies.
   - **FastAPI REST Bridge**: Connects the CrewAI multi-agent pipeline to HTTP frontend clients.

2. **[Frontend](./Frontend/README.md)** (`Angular 19` / `TypeScript` / `RxJS`)
   - **Human-Centred AI UI/UX**: Includes Edit & Resend, Request Cancellation (Stop Processing), Expandable Explainability Accordion, Emergency Alerts, and Feedback mechanisms.
   - **Accessibility & Design**: Built for full screen-reader compliance (ARIA), keyboard navigation, and responsive modern styling.

---

## 🚀 Quick Start Guide

### 1. Backend Setup

```bash
cd Backend

# Create and activate virtual environment
uv venv --python 3.12 .venv
.venv\Scripts\activate      # Windows (PowerShell: .venv\Scripts\Activate.ps1)
# source .venv/bin/activate # Linux / macOS

# Install dependencies
uv pip install -e .

# Setup environment variables
cp .env.example .env
# Edit .env to add your OPENAI_API_KEY or GEMINI_API_KEY

# Start FastAPI server
uvicorn api:app --host 127.0.0.1 --port 8000 --reload
```

The FastAPI server runs at `http://127.0.0.1:8000` (OpenAPI Docs: `http://127.0.0.1:8000/docs`).

### 2. Frontend Setup

```bash
cd Frontend

# Install dependencies
npm install

# Start Angular development server
npm start
```

Open browser at `http://localhost:4200/`.

---

## 🧪 Testing

- **Backend Unit Tests**: `cd Backend && pytest tests/ -v`
- **Frontend Unit Tests**: `cd Frontend && npm test`

---

## 📄 License & Documentation

For detailed information on backend API contracts, CrewAI agent flows, and frontend component design, refer to:
- [Backend Documentation](./Backend/README.md)
- [Frontend Documentation](./Frontend/README.md)
