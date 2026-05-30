"""System routes - health, version, status"""
import time

import httpx
from fastapi import APIRouter

from backend.config import HERMES_HOME, HERMES_API_URL, HERMES_API_KEY
from backend.services import state_db_path, count_sessions, read_config

router = APIRouter(prefix="/api/system", tags=["system"])
_start = time.time()


@router.get("/health")
async def health():
    api_ok = False
    try:
        headers = {"Authorization": f"Bearer {HERMES_API_KEY}"} if HERMES_API_KEY else {}
        async with httpx.AsyncClient(timeout=3) as c:
            r = await c.get(f"{HERMES_API_URL}/models", headers=headers)
            api_ok = r.status_code < 500
    except Exception:
        pass
    return {
        "status": "ok",
        "uptime": round(time.time() - _start, 1),
        "hermes_home": str(HERMES_HOME),
        "state_db": state_db_path() is not None,
        "config_yaml": (HERMES_HOME / "config.yaml").exists(),
        "backend": "healthy",
        "api_server": api_ok,
        "hermes_api": api_ok,
        "sessions_count": count_sessions(),
    }


@router.get("/stats")
async def stats():
    cfg = read_config()
    providers_cfg = cfg.get("providers", {})
    if not providers_cfg:
        providers_cfg = cfg.get("model", {}).get("providers", {})
    # Also count model.fallback providers
    fallback_count = len(cfg.get("model", {}).get("fallback", []))
    primary_count = 1 if cfg.get("model", {}).get("provider") else 0
    provider_count = max(len(providers_cfg), fallback_count + primary_count)
    profiles_dir = HERMES_HOME / "profiles"
    skills_dir = HERMES_HOME / "skills"
    
    db = state_db_path()
    msg_count = 0
    if db:
        import sqlite3
        try:
            conn = sqlite3.connect(str(db))
            msg_count = conn.execute("SELECT COUNT(*) FROM messages").fetchone()[0]
            conn.close()
        except Exception:
            pass

    memory_count = 0
    mem_file = HERMES_HOME / "MEMORY.md"
    if mem_file.exists():
        memory_count = len([line for line in mem_file.read_text().split("\n") if line.strip().startswith("§") or line.strip().startswith("-")])

    import httpx
    from backend.config import HERMES_API_URL, HERMES_API_KEY
    api_ok = False
    try:
        headers = {"Authorization": f"Bearer {HERMES_API_KEY}"} if HERMES_API_KEY else {}
        async with httpx.AsyncClient(timeout=1) as c:
            r = await c.get(f"{HERMES_API_URL}/models", headers=headers)
            api_ok = r.status_code < 500
    except Exception:
        pass

    return {
        "providers": provider_count,
        "active_profiles": len([d for d in profiles_dir.iterdir() if d.is_dir()]) if profiles_dir.exists() else 0,
        "active_skills": len(list(skills_dir.iterdir())) if skills_dir.exists() else 0,
        "sessions_count": count_sessions(),
        "messages_count": msg_count,
        "memory_entries": memory_count,
        "uptime": round(time.time() - _start, 1),
        "api_server": api_ok,
        "model": cfg.get("chat", {}).get("model", "default")
    }

