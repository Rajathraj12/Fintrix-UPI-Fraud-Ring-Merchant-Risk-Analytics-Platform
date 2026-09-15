"""
Analytics Intelligence & Conversational BI Tools - Phase 6

Deterministic dataset-level aggregation and analytics tools for financial reporting.
Evaluates transaction ledgers, customer cohorts, merchant benchmarks, chargeback streams, and risk distributions.
"""
from typing import Dict, Any, List, Optional
import pandas as pd
import numpy as np
from ..data.data_loader import data_loader


def get_transaction_analytics(
    status: Optional[str] = None,
    user_id: Optional[str] = None,
    merchant_id: Optional[str] = None,
    mcc: Optional[float] = None,
    date_from: Optional[str] = None,
    date_to: Optional[str] = None,
    top_n: int = 10,
) -> Dict[str, Any]:
    """
    Retrieve deterministic transaction-level aggregate analytics, volume, failure rates,
    status breakdowns, and volume rankings with optional filters.

    Args:
        status: Optional transaction execution status to filter by (e.g. 'SUCCESS', 'FAILED', 'PENDING').
        user_id: Optional user identifier to filter transactions for a specific customer.
        merchant_id: Optional merchant identifier to filter transactions for a specific merchant.
        mcc: Optional 4-digit Merchant Category Code (e.g. 5411.0).
        date_from: Optional start date/timestamp in ISO format (e.g. '2026-01-01').
        date_to: Optional end date/timestamp in ISO format (e.g. '2026-01-31').
        top_n: Maximum number of top ranking entities to return (default 10, max 50).
    """
    limit_n = max(1, min(int(top_n) if top_n else 10, 50))
    txns_df = data_loader.get_transactions()

    if txns_df is None or txns_df.empty:
        return {
            "success": False,
            "error": "Transactions dataset unavailable",
            "summary": {}
        }

    df = txns_df.copy()
    filters_applied: Dict[str, Any] = {}

    # 1. Apply Filters
    if status and isinstance(status, str) and status.strip():
        stat_clean = status.strip().upper()
        df = df[df["status"].astype(str).str.strip().str.upper() == stat_clean]
        filters_applied["status"] = stat_clean

    if user_id and isinstance(user_id, str) and user_id.strip():
        uid_clean = user_id.strip().upper()
        df = df[df["user_id"].astype(str).str.strip().str.upper() == uid_clean]
        filters_applied["user_id"] = uid_clean

    if merchant_id and isinstance(merchant_id, str) and merchant_id.strip():
        mid_clean = merchant_id.strip().upper()
        df = df[df["merchant_id"].astype(str).str.strip().str.upper() == mid_clean]
        filters_applied["merchant_id"] = mid_clean

    if mcc is not None:
        try:
            mcc_val = float(mcc)
            df = df[df["mcc"] == mcc_val]
            filters_applied["mcc"] = mcc_val
        except (ValueError, TypeError):
            pass

    if date_from and isinstance(date_from, str) and date_from.strip():
        try:
            dt_from = pd.to_datetime(date_from.strip())
            df["_parsed_ts"] = pd.to_datetime(df["timestamp"])
            df = df[df["_parsed_ts"] >= dt_from]
            filters_applied["date_from"] = str(dt_from)
        except Exception:
            pass

    if date_to and isinstance(date_to, str) and date_to.strip():
        try:
            dt_to = pd.to_datetime(date_to.strip())
            if "_parsed_ts" not in df.columns:
                df["_parsed_ts"] = pd.to_datetime(df["timestamp"])
            df = df[df["_parsed_ts"] <= dt_to]
            filters_applied["date_to"] = str(dt_to)
        except Exception:
            pass

    # 2. Zero-result handling
    if df.empty:
        return {
            "success": True,
            "filters_applied": filters_applied,
            "summary": {
                "transaction_count": 0,
                "total_amount": 0.0,
                "average_amount": 0.0,
                "successful_transactions": 0,
                "failed_transactions": 0,
                "pending_transactions": 0,
                "failure_rate_pct": 0.0,
                "first_transaction": None,
                "last_transaction": None
            },
            "status_breakdown": {},
            "mcc_breakdown": {},
            "top_merchants_by_volume": [],
            "top_users_by_volume": []
        }

    # 3. Compute Aggregations
    total_count = len(df)
    total_amt = round(float(df["amount"].sum()), 2)
    avg_amt = round(float(df["amount"].mean()), 2)

    status_counts = df["status"].astype(str).str.strip().str.upper().value_counts().to_dict()
    succ_count = status_counts.get("SUCCESS", 0)
    fail_count = status_counts.get("FAILED", 0)
    pend_count = status_counts.get("PENDING", 0)
    fail_rate = round((fail_count / total_count) * 100, 2) if total_count > 0 else 0.0

    first_txn = str(df["timestamp"].min()) if pd.notna(df["timestamp"].min()) else None
    last_txn = str(df["timestamp"].max()) if pd.notna(df["timestamp"].max()) else None

    # MCC Breakdown (top-10)
    mcc_counts = df["mcc"].value_counts().head(limit_n).to_dict()
    mcc_breakdown = {str(k): int(v) for k, v in mcc_counts.items()}

    # Top Merchants by Amount
    top_m_amt = (
        df.groupby("merchant_id")
        .agg(txn_count=("txn_id", "count"), total_amount=("amount", "sum"))
        .sort_values(["total_amount", "txn_count"], ascending=[False, False])
        .head(limit_n)
        .reset_index()
    )
    top_m_amt["total_amount"] = top_m_amt["total_amount"].round(2)
    top_merchants_amt = top_m_amt.to_dict(orient="records")

    # Top Merchants by Transaction Count
    top_m_cnt = (
        df.groupby("merchant_id")
        .agg(txn_count=("txn_id", "count"), total_amount=("amount", "sum"))
        .sort_values(["txn_count", "total_amount"], ascending=[False, False])
        .head(limit_n)
        .reset_index()
    )
    top_m_cnt["total_amount"] = top_m_cnt["total_amount"].round(2)
    top_merchants_cnt = top_m_cnt.to_dict(orient="records")

    # Top Users by Amount
    top_u_amt = (
        df.groupby("user_id")
        .agg(txn_count=("txn_id", "count"), total_amount=("amount", "sum"))
        .sort_values(["total_amount", "txn_count"], ascending=[False, False])
        .head(limit_n)
        .reset_index()
    )
    top_u_amt["total_amount"] = top_u_amt["total_amount"].round(2)
    top_users_amt = top_u_amt.to_dict(orient="records")

    # Top Users by Transaction Count
    top_u_cnt = (
        df.groupby("user_id")
        .agg(txn_count=("txn_id", "count"), total_amount=("amount", "sum"))
        .sort_values(["txn_count", "total_amount"], ascending=[False, False])
        .head(limit_n)
        .reset_index()
    )
    top_u_cnt["total_amount"] = top_u_cnt["total_amount"].round(2)
    top_users_cnt = top_u_cnt.to_dict(orient="records")

    return {
        "success": True,
        "filters_applied": filters_applied,
        "summary": {
            "transaction_count": total_count,
            "total_amount": total_amt,
            "average_amount": avg_amt,
            "successful_transactions": succ_count,
            "failed_transactions": fail_count,
            "pending_transactions": pend_count,
            "failure_rate_pct": fail_rate,
            "first_transaction": first_txn,
            "last_transaction": last_txn
        },
        "status_breakdown": status_counts,
        "mcc_breakdown": mcc_breakdown,
        "top_merchants_by_transaction_count": top_merchants_cnt,
        "top_merchants_by_amount": top_merchants_amt,
        "top_merchants_by_volume": top_merchants_cnt,
        "top_users_by_transaction_count": top_users_cnt,
        "top_users_by_amount": top_users_amt,
        "top_users_by_volume": top_users_amt
    }


