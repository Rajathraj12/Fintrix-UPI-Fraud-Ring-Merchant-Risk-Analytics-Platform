"""
Customer Intelligence Tool - Phase 5

Deterministic profile and transaction history aggregation tool for customers.
Evaluates KYC compliance, transaction velocity, chargebacks, and risk indicators.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
from ..data.data_loader import data_loader


def get_customer_profile(user_id: str) -> Dict[str, Any]:
    """
    Retrieve deterministic, structured customer profile, KYC details, transaction velocity summary,
    and chargeback history for a given user ID.

    Args:
        user_id: The customer unique identifier (e.g. 'USR90546').
    """
    # 1. Validate input
    if not user_id or not isinstance(user_id, str) or not user_id.strip():
        return {
            "found": False,
            "user_id": str(user_id) if user_id is not None else "",
            "error": "Invalid or empty customer ID provided"
        }

    clean_id = user_id.strip().upper()

    # Load datasets via data_loader
    kyc_df = data_loader.get_kyc()
    txns_df = data_loader.get_transactions()
    cb_df = data_loader.get_chargebacks()

    # 2. Lookup KYC Record (Deduplication Strategy)
    # kyc_clean.csv contains duplicate records per user_id representing audit/update history.
    # Deterministic strategy: sort by signup_timestamp (if available) and pick the latest valid row.
    has_kyc = False
    kyc_data = None
    user_risk_seg = "UNKNOWN"

    if kyc_df is not None and not kyc_df.empty and "user_id" in kyc_df.columns:
        kyc_matches = kyc_df[kyc_df["user_id"].astype(str).str.strip().str.upper() == clean_id]
        if not kyc_matches.empty:
            has_kyc = True
            if "signup_timestamp" in kyc_matches.columns:
                kyc_matches_sorted = kyc_matches.sort_values("signup_timestamp", ascending=True)
                latest_krow = kyc_matches_sorted.iloc[-1]
            else:
                latest_krow = kyc_matches.iloc[-1]

            user_risk_seg = str(latest_krow.get("risk_segment", "UNKNOWN")).strip().upper()
            income_val = None
            if pd.notna(latest_krow.get("monthly_income")):
                try:
                    income_val = round(float(latest_krow["monthly_income"]), 2)
                except (ValueError, TypeError):
                    income_val = None

            # Strictly omit PII (PAN, Aadhaar) for privacy & data minimization
            kyc_data = {
                "full_name": str(latest_krow.get("full_name", "")),
                "city": str(latest_krow.get("city", "")),
                "state": str(latest_krow.get("state", "")),
                "occupation": str(latest_krow.get("occupation", "")),
                "monthly_income": income_val,
                "kyc_status": str(latest_krow.get("kyc_status", "")).strip().upper(),
                "risk_segment": user_risk_seg,
                "signup_timestamp": str(latest_krow.get("signup_timestamp", "")) if pd.notna(latest_krow.get("signup_timestamp")) else None
            }

    # 3. Transaction Summary
    has_transactions = False
    txn_summary = {
        "transaction_count": 0,
        "total_amount": 0.0,
        "average_amount": 0.0,
        "successful_transactions": 0,
        "failed_transactions": 0,
        "failure_rate": 0.0,
        "first_transaction": None,
        "last_transaction": None
    }

    if txns_df is not None and not txns_df.empty and "user_id" in txns_df.columns:
        user_txns = txns_df[txns_df["user_id"].astype(str).str.strip().str.upper() == clean_id]
        if not user_txns.empty:
            has_transactions = True
            txn_count = len(user_txns)
            total_amt = round(float(user_txns["amount"].sum()), 2) if "amount" in user_txns.columns else 0.0
            avg_amt = round(float(user_txns["amount"].mean()), 2) if "amount" in user_txns.columns else 0.0
            
            statuses = user_txns["status"].astype(str).str.strip().str.upper() if "status" in user_txns.columns else pd.Series()
            succ_count = int((statuses == "SUCCESS").sum())
            fail_count = int((statuses == "FAILED").sum())
            fail_rate = round((fail_count / txn_count) * 100, 2) if txn_count > 0 else 0.0

            first_txn = str(user_txns["timestamp"].min()) if "timestamp" in user_txns.columns and pd.notna(user_txns["timestamp"].min()) else None
            last_txn = str(user_txns["timestamp"].max()) if "timestamp" in user_txns.columns and pd.notna(user_txns["timestamp"].max()) else None

            txn_summary = {
                "transaction_count": txn_count,
                "total_amount": total_amt,
                "average_amount": avg_amt,
                "successful_transactions": succ_count,
                "failed_transactions": fail_count,
                "failure_rate": fail_rate,
                "first_transaction": first_txn,
                "last_transaction": last_txn
            }

    # 4. Chargeback Summary
    has_chargebacks = False
    cb_summary = {
        "chargeback_count": 0,
        "disputed_amount": 0.0,
        "open_chargebacks": 0,
        "critical_chargebacks": 0,
        "max_severity": "NONE",
        "reasons_breakdown": {}
    }

    if cb_df is not None and not cb_df.empty and "user_id" in cb_df.columns:
        user_cbs = cb_df[cb_df["user_id"].astype(str).str.strip().str.upper() == clean_id]
        if not user_cbs.empty:
            has_chargebacks = True
            cb_count = len(user_cbs)
            disp_amt = round(float(user_cbs["disputed_amount"].sum()), 2) if "disputed_amount" in user_cbs.columns else 0.0
            
            res_statuses = user_cbs["resolution_status"].astype(str).str.strip().str.upper() if "resolution_status" in user_cbs.columns else pd.Series()
            open_cb = int((res_statuses == "OPEN").sum())
            
            severities = user_cbs["severity"].astype(str).str.strip().str.upper() if "severity" in user_cbs.columns else pd.Series()
            crit_cb = int((severities == "CRITICAL").sum())

            # Determine maximum severity
            max_sev = "NONE"
            sev_order = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]
            for s in sev_order:
                if (severities == s).any():
                    max_sev = s
                    break

            reasons = {}
            if "reason_code" in user_cbs.columns:
                reasons = user_cbs["reason_code"].value_counts().to_dict()

            cb_summary = {
                "chargeback_count": cb_count,
                "disputed_amount": disp_amt,
                "open_chargebacks": open_cb,
                "critical_chargebacks": crit_cb,
                "max_severity": max_sev,
                "reasons_breakdown": reasons
            }

    # 5. Check if customer exists in at least one dataset
    if not has_kyc and not has_transactions and not has_chargebacks:
        return {
            "found": False,
            "user_id": clean_id,
            "error": f"Customer '{clean_id}' not found in KYC, transaction, or dispute records."
        }

    # 6. Customer Risk Signals (from EDA Cell 101)
    risk_signals: List[str] = []
    if has_chargebacks and cb_summary["chargeback_count"] > 0:
        risk_signals.append("HAS_CHARGEBACK")
    if txn_summary["failed_transactions"] >= 2:
        risk_signals.append("HIGH_FAILURE_ACTIVITY")
    if txn_summary["transaction_count"] >= 4:  # >= 95th percentile user activity
        risk_signals.append("HIGH_TRANSACTION_ACTIVITY")
    if user_risk_seg == "HIGH":
        risk_signals.append("HIGH_RISK_KYC")

    return {
        "found": True,
        "user_id": clean_id,
        "has_kyc": has_kyc,
        "has_transactions": has_transactions,
        "has_chargebacks": has_chargebacks,
        "partial_context": not (has_kyc and has_transactions),
        "kyc": kyc_data,
        "transaction_summary": txn_summary,
        "chargeback_summary": cb_summary,
        "risk": {
            "risk_segment": user_risk_seg,
            "risk_signals": risk_signals,
            "signal_count": len(risk_signals)
        }
    }
