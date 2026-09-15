"""
Deterministic Risk Investigation Tool - Phase 4

Multi-factor forensic risk evaluation tool for UPI transactions.
Evaluates deterministic risk signals across transactions, KYC, merchant profiles, and dispute history.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
from ..data.data_loader import data_loader


def get_risk_score(transaction_id: str) -> Dict[str, Any]:
    """
    Retrieve deterministic, structured risk analysis and forensic signals for a given UPI transaction ID.

    Args:
        transaction_id: The unique transaction identifier to evaluate (e.g. 'TXN00011869').
    """
    # 1. Validate input
    if not transaction_id or not isinstance(transaction_id, str) or not transaction_id.strip():
        return {
            "found": False,
            "transaction_id": str(transaction_id) if transaction_id is not None else "",
            "error": "Invalid or empty transaction ID provided"
        }

    clean_id = transaction_id.strip()

    # 2. Retrieve transactions dataset
    txns_df = data_loader.get_transactions()
    if txns_df is None or txns_df.empty or "txn_id" not in txns_df.columns:
        return {
            "found": False,
            "transaction_id": clean_id,
            "error": "Transactions dataset is currently unavailable"
        }

    # Match transaction
    match = txns_df[txns_df["txn_id"].astype(str).str.strip().str.upper() == clean_id.upper()]
    if match.empty:
        return {
            "found": False,
            "transaction_id": clean_id,
            "error": f"Transaction '{clean_id}' not found in UPI records"
        }

    txn_row = match.iloc[0]
    user_id = str(txn_row.get("user_id", "")).strip()
    merchant_id = str(txn_row.get("merchant_id", "")).strip()
    txn_status = str(txn_row.get("status", "")).strip().upper()
    
    amount = 0.0
    if pd.notna(txn_row.get("amount")):
        try:
            amount = round(float(txn_row["amount"]), 2)
        except (ValueError, TypeError):
            amount = 0.0

    # 3. Retrieve Customer KYC Context
    kyc_df = data_loader.get_kyc()
    user_risk_segment = "UNKNOWN"
    kyc_status = "UNKNOWN"
    user_occupation = None
    user_monthly_income = None

    if kyc_df is not None and not kyc_df.empty and "user_id" in kyc_df.columns and user_id:
        kyc_match = kyc_df[kyc_df["user_id"].astype(str).str.strip().str.upper() == user_id.upper()]
        if not kyc_match.empty:
            krow = kyc_match.iloc[0]
            user_risk_segment = str(krow.get("risk_segment", "UNKNOWN")).strip().upper()
            kyc_status = str(krow.get("kyc_status", "UNKNOWN")).strip().upper()
            user_occupation = str(krow.get("occupation", "")) if pd.notna(krow.get("occupation")) else None
            if pd.notna(krow.get("monthly_income")):
                try:
                    user_monthly_income = float(krow["monthly_income"])
                except (ValueError, TypeError):
                    user_monthly_income = None

    # 4. Retrieve Merchant Context
    merchants_df = data_loader.get_merchants()
    merchant_status = "UNKNOWN"
    merchant_name = None
    merchant_category = None
    declared_avg_ticket = None

    if merchants_df is not None and not merchants_df.empty and "merchant_id" in merchants_df.columns and merchant_id:
        m_match = merchants_df[merchants_df["merchant_id"].astype(str).str.strip().str.upper() == merchant_id.upper()]
        if not m_match.empty:
            mrow = m_match.iloc[0]
            merchant_status = str(mrow.get("merchant_status", "UNKNOWN")).strip().upper()
            merchant_name = str(mrow.get("merchant_name", "")) if pd.notna(mrow.get("merchant_name")) else None
            merchant_category = str(mrow.get("merchant_category", "")) if pd.notna(mrow.get("merchant_category")) else None
            if pd.notna(mrow.get("declared_avg_ticket_size")):
                try:
                    declared_avg_ticket = round(float(mrow["declared_avg_ticket_size"]), 2)
                except (ValueError, TypeError):
                    declared_avg_ticket = None

    # 5. Retrieve Chargeback / Dispute Context
    cb_summary_df = data_loader.get_chargeback_summary()
    chargeback_count = 0
    chargeback_amount = 0.0
    open_chargebacks = 0
    critical_chargebacks = 0
    max_chargeback_severity = "NONE"

    if cb_summary_df is not None and not cb_summary_df.empty and "txn_id" in cb_summary_df.columns:
        cb_match = cb_summary_df[cb_summary_df["txn_id"].astype(str).str.strip().str.upper() == clean_id.upper()]
        if not cb_match.empty:
            cb_row = cb_match.iloc[0]
            chargeback_count = int(cb_row.get("chargeback_count", 0)) if pd.notna(cb_row.get("chargeback_count")) else 0
            chargeback_amount = round(float(cb_row.get("chargeback_amount", 0.0)), 2) if pd.notna(cb_row.get("chargeback_amount")) else 0.0
            open_chargebacks = int(cb_row.get("open_chargebacks", 0)) if pd.notna(cb_row.get("open_chargebacks")) else 0
            critical_chargebacks = int(cb_row.get("critical_chargebacks", 0)) if pd.notna(cb_row.get("critical_chargebacks")) else 0
            max_chargeback_severity = str(cb_row.get("max_chargeback_severity", "NONE")).strip().upper()

    # 6. Evaluate Deterministic Risk Signals & Anomaly Checks
    risk_signals: List[str] = []
    explanation_factors: List[Dict[str, Any]] = []

    # Signal A: Historical Chargeback
    has_cb = chargeback_count > 0
    if has_cb:
        risk_signals.append("HISTORICAL_CHARGEBACK")
        cb_ev = f"{chargeback_count} chargeback complaint(s) registered (Total disputed: Rs. {chargeback_amount:,.2f})"
    else:
        cb_ev = "No historical chargebacks registered for this transaction"
    explanation_factors.append({
        "factor": "HISTORICAL_CHARGEBACK",
        "triggered": has_cb,
        "evidence": cb_ev
    })

    # Signal B: Critical Chargeback Severity
    has_crit_cb = critical_chargebacks > 0 or max_chargeback_severity == "CRITICAL"
    if has_crit_cb:
        risk_signals.append("CRITICAL_CHARGEBACK")
        crit_ev = f"{critical_chargebacks} dispute(s) flagged with CRITICAL severity tier"
    else:
        crit_ev = "No critical severity chargeback disputes flagged"
    explanation_factors.append({
        "factor": "CRITICAL_CHARGEBACK",
        "triggered": has_crit_cb,
        "evidence": crit_ev
    })

    # Signal C: Suspended Merchant
    is_suspended_m = merchant_status == "SUSPENDED"
    if is_suspended_m:
        risk_signals.append("SUSPENDED_MERCHANT")
        m_ev = f"Receiving merchant ({merchant_id}) is currently SUSPENDED due to risk policy violations"
    else:
        m_ev = f"Merchant status is {merchant_status}"
    explanation_factors.append({
        "factor": "SUSPENDED_MERCHANT",
        "triggered": is_suspended_m,
        "evidence": m_ev
    })

    # Signal D: High-Risk User KYC Segment
    is_high_risk_kyc = user_risk_segment == "HIGH"
    if is_high_risk_kyc:
        risk_signals.append("HIGH_RISK_KYC")
        kyc_ev = f"Customer ({user_id}) identity is classified under HIGH risk segment"
    else:
        kyc_ev = f"User KYC risk segment is {user_risk_segment}"
    explanation_factors.append({
        "factor": "HIGH_RISK_KYC",
        "triggered": is_high_risk_kyc,
        "evidence": kyc_ev
    })

    # Signal E: Unverified KYC Status
    is_unverified_kyc = kyc_status in ["REJECTED", "PENDING"]
    if is_unverified_kyc:
        risk_signals.append("UNVERIFIED_KYC")
        ukyc_ev = f"User KYC compliance status is currently {kyc_status}"
    else:
        ukyc_ev = f"User KYC status is {kyc_status}"
    explanation_factors.append({
        "factor": "UNVERIFIED_KYC",
        "triggered": is_unverified_kyc,
        "evidence": ukyc_ev
    })

    # Signal F: Ticket-Size Surge Anomaly (Amount > 3.0 * declared_avg_ticket_size)
    ticket_size_ratio: Optional[float] = None
    ticket_size_anomaly = False
    if declared_avg_ticket is not None and declared_avg_ticket > 0:
        ticket_size_ratio = round(amount / declared_avg_ticket, 2)
        if amount > 3.0 * declared_avg_ticket:
            ticket_size_anomaly = True
            risk_signals.append("TICKET_SIZE_ANOMALY")
            ticket_ev = (
                f"Transaction amount Rs. {amount:,.2f} is {ticket_size_ratio}x the merchant's declared "
                f"average ticket size (Rs. {declared_avg_ticket:,.2f}), exceeding the 3.0x anomaly threshold"
            )
        else:
            ticket_ev = (
                f"Transaction amount Rs. {amount:,.2f} is within normal range "
                f"({ticket_size_ratio}x of declared avg Rs. {declared_avg_ticket:,.2f})"
            )
    else:
        ticket_ev = "Declared average ticket size benchmark unavailable for merchant"
    explanation_factors.append({
        "factor": "TICKET_SIZE_ANOMALY",
        "triggered": ticket_size_anomaly,
        "evidence": ticket_ev
    })

    # Signal G: Failed Transaction Status
    is_failed_txn = txn_status == "FAILED"
    if is_failed_txn:
        risk_signals.append("TRANSACTION_FAILED")
        status_ev = "Transaction ended with FAILED status in UPI ledger"
    else:
        status_ev = f"Transaction execution status is {txn_status}"
    explanation_factors.append({
        "factor": "TRANSACTION_FAILED",
        "triggered": is_failed_txn,
        "evidence": status_ev
    })

    # 7. Determine Risk Level from Documented Multi-Signal Thresholds
    # Level hierarchy:
    # - CRITICAL: Critical chargeback present OR (Suspended merchant with active chargebacks)
    # - HIGH: >= 2 risk signals OR Historical chargeback OR Suspended merchant OR High Risk KYC
    # - MEDIUM: Exactly 1 single risk signal (e.g. ticket size spike, unverified KYC, or failed status alone)
    # - LOW: 0 risk signals triggered
    signal_count = len(risk_signals)

    if has_crit_cb or (is_suspended_m and has_cb):
        risk_level = "CRITICAL"
    elif signal_count >= 2 or has_cb or is_suspended_m or is_high_risk_kyc:
        risk_level = "HIGH"
    elif signal_count == 1:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"

    # Numerical risk score: The repository does NOT define an uncalibrated continuous ML probability;
    # it is strictly a deterministic multi-signal heuristic engine.
    risk_score = None

    return {
        "found": True,
        "transaction_id": str(txn_row["txn_id"]),
        "risk_score": risk_score,
        "risk_level": risk_level,
        "risk_signals": risk_signals,
        "metrics": {
            "amount": amount,
            "status": txn_status,
            "user_id": user_id,
            "user_risk_segment": user_risk_segment,
            "kyc_status": kyc_status,
            "merchant_id": merchant_id,
            "merchant_name": merchant_name,
            "merchant_status": merchant_status,
            "merchant_category": merchant_category,
            "declared_avg_ticket_size": declared_avg_ticket,
            "chargeback_count": chargeback_count,
            "critical_chargebacks": critical_chargebacks,
            "open_chargebacks": open_chargebacks,
            "max_chargeback_severity": max_chargeback_severity,
            "ticket_size_ratio": ticket_size_ratio,
            "ticket_size_anomaly": ticket_size_anomaly,
            "signal_count": signal_count
        },
        "explanation_factors": explanation_factors
    }
