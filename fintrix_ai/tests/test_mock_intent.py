"""
Comprehensive Test Suite for Intent Routing, Deterministic Mock Fallback,
and Financial Intelligence Calculations (Task 12).
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
from app.services.mock_engine import resolve_deterministic_intent
from app.tools.analytics_tools import get_merchant_analytics, get_transaction_analytics
from app.tools.risk_tools import get_risk_score
from app.agent.config import FINTRIX_LLM_MODE, LLM_PROVIDER

app = create_app()
client = TestClient(app)


class TestIntentAndMockMode(unittest.TestCase):
    def setUp(self):
        session_manager.clear_all()

    def test_1_merchant_transaction_count_intent(self):
        """
        Test that queries asking for 'most transactions' or 'highest transaction count'
        correctly resolve by transaction COUNT and identify tied top merchants.
        """
        queries = [
            "which merchant has the most transactions",
            "which merchant have the most transactions",
            "who has the highest transaction count",
            "top merchants by transaction count",
            "which merchant processed the most transactions",
        ]
        for q in queries:
            res = resolve_deterministic_intent(q)
            self.assertEqual(res["source"], "get_transaction_analytics")
            self.assertIn("MCH6613", res["answer"])
            self.assertIn("MCH9029", res["answer"])
            self.assertIn("10 transactions", res["answer"])
            # Ensure it did NOT answer with total volume / amount metric
            self.assertNotIn("₹1,28,674.26", res["answer"].split("most transactions")[0])

    def test_2_merchant_transaction_amount_intent(self):
        """
        Test that queries asking for 'highest amount' or 'highest volume by value'
        resolve by total amount and find MCH6245.
        """
        queries = [
            "which merchant processed the highest amount",
            "top merchant by transaction value",
            "top merchants by amount",
        ]
        for q in queries:
            res = resolve_deterministic_intent(q)
            self.assertEqual(res["source"], "get_transaction_analytics")
            self.assertIn("MCH6245", res["answer"])
            self.assertIn("128,674.26", res["answer"])

    def test_3_tied_top_merchants_in_tool(self):
        """
        Verify deterministic tool calculations for tied merchants.
        """
        analytics = get_transaction_analytics(top_n=5)
        top_by_count = analytics.get("top_merchants_by_transaction_count", [])
        self.assertGreaterEqual(len(top_by_count), 2)
        m1 = top_by_count[0]
        m2 = top_by_count[1]
        self.assertEqual(m1["txn_count"], 10)
        self.assertEqual(m2["txn_count"], 10)
        self.assertSetEqual({m1["merchant_id"], m2["merchant_id"]}, {"MCH6613", "MCH9029"})

    def test_4_risk_investigation_intent(self):
        """
        Verify forensic risk investigation flow for TXN00011869.
        """
        res = resolve_deterministic_intent("Why is TXN00011869 risky?")
        self.assertEqual(res["source"], "get_risk_score")
        self.assertEqual(res["response_type"], "investigation")
        self.assertIn("TXN00011869", res["answer"])
        self.assertIn("RISK", res["answer"])
        self.assertIn("get_risk_score", res["tools_used"])

    def test_5_unknown_transaction(self):
        """
        Verify unknown transaction reference handling.
        """
        res = resolve_deterministic_intent("Investigate TXN99999999")
        self.assertEqual(res["source"], "get_risk_score")
        self.assertIn("not found", res["answer"].lower())

    def test_6_mock_mode_via_api(self):
        """
        Verify that POST /api/chat with mock mode executes deterministic tools
        and returns structured response with llm_mode='mock'.
        """
        with patch("app.api.routes.FINTRIX_LLM_MODE", "mock"):
            response = client.post("/api/chat", json={
                "message": "Which merchant has the most transactions?",
                "session_id": "test-mock-session"
            })
            self.assertEqual(response.status_code, 200)
            data = response.json()
            self.assertTrue(data["success"])
            self.assertEqual(data["llm_mode"], "mock")
            self.assertIn("MCH6613", data["answer"])
            self.assertIn("get_transaction_analytics", data["tools_used"])
            self.assertIn("latency_ms", data)
            self.assertIn("response_type", data)

    def test_7_hf_credit_exhaustion_auto_fallback(self):
        """
        Verify that in 'auto' mode, when HF LLM reports credit exhaustion / 402,
        the system seamlessly returns deterministic mock response without crashing.
        """
        with patch("app.api.routes.FINTRIX_LLM_MODE", "auto"):
            with patch("app.api.routes.run_guarded_agent", return_value="Error: Hugging Face inference provider monthly included credits depleted."):
                response = client.post("/api/chat", json={
                    "message": "Give me a financial risk summary of the entire dataset.",
                    "session_id": "test-auto-fallback"
                })
                self.assertEqual(response.status_code, 200)
                data = response.json()
                self.assertTrue(data["success"])
                self.assertEqual(data["llm_mode"], "mock")
                self.assertIn("CRITICAL", data["answer"])
                self.assertIn("get_risk_analytics", data["tools_used"])

    def test_8_api_response_schema_completeness(self):
        """
        Verify all required fields exist in ChatResponse model.
        """
        with patch("app.api.routes.FINTRIX_LLM_MODE", "mock"):
            response = client.post("/api/chat", json={
                "message": "What is the total transaction volume?",
                "session_id": "test-schema-completeness"
            })
            self.assertEqual(response.status_code, 200)
            data = response.json()
            for key in ["success", "session_id", "message", "answer", "response_type", "data", "tools_used", "source", "llm_mode", "latency_ms", "metadata"]:
                self.assertIn(key, data)


if __name__ == "__main__":
    unittest.main()
