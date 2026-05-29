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
        "api_server": api_ok,
        "sessions_count": count_sessions(),
    }


@router.get("/stats")
async def stats():
    cfg = read_config()
    providers = cfg.get("providers", {})
    profiles_dir = HERMES_HOME / "profiles"
    skills_dir = HERMES_HOME / "skills"
    return {
        "providers": len(providers),
        "profiles": len([d for d in profiles_dir.iterdir() if d.is_dir()]) if profiles_dir.exists() else 0,
        "skills": len(list(skills_dir.iterdir())) if skills_dir.exists() else 0,
        "sessions": count_sessions(),
    }
