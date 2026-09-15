from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., description="User query message", example="Which merchants have the highest chargeback rate?")
    conversation_id: Optional[str] = Field(None, description="Optional session tracking ID")


class ChatResponse(BaseModel):
    answer: str = Field(..., description="Final natural language explanation from Fintrix AI")
    sources: List[str] = Field(default_factory=list, description="Datasets or knowledge sources used")
    entities: List[Dict[str, Any]] = Field(default_factory=list, description="Extracted entity references (txns, merchants, users)")
    tool_calls: List[Dict[str, Any]] = Field(default_factory=list, description="Record of tools executed by the agent")
    risk_level: Optional[str] = Field(None, description="Optional risk classification tag")
    data_payload: Optional[Dict[str, Any]] = Field(None, description="Structured UI data payload for charts/KPIs")
