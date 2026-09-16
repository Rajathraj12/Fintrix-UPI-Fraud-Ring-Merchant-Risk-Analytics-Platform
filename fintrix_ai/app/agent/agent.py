import logging
import requests
import re
from typing import List, Optional
from .config import (
    OLLAMA_MODEL,
    OLLAMA_BASE_URL,
    MAX_OUTPUT_TOKENS,
    MAX_CONTEXT_TOKENS,
    MAX_AGENT_REQUESTS_PER_SESSION,
)
from .prompts import FINTRIX_SYSTEM_PROMPT
from ..tools.transaction_tools import get_transaction
from ..tools.risk_tools import get_risk_score
from ..tools.customer_tools import get_customer_profile
from ..tools.merchant_tools import get_merchant_profile
from ..tools.analytics_tools import (
    get_transaction_analytics,
    get_customer_analytics,
    get_merchant_analytics,
    get_chargeback_analytics,
    get_risk_analytics,
)
from ..services.usage_tracker import UsageTracker, global_usage_tracker

logger = logging.getLogger("fintrix_ai.agent")

USAGE_LIMIT_MESSAGE = (
    "Fintrix AI usage limit reached for this session. "
    "Please start a new session or increase the configured limit."
)

CONTEXT_LIMIT_MESSAGE = (
    f"Input context length exceeds the configured safety limit ({MAX_CONTEXT_TOKENS} tokens). "
    "Please shorten your query."
)

# ── Tool registry for the agent ──
TOOL_REGISTRY = {
    "get_transaction": get_transaction,
    "get_risk_score": get_risk_score,
    "get_customer_profile": get_customer_profile,
    "get_merchant_profile": get_merchant_profile,
    "get_transaction_analytics": get_transaction_analytics,
    "get_customer_analytics": get_customer_analytics,
    "get_merchant_analytics": get_merchant_analytics,
    "get_chargeback_analytics": get_chargeback_analytics,
    "get_risk_analytics": get_risk_analytics,
}

TOOL_DESCRIPTIONS = """Available tools you can call:
- get_transaction(txn_id): Look up a specific UPI transaction by ID
- get_risk_score(txn_id): Get risk score and signals for a transaction
- get_customer_profile(user_id): Get KYC and profile info for a customer
- get_merchant_profile(merchant_id): Get merchant details and risk profile
- get_transaction_analytics(): Get aggregate transaction statistics
- get_customer_analytics(): Get aggregate customer/KYC statistics
- get_merchant_analytics(): Get aggregate merchant statistics
- get_chargeback_analytics(): Get aggregate chargeback/dispute statistics
- get_risk_analytics(): Get risk distribution analytics

To use a tool, respond with EXACTLY this format on its own line:
TOOL_CALL: tool_name(arg)

Example: TOOL_CALL: get_transaction_analytics()
Example: TOOL_CALL: get_merchant_profile(MCH1234)

After receiving the tool result, provide your analysis to the user."""


def call_ollama(messages: list, model: str = None) -> str:
    """Call Ollama's local API with a chat completion request."""
    model = model or OLLAMA_MODEL
    url = f"{OLLAMA_BASE_URL}/api/chat"

    payload = {
        "model": model,
        "messages": messages,
        "stream": False,
        "options": {
            "num_predict": MAX_OUTPUT_TOKENS,
            "temperature": 0.1,  # Low temp = faster, more deterministic output
        }
    }

    headers = {
        "ngrok-skip-browser-warning": "69420"
    }

    try:
        resp = requests.post(url, json=payload, headers=headers, timeout=300)  # 5-min timeout for local LLM
        resp.raise_for_status()
        data = resp.json()
        return data.get("message", {}).get("content", "").strip()
    except requests.exceptions.ConnectionError:
        raise ConnectionError(
            f"Cannot connect to Ollama at {OLLAMA_BASE_URL}. "
            "Make sure Ollama is running (run 'ollama serve' in a terminal)."
        )
    except requests.exceptions.Timeout:
        raise TimeoutError("Ollama request timed out after 300 seconds.")
    except Exception as e:
        raise RuntimeError(f"Ollama API error: {e}")


def parse_tool_call(response: str):
    """Parse a TOOL_CALL from the LLM response using regex for better leniency."""
    # Strict parsing for the original format
    for line in response.split("\n"):
        line = line.strip()
        if line.startswith("TOOL_CALL:"):
            call_str = line[len("TOOL_CALL:"):].strip()
            # Parse tool_name(args)
            if "(" in call_str and call_str.endswith(")"):
                tool_name = call_str[:call_str.index("(")].strip()
                args_str = call_str[call_str.index("(") + 1:-1].strip()
                return tool_name, args_str
                
    # Lenient fallback: search the text for any known tool names
    known_tools = list(TOOL_REGISTRY.keys())
    for tool in known_tools:
        if tool in response:
            # Check if there are arguments provided in parentheses after the tool name
            match = re.search(rf"{tool}\s*\((.*?)\)", response)
            if match:
                return tool, match.group(1).strip()
            # Otherwise, just call it with no args
            return tool, ""
            
    return None, None


