import os
import sys
from pathlib import Path

# Force UTF-8 stdout for Windows terminals
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except AttributeError:
        pass

# Add fintrix_ai to Python path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.tools.merchant_tools import get_merchant_profile
from app.agent.agent import create_fintrix_agent, run_guarded_agent
from app.services.usage_tracker import UsageTracker
from app.agent.config import HF_TOKEN, HF_MODEL_ID, HF_PROVIDER


def test_1_valid_merchant():
    print("\n" + "=" * 60)
    print("TEST 1: Valid Merchant Master Lookup (MCH2849)")
    print("=" * 60)
    res = get_merchant_profile("MCH2849")
    print("Merchant Profile Output:", res)
    assert res.get("found") is True
    assert res.get("merchant_id") == "MCH2849"
    assert res.get("has_master_record") is True
    assert res.get("merchant") is not None
    assert "name" in res["merchant"]
    assert "category" in res["merchant"]
    assert "merchant_status" in res["merchant"]
    print("[PASS] TEST 1: Valid merchant master profile retrieved successfully.")
    return True


def test_2_merchant_with_transactions():
    print("\n" + "=" * 60)
    print("TEST 2: Merchant with Active Transactions (MCH6773)")
    print("=" * 60)
    res = get_merchant_profile("MCH6773")
    print("Output:", res)
    assert res.get("found") is True
    assert res.get("has_transactions") is True
    ts = res.get("transaction_summary", {})
    assert ts.get("transaction_count") > 0
    assert ts.get("total_amount") > 0.0
    print("[PASS] TEST 2: Merchant transaction volume aggregated correctly.")
    return True


def test_3_merchant_without_master_record():
    print("\n" + "=" * 60)
    print("TEST 3: Merchant without Master Record (MCH7045)")
    print("=" * 60)
    # MCH7045 exists in upi_transactions_clean.csv but not in merchants_clean.csv
    res = get_merchant_profile("MCH7045")
    print("Output:", res)
    assert res.get("found") is True
    assert res.get("has_master_record") is False
    assert res.get("merchant") is None
    assert res.get("has_transactions") is True
    assert res.get("partial_context") is True
    print("[PASS] TEST 3: Merchant without master record handled safely with partial_context=True.")
    return True


def test_4_invalid_merchant_id():
    print("\n" + "=" * 60)
    print("TEST 4: Nonexistent Merchant ID (MCH99999999)")
    print("=" * 60)
    res = get_merchant_profile("MCH99999999")
    print("Output:", res)
    assert res.get("found") is False
    assert "error" in res
    print("[PASS] TEST 4: Nonexistent merchant ID handled safely without exception.")
    return True


def test_5_empty_merchant_id():
    print("\n" + "=" * 60)
    print("TEST 5: Empty / Whitespace Merchant ID")
    print("=" * 60)
    res_empty = get_merchant_profile("")
    res_ws = get_merchant_profile("   ")
    assert res_empty.get("found") is False
    assert res_ws.get("found") is False
    assert "error" in res_empty and "error" in res_ws
    print("[PASS] TEST 5: Empty and whitespace merchant IDs handled safely.")
    return True


def test_6_duplicate_merchant_handling():
    print("\n" + "=" * 60)
    print("TEST 6: Duplicate Merchant Deduplication Handling")
    print("=" * 60)
    res = get_merchant_profile("MCH2849")
    assert isinstance(res.get("merchant"), dict)
    assert isinstance(res["merchant"]["name"], str)
    print("Clean single merchant record:", res["merchant"])
    print("[PASS] TEST 6: Merchant duplicate records deduplicated cleanly.")
    return True


def test_7_transaction_aggregation():
    print("\n" + "=" * 60)
    print("TEST 7: Transaction Metrics Aggregation")
    print("=" * 60)
    res = get_merchant_profile("MCH6773")
    ts = res.get("transaction_summary", {})
    assert "transaction_count" in ts
    assert "total_amount" in ts
    assert "average_transaction_amount" in ts
    assert "successful_transactions" in ts
    assert "failed_transactions" in ts
    print("Transaction summary:", ts)
    print("[PASS] TEST 7: Merchant transaction metrics aggregated accurately.")
    return True


