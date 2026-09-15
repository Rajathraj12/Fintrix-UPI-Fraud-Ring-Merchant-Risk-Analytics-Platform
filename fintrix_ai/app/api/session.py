"""
In-memory session state manager for Fintrix AI REST API (Phase 7).
Maintains per-session conversation turns and isolated UsageTrackers.
Designed modularly to be easily swapped with Firebase/Redis in later phases.
"""
import time
from typing import Dict, List, Optional
from ..services.usage_tracker import UsageTracker
from ..agent.config import MAX_AGENT_REQUESTS_PER_SESSION


class SessionState:
    """
    Encapsulates state for a single user/client conversation session.
    """
    def __init__(self, session_id: str, max_requests: Optional[int] = None):
        self.session_id: str = session_id
        self.history: List[Dict[str, str]] = []
        self.tracker: UsageTracker = UsageTracker(
            max_requests=max_requests or MAX_AGENT_REQUESTS_PER_SESSION
        )
        self.created_at: float = time.time()
        self.last_activity: float = time.time()

    def add_message(self, role: str, content: str):
        """Append a message turn to session history."""
        self.history.append({"role": role, "content": content})
        self.last_activity = time.time()
        # Keep maximum 20 message entries (10 turns) in memory to prevent context explosion
        if len(self.history) > 20:
            self.history = self.history[-20:]

    def get_recent_turns(self, max_turns: int = 3) -> List[Dict[str, str]]:
        """Retrieve the last N turns (up to 2 * max_turns messages)."""
        num_messages = max_turns * 2
        return self.history[-num_messages:] if len(self.history) > num_messages else list(self.history)


class SessionManager:
    """
    Thread-safe in-memory registry of active client sessions.
    """
    def __init__(self):
        self._sessions: Dict[str, SessionState] = {}

    def get_or_create(self, session_id: str) -> SessionState:
        """Retrieve existing session or instantiate a new one."""
        sid = (session_id or "default").strip()
        if sid not in self._sessions:
            self._sessions[sid] = SessionState(session_id=sid)
        return self._sessions[sid]

    def add_interaction(self, session_id: str, user_message: str, assistant_answer: str):
        """Record a completed conversational turn."""
        session = self.get_or_create(session_id)
        session.add_message("user", user_message)
        session.add_message("assistant", assistant_answer)

    def build_prompt_with_history(self, session_id: str, new_message: str, max_turns: int = 3) -> str:
        """
        Synthesize multi-turn context into the prompt while keeping token overhead controlled.
        """
        session = self.get_or_create(session_id)
        recent_history = session.get_recent_turns(max_turns=max_turns)

        if not recent_history:
            return new_message

        # Format previous turns cleanly
        context_blocks = []
        for msg in recent_history:
            role_label = "User" if msg["role"] == "user" else "Fintrix AI"
            # Truncate prior answers in context to prevent ballooning prompt
            content = msg["content"]
            if len(content) > 300:
                content = content[:300] + "..."
            context_blocks.append(f"{role_label}: {content}")

        history_str = "\n".join(context_blocks)
        return (
            f"Conversation History:\n{history_str}\n\n"
            f"Current User Query: {new_message}"
        )

    def reset_session(self, session_id: str):
        """Reset history and usage tracker for a specific session."""
        sid = (session_id or "default").strip()
        if sid in self._sessions:
            del self._sessions[sid]

    def clear_all(self):
        """Clear all in-memory sessions."""
        self._sessions.clear()


# Global in-memory session manager singleton
session_manager = SessionManager()
