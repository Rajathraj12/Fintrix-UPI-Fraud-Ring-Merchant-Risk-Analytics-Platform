import os
from pathlib import Path
from dotenv import load_dotenv

# Base paths
FINTRIX_DIR = Path(__file__).resolve().parent.parent.parent
WORKSPACE_DIR = FINTRIX_DIR.parent

# Load .env from fintrix_ai/.env
env_path = FINTRIX_DIR / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

# LLM & Inference Settings — Ollama (local)
LLM_PROVIDER = os.getenv("LLM_PROVIDER", "ollama").strip().lower()
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3.2").strip()
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").strip()
FINTRIX_LLM_MODE = os.getenv("FINTRIX_LLM_MODE", "live").strip().lower()

# Usage & Cost Guard Settings
MAX_AGENT_REQUESTS_PER_SESSION = int(os.getenv("MAX_AGENT_REQUESTS_PER_SESSION", "50"))
MAX_OUTPUT_TOKENS = int(os.getenv("MAX_OUTPUT_TOKENS", "1500"))
MAX_CONTEXT_TOKENS = int(os.getenv("MAX_CONTEXT_TOKENS", "4000"))

# App Settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", "8000"))

# Data directory path
DATA_DIR = WORKSPACE_DIR / "data" / "processed"
if not DATA_DIR.exists():
    DATA_DIR = WORKSPACE_DIR / "dashboard" / "public" / "data"
