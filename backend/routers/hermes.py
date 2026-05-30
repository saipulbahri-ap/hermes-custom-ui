"""All Hermes management routes consolidated"""
from fastapi import APIRouter, Query

from backend.services import (
    get_sessions, get_session_messages, search_sessions,
    list_skills, get_skill_content,
    list_memory,
    list_cron_jobs,
    read_config, read_env, write_config,
    read_config_safe, read_env_safe,
    list_profiles, set_active_profile,
    get_tools_info,
    list_plugins,
    list_logs,
    get_providers,
    get_kanban_columns,
)

router = APIRouter(prefix="/api", tags=["hermes"])


# ── Sessions ──
@router.get("/sessions")
async def sessions(limit: int = 50, offset: int = 0):
    return get_sessions(limit, offset)


@router.get("/sessions/search")
async def sessions_search(q: str = "", limit: int = 20):
    return search_sessions(q, limit)


@router.get("/sessions/{session_id}")
async def session_detail(session_id: str, msg_limit: int = 100):
    msgs = get_session_messages(session_id, msg_limit)
    all_sessions = get_sessions(limit=1)
    s = next((s for s in all_sessions if s["id"] == session_id), {})
    return {**s, "messages": msgs}


# ── Skills ──
@router.get("/skills")
async def skills():
    return list_skills()


@router.get("/skills/{name}")
async def skill_detail(name: str):
    content = get_skill_content(name)
    all_skills = list_skills()
    info = next((s for s in all_skills if s["name"] == name), {})
    return {**info, "content": content}


# ── Memory ──
@router.get("/memory")
async def memory(target: str = Query("memory", pattern="^(memory|user)$")):
    return list_memory(target)


# ── Cron ──
@router.get("/cron")
async def cron():
    return list_cron_jobs()


# ── Config ──
@router.get("/config")
async def config():
    return {"yaml": read_config_safe(), "env": read_env_safe()}


@router.put("/config")
async def config_update(data: dict):
    return {"ok": write_config(data.get("yaml", data))}


# ── Profiles ──
@router.get("/profiles")
async def profiles():
    return list_profiles()


@router.post("/profiles/{name}/activate")
async def profile_activate(name: str):
    return {"ok": set_active_profile(name)}


# ── Tools ──
@router.get("/tools")
async def tools():
    return get_tools_info()


# ── Gateway ──
@router.get("/gateway")
async def gateway():
    cfg = read_config()
    # Platforms can be in cfg["platforms"] or scattered as telegram/discord/etc keys
    platforms = cfg.get("platforms", {})
    if not platforms:
        # Auto-detect platform configs
        for key in ("telegram", "discord", "slack", "signal", "whatsapp", "matrix"):
            if key in cfg and isinstance(cfg[key], dict):
                platforms[key] = cfg[key]
    channels = cfg.get("channels", {})
    result = []
    for name, info in platforms.items():
        if not isinstance(info, dict):
            continue
        enabled = info.get("enabled", True)
        result.append({
            "name": name,
            "enabled": enabled,
            "config": {k: (v if k != "token" else "***") for k, v in info.items()},
        })
    return {"platforms": result, "channels": channels}


# ── Providers ──
@router.get("/providers")
async def providers():
    result = get_providers()
    if not result:
        # Fallback: scan model.providers from config
        cfg = read_config()
        model_cfg = cfg.get("model", {})
        proms = model_cfg.get("providers", {})
        for name, info in proms.items():
            result.append({
                "name": name,
                "model": info.get("model", info.get("default_model", "")),
                "api_base": info.get("api_base", ""),
            })
        # Also check fallback_providers
        fb = model_cfg.get("fallback_providers", [])
        for p in fb:
            if isinstance(p, dict):
                result.append({
                    "name": p.get("provider", p.get("name", "")),
                    "model": p.get("model", ""),
                    "api_base": p.get("base_url", p.get("api_base", "")),
                })
    return result


# ── Kanban ──
@router.get("/kanban")
async def kanban():
    return get_kanban_columns()


# ── Logs ──
@router.get("/logs")
async def logs(limit: int = 100):
    return {"logs": list_logs(limit)}


# ── Plugins ──
@router.get("/plugins")
async def plugins():
    return list_plugins()
