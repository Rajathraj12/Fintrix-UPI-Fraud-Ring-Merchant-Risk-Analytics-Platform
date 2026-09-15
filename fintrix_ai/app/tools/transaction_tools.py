"""
Transaction Investigation Tool - Phase 3

Deterministic lookup tool for UPI transactions clean dataset.
"""
from typing import Dict, Any
import pandas as pd
from ..data.data_loader import data_loader


def get_transaction(transaction_id: str) -> Dict[str, Any]:
    """
    Retrieve deterministic, structured transaction details for a given UPI transaction ID.

    Args:
        transaction_id: The unique transaction identifier to look up (e.g. 'TXN00011869').
    """
    # 1. Validate input
    if not transaction_id or not isinstance(transaction_id, str) or not transaction_id.strip():
        return {
            "found": False,
            "transaction_id": str(transaction_id) if transaction_id is not None else "",
            "error": "Invalid or empty transaction ID provided"
        }

    clean_id = transaction_id.strip()

    # 2. Retrieve transactions dataset via data_loader
    df = data_loader.get_transactions()
    if df is None or df.empty:
        return {
            "found": False,
            "transaction_id": clean_id,
            "error": "Transactions dataset is currently unavailable"
        }

    # 3. Deterministic search for transaction_id
    if "txn_id" not in df.columns:
        return {
            "found": False,
            "transaction_id": clean_id,
            "error": "Transaction ID column not found in database schema"
        }

    # Exact match or case-insensitive fallback match
    match = df[df["txn_id"].astype(str).str.strip().str.upper() == clean_id.upper()]

    if match.empty:
        return {
            "found": False,
            "transaction_id": clean_id,
            "error": f"Transaction '{clean_id}' not found"
        }

    # 4. Extract structured data from the actual record
    row = match.iloc[0]
    
    # Safe conversion for json-serializable dict
    mcc_val = None
    if pd.notna(row.get("mcc")):
        try:
            mcc_val = int(row["mcc"])
        except (ValueError, TypeError):
            mcc_val = str(row["mcc"])

    amount_val = 0.0
    if pd.notna(row.get("amount")):
        try:
            amount_val = round(float(row["amount"]), 2)
        except (ValueError, TypeError):
            amount_val = row["amount"]

    data_payload = {
        "txn_id": str(row["txn_id"]),
        "timestamp": str(row.get("timestamp", "")),
        "user_id": str(row.get("user_id", "")),
        "merchant_id": str(row.get("merchant_id", "")),
        "amount": amount_val,
        "utr": str(row.get("utr", "")),
        "mcc": mcc_val,
        "status": str(row.get("status", "")),
    }

    return {
        "found": True,
        "transaction_id": str(row["txn_id"]),
        "data": data_payload
    }
