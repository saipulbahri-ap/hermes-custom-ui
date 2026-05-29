"""
Hermes Monitor Plugin — Hermes Agent event capture & forwarding.

Captures agent lifecycle events and forwards them via HTTP POST to a
backend service at http://localhost:8643/api/events/ingest.

Supported event types:
    - session_start / session_end
    - message
    - tool_call / tool_result
    - delegation
    - kanban_update

Each event payload:
    {
        "type": str,
        "timestamp": str (ISO-8601),
        "agent_id": str,
        "session_id": str,
        "data": dict
    }

Hooks implemented:
    - on_agent_start  →  session_start
    - on_agent_end    →  session_end
    - on_message      →  message
    - on_tool_call    →  tool_call
    - on_tool_result  →  tool_result

Usage:
    plugin = HermesMonitorPlugin(
        agent_id="my-agent",
        session_id="sess-001",
        endpoint="http://localhost:8643/api/events/ingest"
    )
    plugin.on_agent_start()
    plugin.on_message({"role": "user", "content": "hello"})
    plugin.on_agent_end()
"""

import json
import logging
import time
from datetime import datetime, timezone

logger = logging.getLogger(__name__)

# Try requests, fall back to urllib
try:
    import requests as _requests
    _HAS_REQUESTS = True
except ImportError:
    _HAS_REQUESTS = False
    import urllib.request as _urllib_request
    import urllib.error as _urllib_error


def _send_http_post(url: str, payload: dict) -> bool:
    """Send a JSON POST request.  Returns True on success."""
    data = json.dumps(payload).encode("utf-8")
    headers = {"Content-Type": "application/json"}

    if _HAS_REQUESTS:
        try:
            resp = _requests.post(url, data=data, headers=headers, timeout=5)
            resp.raise_for_status()
            return True
        except Exception as exc:
            logger.warning("HermesMonitor: requests POST failed — %s", exc)
            return False

    # urllib fallback
    try:
        req = _urllib_request.Request(url, data=data, headers=headers, method="POST")
        with _urllib_request.urlopen(req, timeout=5) as resp:
            resp.read()  # drain
        return True
    except Exception as exc:
        logger.warning("HermesMonitor: urllib POST failed — %s", exc)
        return False


class HermesMonitorPlugin:
    """
    Hermes Agent plugin that forwards lifecycle events to a backend API.

    Parameters
    ----------
    agent_id : str
        Identifier for the Hermes agent instance.
    session_id : str
        Unique session identifier (one per agent run).
    endpoint : str, optional
        Backend URL to send events to.
        Default: http://localhost:8643/api/events/ingest
    """

    def __init__(
        self,
        agent_id: str,
        session_id: str,
        endpoint: str = "http://localhost:8643/api/events/ingest",
    ):
        self.agent_id = agent_id
        self.session_id = session_id
        self.endpoint = endpoint.rstrip("/")

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _now(self) -> str:
        """Return current UTC timestamp in ISO-8601 format."""
        return datetime.now(timezone.utc).isoformat()

    def _emit(self, event_type: str, data: dict | None = None) -> bool:
        """Build the event dict and POST it to the backend."""
        payload = {
            "type": event_type,
            "timestamp": self._now(),
            "agent_id": self.agent_id,
            "session_id": self.session_id,
            "data": data or {},
        }
        logger.debug("HermesMonitor: emitting %s", event_type)
        return _send_http_post(self.endpoint, payload)

    # ------------------------------------------------------------------
    # Hermes hooks
    # ------------------------------------------------------------------

    def on_agent_start(self, data: dict | None = None) -> None:
        """Called when an agent session begins.

        Emits a *session_start* event.
        """
        self._emit("session_start", data)

    def on_agent_end(self, data: dict | None = None) -> None:
        """Called when an agent session ends.

        Emits a *session_end* event.
        """
        self._emit("session_end", data)

    def on_message(self, data: dict | None = None) -> None:
        """Called for each conversational message.

        Emits a *message* event.
        """
        self._emit("message", data)

    def on_tool_call(self, data: dict | None = None) -> None:
        """Called when the agent invokes a tool.

        Emits a *tool_call* event.
        """
        self._emit("tool_call", data)

    def on_tool_result(self, data: dict | None = None) -> None:
        """Called when a tool returns a result.

        Emits a *tool_result* event.
        """
        self._emit("tool_result", data)