def get_customer_analytics(
    risk_segment: Optional[str] = None,
    kyc_status: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    top_n: int = 10,
) -> Dict[str, Any]:
    """
    Retrieve aggregate customer and KYC intelligence, spend capacity, failure patterns,
    risk segment distribution, and top customer activity rankings.

    Args:
        risk_segment: Optional customer risk classification to filter by ('LOW', 'MEDIUM', 'HIGH').
        kyc_status: Optional regulatory compliance status ('VERIFIED', 'PENDING', 'REJECTED').
        city: Optional residential city filter (e.g. 'Mumbai', 'Pune').
        state: Optional state filter (e.g. 'Maharashtra', 'Karnataka').
        top_n: Maximum number of top customer ranking records to return (default 10, max 50).
    """
    limit_n = max(1, min(int(top_n) if top_n else 10, 50))
    kyc_df = data_loader.get_kyc()
    txns_df = data_loader.get_transactions()
    cb_df = data_loader.get_chargebacks()

    if kyc_df is None or kyc_df.empty:
        return {"success": False, "error": "KYC dataset unavailable", "summary": {}}

    # Deduplicate KYC to 1 row per user_id taking the latest valid profile
    kyc_dedup = (
        kyc_df.sort_values("signup_timestamp", ascending=True)
        .groupby("user_id")
        .last()
        .reset_index()
    )

    filters_applied: Dict[str, Any] = {}

    if risk_segment and isinstance(risk_segment, str) and risk_segment.strip():
        r_clean = risk_segment.strip().upper()
        kyc_dedup = kyc_dedup[kyc_dedup["risk_segment"].astype(str).str.strip().str.upper() == r_clean]
        filters_applied["risk_segment"] = r_clean

    if kyc_status and isinstance(kyc_status, str) and kyc_status.strip():
        k_clean = kyc_status.strip().upper()
        kyc_dedup = kyc_dedup[kyc_dedup["kyc_status"].astype(str).str.strip().str.upper() == k_clean]
        filters_applied["kyc_status"] = k_clean

    if city and isinstance(city, str) and city.strip():
        c_clean = city.strip().title()
        kyc_dedup = kyc_dedup[kyc_dedup["city"].astype(str).str.strip().str.title() == c_clean]
        filters_applied["city"] = c_clean

    if state and isinstance(state, str) and state.strip():
        s_clean = state.strip().title()
        kyc_dedup = kyc_dedup[kyc_dedup["state"].astype(str).str.strip().str.title() == s_clean]
        filters_applied["state"] = s_clean

    if kyc_dedup.empty:
        return {
            "success": True,
            "filters_applied": filters_applied,
            "summary": {
                "customer_count": 0,
                "active_transacting_customers": 0,
                "total_transaction_count": 0,
                "total_transaction_amount": 0.0,
                "average_transaction_amount": 0.0,
                "failed_transactions": 0,
                "failure_rate_pct": 0.0,
                "customers_with_chargebacks": 0,
                "total_disputed_amount": 0.0
            },
            "risk_segment_distribution": {},
            "kyc_status_distribution": {},
            "top_customers_by_amount": [],
            "top_customers_by_failed_transactions": [],
            "top_customers_by_chargebacks": []
        }

    # Aggregate transactions per user
    if txns_df is not None and not txns_df.empty:
        user_txns_agg = (
            txns_df.groupby("user_id")
            .agg(
                txn_count=("txn_id", "count"),
                total_amt=("amount", "sum"),
                failed_count=("status", lambda x: (x.astype(str).str.strip().str.upper() == "FAILED").sum())
            )
            .reset_index()
        )
    else:
        user_txns_agg = pd.DataFrame(columns=["user_id", "txn_count", "total_amt", "failed_count"])

    # Aggregate chargebacks per user
    if cb_df is not None and not cb_df.empty:
        user_cb_agg = (
            cb_df.groupby("user_id")
            .agg(
                cb_count=("complaint_id", "count"),
                cb_amt=("disputed_amount", "sum")
            )
            .reset_index()
        )
    else:
        user_cb_agg = pd.DataFrame(columns=["user_id", "cb_count", "cb_amt"])

    merged = (
        kyc_dedup.merge(user_txns_agg, on="user_id", how="left")
        .merge(user_cb_agg, on="user_id", how="left")
    )
    merged["txn_count"] = merged["txn_count"].fillna(0).astype(int)
    merged["total_amt"] = merged["total_amt"].fillna(0.0).round(2)
    merged["failed_count"] = merged["failed_count"].fillna(0).astype(int)
    merged["cb_count"] = merged["cb_count"].fillna(0).astype(int)
    merged["cb_amt"] = merged["cb_amt"].fillna(0.0).round(2)

    total_cust = len(merged)
    active_cust = int((merged["txn_count"] > 0).sum())
    total_txns = int(merged["txn_count"].sum())
    total_spent = round(float(merged["total_amt"].sum()), 2)
    avg_spent = round(total_spent / total_txns, 2) if total_txns > 0 else 0.0
    failed_txns = int(merged["failed_count"].sum())
    fail_rate = round((failed_txns / total_txns) * 100, 2) if total_txns > 0 else 0.0
    cust_with_cb = int((merged["cb_count"] > 0).sum())
    total_disp = round(float(merged["cb_amt"].sum()), 2)

    risk_dist = merged["risk_segment"].value_counts().to_dict()
    kyc_dist = merged["kyc_status"].value_counts().to_dict()

    # Top Customers by Total Spend (strictly omitting PII: no PAN, no Aadhaar)
    top_spend = (
        merged[merged["total_amt"] > 0]
        .sort_values("total_amt", ascending=False)
        .head(limit_n)[["user_id", "full_name", "city", "risk_segment", "total_amt", "txn_count"]]
        .rename(columns={"total_amt": "total_amount", "txn_count": "transaction_count"})
        .to_dict(orient="records")
    )

    # Top Customers by Failed Transactions
    top_failed = (
        merged[merged["failed_count"] > 0]
        .sort_values("failed_count", ascending=False)
        .head(limit_n)[["user_id", "full_name", "city", "failed_count", "txn_count"]]
        .rename(columns={"failed_count": "failed_transactions", "txn_count": "total_transactions"})
        .to_dict(orient="records")
    )

    # Top Customers by Chargeback Complaints
    top_cb = (
        merged[merged["cb_count"] > 0]
        .sort_values("cb_count", ascending=False)
        .head(limit_n)[["user_id", "full_name", "cb_count", "cb_amt"]]
        .rename(columns={"cb_count": "chargeback_count", "cb_amt": "disputed_amount"})
        .to_dict(orient="records")
    )

    return {
        "success": True,
        "filters_applied": filters_applied,
        "summary": {
            "customer_count": total_cust,
            "active_transacting_customers": active_cust,
            "total_transaction_count": total_txns,
            "total_transaction_amount": total_spent,
            "average_transaction_amount": avg_spent,
            "failed_transactions": failed_txns,
            "failure_rate_pct": fail_rate,
            "customers_with_chargebacks": cust_with_cb,
            "total_disputed_amount": total_disp
        },
        "risk_segment_distribution": risk_dist,
        "kyc_status_distribution": kyc_dist,
        "top_customers_by_amount": top_spend,
        "top_customers_by_failed_transactions": top_failed,
        "top_customers_by_chargebacks": top_cb
    }


