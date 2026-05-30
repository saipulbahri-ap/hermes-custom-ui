#!/usr/bin/env python3
"""
Hermes Monitor Plugin
Captures agent events and sends to Hermes Custom UI backend.
"""
import os
import json
import time
import logging
from pathlib import Path
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

UI_API_URL = os.environ.get("HERMES_UI_URL", "http://localhost:8643/api/events/ingest")
UI_API_KEY=os.environ.get("HERMES_UI_API_KEY", "")


async def send_event(event_type: str, data: dict, agent_id: str = "default", session_id: str = ""):
    """Send event to Hermes UI backend."""
    payload = {
        "type": event_type,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S"),
        "agent_id": agent_id,
        "session_id": session_id,
        "data": data
    }
    headers = {"Content-Type": "application/json"}
    if UI_API_KEY:
        headers["Authorization"] = "Bearer " + UI_API_KEY
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.post(UI_API_URL, json=payload, headers=headers)
    except Exception as e:
        logger.debug("Plugin event send failed: %s", e)
