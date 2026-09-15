# 🤖 Fintrix AI — Conversational Financial Intelligence Agent Backend
> Powered by Hugging Face Inference API & SmolAgents | Track 1: Payments Risk & Forensics

---

## 📌 Overview

**Fintrix AI** is the backend agentic conversational intelligence layer designed to serve:
1. The **Fintrix Web Application**
2. The **Mobile App**
3. The **Interactive Analytics Dashboard**

It connects Hugging Face tool-calling LLMs with deterministic data retrieval tools, risk scoring models, and domain knowledge to provide explainable financial forensics on real UPI transaction and dispute datasets without hallucination.

---

## 📁 Project Structure

```
fintrix_ai/
│
├── .env                     # Local environment variables (HF_TOKEN)
├── .env.example             # Template environment variables
├── .gitignore               # Ignored artifacts and secrets
├── requirements.txt         # Python dependencies
├── README.md                # Documentation & quickstart guide
│
├── app/
│   ├── __init__.py
│   ├── main.py              # FastAPI application server
│   │
│   ├── agent/               # SmolAgents orchestration
│   │   ├── __init__.py
│   │   ├── agent.py         # Agent factory (ToolCallingAgent / CodeAgent)
│   │   ├── config.py        # Environment & model configuration
│   │   └── prompts.py       # Financial system prompts
│   │
│   ├── tools/               # Controlled deterministic tools (Phases 3-9)
│   │   ├── __init__.py
│   │   ├── transaction_tools.py # get_transaction(txn_id)
│   │   ├── customer_tools.py    # get_customer(user_id)
│   │   ├── merchant_tools.py    # get_merchant(merchant_id)
│   │   ├── chargeback_tools.py  # get_chargebacks(...)
│   │   ├── analytics_tools.py   # Aggregations & calculations
│   │   ├── risk_tools.py        # ML anomaly & risk scoring
│   │   └── knowledge_tools.py   # Static glossary & domain facts
│   │
│   ├── data/                # Data loader for clean datasets
│   │   ├── __init__.py
│   │   └── data_loader.py   # Cached access to 20K txns, 2.8K CB, 36K KYC, 6.2K merchants
│   │
│   ├── rag/                 # Modular RAG subsystem (Phase 9)
│   │   ├── __init__.py
│   │   ├── retriever.py     # Static document retriever
│   │   └── documents/       # Knowledge base markdown files
│   │
│   └── schemas/             # Pydantic request/response models
│       ├── __init__.py
│       └── response_models.py
│
└── tests/
    ├── __init__.py
    └── test_agent.py        # Phase 2 Agent verification test
```

---

## 🚀 Quickstart & Setup

### 1. Install Dependencies
```bash
cd fintrix_ai
pip install -r requirements.txt
```

### 2. Configure Hugging Face API Token
Create or update `fintrix_ai/.env`:
```env
HF_TOKEN=hf_your_actual_token_here
HF_MODEL_ID=Qwen/Qwen2.5-Coder-32B-Instruct
HOST=0.0.0.0
PORT=8000
```
> *Get a free Hugging Face User Access Token at [huggingface.co/settings/tokens](https://huggingface.co/settings/tokens).*

---

### 3. Run Phase 2 Agent Verification Test
```bash
python fintrix_ai/tests/test_agent.py
```

Expected Output:
```
============================================================
FINTRIX AI - PHASE 2 AGENT VERIFICATION TEST
============================================================
Model ID: Qwen/Qwen2.5-Coder-32B-Instruct
HF_TOKEN Configured: [YES - Configured]

User Prompt: "Hello, introduce yourself as Fintrix AI."
------------------------------------------------------------
Calling Hugging Face Inference API via SmolAgents...
...
[SUCCESS] Phase 2 Test Passed: Fintrix AI Agent connected to Hugging Face and responded successfully!
```

---

### 4. Run the FastAPI Server
```bash
cd fintrix_ai
uvicorn app.main:app --reload --port 8000
```
Visit API Documentation: `http://localhost:8000/docs`

---

## 🔒 Safety & Architectural Rules
1. **No Hallucinations**: Financial amounts, complaint counts, and user data are retrieved via deterministic Python tools.
2. **Database Migration**: Modular data loader supports current clean CSVs and ready for Firebase / Firestore adapter integration.
3. **No Unrestricted Access**: The LLM interacts strictly through typed tools.
