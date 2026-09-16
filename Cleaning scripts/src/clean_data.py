"""
DATA CLEANING

INPUT
-----
data/raw/
    track1_upi_transactions.csv
    track1_kyc_records.csv
    track1_merchants_master.csv

data/processed/
    track1_chargebacks.csv

OUTPUT
------
data/processed/
    upi_transactions_clean.csv
    kyc_clean.csv
    merchants_clean.csv
    chargebacks_clean.csv
"""


import sys
import re
from pathlib import Path

import numpy as np
import pandas as pd

from exception import CustomException
from logger import logging


# =========================================================
# 1. PROJECT PATHS
# =========================================================

PROJECT_ROOT = Path(__file__).resolve().parent.parent

RAW_DIR = PROJECT_ROOT / "data" / "raw"
PROCESSED_DIR = PROJECT_ROOT / "data" / "processed"

PROCESSED_DIR.mkdir(parents=True, exist_ok=True)


# =========================================================
# 2. MISSING VALUE HANDLING
# =========================================================

MISSING_VALUES = {
    "",
    "NA",
    "N/A",
    "NULL",
    "NONE",
    "NAN",
    "MISSING",
    "NOT AVAILABLE",
    "NOT_AVAILABLE",
}


def is_missing(value):
    """Check whether a value represents missing data."""

    if value is None:
        return True

    try:
        if pd.isna(value):
            return True
    except (TypeError, ValueError):
        pass

    return str(value).strip().upper() in MISSING_VALUES


# =========================================================
# 3. EXACT DUPLICATE REMOVAL
# =========================================================

def remove_raw_duplicates(df, dataset_name):
    """
    Remove only records that are exact duplicates in the
    ORIGINAL raw dataset.

    This is intentionally done BEFORE any cleaning.

    That way, two distinct records that happen to become
    identical after standardization are NOT deleted.
    """

    before = len(df)

    duplicate_count = df.duplicated(keep="first").sum()

    df = df.drop_duplicates(
        keep="first"
    ).reset_index(drop=True)

    after = len(df)

    logging.info(
        f"{dataset_name}: "
        f"raw rows={before}, "
        f"exact duplicates removed={duplicate_count}, "
        f"remaining={after}"
    )

    return df, duplicate_count


# =========================================================
# 4. ID CLEANING
# =========================================================

def clean_id(value, prefix, width):
    """
    Standardize numeric identifiers.

    Examples:

        TXN65742
            ->
        TXN00065742

        MCH3835
            ->
        MCH3835

        3835
            ->
        MCH3835
    """

    if is_missing(value):
        return np.nan

    value = str(value).strip().upper()

    # Remove spaces and punctuation
    value = re.sub(
        r"[^A-Z0-9]",
        "",
        value
    )

    # Remove known prefixes
    prefixes = [
        "TRANSACTION",
        "MERCHANT",
        "COMPLAINT",
        "USER",
        "USR",
        "MCH",
        "TXN",
        "UTR",
        "CBK",
    ]

    for old_prefix in prefixes:

        if value.startswith(old_prefix):

            value = value[len(old_prefix):]

            break

    # IDs in this dataset use numeric suffixes
    if not value.isdigit():

        return np.nan

    # Add leading zeroes
    value = value.zfill(width)

    # Reject numbers that exceed expected width
    if len(value) != width:

        return np.nan

    return prefix + value


# =========================================================
# 5. AMOUNT CLEANING
# =========================================================

def clean_amount(value):
    """
    Convert monetary values to numeric.

    Handles:

        ₹1,250
        Rs 1,250
        INR 1250
        1250
        2.5K
        1.2M

    Invalid, zero and negative values become NaN.
    """

    if is_missing(value):
        return np.nan

    value = str(value).strip().upper()

    value = value.replace("₹", "")
    value = value.replace("INR", "")
    value = value.replace("RS.", "")
    value = value.replace("RS", "")
    value = value.replace(",", "")

    value = value.strip()

    multiplier = 1

    if value.endswith("K"):

        multiplier = 1_000
        value = value[:-1]

    elif value.endswith("M"):

        multiplier = 1_000_000
        value = value[:-1]

    try:

        number = float(value) * multiplier

    except (ValueError, TypeError):

        return np.nan

    if number <= 0:

        return np.nan

    return number


# =========================================================
# 6. GENERAL TEXT CLEANING
# =========================================================

def clean_text(value):
    """Remove unnecessary whitespace and normalize missing values."""

    if is_missing(value):
        return np.nan

    value = str(value).strip()

    value = re.sub(
        r"\s+",
        " ",
        value
    )

    return value


