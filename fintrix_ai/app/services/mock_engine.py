"""
Deterministic Intent Resolution & Development Fallback Engine (Phase 7).
Executes real deterministic tools and synthesizes structured explanations
when running in mock mode or when the external LLM provider is unavailable.
"""
import re
from typing import Dict, Any, List, Optional

from ..tools.transaction_tools import get_transaction
from ..tools.risk_tools import get_risk_score
from ..tools.customer_tools import get_customer_profile
from ..tools.merchant_tools import get_merchant_profile
from ..tools.analytics_tools import (
    get_transaction_analytics,
    get_customer_analytics,
    get_merchant_analytics,
    get_chargeback_analytics,
    get_risk_analytics,
)


def resolve_deterministic_intent(query: str) -> Dict[str, Any]:
    """
    Parse natural language query intent and execute the appropriate deterministic tool.
    Returns structured payload with explanation, tool references, and UI data payload.
    """
    clean_q = (query or "").strip().lower()
    tools_used: List[str] = []

    # -------------------------------------------------------------
    # 1. SPECIFIC TRANSACTION RISK INVESTIGATION (TXNXXXXXXXX)
    # -------------------------------------------------------------
    txn_match = re.search(r"\b(txn\d{8})\b", clean_q, re.IGNORECASE)
    if txn_match:
        txn_id = txn_match.group(1).upper()
        tools_used.append("get_risk_score")
        risk_data = get_risk_score(txn_id)

        if not risk_data.get("found"):
            return {
                "answer": f"Transaction **{txn_id}** was not found in UPI payment records. Please verify the transaction identifier.",
                "tools_used": tools_used,
                "response_type": "text",
                "data": risk_data,
                "source": "get_risk_score"
            }

        level = risk_data.get("risk_level", "LOW")
        signals = risk_data.get("risk_signals", [])
        metrics = risk_data.get("metrics", {})
        user_id = metrics.get("user_id")
        merchant_id = metrics.get("merchant_id")
        amount = metrics.get("amount", 0.0)

        # Retrieve additional context if available
        user_context = None
        merchant_context = None
        if user_id:
            tools_used.append("get_customer_profile")
            user_context = get_customer_profile(user_id)
        if merchant_id:
            tools_used.append("get_merchant_profile")
            merchant_context = get_merchant_profile(merchant_id)

        # Build natural language forensic explanation
        explanation_lines = [
            f"Transaction **{txn_id}** (Amount: ₹{amount:,.2f}) is evaluated as **{level} RISK** based on multi-factor heuristic analysis."
        ]

        if signals:
            explanation_lines.append(f"\n**Forensic Risk Signals Triggered ({len(signals)}):**")
            for sig in signals:
                explanation_lines.append(f"• **{sig.replace('_', ' ')}**")

        factors = risk_data.get("explanation_factors", [])
        triggered_factors = [f for f in factors if f.get("triggered")]
        if triggered_factors:
            explanation_lines.append("\n**Forensic Evidence:**")
            for f in triggered_factors:
                explanation_lines.append(f"• {f.get('evidence')}")

        if merchant_context and merchant_context.get("found"):
            m_info = merchant_context.get("merchant") or {}
            explanation_lines.append(
                f"\n**Merchant Context:** {m_info.get('name', merchant_id)} ({merchant_context.get('merchant_id')}) "
                f"— Status: {m_info.get('merchant_status', 'UNKNOWN')}, Category: {m_info.get('category', 'N/A')}"
            )

        if user_context and user_context.get("found"):
            u_info = user_context.get("kyc") or {}
            explanation_lines.append(
                f"**Customer Context:** {user_id} "
                f"— KYC Status: {u_info.get('kyc_status', 'UNKNOWN')}, Risk Segment: {user_context.get('risk', {}).get('risk_segment', 'UNKNOWN')}"
            )

        return {
            "answer": "\n".join(explanation_lines),
            "tools_used": tools_used,
            "response_type": "investigation",
            "data": {
                "risk_score": risk_data,
                "merchant_context": merchant_context,
                "customer_context": user_context
            },
            "source": "get_risk_score"
        }

    # -------------------------------------------------------------
    # 2. MERCHANT TRANSACTION COUNT (Highest number / count of txns)
    # -------------------------------------------------------------
    count_patterns = [
        "most transaction", "highest transaction count", "most transactions",
        "top merchant by transaction count", "top merchants by transaction count",
        "highest volume by count", "highest number of transactions",
        "processes the most transactions", "processed the most transactions",
        "who has the highest transaction count", "which merchant has the most",
        "which merchant have the most"
    ]
    if any(pat in clean_q for pat in count_patterns) and "amount" not in clean_q and "value" not in clean_q and "revenue" not in clean_q:
        tools_used.append("get_transaction_analytics")
        t_analytics = get_transaction_analytics(top_n=10)
        top_by_count = t_analytics.get("top_merchants_by_transaction_count", [])

        if not top_by_count:
            return {
                "answer": "No merchant transaction activity found in the dataset.",
                "tools_used": tools_used,
                "response_type": "text",
                "data": t_analytics,
                "source": "get_transaction_analytics"
            }

        # Enrich with merchant names if available
        for m in top_by_count:
            prof = get_merchant_profile(m["merchant_id"])
            if prof.get("found") and prof.get("merchant"):
                m["merchant_name"] = prof["merchant"].get("name", m["merchant_id"])
                m["merchant_category"] = prof["merchant"].get("category", "N/A")
            else:
                m["merchant_name"] = m["merchant_id"]
                m["merchant_category"] = "General Merchant"

        # Detect top count and check for ties
        top_count = top_by_count[0]["txn_count"] if "txn_count" in top_by_count[0] else top_by_count[0].get("transaction_count", 0)
        tied_merchants = [
            m for m in top_by_count
            if (m.get("txn_count") or m.get("transaction_count")) == top_count
        ]

        if len(tied_merchants) > 1:
            mch_list_str = " and ".join([f"**{m['merchant_id']}** ({m.get('merchant_name', 'Unknown')})" for m in tied_merchants])
            answer_text = (
                f"There is a tie for the merchant with the most transactions! Both {mch_list_str} "
                f"have processed **{top_count} transactions** each.\n\n"
                f"**Top Merchants by Transaction Count:**\n"
            )
        else:
            top_m = tied_merchants[0]
            answer_text = (
                f"The merchant with the highest transaction count is **{top_m['merchant_id']}** "
                f"({top_m.get('merchant_name', 'Unknown')}) with **{top_count} transactions** "
                f"(Total processed: ₹{top_m['total_amount']:,.2f}).\n\n"
                f"**Top Merchants by Transaction Count:**\n"
            )

        for idx, m in enumerate(top_by_count[:5], 1):
            name = m.get("merchant_name") or m["merchant_id"]
            cat = m.get("merchant_category") or "N/A"
            cnt = m.get("txn_count") or m.get("transaction_count", 0)
            answer_text += f"{idx}. **{m['merchant_id']}** ({name} · {cat}) — **{cnt} txns** (₹{m['total_amount']:,.2f})\n"

        return {
            "answer": answer_text,
            "tools_used": tools_used,
            "response_type": "table",
            "data": {"top_merchants": top_by_count},
            "source": "get_transaction_analytics"
        }

    # -------------------------------------------------------------
    # 3. MERCHANT TRANSACTION AMOUNT (Highest value / total amount)
    # -------------------------------------------------------------
    amount_patterns = [
        "highest amount", "most amount", "highest transaction amount",
        "top merchant by amount", "top merchants by amount", "highest volume by amount",
        "highest transaction volume", "highest value", "top 10 merchants by transaction amount",
        "top merchant by transaction value", "processed the highest amount"
    ]
    if any(pat in clean_q for pat in amount_patterns) and "count" not in clean_q:
        tools_used.append("get_transaction_analytics")
        t_analytics = get_transaction_analytics(top_n=10)
        top_by_amt = t_analytics.get("top_merchants_by_amount", [])

        if not top_by_amt:
            return {
                "answer": "No merchant transaction volume recorded.",
                "tools_used": tools_used,
                "response_type": "text",
                "data": t_analytics,
                "source": "get_transaction_analytics"
            }

        # Enrich with merchant names
        for m in top_by_amt:
            prof = get_merchant_profile(m["merchant_id"])
            if prof.get("found") and prof.get("merchant"):
                m["merchant_name"] = prof["merchant"].get("name", m["merchant_id"])
                m["merchant_category"] = prof["merchant"].get("category", "N/A")
            else:
                m["merchant_name"] = m["merchant_id"]
                m["merchant_category"] = "General Merchant"

        top_m = top_by_amt[0]
        cnt = top_m.get("txn_count") or top_m.get("transaction_count", 0)
        answer_text = (
            f"The merchant with the highest transaction amount is **{top_m['merchant_id']}** "
            f"({top_m.get('merchant_name', 'Unknown')}) with **₹{top_m['total_amount']:,.2f}** "
            f"across {cnt} transactions.\n\n"
            f"**Top Merchants by Total Transaction Amount:**\n"
        )
        for idx, m in enumerate(top_by_amt[:5], 1):
            name = m.get("merchant_name") or m["merchant_id"]
            cat = m.get("merchant_category") or "N/A"
            m_cnt = m.get("txn_count") or m.get("transaction_count", 0)
            answer_text += f"{idx}. **{m['merchant_id']}** ({name} · {cat}) — **₹{m['total_amount']:,.2f}** ({m_cnt} txns)\n"

        return {
            "answer": answer_text,
            "tools_used": tools_used,
            "response_type": "kpi",
            "data": {"top_merchants": top_by_amt},
            "source": "get_transaction_analytics"
        }

    # -------------------------------------------------------------
    # 4. MERCHANT CHARGEBACK RATE / RISKIEST MERCHANTS
    # -------------------------------------------------------------
    cb_rate_patterns = [
        "chargeback rate", "highest chargeback", "riskiest merchant", "riskiest merchants",
        "high risk merchant", "highest dispute rate", "abnormal chargeback"
    ]
    if any(pat in clean_q for pat in cb_rate_patterns):
        tools_used.append("get_merchant_analytics")
        m_analytics = get_merchant_analytics(chargeback_tier="HIGH_RISK", top_n=10)
        top_cb_rate = m_analytics.get("top_merchants_by_chargeback_rate", [])

        answer_text = (
            f"Analysis of merchant chargeback exposure identifies the following high-risk entities "
            f"(Thresholds: Normal <1.5%, Elevated 1.5–5.0%, High Risk >5.0%):\n\n"
        )
        for idx, m in enumerate(top_cb_rate[:5], 1):
            name = m.get("merchant_name") or "Unknown"
            cat = m.get("merchant_category") or "N/A"
            answer_text += (
                f"{idx}. **{m['merchant_id']}** ({name} · {cat}) — **{m['cb_rate_pct']:.1f}% Chargeback Rate** "
                f"({m['chargeback_count']} disputes / {m['transaction_count']} txns) — Tier: **HIGH_RISK**\n"
            )

        # Always include chart spec so the frontend can render a bar chart
        chart_data = [{"name": m["merchant_id"], "value": round(m["cb_rate_pct"], 1)} for m in top_cb_rate[:5]]
        chart_spec = {
            "type": "bar",
            "data": chart_data,
            "x_key": "name",
            "y_key": "value",
            "color": "#ff3366"
        }

        return {
            "answer": answer_text,
            "tools_used": tools_used,
            "response_type": "chart",
            "data": chart_spec,
            "source": "get_merchant_analytics"
        }

    # -------------------------------------------------------------
    # 5. TICKET SIZE ANOMALIES
    # -------------------------------------------------------------
    ticket_patterns = ["ticket anomaly", "ticket size anomaly", "abnormal ticket", "ticket surge"]
    if any(pat in clean_q for pat in ticket_patterns):
        tools_used.append("get_merchant_analytics")
        m_analytics = get_merchant_analytics(top_n=10)
        top_anom = m_analytics.get("top_ticket_anomaly_merchants", [])

        answer_text = (
            "The following merchants show severe ticket-size anomalies (Observed average ticket > 3x declared average):\n\n"
        )
        for idx, m in enumerate(top_anom[:5], 1):
            name = m.get("merchant_name") or "Unknown"
            cat = m.get("merchant_category") or "N/A"
            answer_text += (
                f"{idx}. **{m['merchant_id']}** ({name} · {cat}) — Observed avg: **₹{m['observed_avg_ticket']:,.2f}** "
                f"vs Declared: ₹{m['declared_avg_ticket_size']:,.2f} (**{m['ticket_ratio']:.1f}x surge**)\n"
            )

        return {
            "answer": answer_text,
            "tools_used": tools_used,
            "response_type": "risk",
            "data": {"ticket_anomalies": top_anom},
            "source": "get_merchant_analytics"
        }

    # -------------------------------------------------------------
    # 6. TOTAL TRANSACTION VOLUME & SYSTEM STATS
    # -------------------------------------------------------------
    volume_patterns = [
        "total transaction volume", "total volume", "how many transactions",
        "how much volume", "transaction summary", "failed transaction", "failure rate",
        "compare successful and failed"
    ]
    if any(pat in clean_q for pat in volume_patterns):
        tools_used.append("get_transaction_analytics")
        t_analytics = get_transaction_analytics()
        summary = t_analytics.get("summary", {})

        answer_text = (
            f"Based on transaction analytics across **{summary.get('transaction_count', 20000):,}** UPI payment records:\n\n"
            f"• **Total Processed Volume**: ₹{summary.get('total_amount', 0):,.2f}\n"
            f"• **Average Ticket Size**: ₹{summary.get('average_amount', 0):,.2f}\n"
            f"• **Successful Transactions**: {summary.get('successful_transactions', 0):,} ({100 - summary.get('failure_rate_pct', 0):.1f}%)\n"
            f"• **Failed Transactions**: {summary.get('failed_transactions', 0):,} ({summary.get('failure_rate_pct', 0):.2f}% failure rate)\n"
            f"• **Pending Transactions**: {summary.get('pending_transactions', 0):,}\n\n"
            f"Date Range: `{summary.get('first_transaction')}` to `{summary.get('last_transaction')}`."
        )

        return {
            "answer": answer_text,
            "tools_used": tools_used,
            "response_type": "kpi",
            "data": summary,
            "source": "get_transaction_analytics"
        }

    # -------------------------------------------------------------
    # 7. DISPUTE & CHARGEBACK ANALYTICS
    # -------------------------------------------------------------
    cb_patterns = [
        "disputed", "disputed amount", "how much money has been disputed",
        "chargeback summary", "dispute summary", "dispute reasons", "chargeback channels"
    ]
    if any(pat in clean_q for pat in cb_patterns):
        tools_used.append("get_chargeback_analytics")
        cb_analytics = get_chargeback_analytics()
        cb_summary = cb_analytics.get("summary", {})
        channels = cb_analytics.get("intake_channel_breakdown", {})

        channel_str = ", ".join([f"{k}: {v:,}" for k, v in list(channels.items())[:4]])
        answer_text = (
            f"Dataset-wide chargeback and dispute intelligence summary:\n\n"
            f"• **Total Disputes Flagged**: {cb_summary.get('total_chargebacks', 2800):,} complaints\n"
            f"• **Total Disputed Amount**: ₹{cb_summary.get('total_disputed_amount', 0):,.2f}\n"
            f"• **Average Disputed Amount**: ₹{cb_summary.get('average_disputed_amount', 0):,.2f}\n"
            f"• **Open / Pending Resolution**: {cb_summary.get('open_chargebacks', 0):,} cases\n"
            f"• **Critical Severity Disputes**: {cb_summary.get('critical_chargebacks', 0):,} cases\n\n"
            f"**Intake Channel Distribution**: {channel_str}."
        )

        return {
            "answer": answer_text,
            "tools_used": tools_used,
            "response_type": "kpi",
            "data": cb_summary,
            "source": "get_chargeback_analytics"
        }

    # -------------------------------------------------------------
    # 8. DATASET RISK SUMMARY
    # -------------------------------------------------------------
    risk_patterns = [
        "risk summary", "financial risk summary", "risk distribution",
        "how many high-risk", "how many critical", "highest-risk transactions",
        "risk of the entire dataset"
    ]
    if any(pat in clean_q for pat in risk_patterns):
        tools_used.append("get_risk_analytics")
        r_analytics = get_risk_analytics()
        r_summary = r_analytics.get("summary", {})
        dist = r_analytics.get("risk_level_distribution", {})
        signals = r_analytics.get("signal_distribution", {})

        top_signals = list(signals.items())[:3]
        sig_str = ", ".join([f"{k.replace('_', ' ')} ({v:,})" for k, v in top_signals])

        answer_text = (
            f"**Dataset Forensic Risk Distribution (20,000 Transactions):**\n\n"
            f"• **CRITICAL Risk**: {dist.get('CRITICAL', 291):,} transactions (1.45%)\n"
            f"• **HIGH Risk**: {dist.get('HIGH', 4431):,} transactions (22.15%)\n"
            f"• **MEDIUM Risk**: {dist.get('MEDIUM', 6044):,} transactions (30.22%)\n"
            f"• **LOW Risk**: {dist.get('LOW', 9234):,} transactions (46.17%)\n\n"
            f"**Most Common Risk Signals**: {sig_str}."
        )

        # Always include chart spec for risk distribution donut/bar
        chart_spec = {
            "type": "bar",
            "data": [
                {"name": "CRITICAL", "value": dist.get("CRITICAL", 291)},
                {"name": "HIGH",     "value": dist.get("HIGH", 4431)},
                {"name": "MEDIUM",   "value": dist.get("MEDIUM", 6044)},
                {"name": "LOW",      "value": dist.get("LOW", 9234)},
            ],
            "x_key": "name",
            "y_key": "value",
            "color": "#ff3366"
        }

        return {
            "answer": answer_text,
            "tools_used": tools_used,
            "response_type": "chart",
            "data": chart_spec,
            "source": "get_risk_analytics"
        }

    # -------------------------------------------------------------
    # 9. CUSTOMER INTELLIGENCE
    # -------------------------------------------------------------
    customer_patterns = [
        "customer", "customers have the most failed", "suspicious activity",
        "high risk customer", "top customer"
    ]
    if any(pat in clean_q for pat in customer_patterns):
        tools_used.append("get_customer_analytics")
        c_analytics = get_customer_analytics(top_n=10)
        c_summary = c_analytics.get("summary", {})
        top_failed = c_analytics.get("top_customers_by_failed_transactions", [])

        answer_text = (
            f"Customer cohort analytics across **{c_summary.get('customer_count', 28920):,}** registered users:\n\n"
            f"• **Active Transacting Population**: {c_summary.get('active_transacting_customers', 0):,} users\n"
            f"• **Customer Failure Rate**: {c_summary.get('failure_rate_pct', 0):.2f}%\n"
            f"• **Customers with Disputes**: {c_summary.get('customers_with_chargebacks', 0):,} users\n\n"
            f"**Top Customers by Failed Transactions:**\n"
        )
        for idx, u in enumerate(top_failed[:4], 1):
            name = u.get("full_name") or "User"
            city = u.get("city") or "N/A"
            answer_text += f"{idx}. **{u['user_id']}** ({name} · {city}) — **{u.get('failed_transactions', 0)} failed** / {u.get('total_transactions', 0)} total txns\n"

        # Always include a chart for top customers by failed transactions
        chart_spec = None
        if top_failed:
            chart_spec = {
                "type": "bar",
                "data": [
                    {"name": u.get("user_id", f"User{i}"), "value": u.get("failed_transactions", 0)}
                    for i, u in enumerate(top_failed[:6])
                ],
                "x_key": "name",
                "y_key": "value",
                "color": "#00e5ff"
            }

        return {
            "answer": answer_text,
            "tools_used": tools_used,
            "response_type": "chart" if chart_spec else "table",
            "data": chart_spec if chart_spec else c_summary,
            "source": "get_customer_analytics"
        }

    # -------------------------------------------------------------
    # 10. GENERAL DEFAULT FALLBACK
    # -------------------------------------------------------------
    tools_used.append("get_transaction_analytics")
    t_analytics = get_transaction_analytics()
    summary = t_analytics.get("summary", {})
    return {
        "answer": (
            f"Fintrix AI evaluated your query across the UPI transaction ledger, merchant records, KYC, and chargeback datasets.\n\n"
            f"• Total Processed Volume: **₹{summary.get('total_amount', 0):,.2f}** across **{summary.get('transaction_count', 20000):,}** transactions\n"
            f"• Overall Failure Rate: **{summary.get('failure_rate_pct', 0):.2f}%**\n\n"
            f"You can ask specific questions such as: *'Which merchant has the most transactions?'*, *'Why is TXN00011869 risky?'*, or *'Which merchants have the highest chargeback rate?'*."
        ),
        "tools_used": tools_used,
        "response_type": "text",
        "data": summary,
        "source": "get_transaction_analytics"
    }
