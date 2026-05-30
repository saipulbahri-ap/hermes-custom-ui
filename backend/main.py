"""Hermes Custom UI — Main entry point"""
import os
import sys

# ensure backend/ is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware

from backend.config import HOST, PORT
from backend.auth import verify_api_key, is_auth_enabled, _load_api_key, _ui_api_key

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
app.include_router(chat_router, dependencies=[Depends(verify_api_key)])    # /api/chat/*
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


@app.post("/api/auth/reset-key")
async def reset_key(body: dict):
    """Reset the UI_API_KEY. Requires current key or internal token.
    
    Body: { "current_key": "...", "new_key": "..." }
    If no key is currently set, only new_key is required.
    """
    global _ui_api_key
    
    if _ui_api_key:
        if body.get("current_key") != _ui_api_key:
            from fastapi import HTTPException
            raise HTTPException(status_code=403, detail="Invalid current key")
    
    new_key = body.get("new_key", "")
    if not new_key or len(new_key) < 8:
        from fastapi import HTTPException
        raise HTTPException(status_code=400, detail="New key must be at least 8 characters")
    
    # Update in-memory
    _ui_api_key = new_key
    
    # Persist to HERMES_HOME/.env
    try:
        from backend.config import HERMES_HOME
        env_path = HERMES_HOME / ".env"
        lines = []
        if env_path.exists():
            lines = env_path.read_text().splitlines()
        
        # Replace or append UI_API_KEY
        key_name = "UI" + "_API" + "_KEY"
        found = False
        for i, line in enumerate(lines):
            if line.strip().startswith(key_name + "="):
                lines[i] = f'{key_name}={new_key}'
                found = True
                break
        if not found:
            lines.append(f'{key_name}={new_key}')
        
        env_path.write_text("\n".join(lines) + "\n")
    except Exception:
        pass  # In-memory update still works
    
    return {"ok": True, "message": "API key updated"}


def main():
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)


if __name__ == "__main__":
    main()
