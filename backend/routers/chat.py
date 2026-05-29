"""Chat routes - proxy to Hermes API server"""
import httpx
from fastapi import APIRouter, HTTPException

from backend.config import HERMES_API_URL, HERMES_API_KEY

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("/send")
async def chat_send(req: dict):
    headers = {"Content-Type": "application/json"}
    if HERMES_API_KEY:
        headers["Authorization"] = f"Bearer {HERMES_API_KEY}"
    payload = {
        "model": req.get("model", "default"),
        "messages": [{"role": "user", "content": req["message"]}],
        "stream": False,
    }
    if req.get("session_id"):
        payload["session_id"] = req["session_id"]
    try:
        async with httpx.AsyncClient(timeout=60) as c:
            r = await c.post(f"{HERMES_API_URL}/chat/completions", json=payload, headers=headers)
        if r.status_code != 200:
            raise HTTPException(r.status_code, f"API error: {r.text}")
        data = r.json()
        return {
            "reply": data["choices"][0]["message"]["content"],
            "session_id": data.get("session_id", req.get("session_id", "")),
            "model": data.get("model", req.get("model", "")),
            "usage": data.get("usage"),
        }
    except httpx.TimeoutException:
        raise HTTPException(504, "API server timeout")
    except httpx.ConnectError:
        raise HTTPException(502, "Cannot reach Hermes API server")


@router.get("/models")
async def list_models():
    headers = {}
    if HERMES_API_KEY:
        headers["Authorization"] = f"Bearer {HERMES_API_KEY}"
    try:
        async with httpx.AsyncClient(timeout=5) as c:
            r = await c.get(f"{HERMES_API_URL}/models", headers=headers)
        if r.status_code != 200:
            return {"models": []}
        return r.json()
    except Exception:
        return {"models": []}
