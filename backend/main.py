"""Hermes Custom UI — Main entry point"""
import os
import sys

# ensure backend/ is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import APIKeyHeader
from fastapi.middleware.cors import CORSMiddleware

from backend.config import HOST, PORT

app = FastAPI(title="Hermes Custom UI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth (optional - enabled when UI_API_KEY env var is set)
_UI_API_KEY = os.getenv("UI_API_KEY", "")
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(key: str = Depends(_api_key_header)):
    if not _UI_API_KEY:
        return True  # auth disabled
    if key != _UI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    return True


# Routers
from backend.routers.system import router as system_router
from backend.routers.chat import router as chat_router
from backend.routers.hermes import router as hermes_router
from backend.routers.events import router as events_router

# Public endpoints: health only. Everything else requires auth when UI_API_KEY is set.
app.include_router(system_router)  # /api/system/* — has internal key check where needed
app.include_router(chat_router)    # /api/chat/*
app.include_router(hermes_router, dependencies=[Depends(verify_api_key)])  # /api/sessions, /api/skills, etc.
app.include_router(events_router)  # plugin events — public for ingest


@app.get("/")
async def root():
    return {"app": "Hermes Custom UI", "docs": "/docs"}


@app.get("/api/auth/status")
async def auth_status():
    return {
        "auth_required": bool(_UI_API_KEY),
        "key_configured": bool(_UI_API_KEY),
    }


def main():
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)


if __name__ == "__main__":
    main()
