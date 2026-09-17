# Fintrix - UPI Fraud Ring & Merchant Analytics

**Website / Dashboard:** [https://fintrix-ai-dashboard.vercel.app/](https://fintrix-ai-dashboard.vercel.app/)  
**GitHub Repository:** [Rajathraj12/Fintrix-UPI-Fraud-Ring-Merchant-Risk-Analytics-Platform](https://github.com/Rajathraj12/Fintrix-UPI-Fraud-Ring-Merchant-Risk-Analytics-Platform)

> TransOrg AgentIQ Datathon 2026 - Track 1: FinTech & BFSI

Fintrix is our attempt to turn messy UPI payment data into something that a risk or operations team can actually work with.

The project brings together UPI transactions, customer KYC records, merchant information and chargeback data. We first clean and validate the data, then use it for business analysis, risk investigation and merchant analytics.

On top of that, we built an interactive dashboard and a conversational AI layer so that the same data can be explored either visually or by simply asking questions.

One important choice we made was to keep the actual financial calculations deterministic. The AI is not expected to guess transaction amounts, chargeback numbers or risk signals. Instead, it uses controlled tools to fetch and calculate information from the underlying datasets and then explains the result in natural language.

---

## Quick Overview

```text
Raw Datathon Data
       |
       v
Data Profiling
       |
       v
Data Cleaning & Standardization
       |
       v
Data Validation
       |
       v
EDA & Business Analysis
       |
       +----------------------+
       |                      |
       v                      v
Advanced Analytics     Risk / Intelligence Tools
                              |
                              v
                       Fintrix AI Backend
                              |
                              v
                       Interactive Dashboard
```

---

# Tech Stack

We kept the stack fairly practical so that each part of the project could be developed and tested independently.

## Data Engineering and Analytics

- Python
- Pandas
- NumPy
- Jupyter Notebook
- Matplotlib
- Seaborn
- Scikit-learn
- Statsmodels

## Backend

- Python
- FastAPI
- Uvicorn
- Pydantic
- python-dotenv
- Requests

## AI and Agent Layer

- Ollama
- Llama 3.2
- Tool-based agent architecture
- Deterministic analytics tools
- Deterministic fallback / mock engine
- Rule-based transaction risk analysis

We use **Ollama to run Llama 3.2 locally** instead of relying on a hosted model API. This keeps the AI layer local during development and avoids depending on external API usage limits.

## Website and Dashboard

- React
- Vite
- Tailwind CSS
- React Router
- Recharts
- Plotly
- Leaflet
- React Leaflet
- React Simple Maps
- D3 Scale
- Papa Parse
- Lucide React
- CSS



---

# Project Structure

The repository is split into a few clear parts: data, analysis notebooks, the AI backend, documentation and the dashboard.

```text
TransOrg-AgentIQ-Datathon/

|
├── README.md
├── requirements.txt
|
├── data/
|   ├── raw/
|   |   ├── track1_upi_transactions.csv
|   |   ├── track1_kyc_records.csv
|   |   ├── track1_merchants_master.csv
|   |   ├── track1_chargebacks.json
|   |   └── track1_dataset_notes.txt
|   |
|   └── processed/
|       ├── upi_transactions_clean.csv
|       ├── kyc_clean.csv
|       ├── merchants_clean.csv
|       ├── chargebacks_clean.csv
|       └── chargeback_transaction_summary.csv
|
├── notebooks/
|   ├── 01_data_profiling.ipynb
|   ├── 02_eda_and_business_analysis.ipynb
|   └── 03_advanced_analytics.ipynb
|
├── src/
|   ├── clean_data.py
|   ├── convert_json_to_csv.py
|   ├── exception.py
|   ├── logger.py
|   └── validate_data.py
|
├── docs/
|   └── data_dictionary.md
|
├── fintrix_ai/
|   ├── .env.example
|   ├── requirements.txt
|   ├── README.md
|   |
|   ├── app/
|   |   ├── main.py
|   |   |
|   |   ├── agent/
|   |   |   ├── agent.py
|   |   |   ├── config.py
|   |   |   └── prompts.py
|   |   |
|   |   ├── api/
|   |   |   ├── dependencies.py
|   |   |   ├── main.py
|   |   |   ├── routes.py
|   |   |   ├── schemas.py
|   |   |   └── session.py
|   |   |
|   |   ├── data/
|   |   |   └── data_loader.py
|   |   |
|   |   ├── rag/
|   |   |   ├── retriever.py
|   |   |   └── documents/
|   |   |       └── knowledge_base.md
|   |   |
|   |   ├── schemas/
|   |   |   └── response_models.py
|   |   |
|   |   ├── services/
|   |   |   ├── mock_engine.py
|   |   |   └── usage_tracker.py
|   |   |
|   |   └── tools/
|   |       ├── analytics_tools.py
|   |       ├── chargeback_tools.py
|   |       ├── customer_tools.py
|   |       ├── knowledge_tools.py
|   |       ├── merchant_tools.py
|   |       ├── risk_tools.py
|   |       └── transaction_tools.py
|   |
|   └── tests/
|       ├── test_agent.py
|       ├── test_analytics_tools.py
|       ├── test_api.py
|       ├── test_api_smoke.py
|       ├── test_customer_tool.py
|       ├── test_live_chat_http.py
|       ├── test_manual_prompts.py
|       ├── test_merchant_tool.py
|       ├── test_mock_intent.py
|       ├── test_risk_tool.py
|       └── test_transaction_tool.py
|
├── dashboard/
|   ├── .env.example
|   ├── package.json
|   ├── package-lock.json
|   ├── index.html
|   ├── vite.config.js
|   |
|   ├── public/
|   |   └── data/
|   |
|   └── src/
|       ├── App.jsx
|       ├── components/
|       ├── context/
|       ├── data/
|       ├── pages/
|       └── services/
|
└── frontend/
    ├── package.json
    ├── package-lock.json
    ├── index.html
    ├── tsconfig.json
    ├── vite.config.ts
    |
    └── src/
        ├── App.tsx
        ├── components/
        ├── context/
        ├── data/
        ├── pages/
        └── services/
```

---

# Setup and Running

## Prerequisites

Before running the project, make sure you have the following installed:

- Python 3.10+
- Node.js 18+
- npm 9+
- Ollama
- Llama 3.2

### Ollama

Download and install Ollama from the official website:

https://ollama.com/download

Ollama is available for Windows, macOS and Linux.

### Llama 3.2

After installing Ollama, download the Llama 3.2 model:

```bash
ollama run llama3.2
```

The command downloads the model if it is not already available and starts a local chat session.

You can also find the official Llama 3.2 model page here:

https://ollama.com/library/llama3.2

The project uses the default `llama3.2` model, which is the 3B version.

To check that the model is available:

```bash
ollama list
```

You should see `llama3.2` in the list.

Keep Ollama running while using the Fintrix AI backend.

---

## 1. Clone the Repository

```bash
git clone https://github.com/bhardwajharsh07/TransOrg-AgentIQ-Datathon.git
cd TransOrg-AgentIQ-Datathon
```

---

## 2. Create a Python Environment

From the project root:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

### Linux / macOS

```bash
python3 -m venv venv
source venv/bin/activate
```

Install the project dependencies:

```bash
pip install -r requirements.txt
```

---

## 3. Set Up the Fintrix AI Backend

Move into the backend:

```bash
cd fintrix_ai
```

Install the backend dependencies:

```bash
pip install -r requirements.txt
```

Create:

```text
fintrix_ai/.env
```

Use `fintrix_ai/.env.example` as the starting point.

### Environment Variables

The backend is configured to use Ollama locally.

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2
OLLAMA_BASE_URL=http://localhost:11434

FINTRIX_LLM_MODE=live

MAX_AGENT_REQUESTS_PER_SESSION=50
MAX_OUTPUT_TOKENS=384
MAX_CONTEXT_TOKENS=4000

HOST=0.0.0.0
PORT=8000
```

The important AI settings are:

- `LLM_PROVIDER` tells the backend to use Ollama.
- `OLLAMA_MODEL` specifies the Llama model.
- `OLLAMA_BASE_URL` points to the local Ollama service.
- `FINTRIX_LLM_MODE` controls whether the live AI path is used.

No Hugging Face API token is required for the current setup.

---

## 4. Prepare the Data

The original datathon files are kept separately under:

```text
data/raw/
```

The cleaned versions are stored under:

```text
data/processed/
```

The general workflow is:

```text
Raw Data
   |
   v
Profiling
   |
   v
Cleaning and Standardization
   |
   v
Validation
   |
   v
EDA and Business Analysis
   |
   v
Advanced Analytics
```

The notebooks can be run in order to reproduce the analysis.

The chargeback data is supplied as JSON and is converted into a tabular format before it is used in the analysis.

---

## 5. Run the Fintrix AI Backend

Before starting the backend, make sure Ollama is installed and Llama 3.2 is available:

```bash
ollama list
```

If required:

```bash
ollama run llama3.2
```

Then, from the `fintrix_ai` directory:

```bash
uvicorn app.main:app --reload --port 8000
```

The backend will be available at:

```text
http://localhost:8000
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

Alternative API documentation:

```text
http://localhost:8000/redoc
```

The backend communicates with Ollama through its local API.

By default, Ollama runs on:

```text
http://localhost:11434
```

---

## 6. Set Up the Dashboard

Open another terminal and go back to the project root.

Then:

```bash
cd dashboard
```

Install the frontend packages:

```bash
npm install
```

Create:

```text
dashboard/.env
```

using `dashboard/.env.example` as the template.

### Dashboard Environment Variables

```env
VITE_FINTRIX_API_URL=http://localhost:8000
```

`VITE_FINTRIX_API_URL` tells the dashboard where the Fintrix AI backend is running.

Do not commit local `.env` files containing configuration or secrets.

---

## 7. Run the Dashboard

From the `dashboard` directory:

```bash
npm run dev
```

Vite will normally start the dashboard at:

```text
http://localhost:5173
```

For a production build:

```bash
npm run build
```

To preview the production build:

```bash
npm run preview
```

---

## 8. Set Up the Website

Open another terminal and go back to the project root.

Then:

```bash
cd frontend
```

Install the website packages:

```bash
npm install
```

---

## 9. Run the Website

From the `frontend` directory:

```bash
npm run dev
```

Vite will start the website at:

```text
http://localhost:5174
```

---

# Dataset Description

The datathon gives us four main datasets:

1. UPI transactions
2. KYC records
3. Merchant master
4. Chargebacks

There is also a dataset notes file that explains the expected relationships and some of the business questions that can be explored.

The data supplied for this project is synthetic and is intended for educational and datathon purposes.

---

## 1. UPI Transactions

### Raw File

```text
data/raw/track1_upi_transactions.csv
```

### Clean File

```text
data/processed/upi_transactions_clean.csv
```

This is the main payment transaction dataset. It contains the basic details of each UPI transaction.

| Column | Definition |
| --- | --- |
| `txn_id` | Unique identifier for a UPI transaction. |
| `timestamp` | Date and time when the transaction was recorded or initiated. |
| `user_id` | Identifier of the customer associated with the transaction. |
| `merchant_id` | Identifier of the merchant associated with the transaction. |
| `amount` | Monetary value of the transaction in Indian Rupees. |
| `utr` | Unique Transaction Reference associated with the payment. |
| `mcc` | Merchant Category Code used to classify the merchant's business category. |
| `status` | Transaction status such as `SUCCESS`, `FAILED`, or `PENDING`. |

### Cleaned Dataset Size

```text
20,000 records
```

---

## 2. KYC Records

### Raw File

```text
data/raw/track1_kyc_records.csv
```

### Clean File

```text
data/processed/kyc_clean.csv
```

The KYC dataset gives us the customer-side information needed to connect payment activity with identity and compliance information.

| Column | Definition |
| --- | --- |
| `user_id` | Identifier used to connect a customer with transaction records. |
| `full_name` | Customer name recorded in the KYC information. |
| `pan` | Permanent Account Number associated with the customer. |
| `aadhaar` | Aadhaar identifier associated with the customer. |
| `date_of_birth` | Customer date of birth. |
| `city` | Customer's registered city. |
| `state` | Customer's registered state or union territory. |
| `monthly_income` | Declared monthly income in Indian Rupees. |
| `occupation` | Customer occupation category. |
| `signup_timestamp` | Timestamp associated with customer account signup. |
| `kyc_status` | KYC state such as `VERIFIED`, `PENDING`, or `REJECTED`. |
| `risk_segment` | Customer risk classification available in the source data, such as `LOW`, `MEDIUM`, `HIGH`, or `UNKNOWN`. |

### Cleaned Dataset Size

```text
36,122 records
```

---

## 3. Merchant Master

### Raw File

```text
data/raw/track1_merchants_master.csv
```

### Clean File

```text
data/processed/merchants_clean.csv
```

This dataset describes the merchants receiving the payments and gives us the context needed for merchant-level analysis.

| Column | Definition |
| --- | --- |
| `merchant_id` | Identifier for the merchant entity. |
| `merchant_name` | Registered merchant or business name. |
| `mcc` | Merchant Category Code associated with the merchant. |
| `merchant_category` | Human-readable business category. |
| `business_type` | Business structure or organization type. |
| `city` | Merchant's operating city. |
| `state` | Merchant's operating state or union territory. |
| `onboarding_date` | Date when the merchant was onboarded. |
| `settlement_account` | Settlement account information associated with the merchant. |
| `merchant_status` | Merchant status such as `ACTIVE`, `INACTIVE`, or `SUSPENDED`. |
| `declared_avg_ticket_size` | Merchant-declared expected average transaction amount in Indian Rupees. |

### Cleaned Dataset Size

```text
6,198 records
```

---

## 4. Chargebacks

### Raw File

```text
data/raw/track1_chargebacks.json
```

### Converted File

```text
data/processed/track1_chargebacks.csv
```

### Clean File

```text
data/processed/chargebacks_clean.csv
```

This dataset contains the complaints and disputes raised against transactions.

| Column | Definition |
| --- | --- |
| `complaint_id` | Unique identifier for a chargeback or complaint case. |
| `txn_id` | Transaction identifier associated with the dispute, when available. |
| `user_id` | Customer identifier associated with the complaint. |
| `merchant_id` | Merchant identifier associated with the complaint. |
| `transaction_timestamp` | Timestamp associated with the original transaction. |
| `reported_timestamp` | Timestamp when the customer reported the dispute. |
| `disputed_amount` | Amount being disputed in Indian Rupees. |
| `reason_code` | Reason assigned to the chargeback or dispute. |
| `complaint_text` | Text describing the customer's complaint. |
| `resolution_status` | Current dispute state such as `OPEN`, `CLOSED`, or `REJECTED`. |
| `bank_response_timestamp` | Timestamp associated with the bank's response to the dispute. |
| `severity` | Severity classification of the dispute. |
| `channel` | Channel through which the dispute was reported, such as `IVR`, `Chatbot`, `Email`, `Branch`, `App`, or `Call Center`. |
| `reported_before_transaction` | Boolean flag showing that the reported timestamp occurs before the transaction timestamp. |
| `bank_response_before_report` | Boolean flag showing that the bank response timestamp occurs before the dispute report timestamp. |

The two timeline columns are additional fields created during cleaning and validation.

### Cleaned Dataset Size

```text
2,800 records
```

---

## 5. Dataset Notes

```text
data/raw/track1_dataset_notes.txt
```

The notes file supplied with the datathon describes:

- Expected relationships between the datasets
- Suggested cleaning tasks
- Business metrics
- Dashboard questions
- Example AI queries
- Expected analysis areas

---

# Dataset Relationships

The main connections between the datasets are:

```text
UPI Transactions
       |
       +---- user_id ------> KYC Records
       |
       +---- merchant_id --> Merchant Master
       |
       +---- txn_id -------> Chargebacks

Chargebacks
       |
       +---- user_id ------> KYC Records
       |
       +---- merchant_id --> Merchant Master
```

The join keys are:

| Relationship | Join Key |
| --- | --- |
| Transactions to KYC | `user_id` |
| Transactions to Merchant Master | `merchant_id` |
| Chargebacks to Transactions | `txn_id` |
| Chargebacks to KYC | `user_id` |
| Chargebacks to Merchant Master | `merchant_id` |

One thing we had to be careful about was repeated IDs in the KYC and merchant files. A direct many-to-many join can multiply transaction rows and make totals look much larger than they actually are.

For that reason, analytical joins use controlled lookups where needed.

---

# Data Pipeline

The data work is split into a few stages so that we can see what changed at each point.

```text
Raw Files
   |
   v
01_data_profiling.ipynb
   |
   v
JSON Chargebacks -> CSV
   |
   v
src/clean_data.py
   |
   v
Cleaned Datasets
   |
   v
src/validate_data.py
   |
   v
Validated Analytical Data
   |
   +-----------------------------+
   |                             |
   v                             v
EDA and Business Analysis   Advanced Analytics
   |                             |
   +-------------+---------------+
                 |
                 v
           Risk / AI / Dashboard
```

The idea is simple: keep the original data untouched, create cleaned versions separately, and use those cleaned datasets for the analysis and application.

---

# Data Cleaning and Quality Handling

The raw files were not analysis-ready, so a significant part of the work went into making the data consistent without throwing away useful information.

## Identifier Standardization

The same identifier can appear in different formats.

For example:

```text
USR12345
usr12345
USR-12345
USR 12345
usr_12345
12345
```

These representations are standardized before they are used for joins or analysis.

The same idea is applied to transaction, merchant and complaint identifiers.

## Amount Cleaning

Transaction and dispute amounts can appear in different formats.

The cleaning process handles things such as:

- Currency symbols
- Commas
- `INR`
- `Rs.`
- Blank values
- Invalid strings
- Negative values
- `k` notation

The final monetary fields are converted into numeric values so that calculations can be performed consistently.

## Timestamp Cleaning

Different timestamp formats are converted into proper datetime values.

Unix timestamps are also handled where they occur in the data.

## Status and Category Normalization

Different labels can represent the same underlying status.

For example:

```text
SUCCESS
TXN_SUCCESS
S
COMPLETED
```

can all represent a successful transaction and are normalized to:

```text
SUCCESS
```

Similar normalization is applied to failed and pending transactions, KYC status, merchant status, risk segment, dispute status and severity.

## Location Standardization

City and state names are standardized so that spelling or formatting differences do not split the same location into multiple categories during analysis.

## PAN and Aadhaar Cleaning

PAN values are format-checked and Aadhaar values are cleaned while preserving their identifier structure.

## MCC Normalization

Merchant Category Codes are converted into a consistent representation so they can be used reliably during analysis.

## Duplicate Handling

Exact duplicate records are treated separately from repeated entity IDs.

A repeated `user_id` or `merchant_id` does not automatically mean that the record is useless. Some repeated IDs contain different attributes, and those differences can themselves be useful for data-quality analysis.

---

# Data Quality Findings

The first profiling pass showed that the raw datasets had several issues that needed to be handled before analysis.

## Raw Dataset Sizes

```text
UPI Transactions  : 20,400
KYC Records       : 36,400
Merchant Master   : 6,210
Chargebacks       : 2,884
```

## Cleaned Dataset Sizes

```text
UPI Transactions  : 20,000
KYC Records       : 36,122
Merchant Master   : 6,198
Chargebacks       : 2,800
```

The reduction mainly comes from duplicate handling and cleaning of records that could not be retained in their original form.

We did not simply remove every record that failed a join.

Instead, unmatched relationships were kept as data-quality findings because they can also tell us something about the source data.

## Entity and Join Quality

There are incomplete relationships between transactions, KYC records, merchants and chargebacks.

Rather than hiding these issues, the project keeps them visible during validation and analysis.

## Entity Conflicts

Some KYC and merchant IDs appear more than once with different attributes.

These records are retained because conflicting attributes can be relevant during an investigation.

## Timeline Anomalies

The chargeback data also contains timestamp inconsistencies.

Two explicit flags are created:

- `reported_before_transaction`
- `bank_response_before_report`

These records are retained with the flags instead of being silently removed.

---

# Exploratory Data Analysis

The main EDA notebook is:

```text
notebooks/02_eda_and_business_analysis.ipynb
```

The analysis follows the business questions that matter for a payment and risk platform.

## Transaction Analysis

We looked at:

- Transaction status distribution
- Transaction amount distribution
- Daily transaction volume
- Daily transaction value
- Transaction summary statistics

For the cleaned transaction data, we found:

```text
20,000 transactions

Approximately ₹24.45 Cr in transaction value

85.3% successful transactions

9.8% failed transactions

5.0% pending transactions
```

These numbers give us the basic picture of transaction activity before moving into risk and dispute analysis.

## Merchant and Category Analysis

Merchant analysis covers:

- Merchant activity
- Category transaction count
- Category transaction value
- Transaction status by category
- Merchant master consistency

Repeated merchant IDs are handled carefully so that a join does not artificially increase transaction counts or values.

## Chargeback Analysis

The chargeback analysis looks at:

- Chargeback counts
- Disputed amounts
- Chargeback reasons
- Severity
- Chargeback ratios
- Transaction-level chargeback matching
- Category-level chargeback rates

For category-level chargeback rates, we count unique chargebacked transactions rather than simply counting complaint rows.

This matters because one transaction can have more than one complaint.

The observed category-level rates include:

| Category | Chargeback Rate |
| --- | ---: |
| Travel | 14.60% |
| Retail | 14.05% |
| Books & Stationery | 13.35% |
| Telecom | 13.32% |
| Other | 13.25% |

We use these rates alongside transaction volume because a rate by itself does not tell the whole story.

## KYC and Risk Analysis

The analysis includes:

- KYC status distribution
- Risk segment distribution
- Transaction activity by risk segment
- High-risk users with transaction activity
- High-risk users with chargebacks
- Unusually active users

## Suspicious User Analysis

We also created exploratory risk signals using combinations of:

- Chargeback history
- Failed transaction activity
- High transaction activity
- High-risk KYC segment

These signals are meant to help identify records worth looking into.

They are not treated as proof that a user is fraudulent.

---

# Advanced Analytics

The advanced analysis is in:

```text
notebooks/03_advanced_analytics.ipynb
```

This notebook goes a step beyond basic descriptive analysis.

## Merchant Behavioral Clustering

We use K-Means clustering to group merchants based on behavioral characteristics from transaction and dispute activity.

The clustering uses information such as:

- Merchant transaction volume
- Chargeback volume
- Dispute ratio
- StandardScaler
- K-Means

The goal is to see whether merchants naturally form different behavioral groups.

## Dispute Volume Forecasting

Daily chargeback counts are aggregated and a Simple Exponential Smoothing model is used to estimate the next seven days of dispute volume.

This gives a simple view of the short-term dispute workload.

## Dispute and Cohort Analysis

The notebook also explores:

- Dispute reasons
- Dispute intake channels
- Transaction activity by hour
- Transaction activity by day of week

---

# Fintrix AI

The AI backend lives inside:

```text
fintrix_ai/
```

The main idea behind the AI layer is that the language model should not be responsible for doing the financial math itself.

Instead, it can call specific tools that work with the data.

```text
User Question
      |
      v
Fintrix AI Agent
      |
      v
Controlled Tools
      |
      +---- Transaction Tool
      +---- Customer Tool
      +---- Merchant Tool
      +---- Chargeback Tool
      +---- Analytics Tools
      +---- Risk Tool
      +---- Knowledge Tool
      |
      v
Structured Data
      |
      v
Llama 3.2 via Ollama
      |
      v
Natural Language Response
```

Llama 3.2 runs locally through Ollama. This means the application can send prompts to a local model instead of depending on a hosted LLM API.

This was also useful for development because we could keep testing the AI layer without being blocked by external API usage limits.

---

# Transaction Intelligence

The transaction tool is used when we need information about a particular transaction.

It can return:

- Transaction ID
- Timestamp
- User ID
- Merchant ID
- Amount
- UTR
- MCC
- Status

This is useful when an analyst starts with a transaction ID and wants to understand what happened to that payment.

---

# Customer Intelligence

The customer tool brings together information from the KYC and transaction datasets.

It can provide:

- Customer profile
- KYC status
- Risk segment
- Transaction activity
- Failed transaction activity
- Chargeback activity

Sensitive identity fields such as PAN and Aadhaar are not exposed through the customer tool response.

---

# Merchant Intelligence

The merchant tool combines merchant information with transaction and chargeback activity.

It can provide:

- Merchant profile
- Transaction count
- Transaction value
- Average transaction value
- Failed transaction activity
- Chargeback activity
- Chargeback rate
- Merchant risk tier
- Ticket-size anomaly information

Settlement account information is not exposed through the merchant tool response.

---

# Chargeback Intelligence

The chargeback tools allow us to look at:

- Chargeback volume
- Disputed amounts
- Dispute reasons
- Severity
- Resolution status
- Intake channels
- Chargeback trends

This is particularly useful when moving from a general risk view to understanding what is actually driving disputes.

---

# Risk Analysis

The risk engine uses a set of deterministic signals rather than relying entirely on an LLM to decide whether something looks risky.

The current signals include:

- Historical chargeback
- Critical chargeback
- Suspended merchant
- High-risk KYC
- Unverified KYC
- Ticket-size anomaly
- Failed transaction

For ticket-size anomalies, the transaction amount is compared with the merchant's declared average ticket size.

The current rule is:

```text
transaction amount > 3 x declared average ticket size
```

The triggered signals are then combined to produce a risk level.

This risk level is a heuristic investigation signal. It should not be interpreted as a calibrated probability that a transaction is fraudulent.

---

# Conversational Agent

The conversational layer uses a tool-calling approach so the AI can work with the same datasets used by the dashboard.

The language model used for this layer is **Llama 3.2**, running locally through **Ollama**.

It can handle things such as:

- Transaction lookups
- Customer profiles
- Merchant profiles
- Dataset analytics
- Chargebacks
- Risk analysis
- Domain knowledge

The agent is instructed to use the deterministic tools when answering questions that depend on actual financial data.

For example, if someone asks:

```text
Which merchant has the most transactions?
```

the answer should come from the analytics data rather than from the language model trying to guess.

---

# Ollama and Llama 3.2

Fintrix currently uses Ollama as the local model runtime and Llama 3.2 as the language model.

The default setup is:

```text
Ollama
   |
   v
Llama 3.2
   |
   v
Fintrix AI Agent
   |
   v
Fintrix Tools
   |
   v
Transaction / KYC / Merchant / Chargeback Data
```

Ollama exposes the model locally, normally through:

```text
http://localhost:11434
```

The backend connects to that endpoint using the configuration in `fintrix_ai/.env`.

To manually start the model:

```bash
ollama run llama3.2
```

To check installed models:

```bash
ollama list
```

Official resources:

- Ollama: https://ollama.com/
- Ollama downloads: https://ollama.com/download
- Llama 3.2 model: https://ollama.com/library/llama3.2

---

# Deterministic Fallback

The backend also includes:

```text
fintrix_ai/app/services/mock_engine.py
```

This provides a deterministic fallback for supported intents.

It can be useful when:

- Mock mode is enabled
- The local model is unavailable
- A provider request fails
- A deterministic answer is enough for the question

This gives the application a way to continue responding to supported queries even when the AI model is not available.

---

# API

The FastAPI backend exposes the conversational API through:

```text
POST /api/chat
```

Health check:

```text
GET /health
```

Interactive API documentation:

```text
/docs
```

The API also takes care of:

- Request validation
- Session management
- Usage limits
- Request IDs
- Latency tracking
- Structured responses
- Error handling
- Provider fallback

---

# Session and Usage Controls

The backend keeps track of AI usage at the session level.

The usage tracker records information such as:

- Request count
- Input tokens
- Output tokens
- Total tokens

The limits can be configured through environment variables:

```env
MAX_AGENT_REQUESTS_PER_SESSION=50
MAX_OUTPUT_TOKENS=384
MAX_CONTEXT_TOKENS=4000
```

These limits help keep the conversational service within defined usage boundaries.

---

# Dashboard

The dashboard is built with React and Vite.

The main idea is to let someone explore the payment ecosystem from a broad view and then drill down into merchants, transactions, disputes or KYC information.

## Overview

The overview page gives a quick snapshot of:

- Transaction activity
- Key transaction KPIs
- Dispute activity
- Risk indicators

## India City Risk Map

The map provides a geographic view of transaction and risk-related information across Indian cities and states.

## Disputes and Chargebacks

This section focuses on:

- Chargeback patterns
- Dispute reasons
- Severity
- Resolution status
- Intake channels
- Dispute trends

## Merchant Intelligence

This section looks at:

- Merchant portfolio information
- Transaction activity
- Category breakdown
- Chargeback indicators
- Merchant risk information
- Ticket-size anomalies

## Data Quality and KYC

This section brings together:

- KYC status
- Risk segments
- Identity-related quality information
- Anomaly indicators

## Fintrix AI

The AI page provides the conversational interface for asking questions about transactions, customers, merchants, disputes and risk.

---

# Website (Landing Page)

The website is a lightweight landing page for the project built with React, Vite, and Tailwind CSS. It is located in the `frontend/` directory.

It provides an overview of the Fintrix project, highlighting its core capabilities such as UPI fraud detection, merchant analytics, and the AI-driven conversational layer. It serves as the primary entry point for users before they launch the main interactive dashboard.

---

# Dashboard Data Flow

The dashboard loads the processed CSV files through a shared data context.

```text
Processed CSV Files
       |
       v
Papa Parse
       |
       v
DataContext
       |
       v
React Pages
       |
       v
Charts / Tables / Risk Views
```

For AI-related questions, the dashboard communicates with the FastAPI backend.



---

# Testing

The backend has a dedicated test suite under:

```text
fintrix_ai/tests/
```

The tests cover areas such as:

- Agent initialization
- Transaction lookup
- Customer lookup
- Merchant lookup
- Risk analysis
- Analytics tools
- API behavior
- API validation
- Session handling
- Usage limits
- Deterministic intent handling
- Privacy checks
- Regression checks
- API smoke testing

For example:

```bash
cd fintrix_ai
python tests/test_agent.py
```

Individual test files can also be run directly when working on a specific part of the backend.

---

# Example Fintrix AI Queries

The conversational layer is designed around practical questions that someone working with payment or risk data might ask.

```text
Which merchant has the most transactions?

Which merchant processed the highest transaction amount?

Which merchant category has the highest chargeback rate?

What is the overall transaction failure rate?

How much money has been disputed?

What are the most common dispute reasons?

Show the chargeback distribution by severity.

Show the top users by disputed amount.

What is the KYC risk distribution?

Why is this transaction considered risky?

Show me the transaction details for a transaction ID.

Show me the profile of a customer.

Show me the profile of a merchant.

Show disputes reported after a certain number of days.
```

---

# Key Business Metrics

The project focuses on the metrics that are most useful for understanding payment activity and risk.

These include:

- Total transaction count
- Total transaction amount
- Average transaction value
- Successful transaction rate
- Failed transaction rate
- Pending transaction rate
- Chargeback count
- Disputed amount
- Chargeback-to-transaction rate
- Merchant category performance
- Merchant chargeback activity
- User chargeback activity
- KYC status
- Risk segment
- Failed transaction activity
- Dispute severity
- Dispute reasons
- Dispute channels
- Dispute timeline anomalies
- Merchant ticket-size anomalies

---

# Important Analytical Decisions

A few choices during the analysis made a noticeable difference to the results.

## Transaction-Level Chargeback Rate

We calculate chargeback rates using unique chargebacked transactions rather than simply counting complaint records.

This matters because the same transaction can appear in more than one complaint.

Counting every complaint separately could make a category or merchant look riskier than it actually is.

## Merchant Join Handling

The merchant master contains repeated merchant IDs.

A normal many-to-many join can therefore duplicate transaction rows and inflate totals.

Where required, we use a one-row-per-merchant lookup for analytical joins.

## KYC and Merchant Repeated IDs

A repeated KYC or merchant ID is not automatically treated as a duplicate entity.

Some repeated IDs have different attributes, so we retain them and treat the differences as part of the data-quality analysis.

## Unmatched Foreign Keys

If a transaction cannot be matched to a customer or merchant, we do not automatically throw it away.

The unmatched relationship itself can be useful when assessing the quality of the source data.

## Timeline Anomalies

Timestamp inconsistencies in the chargeback data are retained with explicit flags.

This keeps the original information available for investigation instead of hiding it during cleaning.

## Risk Signals

The risk signals are designed to highlight records that may deserve a closer look.

They are not intended to declare that a particular user, merchant or transaction is fraudulent.

---

# Reproducibility

The recommended order for reproducing the project is:

```text
1. Load the raw datathon files

2. Profile the raw datasets

3. Convert chargebacks JSON to CSV

4. Clean and standardize the datasets

5. Validate relationships and data quality

6. Run EDA and business analysis

7. Run advanced analytics

8. Start Ollama and load Llama 3.2

9. Start the Fintrix AI backend

10. Start the dashboard
```

Keeping `data/raw/` and `data/processed/` separate also makes it easier to see exactly what happened to the original data during cleaning.

---

# Data Quality Summary

| Dataset | Raw Records | Clean Records |
| --- | ---: | ---: |
| UPI Transactions | 20,400 | 20,000 |
| KYC Records | 36,400 | 36,122 |
| Merchant Master | 6,210 | 6,198 |
| Chargebacks | 2,884 | 2,800 |

The difference between the raw and cleaned counts mainly comes from duplicate handling and the cleaning and standardization process.

The important part is that the cleaning stage is not treated as a black box. The raw files are kept separately, the cleaning work is documented in notebooks, and data-quality issues that may be useful for investigation are retained rather than simply deleted.

---

# Final Note

Fintrix is built around a simple idea:

**Make the payment data easier to understand, easier to investigate, and harder to misinterpret.**

The dashboard gives the visual overview, the analytics notebooks provide the deeper analysis, and the AI layer gives users another way to interact with the same underlying information.

The AI side runs locally through Ollama and Llama 3.2, while the actual financial calculations continue to come from the underlying datasets and deterministic tools.

Since the dataset is synthetic, the results should be treated as analytical findings from the datathon data rather than as conclusions about real-world customers, merchants or transactions.