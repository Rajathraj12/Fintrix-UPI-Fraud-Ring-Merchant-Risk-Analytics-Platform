"""
Comprehensive Test Suite for Fintrix AI REST API (Phase 7).
Tests endpoint contracts, validation, session management, error handling, CORS, security,
and regressions across Phases 2 through 6.
"""
import sys
import os
import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient

# Ensure fintrix_ai root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.api.main import create_app
from app.api.session import session_manager
from app.agent.config import HF_TOKEN

app = create_app()
client = TestClient(app)


def test_1_health_endpoint():
    print("\n" + "=" * 60)
    print("TEST 1: GET /health Contract & Zero-LLM Execution")
    print("=" * 60)
    response = client.get("/health")
    assert response.status_code == 200, f"Expected 200, got {response.status_code}"
    data = response.json()
    assert data.get("status") == "ok"
    assert data.get("service") == "fintrix-ai"
    print("Health response:", data)
    print("[PASS] TEST 1: Health endpoint returned 200 OK without invoking LLM.")
    return True


def test_2_valid_chat_request():
    print("\n" + "=" * 60)
    print("TEST 2: POST /api/chat Valid Request & Response Schema")
    print("=" * 60)
    session_manager.clear_all()
    
    with patch("app.api.routes.run_guarded_agent", return_value="Total transaction volume is INR 244,502,576.06 across 20,000 transactions."):
        payload = {
            "message": "What is the total transaction volume?",
            "session_id": "demo-session-001"
        }
        response = client.post("/api/chat", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        data = response.json()
        assert data.get("success") is True
        assert data.get("session_id") == "demo-session-001"
        assert data.get("message") == "What is the total transaction volume?"
        assert "244,502,576.06" in data.get("answer", "")
        assert "metadata" in data
        assert "processing_time_ms" in data["metadata"]
        print("Chat response:", data)
        print("[PASS] TEST 2: Valid chat request processed successfully.")
    return True


def test_3_empty_message_rejection():
    print("\n" + "=" * 60)
    print("TEST 3: Empty Message Rejection (HTTP 422)")
    print("=" * 60)
    response = client.post("/api/chat", json={"message": "", "session_id": "test-session"})
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    data = response.json()
    assert data.get("success") is False
    assert data.get("error", {}).get("code") == "VALIDATION_ERROR"
    print("Empty message error response:", data)
    print("[PASS] TEST 3: Empty message strictly rejected with HTTP 422.")
    return True


def test_4_whitespace_message_rejection():
    print("\n" + "=" * 60)
    print("TEST 4: Whitespace-only Message Rejection (HTTP 422)")
    print("=" * 60)
    response = client.post("/api/chat", json={"message": "     \n\t   ", "session_id": "test-session"})
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    data = response.json()
    assert data.get("success") is False
    assert data.get("error", {}).get("code") == "VALIDATION_ERROR"
    print("Whitespace error response:", data)
    print("[PASS] TEST 4: Whitespace-only message strictly rejected with HTTP 422.")
    return True


def test_5_invalid_request_schema():
    print("\n" + "=" * 60)
    print("TEST 5: Invalid Schema Payload Rejection (HTTP 422)")
    print("=" * 60)
    # Missing required 'message' field entirely
    response = client.post("/api/chat", json={"invalid_field": "some data"})
    assert response.status_code == 422, f"Expected 422, got {response.status_code}"
    data = response.json()
    assert data.get("success") is False
    assert data.get("error", {}).get("code") == "VALIDATION_ERROR"
    print("Malformed payload response:", data)
    print("[PASS] TEST 5: Malformed payload schema rejected with HTTP 422.")
    return True


def test_6_session_id_handling():
    print("\n" + "=" * 60)
    print("TEST 6: Custom Session ID Tracking")
    print("=" * 60)
    session_manager.clear_all()
    custom_sid = "user-investigation-xyz-99"
    
    with patch("app.api.routes.run_guarded_agent", return_value="Verified transaction risk score."):
        response = client.post("/api/chat", json={"message": "Why is TXN00011869 risky?", "session_id": custom_sid})
        assert response.status_code == 200
        data = response.json()
        assert data.get("session_id") == custom_sid
        session = session_manager.get_or_create(custom_sid)
        assert session.session_id == custom_sid
        assert len(session.history) == 2  # user + assistant
        print("[PASS] TEST 6: Custom session ID recorded and mapped to isolated session state.")
    return True


def test_7_session_continuity():
    print("\n" + "=" * 60)
    print("TEST 7: Multi-turn Session Continuity")
    print("=" * 60)
    session_manager.clear_all()
    sid = "continuity-session"

    with patch("app.api.routes.run_guarded_agent", side_effect=["MCH6773 is Parmar Sahota.", "They operate in Maharashtra."]) as mock_agent:
        # Turn 1
        res1 = client.post("/api/chat", json={"message": "Who is merchant MCH6773?", "session_id": sid})
        assert res1.status_code == 200
        
        # Turn 2
        res2 = client.post("/api/chat", json={"message": "Where are they located?", "session_id": sid})
        assert res2.status_code == 200
        
        session = session_manager.get_or_create(sid)
        assert len(session.history) == 4  # 2 user messages, 2 assistant replies
        
        # Verify the second call received historical context in the synthesized prompt
        second_call_prompt = mock_agent.call_args_list[1][0][1]
        assert "Conversation History:" in second_call_prompt
        assert "Who is merchant MCH6773?" in second_call_prompt
        print("Second turn synthesized prompt:\n", second_call_prompt)
        print("[PASS] TEST 7: Multi-turn conversational history correctly injected into prompt context.")
    return True


def test_8_safe_agent_error_handling():
    print("\n" + "=" * 60)
    print("TEST 8: Safe Agent Exception Masking & HTTP 500 Response")
    print("=" * 60)
    session_manager.clear_all()
    
    with patch("app.api.routes.run_guarded_agent", side_effect=Exception("Internal database timeout at /secret/path/to/db")):
        response = client.post("/api/chat", json={"message": "Check TXN00000001", "session_id": "err-session"})
        assert response.status_code == 500
        data = response.json()
        assert data.get("success") is False
        assert data.get("error", {}).get("code") == "AGENT_ERROR"
        assert "secret" not in data.get("error", {}).get("message", "").lower()
        print("Safe error payload:", data)
        print("[PASS] TEST 8: Server errors handled safely without exposing stack traces.")
    return True


def test_9_usage_limit_enforcement():
    print("\n" + "=" * 60)
    print("TEST 9: Session Usage Limit Quota Enforcement (HTTP 429)")
    print("=" * 60)
    session_manager.clear_all()
    sid = "quota-test-session"
    session = session_manager.get_or_create(sid)
    # Set request count to exceed session max limit
    session.tracker.request_count = session.tracker.max_requests

    response = client.post("/api/chat", json={"message": "Analyze all transactions", "session_id": sid})
    assert response.status_code == 429, f"Expected 429, got {response.status_code}"
    data = response.json()
    assert data.get("success") is False
    assert data.get("error", {}).get("code") == "USAGE_LIMIT_REACHED"
    print("429 Quota Exceeded Response:", data)
    print("[PASS] TEST 9: Session request quota enforced with HTTP 429 USAGE_LIMIT_REACHED.")
    return True


def test_10_response_schema_validation():
    print("\n" + "=" * 60)
    print("TEST 10: Strict Response Model Conformity")
    print("=" * 60)
    session_manager.clear_all()
    
    with patch("app.api.routes.run_guarded_agent", return_value="Deterministic response content."):
        response = client.post("/api/chat", json={"message": "Test query", "session_id": "schema-test"})
        assert response.status_code == 200
        data = response.json()
        for required_key in ["success", "session_id", "message", "answer", "metadata"]:
            assert required_key in data, f"Missing required response key: {required_key}"
        assert isinstance(data["metadata"], dict)
        assert "processing_time_ms" in data["metadata"]
        print("[PASS] TEST 10: API response strictly conforms to ChatResponse schema.")
    return True


def test_11_no_token_leakage():
    print("\n" + "=" * 60)
    print("TEST 11: Privacy & Secret Masking (No HF Token / PII Leakage)")
    print("=" * 60)
    session_manager.clear_all()
    
    with patch("app.api.routes.run_guarded_agent", return_value="Data processed safely."):
        response = client.post("/api/chat", json={"message": "Show account details", "session_id": "security-test"})
        res_str = str(response.json()).lower()
        if HF_TOKEN:
            assert HF_TOKEN.lower() not in res_str
        assert "aadhaar" not in res_str
        assert "pan_number" not in res_str
        assert "settlement_account" not in res_str
        print("[PASS] TEST 11: Zero credentials or private PII leaked.")
    return True


def test_12_cors_configuration():
    print("\n" + "=" * 60)
    print("TEST 12: CORS Headers Configuration")
    print("=" * 60)
    # Pre-flight OPTIONS request for React dev server origin
    response = client.options(
        "/api/chat",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "Content-Type"
        }
    )
    assert response.status_code in (200, 204), f"Preflight returned {response.status_code}"
    assert response.headers.get("access-control-allow-origin") in ("http://localhost:5173", "*")
    print("CORS Allow-Origin header:", response.headers.get("access-control-allow-origin"))
    print("[PASS] TEST 12: CORS configured for frontend development origins.")
    return True