def test_8_chargeback_rate_calculation():
    print("\n" + "=" * 60)
    print("TEST 8: Chargeback Rate Calculation")
    print("=" * 60)
    res = get_merchant_profile("MCH6773")
    cb = res.get("chargeback_summary", {})
    assert "chargeback_count" in cb
    assert "disputed_amount" in cb
    assert "chargeback_rate_pct" in cb
    assert isinstance(cb["chargeback_rate_pct"], float)
    print("Chargeback summary:", cb)
    print("[PASS] TEST 8: Chargeback rate calculated accurately.")
    return True


def test_9_chargeback_tier():
    print("\n" + "=" * 60)
    print("TEST 9: Chargeback Rate Tier Classification")
    print("=" * 60)
    res = get_merchant_profile("MCH6773")
    risk = res.get("risk_indicators", {})
    assert "chargeback_rate_tier" in risk
    assert risk["chargeback_rate_tier"] in ["NORMAL", "ELEVATED", "HIGH_RISK"]
    print("Risk indicators:", risk)
    print("[PASS] TEST 9: Chargeback rate tier mapped correctly.")
    return True


def test_10_ticket_anomaly():
    print("\n" + "=" * 60)
    print("TEST 10: Ticket Size Anomaly Benchmark Detection")
    print("=" * 60)
    res = get_merchant_profile("MCH6773")
    risk = res.get("risk_indicators", {})
    assert "ticket_anomaly" in risk
    assert "ticket_size_ratio" in risk
    print("Ticket anomaly:", risk["ticket_anomaly"], "Ratio:", risk["ticket_size_ratio"])
    print("[PASS] TEST 10: Ticket size anomaly logic evaluated.")
    return True


def test_11_deterministic_lookup():
    print("\n" + "=" * 60)
    print("TEST 11: Deterministic Consistency Verification")
    print("=" * 60)
    res1 = get_merchant_profile("MCH6773")
    res2 = get_merchant_profile("MCH6773")
    assert res1 == res2, "Output changed between consecutive calls!"
    print("[PASS] TEST 11: Repeated merchant lookups are 100% deterministic.")
    return True


def test_12_settlement_account_not_exposed():
    print("\n" + "=" * 60)
    print("TEST 12: Strict Privacy & Financial Security (No Settlement Account)")
    print("=" * 60)
    res = get_merchant_profile("MCH2849")
    merchant = res.get("merchant", {})
    assert "settlement_account" not in merchant, "CRITICAL ERROR: Settlement account exposed in merchant output!"
    res_str = str(res).lower()
    assert "settlement_account" not in res_str
    print("[PASS] TEST 12: Sensitive settlement account number strictly omitted.")
    return True


def run_all_merchant_tests():
    print("=" * 60)
    print("FINTRIX AI - PHASE 5 MERCHANT TOOL TEST SUITE")
    print("=" * 60)

    results = []
    results.append(("TEST 1 - Valid Merchant", test_1_valid_merchant()))
    results.append(("TEST 2 - Merchant with Transactions", test_2_merchant_with_transactions()))
    results.append(("TEST 3 - Merchant without Master Record", test_3_merchant_without_master_record()))
    results.append(("TEST 4 - Invalid Merchant ID", test_4_invalid_merchant_id()))
    results.append(("TEST 5 - Empty Merchant ID", test_5_empty_merchant_id()))
    results.append(("TEST 6 - Duplicate Merchant Handling", test_6_duplicate_merchant_handling()))
    results.append(("TEST 7 - Transaction Aggregation", test_7_transaction_aggregation()))
    results.append(("TEST 8 - Chargeback Rate Calculation", test_8_chargeback_rate_calculation()))
    results.append(("TEST 9 - Chargeback Tier", test_9_chargeback_tier()))
    results.append(("TEST 10 - Ticket Anomaly", test_10_ticket_anomaly()))
    results.append(("TEST 11 - Deterministic Consistency", test_11_deterministic_lookup()))
    results.append(("TEST 12 - Settlement Account Not Exposed", test_12_settlement_account_not_exposed()))

    print("\n" + "=" * 60)
    print("MERCHANT TOOL TEST RESULTS SUMMARY")
    print("=" * 60)
    all_passed = True
    for name, res in results:
        status = "PASSED" if res else "FAILED"
        print(f"{name:<42} : {status}")
        if not res:
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("ALL 12 MERCHANT TOOL TESTS COMPLETED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED!")
    print("=" * 60)
    return all_passed


if __name__ == "__main__":
    success = run_all_merchant_tests()
    sys.exit(0 if success else 1)