def get_merchant_analytics(
    merchant_category: Optional[str] = None,
    merchant_status: Optional[str] = None,
    city: Optional[str] = None,
    state: Optional[str] = None,
    chargeback_tier: Optional[str] = None,
    top_n: int = 10,
) -> Dict[str, Any]:
    """
    Retrieve aggregate merchant ecosystem intelligence, transaction volume rankings,
    chargeback rates, risk tiers (NORMAL, ELEVATED, HIGH_RISK), and ticket size anomalies.

    Args:
        merchant_category: Optional industry classification filter (e.g. 'Grocery', 'Telecom', 'Hotel & Lodging').
        merchant_status: Optional operating status filter ('ACTIVE', 'INACTIVE', 'SUSPENDED').
        city: Optional merchant headquarters city filter.
        state: Optional state filter.
        chargeback_tier: Optional risk tier filter ('NORMAL' for <1.5%, 'ELEVATED' for 1.5-5.0%, 'HIGH_RISK' for >5.0%).
        top_n: Maximum number of top merchant ranking records to return (default 10, max 50).
    """
    limit_n = max(1, min(int(top_n) if top_n else 10, 50))
    merchants_df = data_loader.get_merchants()
    txns_df = data_loader.get_transactions()
    cb_df = data_loader.get_chargebacks()

    if merchants_df is None or merchants_df.empty:
        return {"success": False, "error": "Merchants dataset unavailable", "summary": {}}

    # Deduplicate merchants taking the latest record by onboarding_date
    m_dedup = (
        merchants_df.sort_values("onboarding_date", ascending=True)
        .groupby("merchant_id")
        .last()
        .reset_index()
    )

    # Aggregate transactions
    if txns_df is not None and not txns_df.empty:
        m_txns_agg = (
            txns_df.groupby("merchant_id")
            .agg(
                txn_count=("txn_id", "count"),
                total_amt=("amount", "sum"),
                avg_ticket=("amount", "mean"),
                failed_count=("status", lambda x: (x.astype(str).str.strip().str.upper() == "FAILED").sum())
            )
            .reset_index()
        )
    else:
        m_txns_agg = pd.DataFrame(columns=["merchant_id", "txn_count", "total_amt", "avg_ticket", "failed_count"])

    # Aggregate chargebacks
    if cb_df is not None and not cb_df.empty:
        m_cb_agg = (
            cb_df.groupby("merchant_id")
            .agg(
                cb_count=("complaint_id", "count"),
                cb_amt=("disputed_amount", "sum")
            )
            .reset_index()
        )
    else:
        m_cb_agg = pd.DataFrame(columns=["merchant_id", "cb_count", "cb_amt"])

    merged = (
        m_dedup.merge(m_txns_agg, on="merchant_id", how="left")
        .merge(m_cb_agg, on="merchant_id", how="left")
    )
    merged["txn_count"] = merged["txn_count"].fillna(0).astype(int)
    merged["total_amt"] = merged["total_amt"].fillna(0.0).round(2)
    merged["avg_ticket"] = merged["avg_ticket"].fillna(0.0).round(2)
    merged["failed_count"] = merged["failed_count"].fillna(0).astype(int)
    merged["cb_count"] = merged["cb_count"].fillna(0).astype(int)
    merged["cb_amt"] = merged["cb_amt"].fillna(0.0).round(2)

    # Compute chargeback rate & risk tier
    merged["cb_rate_pct"] = np.where(
        merged["txn_count"] > 0,
        ((merged["cb_count"] / merged["txn_count"]) * 100).round(2),
        0.0
    )
    merged["cb_tier"] = np.where(
        merged["cb_rate_pct"] > 5.0,
        "HIGH_RISK",
        np.where(merged["cb_rate_pct"] >= 1.5, "ELEVATED", "NORMAL")
    )

    # Ticket size surge ratio
    merged["declared_avg_ticket_size"] = merged["declared_avg_ticket_size"].fillna(0.0)
    merged["ticket_ratio"] = np.where(
        (merged["declared_avg_ticket_size"] > 0) & (merged["avg_ticket"] > 0),
        (merged["avg_ticket"] / merged["declared_avg_ticket_size"]).round(2),
        np.nan
    )
    merged["ticket_anomaly"] = merged["ticket_ratio"].apply(lambda r: r > 3.0 if pd.notna(r) else False)

    filters_applied: Dict[str, Any] = {}

    if merchant_category and isinstance(merchant_category, str) and merchant_category.strip():
        cat_clean = merchant_category.strip()
        merged = merged[merged["merchant_category"].astype(str).str.strip().str.lower() == cat_clean.lower()]
        filters_applied["merchant_category"] = cat_clean

    if merchant_status and isinstance(merchant_status, str) and merchant_status.strip():
        stat_clean = merchant_status.strip().upper()
        merged = merged[merged["merchant_status"].astype(str).str.strip().str.upper() == stat_clean]
        filters_applied["merchant_status"] = stat_clean

    if city and isinstance(city, str) and city.strip():
        c_clean = city.strip().title()
        merged = merged[merged["city"].astype(str).str.strip().str.title() == c_clean]
        filters_applied["city"] = c_clean

    if state and isinstance(state, str) and state.strip():
        s_clean = state.strip().title()
        merged = merged[merged["state"].astype(str).str.strip().str.title() == s_clean]
        filters_applied["state"] = s_clean

    if chargeback_tier and isinstance(chargeback_tier, str) and chargeback_tier.strip():
        tier_clean = chargeback_tier.strip().upper()
        merged = merged[merged["cb_tier"] == tier_clean]
        filters_applied["chargeback_tier"] = tier_clean

    if merged.empty:
        return {
            "success": True,
            "filters_applied": filters_applied,
            "summary": {
                "merchant_count": 0,
                "active_merchants_with_txns": 0,
                "total_transaction_count": 0,
                "total_transaction_amount": 0.0,
                "average_transaction_amount": 0.0,
                "failed_transactions": 0,
                "failure_rate_pct": 0.0,
                "total_chargebacks": 0,
                "total_disputed_amount": 0.0,
                "overall_chargeback_rate_pct": 0.0
            },
            "category_breakdown": {},
            "status_breakdown": {},
            "chargeback_tier_breakdown": {},
            "top_merchants_by_volume": [],
            "top_merchants_by_amount": [],
            "top_merchants_by_chargeback_rate": [],
            "top_ticket_anomaly_merchants": []
        }

    total_m = len(merged)
    active_m = int((merged["txn_count"] > 0).sum())
    total_txns = int(merged["txn_count"].sum())
    total_vol = round(float(merged["total_amt"].sum()), 2)
    avg_ticket_overall = round(total_vol / total_txns, 2) if total_txns > 0 else 0.0
    failed_txns = int(merged["failed_count"].sum())
    fail_rate = round((failed_txns / total_txns) * 100, 2) if total_txns > 0 else 0.0
    total_cbs = int(merged["cb_count"].sum())
    total_disputed = round(float(merged["cb_amt"].sum()), 2)
    overall_cb_rate = round((total_cbs / total_txns) * 100, 2) if total_txns > 0 else 0.0

    cat_breakdown = merged["merchant_category"].value_counts().to_dict()
    status_breakdown = merged["merchant_status"].value_counts().to_dict()
    tier_breakdown = merged["cb_tier"].value_counts().to_dict()

    # Top Merchants by Transaction Amount
    top_amt = (
        merged[merged["total_amt"] > 0]
        .sort_values("total_amt", ascending=False)
        .head(limit_n)[["merchant_id", "merchant_name", "merchant_category", "total_amt", "txn_count"]]
        .rename(columns={"total_amt": "total_amount", "txn_count": "transaction_count"})
        .to_dict(orient="records")
    )

    # Top Merchants by Transaction Volume (count)
    top_vol = (
        merged[merged["txn_count"] > 0]
        .sort_values("txn_count", ascending=False)
        .head(limit_n)[["merchant_id", "merchant_name", "merchant_category", "txn_count", "total_amt"]]
        .rename(columns={"total_amt": "total_amount", "txn_count": "transaction_count"})
        .to_dict(orient="records")
    )

    # Top Merchants by Chargeback Rate (min 1 txn)
    top_cb_rate = (
        merged[merged["txn_count"] >= 1]
        .sort_values(["cb_rate_pct", "cb_count"], ascending=False)
        .head(limit_n)[["merchant_id", "merchant_name", "merchant_category", "cb_rate_pct", "cb_count", "txn_count"]]
        .rename(columns={"cb_count": "chargeback_count", "txn_count": "transaction_count"})
        .to_dict(orient="records")
    )

    # Top Ticket Anomaly Merchants (>3x declared avg)
    top_anom = (
        merged[merged["ticket_anomaly"]]
        .sort_values("ticket_ratio", ascending=False)
        .head(limit_n)[["merchant_id", "merchant_name", "merchant_category", "avg_ticket", "declared_avg_ticket_size", "ticket_ratio"]]
        .rename(columns={"avg_ticket": "observed_avg_ticket"})
        .to_dict(orient="records")
    )

    return {
        "success": True,
        "filters_applied": filters_applied,
        "summary": {
            "merchant_count": total_m,
            "active_merchants_with_txns": active_m,
            "total_transaction_count": total_txns,
            "total_transaction_amount": total_vol,
            "average_transaction_amount": avg_ticket_overall,
            "failed_transactions": failed_txns,
            "failure_rate_pct": fail_rate,
            "total_chargebacks": total_cbs,
            "total_disputed_amount": total_disputed,
            "overall_chargeback_rate_pct": overall_cb_rate
        },
        "category_breakdown": cat_breakdown,
        "status_breakdown": status_breakdown,
        "chargeback_tier_breakdown": tier_breakdown,
        "top_merchants_by_amount": top_amt,
        "top_merchants_by_volume": top_vol,
        "top_merchants_by_transaction_count": top_vol,
        "top_merchants_by_chargeback_rate": top_cb_rate,
        "top_ticket_anomaly_merchants": top_anom
    }


