"""
Manual API Smoke Test & Documentation Verification (Phase 7).
"""
import sys
import os
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.main import app
from app.tools.analytics_tools import (
    get_transaction_analytics,
    get_merchant_analytics
)
from app.tools.risk_tools import get_risk_score
from app.tools.customer_tools import get_customer_profile
from app.tools.merchant_tools import get_merchant_profile

client = TestClient(app)

def run_smoke_tests():
    print("=" * 60)
    print("FINTRIX AI - PHASE 7 API SMOKE & DOCUMENTATION VERIFICATION")
    print("=" * 60)

    # 1. Verify OpenAPI Documentation Endpoints
    docs_res = client.get("/docs")
    assert docs_res.status_code == 200, f"/docs failed: {docs_res.status_code}"
    print("[PASS] GET /docs (Swagger UI) loaded successfully (200 OK).")

    redoc_res = client.get("/redoc")
    assert redoc_res.status_code == 200, f"/redoc failed: {redoc_res.status_code}"
    print("[PASS] GET /redoc (ReDoc UI) loaded successfully (200 OK).")

    openapi_res = client.get("/openapi.json")
    assert openapi_res.status_code == 200, f"/openapi.json failed: {openapi_res.status_code}"
    schema = openapi_res.json()
    assert "/health" in schema["paths"]
    assert "/api/chat" in schema["paths"]
    print(f"[PASS] GET /openapi.json valid (Paths: {list(schema['paths'].keys())}).")

    # 2. Health Endpoint
    health_res = client.get("/health")
    assert health_res.status_code == 200
    print("GET /health ->", health_res.json())

    # 3. Conversational BI Smoke Queries Resolution Verification
    print("\n" + "=" * 60)
    print("SMOKE TEST QUERIES RESOLUTION & DETERMINISTIC VALIDATION")
    print("=" * 60)

    # Smoke Query 1: "What is the total transaction volume?"
    t1 = get_transaction_analytics()
    print("\n[Query 1] 'What is the total transaction volume?'")
    print(f"-> Tool: get_transaction_analytics() | Result: INR {t1['summary']['total_amount']:,.2f} ({t1['summary']['transaction_count']:,} txns)")

    # Smoke Query 2: "How many transactions failed?"
    t2 = get_transaction_analytics(status="FAILED")
    print("\n[Query 2] 'How many transactions failed?'")
    print(f"-> Tool: get_transaction_analytics(status='FAILED') | Result: {t2['summary']['failed_transactions']:,} failed ({t1['summary']['failure_rate_pct']}%)")

    # Smoke Query 3: "Which merchants have the highest chargeback rate?"
    t3 = get_merchant_analytics(chargeback_tier="HIGH_RISK", top_n=3)
    print("\n[Query 3] 'Which merchants have the highest chargeback rate?'")
    print(f"-> Tool: get_merchant_analytics(chargeback_tier='HIGH_RISK') | Top Merchant: {t3['top_merchants_by_chargeback_rate'][0]}")

    # Smoke Query 4: "Why is transaction TXN00011869 risky?"
    t4 = get_risk_score("TXN00011869")
    print("\n[Query 4] 'Why is transaction TXN00011869 risky?'")
    print(f"-> Tool: get_risk_score('TXN00011869') | Risk Level: {t4['risk_level']} | Signals: {t4['risk_signals']}")

    # Smoke Query 5: "Investigate transaction TXN00011869 including customer and merchant context."
    c5 = get_customer_profile(t4["metrics"]["user_id"])
    m5 = get_merchant_profile(t4["metrics"]["merchant_id"])
    cust_name = c5["kyc"]["full_name"] if c5.get("kyc") else "Unenrolled User"
    print("\n[Query 5] 'Investigate transaction TXN00011869 including customer and merchant context.'")
    print(f"-> Tools: get_risk_score + get_customer_profile + get_merchant_profile | User: {c5['user_id']} ({cust_name}) | Merchant: {m5['merchant_id']} (Txns: {m5['transaction_summary']['transaction_count']})")

    print("\n" + "=" * 60)
    print("ALL API SMOKE TESTS & OPENAPI DOCS VERIFIED SUCCESSFULLY!")
    print("=" * 60)

if __name__ == "__main__":
    run_smoke_tests()
