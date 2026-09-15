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

from app.agent.agent import create_fintrix_agent
from app.agent.config import HF_TOKEN, HF_MODEL_ID, HF_PROVIDER


def test_agent_introduction():
    """
    Phase 2 Verification Test:
    Prompt: 'Hello, introduce yourself as Fintrix AI.'
    """
    print("=" * 60)
    print("FINTRIX AI - PHASE 2 AGENT VERIFICATION TEST")
    print("=" * 60)
    print(f"Model ID: {HF_MODEL_ID}")
    print(f"Provider: {HF_PROVIDER}")
    print(f"HF_TOKEN Configured: {'[YES - Configured]' if HF_TOKEN else '[NO - Unset]'}")
    
    prompt = "Hello, introduce yourself as Fintrix AI."
    print(f"\nUser Prompt: \"{prompt}\"")
    print("-" * 60)

    if not HF_TOKEN:
        print("[INFO] HF_TOKEN is not set in fintrix_ai/.env.")
        print("[INFO] Please provide your Hugging Face API token in fintrix_ai/.env as:")
        print("       HF_TOKEN=hf_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx")
        print("\n[INFO] You can obtain a free token at https://huggingface.co/settings/tokens")
        print("=" * 60)
        return False
    
    try:
        # Create minimal agent (no tools required for introductory test)
        agent = create_fintrix_agent(tools=[])
        
        print("Calling Hugging Face Inference API via SmolAgents...")
        response = agent.run(prompt)
        
        print("\nAgent Response:")
        print("-" * 60)
        print(response)
        print("-" * 60)
        
        assert response is not None, "Agent returned None response"
        assert len(str(response).strip()) > 0, "Agent returned empty response"
        print("\n[SUCCESS] Phase 2 Test Passed: Fintrix AI Agent connected to Hugging Face and responded successfully!")
        return True

    except Exception as e:
        print(f"\n[ERROR] Agent Execution Error: {type(e).__name__}: {e}")
        return False


if __name__ == "__main__":
    success = test_agent_introduction()
    sys.exit(0 if success else 1)