def get_chargeback_analytics(
    severity: Optional[str] = None,
    resolution_status: Optional[str] = None,
    channel: Optional[str] = None,
    reason_code: Optional[str] = None,
    top_n: int = 10,
) -> Dict[str, Any]:
    """
    Retrieve dataset-wide dispute intelligence, resolution lifecycles, channel intakes,
    dispute reason patterns, and top disputed merchant/customer rankings.

    Args:
        severity: Optional dispute severity tier filter ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW').
        resolution_status: Optional resolution state ('OPEN', 'CLOSED', 'REJECTED').
        channel: Optional intake conduit ('IVR', 'Chatbot', 'Email', 'Branch', 'Mobile App', 'Call Center').
        reason_code: Optional reason classification (e.g. 'SERVICE_NOT_PROVIDED', 'UNAUTHORIZED_TRANSACTION').
        top_n: Maximum number of top disputed ranking records to return (default 10, max 50).
    """
    limit_n = max(1, min(int(top_n) if top_n else 10, 50))
    cb_df = data_loader.get_chargebacks()

    if cb_df is None or cb_df.empty:
        return {"success": False, "error": "Chargebacks dataset unavailable", "summary": {}}

    df = cb_df.copy()
    filters_applied: Dict[str, Any] = {}

    if severity and isinstance(severity, str) and severity.strip():
        s_clean = severity.strip().upper()
        df = df[df["severity"].astype(str).str.strip().str.upper() == s_clean]
        filters_applied["severity"] = s_clean

    if resolution_status and isinstance(resolution_status, str) and resolution_status.strip():
        res_clean = resolution_status.strip().upper()
        df = df[df["resolution_status"].astype(str).str.strip().str.upper() == res_clean]
        filters_applied["resolution_status"] = res_clean

    if channel and isinstance(channel, str) and channel.strip():
        ch_clean = channel.strip().lower()
        df = df[df["channel"].astype(str).str.strip().str.lower() == ch_clean]
        filters_applied["channel"] = channel.strip()

    if reason_code and isinstance(reason_code, str) and reason_code.strip():
        rc_clean = reason_code.strip().upper()
        df = df[df["reason_code"].astype(str).str.strip().str.upper() == rc_clean]
        filters_applied["reason_code"] = rc_clean

    if df.empty:
        return {
            "success": True,
            "filters_applied": filters_applied,
            "summary": {
                "total_chargebacks": 0,
                "total_disputed_amount": 0.0,
                "average_disputed_amount": 0.0,
                "open_chargebacks": 0,
                "critical_chargebacks": 0,
                "closed_chargebacks": 0,
                "rejected_chargebacks": 0
            },
            "severity_breakdown": {},
            "resolution_status_breakdown": {},
            "channel_breakdown": {},
            "reason_breakdown": {},
            "top_merchants_by_chargeback_count": [],
            "top_merchants_by_disputed_amount": [],
            "top_customers_by_chargeback_count": []
        }

    total_cb = len(df)
    total_disp = round(float(df["disputed_amount"].sum()), 2) if "disputed_amount" in df.columns else 0.0
    avg_disp = round(total_disp / total_cb, 2) if total_cb > 0 else 0.0

    status_counts = df["resolution_status"].astype(str).str.strip().str.upper().value_counts().to_dict()
    open_cb = status_counts.get("OPEN", 0)
    closed_cb = status_counts.get("CLOSED", 0)
    rejected_cb = status_counts.get("REJECTED", 0)

    sev_counts = df["severity"].astype(str).str.strip().str.upper().value_counts().to_dict()
    crit_cb = sev_counts.get("CRITICAL", 0)

    channel_counts = df["channel"].value_counts().to_dict()
    reason_counts = df["reason_code"].value_counts().head(limit_n).to_dict()

    # Top Merchants by Chargeback Count
    top_m_cb = (
        df.groupby("merchant_id")
        .agg(chargeback_count=("complaint_id", "count"), disputed_amount=("disputed_amount", "sum"))
        .sort_values("chargeback_count", ascending=False)
        .head(limit_n)
        .reset_index()
    )
    top_m_cb["disputed_amount"] = top_m_cb["disputed_amount"].round(2)
    top_merchants_cb = top_m_cb.to_dict(orient="records")

    # Top Merchants by Disputed Amount
    top_m_amt = (
        df.groupby("merchant_id")
        .agg(chargeback_count=("complaint_id", "count"), disputed_amount=("disputed_amount", "sum"))
        .sort_values("disputed_amount", ascending=False)
        .head(limit_n)
        .reset_index()
    )
    top_m_amt["disputed_amount"] = top_m_amt["disputed_amount"].round(2)
    top_merchants_amt = top_m_amt.to_dict(orient="records")

    # Top Customers by Chargeback Count
    top_u_cb = (
        df.groupby("user_id")
        .agg(chargeback_count=("complaint_id", "count"), disputed_amount=("disputed_amount", "sum"))
        .sort_values("chargeback_count", ascending=False)
        .head(limit_n)
        .reset_index()
    )
    top_u_cb["disputed_amount"] = top_u_cb["disputed_amount"].round(2)
    top_customers_cb = top_u_cb.to_dict(orient="records")

    return {
        "success": True,
        "filters_applied": filters_applied,
        "summary": {
            "total_chargebacks": total_cb,
            "total_disputed_amount": total_disp,
            "average_disputed_amount": avg_disp,
            "open_chargebacks": open_cb,
            "critical_chargebacks": crit_cb,
            "closed_chargebacks": closed_cb,
            "rejected_chargebacks": rejected_cb
        },
        "severity_breakdown": sev_counts,
        "resolution_status_breakdown": status_counts,
        "channel_breakdown": channel_counts,
        "reason_breakdown": reason_counts,
        "top_merchants_by_chargeback_count": top_merchants_cb,
        "top_merchants_by_disputed_amount": top_merchants_amt,
        "top_customers_by_chargeback_count": top_customers_cb
    }