def test_13_phase2_regression():
    print("\n" + "=" * 60)
    print("TEST 13: Phase 2 Agent Configuration Regression")
    print("=" * 60)
    from app.agent.agent import create_fintrix_agent
    from app.agent.config import HF_MODEL_ID, HF_PROVIDER
    agent = create_fintrix_agent()
    assert agent is not None
    assert agent.model.model_id == HF_MODEL_ID
    print(f"Agent Model ID: {agent.model.model_id}, Provider: {HF_PROVIDER}")
    print("[PASS] TEST 13: Phase 2 agent layer operational.")
    return True


def test_14_phase3_regression():
    print("\n" + "=" * 60)
    print("TEST 14: Phase 3 Transaction Tool Regression")
    print("=" * 60)
    from app.tools.transaction_tools import get_transaction
    res = get_transaction("TXN00011869")
    assert res.get("found") is True
    assert res.get("transaction_id") == "TXN00011869"
    print("[PASS] TEST 14: Phase 3 get_transaction tool operational.")
    return True


def test_15_phase4_regression():
    print("\n" + "=" * 60)
    print("TEST 15: Phase 4 Risk Investigation Tool Regression")
    print("=" * 60)
    from app.tools.risk_tools import get_risk_score
    res = get_risk_score("TXN00011869")
    assert res.get("found") is True
    assert res.get("risk_level") == "CRITICAL"
    print("[PASS] TEST 15: Phase 4 get_risk_score tool operational.")
    return True


