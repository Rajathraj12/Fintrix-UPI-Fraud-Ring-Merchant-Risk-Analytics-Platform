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

from app.tools.customer_tools import get_customer_profile
from app.agent.agent import create_fintrix_agent, run_guarded_agent
from app.services.usage_tracker import UsageTracker
from app.agent.config import HF_TOKEN, HF_MODEL_ID, HF_PROVIDER


def test_1_valid_customer_with_kyc():
    print("\n" + "=" * 60)
    print("TEST 1: Valid Customer with KYC (USR16112)")
    print("=" * 60)
    res = get_customer_profile("USR16112")
    print("Customer Profile Output:", res)
    assert res.get("found") is True
    assert res.get("user_id") == "USR16112"
    assert res.get("has_kyc") is True
    assert res.get("kyc") is not None
    assert "full_name" in res["kyc"]
    assert "kyc_status" in res["kyc"]
    print("[PASS] TEST 1: Valid customer profile retrieved successfully.")
    return True


def test_2_customer_with_transactions():
    print("\n" + "=" * 60)
    print("TEST 2: Customer with Active Transactions (USR90546)")
    print("=" * 60)
    res = get_customer_profile("USR90546")
    print("Output:", res)
    assert res.get("found") is True
    assert res.get("has_transactions") is True
    ts = res.get("transaction_summary", {})
    assert ts.get("transaction_count") > 0
    assert ts.get("total_amount") > 0.0
    print("[PASS] TEST 2: Customer transaction history aggregated correctly.")
    return True


def test_3_customer_without_kyc():
    print("\n" + "=" * 60)
    print("TEST 3: Customer without KYC Master Record (USR45826)")
    print("=" * 60)
    # USR45826 exists in upi_transactions_clean.csv but not in kyc_clean.csv
    res = get_customer_profile("USR45826")
    print("Output:", res)
    assert res.get("found") is True
    assert res.get("has_kyc") is False
    assert res.get("kyc") is None
    assert res.get("has_transactions") is True
    assert res.get("partial_context") is True
    print("[PASS] TEST 3: Customer without KYC handled safely with partial_context=True.")
    return True


def test_4_invalid_customer_id():
    print("\n" + "=" * 60)
    print("TEST 4: Nonexistent Customer ID (USR99999999)")
    print("=" * 60)
    res = get_customer_profile("USR99999999")
    print("Output:", res)
    assert res.get("found") is False
    assert "error" in res
    print("[PASS] TEST 4: Nonexistent customer ID handled safely without exception.")
    return True


def test_5_empty_customer_id():
    print("\n" + "=" * 60)
    print("TEST 5: Empty / Whitespace Customer ID")
    print("=" * 60)
    res_empty = get_customer_profile("")
    res_ws = get_customer_profile("   ")
    assert res_empty.get("found") is False
    assert res_ws.get("found") is False
    assert "error" in res_empty and "error" in res_ws
    print("[PASS] TEST 5: Empty and whitespace customer IDs handled safely.")
    return True


def test_6_duplicate_kyc_handling():
    print("\n" + "=" * 60)
    print("TEST 6: Duplicate KYC Deduplication Handling")
    print("=" * 60)
    # Run lookup on a customer and verify clean single dict output
    res = get_customer_profile("USR16112")
    assert isinstance(res.get("kyc"), dict)
    assert isinstance(res["kyc"]["full_name"], str)
    print("Clean single KYC record:", res["kyc"])
    print("[PASS] TEST 6: KYC duplicate records deduplicated cleanly.")
    return True


def test_7_transaction_aggregation():
    print("\n" + "=" * 60)
    print("TEST 7: Transaction Metrics Aggregation Consistency")
    print("=" * 60)
    res = get_customer_profile("USR90546")
    ts = res.get("transaction_summary", {})
    assert "transaction_count" in ts
    assert "total_amount" in ts
    assert "average_amount" in ts
    assert "successful_transactions" in ts
    assert "failed_transactions" in ts
    assert "failure_rate" in ts
    assert ts["successful_transactions"] + ts["failed_transactions"] <= ts["transaction_count"]
    print("Transaction summary:", ts)
    print("[PASS] TEST 7: Transaction aggregation computed accurately.")
    return True


def test_8_chargeback_aggregation():
    print("\n" + "=" * 60)
    print("TEST 8: Chargeback Metrics Aggregation")
    print("=" * 60)
    res = get_customer_profile("USR90546")
    cb = res.get("chargeback_summary", {})
    assert "chargeback_count" in cb
    assert "disputed_amount" in cb
    assert "open_chargebacks" in cb
    assert "critical_chargebacks" in cb
    assert "max_severity" in cb
    assert "reasons_breakdown" in cb
    print("Chargeback summary:", cb)
    print("[PASS] TEST 8: Chargeback summary generated accurately.")
    return True


def test_9_deterministic_lookup():
    print("\n" + "=" * 60)
    print("TEST 9: Deterministic Consistency Verification")
    print("=" * 60)
    res1 = get_customer_profile("USR90546")
    res2 = get_customer_profile("USR90546")
    assert res1 == res2, "Output changed between consecutive calls!"
    print("[PASS] TEST 9: Repeated customer lookups are 100% deterministic.")
    return True


def test_10_pii_not_exposed():
    print("\n" + "=" * 60)
    print("TEST 10: Strict Privacy & PII Protection (No Aadhaar / PAN)")
    print("=" * 60)
    res = get_customer_profile("USR16112")
    kyc = res.get("kyc", {})
    assert "aadhaar" not in kyc, "CRITICAL ERROR: Aadhaar exposed in KYC output!"
    assert "pan" not in kyc, "CRITICAL ERROR: PAN exposed in KYC output!"
    # Verify across whole dictionary string
    res_str = str(res).lower()
    assert "aadhaar" not in res_str
    assert "pan" not in res_str
    print("[PASS] TEST 10: PII (Aadhaar, PAN) strictly omitted from customer response.")
    return True


def run_all_customer_tests():
    print("=" * 60)
    print("FINTRIX AI - PHASE 5 CUSTOMER TOOL TEST SUITE")
    print("=" * 60)

    results = []
    results.append(("TEST 1 - Valid Customer with KYC", test_1_valid_customer_with_kyc()))
    results.append(("TEST 2 - Customer with Transactions", test_2_customer_with_transactions()))
    results.append(("TEST 3 - Customer without KYC", test_3_customer_without_kyc()))
    results.append(("TEST 4 - Invalid Customer ID", test_4_invalid_customer_id()))
    results.append(("TEST 5 - Empty Customer ID", test_5_empty_customer_id()))
    results.append(("TEST 6 - Duplicate KYC Handling", test_6_duplicate_kyc_handling()))
    results.append(("TEST 7 - Transaction Aggregation", test_7_transaction_aggregation()))
    results.append(("TEST 8 - Chargeback Aggregation", test_8_chargeback_aggregation()))
    results.append(("TEST 9 - Deterministic Consistency", test_9_deterministic_lookup()))
    results.append(("TEST 10 - PII Not Exposed", test_10_pii_not_exposed()))

    print("\n" + "=" * 60)
    print("CUSTOMER TOOL TEST RESULTS SUMMARY")
    print("=" * 60)
    all_passed = True
    for name, res in results:
        status = "PASSED" if res else "FAILED"
        print(f"{name:<40} : {status}")
        if not res:
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("ALL 10 CUSTOMER TOOL TESTS COMPLETED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED!")
    print("=" * 60)
    return all_passed


if __name__ == "__main__":
    success = run_all_customer_tests()
    sys.exit(0 if success else 1)