def clean_name(value):
    """Standardize person and merchant names."""

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    # KumarAndSons -> Kumar And Sons
    value = re.sub(
        r"(?<=[a-z])(?=[A-Z])",
        " ",
        value
    )

    return value.title()


# =========================================================
# 7. MCC
# =========================================================

def clean_mcc(value):
    """
    MCC must be a four-character code.

    Example:

        MCC5411
        5411
        5411.0

    all become:

        5411
    """

    if is_missing(value):
        return np.nan

    value = str(value).strip().upper()

    value = value.replace(
        "MCC",
        ""
    )

    # Remove accidental .0
    value = re.sub(
        r"\.0$",
        "",
        value
    )

    value = re.sub(
        r"\D",
        "",
        value
    )

    # Handle 5-digit value with leading zero
    if len(value) == 5 and value.startswith("0"):

        value = value[1:]

    if len(value) != 4:

        return np.nan

    return value


# =========================================================
# 8. PAN
# =========================================================

def clean_pan(value):
    """
    Validate Indian PAN format:

        AAAAA9999A
    """

    if is_missing(value):
        return np.nan

    value = str(value).strip().upper()

    value = re.sub(
        r"[^A-Z0-9]",
        "",
        value
    )

    if re.fullmatch(
        r"[A-Z]{5}[0-9]{4}[A-Z]",
        value
    ):

        return value

    return np.nan


# =========================================================
# 9. AADHAAR
# =========================================================

def clean_aadhaar(value):
    """
    Aadhaar must contain exactly 12 digits.

    It is stored as STRING, not numeric, so leading zeroes
    are preserved.
    """

    if is_missing(value):
        return np.nan

    value = str(value).strip()

    # Remove accidental .0
    value = re.sub(
        r"\.0$",
        "",
        value
    )

    value = re.sub(
        r"\D",
        "",
        value
    )

    if len(value) != 12:

        return np.nan

    return value


# =========================================================
# 10. UTR
# =========================================================

def clean_utr(value):
    """Standardize UTR values."""

    if is_missing(value):
        return np.nan

    value = str(value).strip().upper()

    value = re.sub(
        r"[^A-Z0-9]",
        "",
        value
    )

    if value.startswith("UTR"):

        value = value[3:]

    if not value:

        return np.nan

    return "UTR" + value


# =========================================================
# 11. DATETIME
# =========================================================

def clean_datetime(value):
    """
    Convert mixed date/time values into datetime.

    Supports:
        YYYY-MM-DD
        DD/MM/YYYY
        MM/DD/YYYY
        DD-Mon-YYYY
        timestamps
        Unix seconds
        Unix milliseconds
    """

    if is_missing(value):
        return pd.NaT

    value = str(value).strip()

    # Unix seconds
    if re.fullmatch(
        r"\d{10}",
        value
    ):

        return pd.to_datetime(
            int(value),
            unit="s",
            errors="coerce"
        )

    # Unix milliseconds
    if re.fullmatch(
        r"\d{13,}",
        value
    ):

        return pd.to_datetime(
            int(value),
            unit="ms",
            errors="coerce"
        )

    # First attempt normal mixed parsing
    parsed = pd.to_datetime(
        value,
        errors="coerce",
        format="mixed"
    )

    if pd.notna(parsed):

        return parsed

    # Second attempt day-first
    parsed = pd.to_datetime(
        value,
        errors="coerce",
        dayfirst=True,
        format="mixed"
    )

    return parsed


# =========================================================
# 12. CITY
# =========================================================

CITY_MAP = {

    "ASR": "Amritsar",
    "AMRITSAR": "Amritsar",

    "BLR": "Bengaluru",
    "BANGALORE": "Bengaluru",
    "BENGALURU": "Bengaluru",

    "DELHI": "Delhi",
    "DILLI": "Delhi",
    "NEW DELHI": "Delhi",

    "JPR": "Jaipur",
    "JAIPUR": "Jaipur",

    "JALANDAR": "Jalandhar",
    "JALANDHAR": "Jalandhar",

    "LDH": "Ludhiana",
    "LUDHIANA": "Ludhiana",

    "LKO": "Lucknow",
    "LUCKNOW": "Lucknow",

    "HYD": "Hyderabad",
    "HYDERABAD": "Hyderabad",

    "MUMBAI": "Mumbai",
    "MUMBAY": "Mumbai",
    "BOMBAY": "Mumbai",

    "KOLKATA": "Kolkata",
    "CALCUTTA": "Kolkata",

    "CHENNAI": "Chennai",
    "MADRAS": "Chennai",

    "PUNE": "Pune",
    "POONA": "Pune",
}