def get_risk_analytics(top_n: int = 10) -> Dict[str, Any]:
    """
    Retrieve dataset-wide risk distribution, risk level breakdowns (CRITICAL, HIGH, MEDIUM, LOW),
    signal occurrence frequencies, and rankings of the highest risk transactions in the ecosystem.

    Args:
        top_n: Maximum number of highest risk transaction records to return (default 10, max 50).
    """
    limit_n = max(1, min(int(top_n) if top_n else 10, 50))
    txns_df = data_loader.get_transactions()
    cb_sum_df = data_loader.get_chargeback_summary()
    kyc_df = data_loader.get_kyc()
    merchants_df = data_loader.get_merchants()

    if txns_df is None or txns_df.empty:
        return {"success": False, "error": "Transactions dataset unavailable", "summary": {}}

    # Deduplicate KYC & Merchants for fast lookup
    kyc_lookup = (
        kyc_df.sort_values("signup_timestamp", ascending=True)
        .groupby("user_id")
        .last()[["risk_segment", "kyc_status"]]
        .reset_index()
    ) if kyc_df is not None and not kyc_df.empty else pd.DataFrame(columns=["user_id", "risk_segment", "kyc_status"])

    m_lookup = (
        merchants_df.sort_values("onboarding_date", ascending=True)
        .groupby("merchant_id")
        .last()[["merchant_status", "declared_avg_ticket_size"]]
        .reset_index()
    ) if merchants_df is not None and not merchants_df.empty else pd.DataFrame(columns=["merchant_id", "merchant_status", "declared_avg_ticket_size"])

    # Merge across full transaction ledger
    merged = txns_df.merge(cb_sum_df, on="txn_id", how="left")
    merged = merged.merge(kyc_lookup, on="user_id", how="left")
    merged = merged.merge(m_lookup, on="merchant_id", how="left")

    # Evaluate 7 deterministic forensic risk signals
    crit_cb = (merged["critical_chargebacks"] > 0) | (merged["max_chargeback_severity"] == "CRITICAL")
    has_cb = merged["chargeback_count"] > 0
    susp_m = merged["merchant_status"].astype(str).str.strip().str.upper() == "SUSPENDED"
    high_kyc = merged["risk_segment"].astype(str).str.strip().str.upper() == "HIGH"
    unver_kyc = merged["kyc_status"].astype(str).str.strip().str.upper().isin(["REJECTED", "PENDING"])
    ticket_anom = (merged["declared_avg_ticket_size"] > 0) & (merged["amount"] > 3.0 * merged["declared_avg_ticket_size"])
    failed_txn = merged["status"].astype(str).str.strip().str.upper() == "FAILED"

    signal_matrix = [
        ("HISTORICAL_CHARGEBACK", has_cb),
        ("CRITICAL_CHARGEBACK", crit_cb),
        ("SUSPENDED_MERCHANT", susp_m),
        ("HIGH_RISK_KYC", high_kyc),
        ("UNVERIFIED_KYC", unver_kyc),
        ("TICKET_SIZE_ANOMALY", ticket_anom),
        ("TRANSACTION_FAILED", failed_txn)
    ]

    signal_counts = sum(s[1].astype(int) for s in signal_matrix)
    merged["signal_count"] = signal_counts

    # Determine risk level hierarchy
    is_crit = crit_cb | (susp_m & has_cb)
    is_high = ~is_crit & ((signal_counts >= 2) | has_cb | susp_m | high_kyc)
    is_med = ~is_crit & ~is_high & (signal_counts == 1)
    is_low = ~is_crit & ~is_high & ~is_med

    merged["risk_level"] = np.where(
        is_crit, "CRITICAL",
        np.where(is_high, "HIGH",
        np.where(is_med, "MEDIUM", "LOW"))
    )

    total_analyzed = len(merged)
    crit_count = int(is_crit.sum())
    high_count = int(is_high.sum())
    med_count = int(is_med.sum())
    low_count = int(is_low.sum())

    risk_dist = {
        "CRITICAL": crit_count,
        "HIGH": high_count,
        "MEDIUM": med_count,
        "LOW": low_count
    }

    signal_frequency = {
        name: int(series.sum()) for name, series in signal_matrix
    }

    # Top Riskiest Transactions (highest signal count)
    top_risk_df = (
        merged.sort_values(["signal_count", "amount"], ascending=[False, False])
        .head(limit_n)[["txn_id", "user_id", "merchant_id", "amount", "status", "risk_level", "signal_count"]]
    )
    top_risk_transactions = top_risk_df.to_dict(orient="records")

    return {
        "success": True,
        "summary": {
            "total_transactions_analyzed": total_analyzed,
            "critical_transaction_count": crit_count,
            "high_risk_transaction_count": high_count,
            "medium_risk_transaction_count": med_count,
            "low_risk_transaction_count": low_count,
            "critical_risk_transaction_count": crit_count,
            "high_and_critical_risk_count": crit_count + high_count,
            "high_and_critical_risk_pct": round(((crit_count + high_count) / total_analyzed) * 100, 2) if total_analyzed > 0 else 0.0
        },
        "risk_level_distribution": risk_dist,
        "signal_distribution": signal_frequency,
        "signal_frequency": signal_frequency,
        "top_highest_risk_transactions": top_risk_transactions
    }
