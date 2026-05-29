"""Hermes Monitor plugin — captures agent events for live dashboard."""

from __future__ import annotations

import asyncio
import json
import logging
import time
from typing import Any, Dict, Optional

logger = logging.getLogger(__name__)

BACKEND_URL = "http://127.0.0.1:8643/api/events/ingest"

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _send_event(event_type: str, agent_id: str, session_id: str, data: dict, parent_id: str = ""):
    """Fire-and-forget POST to the UI backend. Never blocks the agent."""
    payload = {
        "type": event_type,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "agent_id": agent_id,
        "session_id": session_id,
        "parent_id": parent_id,
        "data": data,
    }
    try:
        import httpx
        import threading
        def _do_req():
            try:
                httpx.post(BACKEND_URL, json=payload, timeout=2)
            except Exception:
                pass
        threading.Thread(target=_do_req, daemon=True).start()
    except Exception:
        pass  # swallow — monitoring should never block the agent


# ---------------------------------------------------------------------------
# Hooks
# ---------------------------------------------------------------------------

def _on_session_start(
    session_id: str = "",
    source: str = "",
    model: str = "",
    parent_session_id: str = "",
    task_id: str = "",
    **_: Any,
) -> None:
    """Fired when a new session begins."""
    _send_event(
        "session_start",
        agent_id=task_id or "main",
        session_id=session_id,
        data={"source": source, "model": model},
        parent_id=parent_session_id or "",
    )


def _on_session_end(
    session_id: str = "",
    completed: bool = True,
    interrupted: bool = False,
    end_reason: str = "",
    task_id: str = "",
    **_: Any,
) -> None:
    """Fired when a session ends."""
    _send_event(
        "session_end",
        agent_id=task_id or "main",
        session_id=session_id,
        data={"completed": completed, "interrupted": interrupted, "end_reason": end_reason},
    )


def _on_pre_tool_call(
    tool_name: str = "",
    args: Optional[Dict[str, Any]] = None,
    task_id: str = "",
    session_id: str = "",
    **_: Any,
) -> None:
    """Fired before a tool is called."""
    _send_event(
        "tool_call",
        agent_id=task_id or "main",
        session_id=session_id,
        data={"tool": tool_name, "args": args},
    )


def _on_post_tool_call(
    tool_name: str = "",
    args: Optional[Dict[str, Any]] = None,
    result: Any = None,
    task_id: str = "",
    session_id: str = "",
    tool_call_id: str = "",
    **_: Any,
) -> None:
    """Fired after a tool returns."""
    result_summary = str(result)[:200] if result else ""
    _send_event(
        "tool_result",
        agent_id=task_id or "main",
        session_id=session_id,
        data={"tool": tool_name, "result_preview": result_summary},
    )


# ---------------------------------------------------------------------------
# Plugin registration
# ---------------------------------------------------------------------------

def register(ctx) -> None:
    ctx.register_hook("on_session_start", _on_session_start)
    ctx.register_hook("on_session_end", _on_session_end)
    ctx.register_hook("pre_tool_call", _on_pre_tool_call)
    ctx.register_hook("post_tool_call", _on_post_tool_call)
    logger.info("hermes-monitor plugin registered — capturing agent events")