def execute_tool(tool_name: str, args_str: str) -> str:
    """Execute a registered tool and return its result as a string."""
    if tool_name not in TOOL_REGISTRY:
        return f"Error: Unknown tool '{tool_name}'. Available tools: {', '.join(TOOL_REGISTRY.keys())}"

    tool_fn = TOOL_REGISTRY[tool_name]
    try:
        if args_str:
            # Handle keyword arguments like key=value
            if "=" in args_str:
                kwargs = {}
                for part in args_str.split(","):
                    k, v = part.strip().split("=", 1)
                    v = v.strip().strip("'\"")
                    kwargs[k.strip()] = v
                result = tool_fn(**kwargs)
            else:
                # Positional argument
                arg = args_str.strip().strip("'\"")
                result = tool_fn(arg)
        else:
            result = tool_fn()
        return str(result)
    except Exception as e:
        return f"Tool execution error: {e}"


class FintrixAgent:
    """
    Fintrix AI Agent powered by Ollama (Llama 3.2).
    Supports tool calling through a simple text-based protocol.
    """

    def __init__(self, model: str = None):
        self.model = model or OLLAMA_MODEL
        self.tools_used: List[str] = []

    def run(self, prompt: str) -> str:
        """Execute the agent with tool-calling loop."""
        self.tools_used = []

        messages = [
            {"role": "system", "content": FINTRIX_SYSTEM_PROMPT + "\n\n" + TOOL_DESCRIPTIONS},
            {"role": "user", "content": prompt},
        ]

        # Allow up to 3 tool-calling rounds
        for _ in range(3):
            response = call_ollama(messages, self.model)

            tool_name, args_str = parse_tool_call(response)
            if tool_name is None:
                # No tool call — this is the final answer
                return response

            # Execute the tool
            logger.info(f"Agent calling tool: {tool_name}({args_str})")
            self.tools_used.append(tool_name)
            tool_result = execute_tool(tool_name, args_str)

            # Truncate large tool outputs so LLM doesn't get overwhelmed
            MAX_TOOL_RESULT_CHARS = 1500
            if len(tool_result) > MAX_TOOL_RESULT_CHARS:
                tool_result = tool_result[:MAX_TOOL_RESULT_CHARS] + "\n...[truncated]"

            # Feed tool result back to the LLM
            messages.append({"role": "assistant", "content": response})
            messages.append({
                "role": "user",
                "content": f"Tool result for {tool_name}:\n{tool_result}\n\nNow provide your final analysis. If the original query asked to plot, graph, or compare, you MUST end your response with the ```json chart block as instructed."
            })

        # If we exhausted tool rounds, get a final response
        response = call_ollama(messages, self.model)
        return response


def create_fintrix_agent(model: str = None) -> FintrixAgent:
    """Factory to create a Fintrix AI Agent backed by Ollama."""
    return FintrixAgent(model=model)


def run_guarded_agent(
    agent: FintrixAgent,
    prompt: str,
    tracker: Optional[UsageTracker] = None,
) -> str:
    """
    Execute an agent run with usage and context guards.
    """
    active_tracker = tracker or global_usage_tracker

    # Guard: Check request count limit
    if not active_tracker.can_make_request():
        logger.warning("Agent execution blocked: session request limit reached.")
        return USAGE_LIMIT_MESSAGE

    # Guard: Check context length limit
    if not active_tracker.validate_context_length(prompt):
        logger.warning("Agent execution blocked: input context exceeds max context tokens.")
        return CONTEXT_LIMIT_MESSAGE

    try:
        result = agent.run(prompt)
        # Estimate tokens for tracking
        input_tokens = len(prompt) // 4
        output_tokens = len(result) // 4
        active_tracker.record_usage(input_tokens=input_tokens, output_tokens=output_tokens)
        return str(result)

    except ConnectionError as e:
        logger.error(f"Ollama connection error: {e}")
        return f"Error: {e}"
    except TimeoutError as e:
        logger.error(f"Ollama timeout: {e}")
        return "Error: Request timed out. Ollama may be processing a large request."
    except Exception as e:
        active_tracker.record_usage(input_tokens=0, output_tokens=0)
        err_msg = str(e)
        logger.error(f"Agent execution error: {err_msg}")
        return f"Error processing request: {err_msg}"
