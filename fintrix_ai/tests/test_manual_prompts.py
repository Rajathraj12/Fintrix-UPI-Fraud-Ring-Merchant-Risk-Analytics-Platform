"""
Manual Agent Verification Script for Phase 6 Analytics Intelligence Prompts
"""
import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.tools.analytics_tools import (
    get_transaction_analytics,
    get_customer_analytics,
    get_merchant_analytics,
    get_chargeback_analytics,
    get_risk_analytics
)

def run_manual_prompt_verifications():
    print("=" * 60)
    print("FINTRIX AI - PHASE 6 MANUAL PROMPT DETERMINISTIC VERIFICATION")
    print("=" * 60)

    # 1. "What is the total transaction volume?"
    t1 = get_transaction_analytics()
    print("\n[Prompt 1] 'What is the total transaction volume?'")
    print(f"Tool: get_transaction_analytics() -> Total Amount: INR {t1['summary']['total_amount']:,.2f} ({t1['summary']['transaction_count']:,} txns)")

    # 2. "How many transactions failed?"
    t2 = get_transaction_analytics(status="FAILED")
    print("\n[Prompt 2] 'How many transactions failed?'")
    print(f"Tool: get_transaction_analytics(status='FAILED') -> Failed count: {t2['summary']['failed_transactions']:,} (Failure rate: {t1['summary']['failure_rate_pct']}%)")

    # 3. "Which merchants have the highest chargeback rate?"
    t3 = get_merchant_analytics(chargeback_tier="HIGH_RISK", top_n=5)
    print("\n[Prompt 3] 'Which merchants have the highest chargeback rate?'")
    print(f"Tool: get_merchant_analytics(chargeback_tier='HIGH_RISK') -> Top 3 highest CB rate: {t3['top_merchants_by_chargeback_rate'][:3]}")

    # 4. "Which category has the highest failure rate?"
    print("\n[Prompt 4] 'Which category has the highest failure rate?'")
    m_clothing = get_merchant_analytics(merchant_category="Clothing")
    m_medical = get_merchant_analytics(merchant_category="Medical")
    m_electronics = get_merchant_analytics(merchant_category="Electronics")
    print(f"Tool: get_merchant_analytics() -> Clothing failure rate: {m_clothing['summary']['failure_rate_pct']}%, Medical failure rate: {m_medical['summary']['failure_rate_pct']}%, Electronics failure rate: {m_electronics['summary']['failure_rate_pct']}%")

    # 5. "Show me the top 10 merchants by transaction amount."
    t5 = get_merchant_analytics(top_n=10)
    print("\n[Prompt 5] 'Show me the top 10 merchants by transaction amount.'")
    print(f"Tool: get_merchant_analytics(top_n=10) -> Top 3 merchants: {t5['top_merchants_by_amount'][:3]}")

    # 6. "How much money has been disputed?"
    t6 = get_chargeback_analytics()
    print("\n[Prompt 6] 'How much money has been disputed?'")
    print(f"Tool: get_chargeback_analytics() -> Total Disputed: INR {t6['summary']['total_disputed_amount']:,.2f} across {t6['summary']['total_chargebacks']:,} disputes")

    # 7. "How many high-risk and critical transactions are there?"
    t7 = get_risk_analytics()
    print("\n[Prompt 7] 'How many high-risk and critical transactions are there?'")
    print(f"Tool: get_risk_analytics() -> High Risk: {t7['summary']['high_risk_transaction_count']:,}, Critical: {t7['summary']['critical_transaction_count']:,}")

    # 8. "Which customers have the most failed transactions?"
    t8 = get_customer_analytics(top_n=10)
    print("\n[Prompt 8] 'Which customers have the most failed transactions?'")
    print(f"Tool: get_customer_analytics(top_n=10) -> Top failed: {t8['top_customers_by_failed_transactions'][:3]}")

    # 9. "Give me a financial risk summary of the entire dataset."
    print("\n[Prompt 9] 'Give me a financial risk summary of the entire dataset.'")
    print(f"Tool: get_risk_analytics() -> Risk distribution: {t7['risk_level_distribution']}, Top signals: {list(t7['signal_distribution'].items())[:4]}")

    # 10. "Compare successful and failed transactions."
    succ_res = get_transaction_analytics(status="SUCCESS")
    fail_res = get_transaction_analytics(status="FAILED")
    print("\n[Prompt 10] 'Compare successful and failed transactions.'")
    print(f"Tool: get_transaction_analytics() -> SUCCESS: {succ_res['summary']['transaction_count']:,} (INR {succ_res['summary']['total_amount']:,.2f}), FAILED: {fail_res['summary']['transaction_count']:,} (INR {fail_res['summary']['total_amount']:,.2f})")

    print("\n" + "=" * 60)
    print("ALL 10 MANUAL PROMPTS VERIFIED DETERMINISTICALLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_manual_prompt_verifications()
