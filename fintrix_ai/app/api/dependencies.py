"""
FastAPI dependency injection providers for Fintrix AI API (Phase 7).
"""
import logging
from functools import lru_cache
from .session import session_manager, SessionManager
from ..agent.agent import create_fintrix_agent

logger = logging.getLogger("fintrix_ai.api")


def get_session_manager() -> SessionManager:
    """Dependency provider for the in-memory session manager."""
    return session_manager


@lru_cache(maxsize=1)
def get_shared_agent():
    """
    Cached instance of the Fintrix AI agent to avoid recreating tool structures on every request.
    The agent is thread-safe for inference calls as tool executions are stateless.
    """
    logger.info("Initializing shared Fintrix AI Agent instance for REST API...")
    return create_fintrix_agent()
