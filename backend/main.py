"""Hermes Custom UI — Main entry point"""
import os
import sys

# ensure backend/ is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from backend.config import HOST, PORT
from backend.auth import verify_api_key, is_auth_enabled

app = FastAPI(title="Hermes Custom UI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
from backend.routers.system import router as system_router
from backend.routers.chat import router as chat_router
from backend.routers.hermes import router as hermes_router
from backend.routers.events import router as events_router

# Health is public; everything else requires auth when UI_API_KEY is set
app.include_router(system_router)  # /api/system/* — health public, stats protected
app.include_router(chat_router)    # /api/chat/*
app.include_router(hermes_router, dependencies=[Depends(verify_api_key)])  # /api/sessions, /api/skills, etc.
app.include_router(events_router)  # plugin events — public for ingest


@app.get("/")
async def root():
    return {"app": "Hermes Custom UI", "docs": "/docs"}


@app.get("/api/auth/status")
async def auth_status():
    return {
        "auth_required": is_auth_enabled(),
        "key_configured": is_auth_enabled(),
    }


def main():
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)


if __name__ == "__main__":
    main()
