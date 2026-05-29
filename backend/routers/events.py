"""
Events Router — Hermes Monitor event ingestion & WebSocket broadcast.

Endpoints
---------
POST /api/events/ingest
    Accept a single event from the HermesMonitorPlugin and store it in an
    in-memory ring buffer (max 1000 events).  The event is also broadcast
    to every connected WebSocket client.

GET  /api/events
    Return the full list of stored events (newest last).

WS   /ws
    WebSocket endpoint that receives an immediate dump of all stored
    events on connection, then streams every new event as it arrives.
"""

import asyncio
import json
import logging
from collections import deque
from typing import Any

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from pydantic import BaseModel, Field

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api", tags=["events"])

# ---------------------------------------------------------------------------
# In-memory event store (ring buffer)
# ---------------------------------------------------------------------------
MAX_EVENTS = 1000
_events: deque[dict[str, Any]] = deque(maxlen=MAX_EVENTS)

# ---------------------------------------------------------------------------
# WebSocket broadcast machinery
# ---------------------------------------------------------------------------
_ws_queues: set[asyncio.Queue[dict[str, Any]]] = set()


async def _broadcast(event: dict[str, Any]) -> None:
    """Push *event* onto every connected WebSocket's queue."""
    dead: list[Any] = []
    for q in _ws_queues:
        try:
            q.put_nowait(event)
        except Exception:
            dead.append(q)
    for q in dead:
        _ws_queues.discard(q)


# ---------------------------------------------------------------------------
# Pydantic schema for incoming events
# ---------------------------------------------------------------------------
class EventPayload(BaseModel):
    type: str = Field(..., description="Event type identifier")
    timestamp: str = Field(..., description="ISO-8601 timestamp")
    agent_id: str = Field(..., description="Originating agent ID")
    session_id: str = Field(..., description="Session identifier")
    data: dict[str, Any] = Field(default_factory=dict, description="Arbitrary event payload")


# ---------------------------------------------------------------------------
# REST endpoints
# ---------------------------------------------------------------------------
@router.post("/events/ingest")
async def ingest_event(payload: EventPayload):
    """Accept a single event from the monitor plugin.

    Stores the event in memory (ring buffer, max 1000) and broadcasts it
    to all connected WebSocket clients.
    """
    event = payload.model_dump()
    _events.append(event)
    await _broadcast(event)
    logger.debug("Event ingested: %s", event.get("type"))
    return {"status": "ok", "stored": len(_events)}


@router.get("/events")
async def list_events():
    """Return all stored events (newest last)."""
    return {"events": list(_events), "total": len(_events)}


# ---------------------------------------------------------------------------
# WebSocket endpoint
# ---------------------------------------------------------------------------
@router.websocket("/ws")
async def event_websocket(ws: WebSocket):
    """WebSocket — real-time event stream.

    1. Accept connection.
    2. Send all stored events immediately (as a JSON array).
    3. Forward every new event as it arrives.
    """
    await ws.accept()

    # Send the current backlog on connect
    backlog = list(_events)
    await ws.send_json({"type": "__backlog__", "events": backlog, "total": len(backlog)})

    # Register a per-client queue
    queue: asyncio.Queue[dict[str, Any]] = asyncio.Queue()
    _ws_queues.add(queue)

    try:
        while True:
            event = await queue.get()
            # ping/pong keep-alive is handled by the ASGI server
            await ws.send_json(event)
    except WebSocketDisconnect:
        pass
    except Exception as exc:
        logger.warning("WebSocket error: %s", exc)
    finally:
        _ws_queues.discard(queue)
