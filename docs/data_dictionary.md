# 📊 Fintrix Complete Data Dictionary & Schema Reference
> **TransOrg AgentIQ Datathon 2026** // Track 1: Payments Risk & Chargeback Forensics

---

## 1. `upi_transactions_clean.csv` (20,000 Records)
Core financial transaction ledger recording real-time UPI payments.

| Column Name | Data Type | Null Count | Description & Business Meaning | Sample Value | Hygiene Rules |
| :--- | :---: | :---: | :--- | :---: | :--- |
| `txn_id` | `VARCHAR` | 0 | Unique transaction identifier generated per UPI payment request. | `TXN00011869` | Primary key; standardized formatting. |
| `timestamp` | `DATETIME` | 0 | Initiation timestamp of the UPI payment. | `2026-01-15 00:11:30` | Converted to ISO-8601 standard format. |
| `user_id` | `VARCHAR` | 0 | Unique identifier of customer initiating payment. | `USR45826` | Foreign key referencing KYC records. |
| `merchant_id` | `VARCHAR` | 0 | Unique identifier of merchant receiving payment. | `MCH7045` | Foreign key referencing Merchant records. |
| `amount` | `FLOAT` | 420 | Total monetary value transacted in Indian Rupees (₹). | `15722.34` | Cleaned of negative/corrupt strings; rounded to 2 decimals. |
| `utr` | `VARCHAR` | 1,000 | 12-digit Unique Transaction Reference from NPCI / bank. | `UTR6498104698` | Standardized alphanumeric syntax. |
| `mcc` | `FLOAT` | 2,872 | 4-digit ISO Merchant Category Code classifying merchant's industry. | `5411.0` | Imputed and mapped to ISO 18245 standards. |
| `status` | `VARCHAR` | 0 | Final transaction state (`SUCCESS`, `FAILED`, `PENDING`). | `SUCCESS` | Normalized string values (85.3% success rate). |

---

## 2. `chargebacks_clean.csv` (2,800 Records)
Dispute claims logged by customers against transactions.

