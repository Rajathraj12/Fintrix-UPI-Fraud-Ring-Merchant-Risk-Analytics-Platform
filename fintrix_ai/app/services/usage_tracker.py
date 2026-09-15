from typing import Dict, Any, Optional
import os


class UsageTracker:
    """
    Lightweight, in-memory application-level usage and cost guard tracker.
    Tracks session request count, token usage, and enforces rate/context limits.
    """
    def __init__(self, max_requests: Optional[int] = None, max_context_tokens: Optional[int] = None):
        if max_requests is not None:
            self.max_requests = max_requests
        else:
            self.max_requests = int(os.getenv("MAX_AGENT_REQUESTS_PER_SESSION", "20"))

        if max_context_tokens is not None:
            self.max_context_tokens = max_context_tokens
        else:
            self.max_context_tokens = int(os.getenv("MAX_CONTEXT_TOKENS", "4000"))

        self.request_count: int = 0
        self.input_tokens: int = 0
        self.output_tokens: int = 0
        self.total_tokens: int = 0

    def can_make_request(self) -> bool:
        """Check if request count is strictly within the allowed session limit."""
        return self.request_count < self.max_requests

    def validate_context_length(self, text: str) -> bool:
        """
        Conservative lightweight character-based approximation of token count.
        Rule of thumb: ~3.5 to 4 characters per token in English financial text.
        """
        if not text:
            return True
        estimated_tokens = len(text) / 3.5
        return estimated_tokens <= self.max_context_tokens

    def record_usage(self, input_tokens: int = 0, output_tokens: int = 0):
        """Record model token usage and increment request count."""
        self.request_count += 1
        self.input_tokens += max(0, input_tokens)
        self.output_tokens += max(0, output_tokens)
        self.total_tokens = self.input_tokens + self.output_tokens

    def get_summary(self) -> Dict[str, Any]:
        """Return a structured dictionary snapshot of current session usage."""
        return {
            "request_count": self.request_count,
            "max_requests": self.max_requests,
            "input_tokens": self.input_tokens,
            "output_tokens": self.output_tokens,
            "total_tokens": self.total_tokens,
            "limit_reached": not self.can_make_request(),
        }

    def reset(self):
        """Reset session counters."""
        self.request_count = 0
        self.input_tokens = 0
        self.output_tokens = 0
        self.total_tokens = 0


# Global default session tracker instance
global_usage_tracker = UsageTracker()