def clean_city(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    key = value.upper()

    return CITY_MAP.get(
        key,
        value.title()
    )


# =========================================================
# 13. STATE
# =========================================================

STATE_MAP = {

    "PUNJAB": "Punjab",
    "KARNATAKA": "Karnataka",
    "MAHARASHTRA": "Maharashtra",
    "RAJASTHAN": "Rajasthan",
    "DELHI": "Delhi",
    "TAMIL NADU": "Tamil Nadu",
    "TELANGANA": "Telangana",
    "UTTAR PRADESH": "Uttar Pradesh",
    "WEST BENGAL": "West Bengal",
}


def clean_state(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return STATE_MAP.get(
        value.upper(),
        value.title()
    )


# =========================================================
# 14. CITY-STATE CONSISTENCY
# =========================================================

CITY_STATE = {

    "Amritsar": "Punjab",
    "Bengaluru": "Karnataka",
    "Chennai": "Tamil Nadu",
    "Delhi": "Delhi",
    "Hyderabad": "Telangana",
    "Jaipur": "Rajasthan",
    "Jalandhar": "Punjab",
    "Kolkata": "West Bengal",
    "Lucknow": "Uttar Pradesh",
    "Ludhiana": "Punjab",
    "Mumbai": "Maharashtra",
    "Pune": "Maharashtra",
}


def validate_city_state(df):

    for index in df.index:

        city = df.at[index, "city"]
        state = df.at[index, "state"]

        if pd.isna(city) or pd.isna(state):
            continue

        expected_state = CITY_STATE.get(city)

        if expected_state is None:
            continue

        if state != expected_state:

            logging.warning(
                f"City/state mismatch at row {index}: "
                f"{city} / {state}"
            )

            # Do not invent the correct state.
            # Preserve the row and mark the inconsistent
            # state as missing.
            df.at[index, "state"] = np.nan

    return df


# =========================================================
# 15. MERCHANT CATEGORY
# =========================================================

CATEGORY_MAP = {

    "GROCERY": "Grocery",
    "GROCERY STORE": "Grocery",
    "GROCERY_STORE": "Grocery",
    "GROCERY STORES": "Grocery",
    "GROCERIES": "Grocery",
    "KIRANA": "Grocery",

    "CLOTHING": "Clothing",
    "CLOTHS": "Clothing",
    "APPAREL": "Clothing",
    "FASHION": "Clothing",
    "GARMENTS": "Clothing",

    "BOOKS": "Books & Stationery",
    "BOOK STORE": "Books & Stationery",
    "BOOKS_STATIONERY": "Books & Stationery",
    "STATIONERY": "Books & Stationery",

    "DEPT STORE": "Department Store",
    "DEPT_STORE": "Department Store",
    "DEPARTMENT STORE": "Department Store",
    "DEPARTMENT STORES": "Department Store",

    "FOOD": "Food Services",
    "FOOD SERVICES": "Food Services",
    "FOOD_SERVICES": "Food Services",
    "RESTAURANT": "Food Services",
    "RESTAURANTS": "Food Services",
    "EATING PLACE": "Food Services",

    "HOTEL": "Hotel & Lodging",
    "HOTELS": "Hotel & Lodging",
    "HOTEL LODGING": "Hotel & Lodging",
    "HOTEL_LODGING": "Hotel & Lodging",
    "HOSPITALITY": "Hotel & Lodging",

    "MEDICAL": "Medical",
    "MEDICAL STORE": "Medical",
    "MEDICAL_STORE": "Medical",
    "PHARMACY": "Medical",
    "PHARMACIES": "Medical",
    "CHEMIST": "Medical",

    "TELECOM": "Telecom",
    "PHONE SERVICE": "Telecom",
    "MOBILE RECHARGE": "Telecom",

    "TRANSPORT": "Transport",
    "TRANSPORTATION": "Transport",
    "TRANSPRT": "Transport",
    "BUS/TAXI": "Transport",

    "TRAVEL": "Travel",

    "RETAIL": "Retail",

    "MISC RETAIL": "Other",
    "MISCELLANEOUS": "Other",
    "RETAIL OTHER": "Other",
    "OTHER": "Other",
}


def clean_category(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return CATEGORY_MAP.get(
        value.upper(),
        value.title()
    )


# =========================================================
# 16. BUSINESS TYPE
# =========================================================

BUSINESS_TYPE_MAP = {

    "INDIVIDUAL": "Individual",

    "PARTNERSHIP": "Partnership",

    "PRIVATE LIMITED": "Private Limited",
    "PRIVATE-LIMITED": "Private Limited",
    "PRIVATE_LIMITED": "Private Limited",

    "SOLE PROPRIETOR": "Sole Proprietor",
    "SOLE-PROPRIETOR": "Sole Proprietor",
    "SOLE_PROPRIETOR": "Sole Proprietor",
}


def clean_business_type(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return BUSINESS_TYPE_MAP.get(
        value.upper(),
        value.title()
    )


# =========================================================
# 17. TRANSACTION STATUS
# =========================================================

TRANSACTION_STATUS_MAP = {

    "SUCCESS": "SUCCESS",
    "TXN_SUCCESS": "SUCCESS",
    "S": "SUCCESS",
    "COMPLETED": "SUCCESS",

    "FAILED": "FAILED",
    "TXN_FAILED": "FAILED",
    "F": "FAILED",
    "FAIL": "FAILED",
    "DECLINED": "FAILED",

    "PENDING": "PENDING",
    "P": "PENDING",
    "PROCESSING": "PENDING",
    "INITIATED": "PENDING",
}


def clean_transaction_status(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return TRANSACTION_STATUS_MAP.get(
        value.upper(),
        "UNKNOWN"
    )


# =========================================================
# 18. KYC STATUS
# =========================================================

KYC_STATUS_MAP = {

    "VERIFIED": "VERIFIED",
    "V": "VERIFIED",
    "DONE": "VERIFIED",
    "APPROVED": "VERIFIED",
    "KYC_DONE": "VERIFIED",

    "REJECTED": "REJECTED",
    "REJECT": "REJECTED",
    "R": "REJECTED",
    "FAILED": "REJECTED",

    "PENDING": "PENDING",
    "P": "PENDING",
    "IN_PROGRESS": "PENDING",
    "IN PROGRESS": "PENDING",
    "UNDER REVIEW": "PENDING",
}


def clean_kyc_status(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return KYC_STATUS_MAP.get(
        value.upper(),
        "UNKNOWN"
    )


# =========================================================
# 19. RISK SEGMENT
# =========================================================

RISK_MAP = {

    "LOW": "LOW",
    "L": "LOW",

    "MEDIUM": "MEDIUM",
    "M": "MEDIUM",

    "HIGH": "HIGH",
    "H": "HIGH",
    "CRITICAL": "HIGH",
    "CRIT": "HIGH",
}


def clean_risk(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return RISK_MAP.get(
        value.upper(),
        "UNKNOWN"
    )


# =========================================================
# 20. MERCHANT STATUS
# =========================================================

MERCHANT_STATUS_MAP = {

    "ACTIVE": "ACTIVE",
    "A": "ACTIVE",
    "LIVE": "ACTIVE",
    "ENABLED": "ACTIVE",

    "INACTIVE": "INACTIVE",
    "I": "INACTIVE",
    "CLOSED": "INACTIVE",

    "SUSPENDED": "SUSPENDED",
    "HOLD": "SUSPENDED",
    "DISABLED": "SUSPENDED",
    "BLOCKED": "SUSPENDED",
    "S": "SUSPENDED",
}


def clean_merchant_status(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return MERCHANT_STATUS_MAP.get(
        value.upper(),
        "UNKNOWN"
    )


# =========================================================
# 21. CHARGEBACK RESOLUTION
# =========================================================

RESOLUTION_MAP = {

    "OPEN": "OPEN",
    "WIP": "OPEN",
    "IN_PROGRESS": "OPEN",
    "IN PROGRESS": "OPEN",
    "PENDING BANK": "OPEN",
    "PENDING_BANK": "OPEN",

    "CLOSED": "CLOSED",
    "RESOLVED": "CLOSED",

    "REJECTED": "REJECTED",
}


def clean_resolution(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return RESOLUTION_MAP.get(
        value.upper(),
        "UNKNOWN"
    )


# =========================================================
# 22. CHARGEBACK SEVERITY
# =========================================================

SEVERITY_MAP = {

    "LOW": "LOW",
    "L": "LOW",
    "P4": "LOW",

    "MEDIUM": "MEDIUM",
    "M": "MEDIUM",
    "P3": "MEDIUM",

    "HIGH": "HIGH",
    "H": "HIGH",
    "P2": "HIGH",

    "CRITICAL": "CRITICAL",
    "CRIT": "CRITICAL",
    "P1": "CRITICAL",
}


def clean_severity(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return SEVERITY_MAP.get(
        value.upper(),
        "UNKNOWN"
    )


# =========================================================
# 23. CHARGEBACK CHANNEL
# =========================================================

CHANNEL_MAP = {

    "APP": "App",
    "BRANCH": "Branch",
    "IVR": "IVR",
    "CHATBOT": "Chatbot",
    "EMAIL": "Email",

    "CALL CENTER": "Call Center",
    "CALLCENTER": "Call Center",
    "CALL-CENTER": "Call Center",
}


def clean_channel(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    return CHANNEL_MAP.get(
        value.upper(),
        "Other"
    )


# =========================================================
# 24. CHARGEBACK REASON
# =========================================================

# All 34 raw reason-code representations observed in the
# dataset are mapped here.

REASON_CODE_MAP = {

    "ATO":
        "ACCOUNT_TAKEOVER",

    "ACCOUNT TAKEOVER":
        "ACCOUNT_TAKEOVER",

    "ACCOUNT HACKED":
        "ACCOUNT_TAKEOVER",

    "LOGIN COMPROMISED":
        "ACCOUNT_TAKEOVER",


    "DUP_DEBIT":
        "DUPLICATE_DEBIT",

    "DUPLICATE DEBIT":
        "DUPLICATE_DEBIT",

    "CHARGED TWICE":
        "DUPLICATE_DEBIT",

    "DOUBLE DEBIT":
        "DUPLICATE_DEBIT",


    "FRAUD":
        "FRAUD_SUSPECTED",

    "FRAUD SUSPECTED":
        "FRAUD_SUSPECTED",

    "SCAM":
        "FRAUD_SUSPECTED",

    "SUSPICIOUS TRANSACTION":
        "FRAUD_SUSPECTED",


    "UNAUTHORISED":
        "UNAUTHORIZED_TRANSACTION",

    "UNAUTHORIZED TRANSACTION":
        "UNAUTHORIZED_TRANSACTION",

    "UNAUTHORIZED_TRANSACTION":
        "UNAUTHORIZED_TRANSACTION",

    "UNAUTH TXN":
        "UNAUTHORIZED_TRANSACTION",

    "NOT DONE BY ME":
        "UNAUTHORIZED_TRANSACTION",


    "WRONG AMOUNT":
        "WRONG_AMOUNT",

    "AMOUNT MISMATCH":
        "WRONG_AMOUNT",

    "EXTRA AMOUNT DEDUCTED":
        "WRONG_AMOUNT",

    "INCORRECT AMOUNT":
        "WRONG_AMOUNT",


    "MERCHANT NOT DELIVERED":
        "SERVICE_NOT_PROVIDED",

    "DELIVERY ISSUE":
        "SERVICE_NOT_PROVIDED",

    "ITEM NOT RECEIVED":
        "SERVICE_NOT_PROVIDED",

    "NOT DELIVERED":
        "SERVICE_NOT_PROVIDED",

    "SERVICE NOT PROVIDED":
        "SERVICE_NOT_PROVIDED",

    "NO SERVICE":
        "SERVICE_NOT_PROVIDED",

    "MERCHANT SERVICE ISSUE":
        "SERVICE_NOT_PROVIDED",

    "SERVICE FAILED":
        "SERVICE_NOT_PROVIDED",


    "CUSTOMER DISPUTE":
        "CUSTOMER_DISPUTE",

    "CUSTOMER ISSUE":
        "CUSTOMER_DISPUTE",

    "DISPUTE RAISED":
        "CUSTOMER_DISPUTE",

    "COMPLAINT":
        "CUSTOMER_DISPUTE",
}


def clean_reason_code(value):

    value = clean_text(value)

    if pd.isna(value):
        return np.nan

    key = value.upper().strip()

    return REASON_CODE_MAP.get(
        key,
        "OTHER"
    )


# =========================================================
# 25. LOAD DATA
# =========================================================

def load_data():

    logging.info("Loading source datasets.")

    # Read as STRING.
    #
    # This is extremely important for:
    #   IDs
    #   Aadhaar
    #   MCC
    #   UTR
    #
    # We don't want pandas to convert them into floats.

    transactions = pd.read_csv(
        RAW_DIR / "track1_upi_transactions.csv",
        dtype=str
    )

    kyc = pd.read_csv(
        RAW_DIR / "track1_kyc_records.csv",
        dtype=str
    )

    merchants = pd.read_csv(
        RAW_DIR / "track1_merchants_master.csv",
        dtype=str
    )

    # Step 4 output
    chargebacks = pd.read_csv(
        PROCESSED_DIR / "track1_chargebacks.csv",
        dtype=str
    )

    return (
        transactions,
        kyc,
        merchants,
        chargebacks
    )


# =========================================================
# 26. TRANSACTIONS
# =========================================================

def clean_transactions(df):

    logging.info("Cleaning transactions.")

    # IMPORTANT:
    # Remove only exact RAW duplicates.
    df, _ = remove_raw_duplicates(
        df,
        "Transactions"
    )

    df["txn_id"] = df["txn_id"].apply(
        lambda x: clean_id(
            x,
            "TXN",
            8
        )
    )

    df["user_id"] = df["user_id"].apply(
        lambda x: clean_id(
            x,
            "USR",
            5
        )
    )

    df["merchant_id"] = df["merchant_id"].apply(
        lambda x: clean_id(
            x,
            "MCH",
            4
        )
    )

    df["amount"] = df["amount"].apply(
        clean_amount
    )

    df["utr"] = df["utr"].apply(
        clean_utr
    )

    df["mcc"] = df["mcc"].apply(
        clean_mcc
    )

    df["timestamp"] = df["timestamp"].apply(
        clean_datetime
    )

    df["status"] = df["status"].apply(
        clean_transaction_status
    )

    return df.reset_index(drop=True)


# =========================================================
# 27. KYC
# =========================================================

def clean_kyc(df):

    logging.info("Cleaning KYC.")

    # Remove only genuine raw duplicates.
    df, _ = remove_raw_duplicates(
        df,
        "KYC"
    )

    df["user_id"] = df["user_id"].apply(
        lambda x: clean_id(
            x,
            "USR",
            5
        )
    )

    df["full_name"] = df[
        "full_name"
    ].apply(clean_name)

    df["pan"] = df[
        "pan"
    ].apply(clean_pan)

    df["aadhaar"] = df[
        "aadhaar"
    ].apply(clean_aadhaar)

    df["date_of_birth"] = df[
        "date_of_birth"
    ].apply(clean_datetime)

    df["signup_timestamp"] = df[
        "signup_timestamp"
    ].apply(clean_datetime)

    df["monthly_income"] = df[
        "monthly_income"
    ].apply(clean_amount)

    df["city"] = df[
        "city"
    ].apply(clean_city)

    df["state"] = df[
        "state"
    ].apply(clean_state)

    df = validate_city_state(df)

    df["occupation"] = df[
        "occupation"
    ].apply(clean_text)

    df["kyc_status"] = df[
        "kyc_status"
    ].apply(clean_kyc_status)

    df["risk_segment"] = df[
        "risk_segment"
    ].apply(clean_risk)

    # -----------------------------------------------------
    # DOB validation
    # -----------------------------------------------------

    # Dataset users should not have impossible historical
    # DOB values such as years 6000 or negative years.

    df.loc[df["date_of_birth"] < pd.Timestamp("1900-01-01"), "date_of_birth"] = pd.NaT

    # DOB cannot be after signup date.
    invalid_dob = (
        df["date_of_birth"].notna()
        &
        df["signup_timestamp"].notna()
        &
        (
            df["date_of_birth"]
            > df["signup_timestamp"]
        )
    )

    df.loc[
        invalid_dob,
        "date_of_birth"
    ] = pd.NaT

    return df.reset_index(drop=True)


# =========================================================
# 28. MERCHANTS
# =========================================================

def clean_merchants(df):

    logging.info("Cleaning merchants.")

    # Remove only genuine raw duplicates.
    df, _ = remove_raw_duplicates(
        df,
        "Merchants"
    )

    df["merchant_id"] = df[
        "merchant_id"
    ].apply(
        lambda x: clean_id(
            x,
            "MCH",
            4
        )
    )

    df["merchant_name"] = df[
        "merchant_name"
    ].apply(clean_name)

    df["mcc"] = df[
        "mcc"
    ].apply(clean_mcc)

    df["merchant_category"] = df[
        "merchant_category"
    ].apply(clean_category)

    df["business_type"] = df[
        "business_type"
    ].apply(clean_business_type)

    df["city"] = df[
        "city"
    ].apply(clean_city)

    df["state"] = df[
        "state"
    ].apply(clean_state)

    df = validate_city_state(df)

    df["onboarding_date"] = df[
        "onboarding_date"
    ].apply(clean_datetime)

    # Settlement account is kept as text.
    def clean_account(value):

        if is_missing(value):
            return np.nan

        value = str(value).strip().upper()

        value = re.sub(
            r"[^A-Z0-9X]",
            "",
            value
        )

        return value if value else np.nan

    df["settlement_account"] = df[
        "settlement_account"
    ].apply(clean_account)

    df["declared_avg_ticket_size"] = df[
        "declared_avg_ticket_size"
    ].apply(clean_amount)

    df["merchant_status"] = df[
        "merchant_status"
    ].apply(clean_merchant_status)

    return df.reset_index(drop=True)


# =========================================================
# 29. CHARGEBACKS
# =========================================================

def clean_chargebacks(df):

    logging.info("Cleaning chargebacks.")

    # Remove exact duplicates from the Step 4 CSV.
    df, _ = remove_raw_duplicates(
        df,
        "Chargebacks"
    )

    df["complaint_id"] = df[
        "complaint_id"
    ].apply(
        lambda x: clean_id(
            x,
            "CBK",
            7
        )
    )

    # Critical:
    # TXN65742 -> TXN00065742
    df["txn_id"] = df[
        "txn_id"
    ].apply(
        lambda x: clean_id(
            x,
            "TXN",
            8
        )
    )

    df["user_id"] = df[
        "user_id"
    ].apply(
        lambda x: clean_id(
            x,
            "USR",
            5
        )
    )

    df["merchant_id"] = df[
        "merchant_id"
    ].apply(
        lambda x: clean_id(
            x,
            "MCH",
            4
        )
    )

    df["transaction_timestamp"] = df[
        "transaction_timestamp"
    ].apply(clean_datetime)

    df["reported_timestamp"] = df[
        "reported_timestamp"
    ].apply(clean_datetime)

    df["bank_response_timestamp"] = df[
        "bank_response_timestamp"
    ].apply(clean_datetime)

    df["disputed_amount"] = df[
        "disputed_amount"
    ].apply(clean_amount)

    df["reason_code"] = df[
        "reason_code"
    ].apply(clean_reason_code)

    df["complaint_text"] = df[
        "complaint_text"
    ].apply(clean_text)

    df["resolution_status"] = df[
        "resolution_status"
    ].apply(clean_resolution)

    df["severity"] = df[
        "severity"
    ].apply(clean_severity)

    df["channel"] = df[
        "channel"
    ].apply(clean_channel)

    # -----------------------------------------------------
    # Timeline anomaly flags
    # -----------------------------------------------------

    df["reported_before_transaction"] = (
        df["reported_timestamp"]
        < df["transaction_timestamp"]
    )

    df["bank_response_before_report"] = (
        df["bank_response_timestamp"]
        < df["reported_timestamp"]
    )

    return df.reset_index(drop=True)


# =========================================================
# 30. SAVE
# =========================================================

def save_data(
    transactions,
    kyc,
    merchants,
    chargebacks
):

    logging.info("Saving cleaned datasets.")
    # ---------------------------------------------------------
    # FINAL DATA TYPES
    # ---------------------------------------------------------
    # Keep identifiers/codes as strings.
    # Convert analytical fields to numeric/datetime types.

    # Transactions
    transactions["timestamp"] = pd.to_datetime(
        transactions["timestamp"],
        errors="coerce"
    )

    transactions["amount"] = pd.to_numeric(
        transactions["amount"],
        errors="coerce"
    )

    transactions["mcc"] = transactions["mcc"].astype("string")


    # KYC
    kyc["date_of_birth"] = pd.to_datetime(
        kyc["date_of_birth"],
        errors="coerce"
    )

    kyc["signup_timestamp"] = pd.to_datetime(
        kyc["signup_timestamp"],
        errors="coerce"
    )

    kyc["monthly_income"] = pd.to_numeric(
        kyc["monthly_income"],
        errors="coerce"
    )


    # Merchants
    merchants["onboarding_date"] = pd.to_datetime(
        merchants["onboarding_date"],
        errors="coerce"
    )

    merchants["declared_avg_ticket_size"] = pd.to_numeric(
        merchants["declared_avg_ticket_size"],
        errors="coerce"
    )

    merchants["mcc"] = merchants["mcc"].astype("string")


    # Chargebacks
    chargebacks["transaction_timestamp"] = pd.to_datetime(
        chargebacks["transaction_timestamp"],
        errors="coerce"
    )

    chargebacks["reported_timestamp"] = pd.to_datetime(
        chargebacks["reported_timestamp"],
        errors="coerce"
    )

    chargebacks["bank_response_timestamp"] = pd.to_datetime(
        chargebacks["bank_response_timestamp"],
        errors="coerce"
    )

    chargebacks["disputed_amount"] = pd.to_numeric(
        chargebacks["disputed_amount"],
        errors="coerce"
    )

    transactions.to_csv(
        PROCESSED_DIR
        / "upi_transactions_clean.csv",
        index=False
    )

    kyc.to_csv(
        PROCESSED_DIR
        / "kyc_clean.csv",
        index=False
    )

    merchants.to_csv(
        PROCESSED_DIR
        / "merchants_clean.csv",
        index=False
    )

    chargebacks.to_csv(
        PROCESSED_DIR
        / "chargebacks_clean.csv",
        index=False
    )


# =========================================================
# 31. VALIDATION
# =========================================================

def validate_output(
    transactions,
    kyc,
    merchants,
    chargebacks
):

    print()
    print("=" * 65)
    print("CLEANING VALIDATION")
    print("=" * 65)

    # -----------------------------------------------------
    # ID checks
    # -----------------------------------------------------

    txn_id_ok = transactions[
        "txn_id"
    ].dropna().str.fullmatch(
        r"TXN\d{8}"
    ).all()

    user_id_ok = kyc[
        "user_id"
    ].dropna().str.fullmatch(
        r"USR\d{5}"
    ).all()

    merchant_id_ok = merchants[
        "merchant_id"
    ].dropna().str.fullmatch(
        r"MCH\d{4}"
    ).all()

    cb_txn_ok = chargebacks[
        "txn_id"
    ].dropna().str.fullmatch(
        r"TXN\d{8}"
    ).all()

    mcc_txn_ok = transactions[
        "mcc"
    ].dropna().str.fullmatch(
        r"\d{4}"
    ).all()

    mcc_merchant_ok = merchants[
        "mcc"
    ].dropna().str.fullmatch(
        r"\d{4}"
    ).all()

    print(
        "Transaction ID format  :", txn_id_ok
    )

    print(
        "User ID format         :", user_id_ok
    )

    print(
        "Merchant ID format     :", merchant_id_ok
    )

    print(
        "Chargeback TXN format  :", cb_txn_ok
    )

    print(
        "Transaction MCC format :", mcc_txn_ok
    )

    print(
        "Merchant MCC format    :", mcc_merchant_ok
    )

    # -----------------------------------------------------
    # Chargeback categories
    # -----------------------------------------------------

    print()
    print(
        "Chargeback channels:"
    )

    print(
        sorted(
            chargebacks[
                "channel"
            ]
            .dropna()
            .unique()
            .tolist()
        )
    )

    print()
    print(
        "Chargeback reason codes:"
    )

    print(
        sorted(
            chargebacks[
                "reason_code"
            ]
            .dropna()
            .unique()
            .tolist()
        )
    )

    # -----------------------------------------------------
    # Row counts
    # -----------------------------------------------------

    print()
    print(
        "FINAL ROW COUNTS"
    )

    print(
        "Transactions :",
        f"{len(transactions):,}"
    )

    print(
        "KYC          :",
        f"{len(kyc):,}"
    )

    print(
        "Merchants    :",
        f"{len(merchants):,}"
    )

    print(
        "Chargebacks  :",
        f"{len(chargebacks):,}"
    )

    print("=" * 65)


# =========================================================
# 32. MAIN
# =========================================================

def main():

    try:

        logging.info(
            "========== DATA CLEANING STARTED =========="
        )

        # -------------------------------------------------
        # Load
        # -------------------------------------------------

        (
            transactions,
            kyc,
            merchants,
            chargebacks
        ) = load_data()

        # -------------------------------------------------
        # Clean
        # -------------------------------------------------

        transactions = clean_transactions(
            transactions
        )

        kyc = clean_kyc(
            kyc
        )

        merchants = clean_merchants(
            merchants
        )

        chargebacks = clean_chargebacks(
            chargebacks
        )

        # -------------------------------------------------
        # Save
        # -------------------------------------------------

        save_data(
            transactions,
            kyc,
            merchants,
            chargebacks
        )

        # -------------------------------------------------
        # Validate
        # -------------------------------------------------

        validate_output(
            transactions,
            kyc,
            merchants,
            chargebacks
        )

        logging.info(
            "========== DATA CLEANING COMPLETED =========="
        )

    except Exception as e:

        logging.exception("Error occurred during data cleaning.")

        raise CustomException(e, sys)


# =========================================================
# 33. RUN
# =========================================================

if __name__ == "__main__":

    main()