| Column Name | Data Type | Null Count | Description & Business Meaning | Sample Value | Hygiene Rules |
| :--- | :---: | :---: | :--- | :---: | :--- |
| `complaint_id` | `VARCHAR` | 0 | Unique case filing reference for the grievance. | `CBK0002082` | Primary key (`CBKxxxxxxx`). |
| `txn_id` | `VARCHAR` | 77 | Associated transaction ID under dispute. | `TXN00004325` | Nullable for unlinked voice/IVR claims. |
| `user_id` | `VARCHAR` | 0 | Customer ID filing the chargeback complaint. | `USR97580` | Verified against user directory. |
| `merchant_id` | `VARCHAR` | 0 | Target merchant entity against whom claim was raised. | `MCH1127` | Verified against merchant directory. |
| `transaction_timestamp` | `DATETIME` | 230 | Time when original UPI transaction occurred. | `2026-01-28 00:00:00` | Chronologically validated. |
| `reported_timestamp` | `DATETIME` | 203 | Time when customer registered the dispute. | `2026-02-01 00:00:00` | Validated $t_{\text{report}} \ge t_{\text{txn}}$. |
| `disputed_amount` | `FLOAT` | 399 | Claimed disputed money value in Rupees (₹). | `414.69` | Imputed from txn amount if missing. |
| `reason_code` | `VARCHAR` | 0 | Standardized chargeback classification (`SERVICE_NOT_PROVIDED`, `UNAUTHORIZED_TRANSACTION`, `WRONG_AMOUNT`, etc.). | `SERVICE_NOT_PROVIDED` | Categorized and normalized. |
| `complaint_text` | `TEXT` | 0 | Raw or transcribed grievance narrative from the customer. | `"Customer says amount was debited twice."` | NLP sentiment & keyword tokenized. |
| `resolution_status` | `VARCHAR` | 0 | Current stage of dispute lifecycle (`OPEN`, `CLOSED`, `REJECTED`). | `CLOSED` | 1,492 Open, 865 Closed, 443 Rejected. |
| `bank_response_timestamp` | `DATETIME` | 701 | Timestamp when acquiring bank responded with arbitration evidence. | `2026-02-10 03:19:10` | Used to compute turnaround time (TAT). |
| `severity` | `VARCHAR` | 0 | Forensic severity tier (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`). | `CRITICAL` | Risk-weighted based on amount & reason. |
| `channel` | `VARCHAR` | 0 | Intake conduit from which dispute originated. | `IVR` | Exactly 6 channels: IVR, Chatbot, Email, Branch, App, Call Center. |
| `reported_before_transaction` | `BOOLEAN` | 0 | Anomaly flag: was dispute registered before txn date? | `False` | Forensic anomaly indicator. |
| `bank_response_before_report` | `BOOLEAN` | 0 | Anomaly flag: did bank respond before claim was filed? | `False` | Temporal corruption flag. |

---

## 3. `kyc_clean.csv` (36,122 Records)
Identity profiles, demographic verification, and regulatory compliance data.

| Column Name | Data Type | Null Count | Description & Business Meaning | Sample Value | Hygiene Rules |
| :--- | :---: | :---: | :--- | :---: | :--- |
| `user_id` | `VARCHAR` | 0 | Unique identity key for the account holder. | `USR16112` | Primary key. |
| `full_name` | `VARCHAR` | 0 | Legal name of customer registered with bank. | `Dhriti Deshmukh` | Trimmed, casing standardized. |
| `pan` | `VARCHAR` | 4,514 | 10-character Permanent Account Number. | `SEJAA8194O` | Regex validated (`^[A-Z]{5}[0-9]{4}[A-Z]$`). |
| `aadhaar` | `FLOAT` | 8,774 | 12-digit UIDAI National Identity Number. | `715658320763` | Format sanitized and masked. |
| `date_of_birth` | `DATETIME` | 5,332 | Customer date of birth. | `1967-06-04 00:14:00` | Age range verified ($18 \le \text{Age} \le 100$). |
| `city` | `VARCHAR` | 0 | Registered residential city of the user. | `Mumbai` | Standardized metro naming. |
| `state` | `VARCHAR` | 0 | State / Union Territory of residence. | `Maharashtra` | Mapped to official India GeoJSON. |
| `monthly_income` | `FLOAT` | 6,135 | Declared monthly earnings in Rupees (₹). | `35119.0` | Winsorized outlier extremes. |
| `occupation` | `VARCHAR` | 0 | Professional domain (Salaried, Self-Employed, Retired, Student). | `Retired` | Standardized categories. |
| `signup_timestamp` | `DATETIME` | 2,886 | User account creation timestamp. | `2025-12-02 02:18:16` | Baseline onboarding date. |
| `kyc_status` | `VARCHAR` | 0 | Regulatory compliance status (`VERIFIED`, `PENDING`, `REJECTED`). | `VERIFIED` | 27,555 Verified (76.3% rate). |
| `risk_segment` | `VARCHAR` | 0 | Customer behavioral risk profile (`LOW`, `MEDIUM`, `HIGH`). | `LOW` | Model-derived trust score. |

---

## 4. `merchants_clean.csv` (6,198 Records)
Business entity directory, category classification, and operational status.

| Column Name | Data Type | Null Count | Description & Business Meaning | Sample Value | Hygiene Rules |
| :--- | :---: | :---: | :--- | :---: | :--- |
| `merchant_id` | `VARCHAR` | 0 | Unique merchant identification handle. | `MCH2849` | Primary key. |
| `merchant_name` | `VARCHAR` | 0 | Registered business trade name. | `Bhavsar, Kota And Zacharia` | Cleaned of corrupt punctuation. |
| `mcc` | `FLOAT` | 692 | 4-digit Merchant Category Code. | `7011.0` | Harmonized with category mapping. |
| `merchant_category` | `VARCHAR` | 0 | Human-readable business domain. | `Hotel & Lodging` | 12 unified industry groups. |
| `business_type` | `VARCHAR` | 0 | Legal constitution (`Proprietorship`, `Private Limited`, `Partnership`, `LLP`). | `Private Limited` | Categorical normalization. |
| `city` | `VARCHAR` | 0 | Operating city headquarters. | `Ludhiana` | Mapped for geo-spatial risk. |
| `state` | `VARCHAR` | 0 | Operating state in India. | `Punjab` | Regional risk clustering. |
| `onboarding_date` | `DATETIME` | 499 | Date merchant joined network. | `2025-09-23 00:00:00` | Merchant age baseline. |
| `settlement_account` | `VARCHAR` | 2,445 | Masked disbursement bank account. | `3021439858` | Sanitized. |
| `merchant_status` | `VARCHAR` | 0 | Operating status (`ACTIVE`, `INACTIVE`, `SUSPENDED`). | `INACTIVE` | 5,026 Active, 612 Inactive, 560 Suspended. |
| `declared_avg_ticket_size` | `FLOAT` | 872 | Expected average ticket size (₹). | `2432.18` | Used for velocity anomaly alerts. |
