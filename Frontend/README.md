# AutoCare Guide - Angular Frontend

This repository contains the standalone Angular frontend user interface for **AutoCare Guide**, an automobile service and maintenance chatbot.

## 🚀 Quick Start & Local Run Instructions

### Prerequisites
- Node.js (v18+ or v22 LTS recommended)
- npm (v10+ or v11+)

### 1. Install Dependencies
Navigate to the `Frontend/` folder and run:
```bash
npm install
```

### 2. Run Local Development Server
To launch the frontend local dev server, run:
```bash
npm start
```
Or:
```bash
npx ng serve --open
```
Open your browser and navigate to:
**`http://localhost:4200/`**

### 3. Run Unit Tests
To execute component and service unit tests, run:
```bash
npm test
```

### 4. Build Production Bundle
To create a production build:
```bash
npm run build
```

---

## 🛠️ Architecture & Features

- **Decoupled Service Layer**: `ChatService` delegates to `MockChatService` for offline development. Connects seamlessly to the FastAPI backend at `https://autocare-guide-api.onrender.com/chat`.
- **Human-Centred AI (HCAI) UX**:
  - **Edit & Resend**: Revise previously sent messages.
  - **Stop Processing**: Cancel active request while loading.
  - **Explainability Accordion**: Expandable "Why this answer?" section showing Confidence Level, FAQ IDs (`AC-FAQ-001`), and Evidence attribution.
  - **Emergency Safety Alerts**: Prominent red banner placing immediate safety instructions first.
  - **Feedback Loop**: 👍 Helpful / 👎 Not helpful controls with reason chips (`Inaccurate`, `Unclear`, `Incomplete`, `Unsafe`).
- **Accessibility**: Full keyboard navigation, visible focus rings, ARIA live screen-reader announcements, and reduced motion compliance.