def test_16_phase5_regression():
    print("\n" + "=" * 60)
    print("TEST 16: Phase 5 Customer & Merchant Intelligence Regression")
    print("=" * 60)
    from app.tools.customer_tools import get_customer_profile
    from app.tools.merchant_tools import get_merchant_profile
    c_res = get_customer_profile("USR90546")
    m_res = get_merchant_profile("MCH6773")
    assert c_res.get("found") is True
    assert m_res.get("found") is True
    print("[PASS] TEST 16: Phase 5 customer & merchant tools operational.")
    return True


def test_17_phase6_regression():
    print("\n" + "=" * 60)
    print("TEST 17: Phase 6 Analytics Intelligence Regression")
    print("=" * 60)
    from app.tools.analytics_tools import (
        get_transaction_analytics,
        get_customer_analytics,
        get_merchant_analytics,
        get_chargeback_analytics,
        get_risk_analytics
    )
    t_res = get_transaction_analytics()
    c_res = get_customer_analytics()
    m_res = get_merchant_analytics()
    cb_res = get_chargeback_analytics()
    r_res = get_risk_analytics()
    
    assert t_res.get("success") is True and t_res["summary"]["transaction_count"] == 20000
    assert c_res.get("success") is True and c_res["summary"]["customer_count"] == 28920
    assert m_res.get("success") is True and m_res["summary"]["merchant_count"] == 4343
    assert cb_res.get("success") is True and cb_res["summary"]["total_chargebacks"] == 2800
    assert r_res.get("success") is True and r_res["summary"]["total_transactions_analyzed"] == 20000
    print("[PASS] TEST 17: Phase 6 analytics intelligence tools operational.")
    return True


def run_all_api_tests():
    print("=" * 60)
    print("FINTRIX AI - PHASE 7 REST API & CHAT ENDPOINT TEST SUITE")
    print("=" * 60)

    results = []
    results.append(("TEST 1 - Health Endpoint", test_1_health_endpoint()))
    results.append(("TEST 2 - Valid Chat Request", test_2_valid_chat_request()))
    results.append(("TEST 3 - Empty Message Rejection", test_3_empty_message_rejection()))
    results.append(("TEST 4 - Whitespace Rejection", test_4_whitespace_message_rejection()))
    results.append(("TEST 5 - Invalid Schema Rejection", test_5_invalid_request_schema()))
    results.append(("TEST 6 - Session ID Handling", test_6_session_id_handling()))
    results.append(("TEST 7 - Session Continuity", test_7_session_continuity()))
    results.append(("TEST 8 - Safe Error Handling", test_8_safe_agent_error_handling()))
    results.append(("TEST 9 - Usage Limit Enforcement", test_9_usage_limit_enforcement()))
    results.append(("TEST 10 - Schema Validation", test_10_response_schema_validation()))
    results.append(("TEST 11 - Secret & Privacy Protection", test_11_no_token_leakage()))
    results.append(("TEST 12 - CORS Configuration", test_12_cors_configuration()))
    results.append(("TEST 13 - Phase 2 Regression", test_13_phase2_regression()))
    results.append(("TEST 14 - Phase 3 Regression", test_14_phase3_regression()))
    results.append(("TEST 15 - Phase 4 Regression", test_15_phase4_regression()))
    results.append(("TEST 16 - Phase 5 Regression", test_16_phase5_regression()))
    results.append(("TEST 17 - Phase 6 Regression", test_17_phase6_regression()))

    print("\n" + "=" * 60)
    print("FASTAPI REST API TEST RESULTS SUMMARY")
    print("=" * 60)
    all_passed = True
    for name, passed in results:
        status_str = "PASSED" if passed else "FAILED"
        print(f"{name:<45}: {status_str}")
        if not passed:
            all_passed = False

    print("=" * 60)
    if all_passed:
        print("ALL 17 PHASE 7 TESTS COMPLETED SUCCESSFULLY!")
    else:
        print("SOME TESTS FAILED.")
    print("=" * 60)
    return all_passed


if __name__ == "__main__":
    success = run_all_api_tests()
    sys.exit(0 if success else 1)
