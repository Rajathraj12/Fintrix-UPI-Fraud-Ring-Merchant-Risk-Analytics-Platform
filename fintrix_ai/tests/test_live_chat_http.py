"""
Live Backend Verification Script for Phase 7 FastAPI REST API
Tests all queries over HTTP POST http://127.0.0.1:8000/api/chat
"""
import urllib.request
import json
import time

URL = "http://127.0.0.1:8000/api/chat"

def query_backend(message, session_id):
    payload = json.dumps({"message": message, "session_id": session_id}).encode("utf-8")
    req = urllib.request.Request(
        URL,
        data=payload,
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST"
    )
    start = time.time()
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            elapsed = int((time.time() - start) * 1000)
            data = json.loads(resp.read().decode("utf-8"))
            return resp.status, data, elapsed
    except urllib.error.HTTPError as e:
        elapsed = int((time.time() - start) * 1000)
        data = json.loads(e.read().decode("utf-8"))
        return e.code, data, elapsed
    except Exception as e:
        return 0, {"error": str(e)}, 0

def test_live_queries():
    print("=" * 60)
    print("LIVE FASTAPI HTTP /api/chat ENDPOINT VERIFICATION")
    print("=" * 60)

    # 1. Health check
    with urllib.request.urlopen("http://127.0.0.1:8000/health") as resp:
        h_data = json.loads(resp.read().decode("utf-8"))
        print(f"GET /health -> HTTP {resp.status} : {h_data}")
        assert h_data.get("status") == "ok"

    test_questions = [
        ("which merchant have the most transactions", "mch-count-1"),
        ("Which merchant has the most transactions?", "mch-count-2"),
        ("Who has the highest transaction count?", "mch-count-3"),
        ("Which merchant processes the most transactions?", "mch-count-4"),
        ("Show me the merchant with the highest transaction volume by count.", "mch-count-5"),
        ("What is the total transaction volume?", "volume-1"),
        ("Which merchants have the highest chargeback rate?", "cb-rate-1"),
        ("Why is TXN00011869 risky?", "risk-1"),
    ]

    for q, sid in test_questions:
        print("\n" + "-" * 60)
        print(f"Query: \"{q}\" (Session: {sid})")
        status, res, elapsed = query_backend(q, session_id=sid)
        print(f"HTTP Status: {status} ({elapsed}ms)")
        print(f"Success: {res.get('success')}")
        ans = (res.get('answer') or '').encode('ascii', errors='replace').decode('ascii')
        print(f"Answer:\n{ans}")
        if res.get("metadata"):
            print(f"Tools Used: {res.get('metadata', {}).get('tools_used')}")
        if not res.get("success"):
            print(f"Error Detail: {res.get('error')}")

if __name__ == "__main__":
    test_live_queries()
