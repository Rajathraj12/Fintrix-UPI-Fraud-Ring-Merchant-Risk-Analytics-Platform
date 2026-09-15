"""
Pydantic schemas for Fintrix AI REST API (Phase 7).
"""
import uuid
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field, field_validator


class ChatRequest(BaseModel):
    """
    Request model for conversational chat endpoint.
    """
    message: str = Field(
        ...,
        description="User query or financial intelligence prompt.",
        examples=["Which merchants have the highest chargeback rate?"]
    )
    session_id: Optional[str] = Field(
        default="default",
        description="Unique session identifier for in-memory context tracking.",
        examples=["demo-session-001"]
    )

    @field_validator("message")
    @classmethod
    def validate_message(cls, v: str) -> str:
        if not isinstance(v, str):
            raise ValueError("Message must be a string.")
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Message must not be empty or only whitespace.")
        if len(trimmed) > 4000:
            raise ValueError("Message exceeds maximum allowed length of 4,000 characters.")
        return trimmed

    @field_validator("session_id")
    @classmethod
    def validate_session_id(cls, v: Optional[str]) -> str:
        if v is None:
            return "default"
        if not isinstance(v, str):
            raise ValueError("session_id must be a string.")
        trimmed = v.strip()
        if not trimmed:
            return "default"
        if len(trimmed) > 128:
            raise ValueError("session_id exceeds maximum allowed length of 128 characters.")
        return trimmed


class ChatMetadata(BaseModel):
    """
    Operational metadata for chat processing.
    """
    tools_used: List[str] = Field(default_factory=list, description="List of tool names invoked during resolution.")
    processing_time_ms: int = Field(default=0, description="End-to-end request processing time in milliseconds.")
    request_id: Optional[str] = Field(default=None, description="Unique UUID for request correlation.")


class ChatResponse(BaseModel):
    """
    Standard successful response model for POST /api/chat.
    Provides structured intelligence payload, tool invocation list,
    response classification, and execution metadata.
    """
    success: bool = Field(default=True, description="Indicates successful request handling.")
    session_id: str = Field(..., description="Session ID matching the request.")
    message: str = Field(..., description="Echo of sanitized user query.")
    answer: str = Field(..., description="Deterministic natural language explanation.")
    response_type: str = Field(default="text", description="UI response rendering hint: 'text', 'kpi', 'risk', 'table', 'investigation'.")
    data: Optional[Dict[str, Any]] = Field(default=None, description="Structured data payload from deterministic tools for UI widgets.")
    tools_used: List[str] = Field(default_factory=list, description="List of tools invoked during query resolution.")
    source: str = Field(default="deterministic_tool", description="Origin source of the underlying financial calculation.")
    llm_mode: str = Field(default="live", description="LLM execution mode: 'live' (Hugging Face) or 'mock' (deterministic fallback).")
    latency_ms: int = Field(default=0, description="End-to-end request latency in milliseconds.")
    request_id: Optional[str] = Field(default=None, description="Unique correlation ID.")
    metadata: Dict[str, Any] = Field(
        default_factory=dict,
        description="Execution metadata including tools invoked and latency."
    )


class ErrorDetail(BaseModel):
    """
    Standardized error payload detail.
    """
    code: str = Field(..., description="Machine-readable error code (e.g. AGENT_ERROR, USAGE_LIMIT_REACHED).")
    message: str = Field(..., description="Human-readable safe explanation of the error.")


class ErrorResponse(BaseModel):
    """
    Standard error response model.
    """
    success: bool = Field(default=False, description="Indicates unsuccessful request handling.")
    error: ErrorDetail = Field(..., description="Error classification and description.")


class HealthResponse(BaseModel):
    """
    Response model for GET /health endpoint.
    """
    status: str = Field(default="ok", description="Service health indicator.")
    service: str = Field(default="fintrix-ai", description="Application service identifier.")
