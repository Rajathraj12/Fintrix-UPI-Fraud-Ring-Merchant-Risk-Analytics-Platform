"""
Merchant Intelligence Tool - Phase 5

Deterministic profile and transaction history aggregation tool for merchants.
Evaluates Merchant Master data, transaction volume, chargeback rates, and risk benchmarks.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
from ..data.data_loader import data_loader


def get_merchant_profile(merchant_id: str) -> Dict[str, Any]:
    """
    Retrieve deterministic, structured merchant master details, transaction volume aggregation,
    dispute metrics, and risk tier indicators for a given merchant ID.

    Args:
        merchant_id: The merchant unique identifier (e.g. 'MCH6773').
    """
    # 1. Validate input
    if not merchant_id or not isinstance(merchant_id, str) or not merchant_id.strip():
        return {
            "found": False,
            "merchant_id": str(merchant_id) if merchant_id is not None else "",
            "error": "Invalid or empty merchant ID provided"
        }

    clean_id = merchant_id.strip().upper()

    # Load datasets via data_loader
    merchants_df = data_loader.get_merchants()
    txns_df = data_loader.get_transactions()
    cb_df = data_loader.get_chargebacks()

    # 2. Lookup Merchant Master Record (Deduplication Strategy)
    # merchants_clean.csv contains duplicate records per merchant_id representing updates/terminals.
    # Deterministic strategy: sort by onboarding_date (if available) and pick the latest valid row.
    has_master_record = False
    merchant_data = None
    m_status = "UNKNOWN"
    declared_avg_ticket = None

    if merchants_df is not None and not merchants_df.empty and "merchant_id" in merchants_df.columns:
        m_matches = merchants_df[merchants_df["merchant_id"].astype(str).str.strip().str.upper() == clean_id]
        if not m_matches.empty:
            has_master_record = True
            if "onboarding_date" in m_matches.columns:
                m_matches_sorted = m_matches.sort_values("onboarding_date", ascending=True)
                latest_mrow = m_matches_sorted.iloc[-1]
            else:
                latest_mrow = m_matches.iloc[-1]

            m_status = str(latest_mrow.get("merchant_status", "UNKNOWN")).strip().upper()
            if pd.notna(latest_mrow.get("declared_avg_ticket_size")):
                try:
                    declared_avg_ticket = round(float(latest_mrow["declared_avg_ticket_size"]), 2)
                except (ValueError, TypeError):
                    declared_avg_ticket = None

            # Strictly omit settlement_account for privacy & security
            merchant_data = {
                "name": str(latest_mrow.get("merchant_name", "")),
                "category": str(latest_mrow.get("merchant_category", "")),
                "business_type": str(latest_mrow.get("business_type", "")),
                "city": str(latest_mrow.get("city", "")),
                "state": str(latest_mrow.get("state", "")),
                "merchant_status": m_status,
                "declared_avg_ticket_size": declared_avg_ticket,
                "onboarding_date": str(latest_mrow.get("onboarding_date", "")) if pd.notna(latest_mrow.get("onboarding_date")) else None
            }

    # 3. Transaction Summary
    has_transactions = False
    txn_summary = {
        "transaction_count": 0,
        "total_amount": 0.0,
        "average_transaction_amount": 0.0,
        "successful_transactions": 0,
        "failed_transactions": 0
    }

    if txns_df is not None and not txns_df.empty and "merchant_id" in txns_df.columns:
        m_txns = txns_df[txns_df["merchant_id"].astype(str).str.strip().str.upper() == clean_id]
        if not m_txns.empty:
            has_transactions = True
            txn_count = len(m_txns)
            total_amt = round(float(m_txns["amount"].sum()), 2) if "amount" in m_txns.columns else 0.0
            avg_amt = round(float(m_txns["amount"].mean()), 2) if "amount" in m_txns.columns else 0.0

            statuses = m_txns["status"].astype(str).str.strip().str.upper() if "status" in m_txns.columns else pd.Series()
            succ_count = int((statuses == "SUCCESS").sum())
            fail_count = int((statuses == "FAILED").sum())

            txn_summary = {
                "transaction_count": txn_count,
                "total_amount": total_amt,
                "average_transaction_amount": avg_amt,
                "successful_transactions": succ_count,
                "failed_transactions": fail_count
            }

    # 4. Chargeback Summary
    has_chargebacks = False
    cb_summary = {
        "chargeback_count": 0,
        "disputed_amount": 0.0,
        "chargeback_rate_pct": 0.0,
        "open_chargebacks": 0,
        "critical_chargebacks": 0
    }

    if cb_df is not None and not cb_df.empty and "merchant_id" in cb_df.columns:
        m_cbs = cb_df[cb_df["merchant_id"].astype(str).str.strip().str.upper() == clean_id]
        if not m_cbs.empty:
            has_chargebacks = True
            cb_count = len(m_cbs)
            disp_amt = round(float(m_cbs["disputed_amount"].sum()), 2) if "disputed_amount" in m_cbs.columns else 0.0

            res_statuses = m_cbs["resolution_status"].astype(str).str.strip().str.upper() if "resolution_status" in m_cbs.columns else pd.Series()
            open_cb = int((res_statuses == "OPEN").sum())

            severities = m_cbs["severity"].astype(str).str.strip().str.upper() if "severity" in m_cbs.columns else pd.Series()
            crit_cb = int((severities == "CRITICAL").sum())

            # Chargeback rate
            cb_rate = round((cb_count / txn_summary["transaction_count"]) * 100, 2) if txn_summary["transaction_count"] > 0 else 0.0

            cb_summary = {
                "chargeback_count": cb_count,
                "disputed_amount": disp_amt,
                "chargeback_rate_pct": cb_rate,
                "open_chargebacks": open_cb,
                "critical_chargebacks": crit_cb
            }

    # 5. Check if merchant exists in at least one dataset
    if not has_master_record and not has_transactions and not has_chargebacks:
        return {
            "found": False,
            "merchant_id": clean_id,
            "error": f"Merchant '{clean_id}' not found in merchant master, transaction, or dispute records."
        }

    # 6. Risk Indicators & Documented Thresholds
    is_suspended = (m_status == "SUSPENDED")

    cb_rate_val = cb_summary["chargeback_rate_pct"]
    if cb_rate_val > 5.0:
        cb_rate_tier = "HIGH_RISK"
    elif cb_rate_val >= 1.5:
        cb_rate_tier = "ELEVATED"
    else:
        cb_rate_tier = "NORMAL"

    ticket_anomaly = False
    ticket_size_ratio: Optional[float] = None
    if declared_avg_ticket is not None and declared_avg_ticket > 0 and txn_summary["average_transaction_amount"] > 0:
        ticket_size_ratio = round(txn_summary["average_transaction_amount"] / declared_avg_ticket, 2)
        ticket_anomaly = (ticket_size_ratio > 3.0)

    return {
        "found": True,
        "merchant_id": clean_id,
        "has_master_record": has_master_record,
        "has_transactions": has_transactions,
        "has_chargebacks": has_chargebacks,
        "partial_context": not (has_master_record and has_transactions),
        "merchant": merchant_data,
        "transaction_summary": txn_summary,
        "chargeback_summary": cb_summary,
        "risk_indicators": {
            "is_suspended": is_suspended,
            "chargeback_rate_tier": cb_rate_tier,
            "ticket_anomaly": ticket_anomaly,
            "ticket_size_ratio": ticket_size_ratio
        }
    }
