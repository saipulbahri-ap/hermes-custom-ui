"""Hermes Bridge — CLI, SQLite, filesystem interactions"""
import json
import os
import sqlite3
import subprocess
from pathlib import Path

from typing import Optional

import yaml

from backend.config import HERMES_HOME


def cli(*args: str) -> tuple[str, int]:
    """Run `hermes` CLI command, return (stdout, exit_code)."""
    try:
        r = subprocess.run(
            ["hermes", *args],
            capture_output=True, text=True, timeout=15,
            env={**os.environ, "HERMES_HOME": str(HERMES_HOME)},
        )
        return r.stdout, r.returncode
    except FileNotFoundError:
        return "", 127


# ── Sessions (SQLite) ──

def state_db_path() -> Optional[Path]:
    p = HERMES_HOME / "state.db"
    return p if p.exists() else None


def get_sessions(limit: int = 50, offset: int = 0) -> list[dict]:
    db = state_db_path()
    if not db:
        return []
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, title, started_at, ended_at, model FROM sessions ORDER BY started_at DESC LIMIT ? OFFSET ?",
        (limit, offset),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_session_messages(session_id: str, limit: int = 100) -> list[dict]:
    db = state_db_path()
    if not db:
        return []
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, role, content, timestamp, tool_calls FROM messages WHERE session_id = ? ORDER BY timestamp LIMIT ?",
        (session_id, limit),
    ).fetchall()
    conn.close()
    msgs = []
    for r in rows:
        d = dict(r)
        if d["tool_calls"]:
            try:
                d["tool_calls"] = json.loads(d["tool_calls"])
            except (json.JSONDecodeError, TypeError):
                pass
        msgs.append(d)
    return msgs


def count_sessions() -> int:
    db = state_db_path()
    if not db:
        return 0
    conn = sqlite3.connect(str(db))
    c = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
    conn.close()
    return c


def search_sessions(q: str, limit: int = 20) -> list[dict]:
    db = state_db_path()
    if not db:
        return []
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    rows = conn.execute(
        "SELECT id, title, started_at, ended_at FROM sessions WHERE title LIKE ? ORDER BY started_at DESC LIMIT ?",
        (f"%{q}%", limit),
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Skills ──

def list_skills() -> list[dict]:
    skills_dir = HERMES_HOME / "skills"
    if not skills_dir.exists():
        return []
    results = []
    for f in sorted(skills_dir.iterdir()):
        skill_md = f / "SKILL.md" if f.is_dir() else f
        if not skill_md.exists():
            continue
        content = skill_md.read_text()
        desc = ""
        cat = None
        linked = []
        for line in content.split("\n"):
            if line.startswith("description:"):
                desc = line.split(":", 1)[1].strip().strip('"')
            elif line.startswith("category:"):
                cat = line.split(":", 1)[1].strip().strip('"')
        if f.is_dir():
            linked = [str(p.relative_to(f)) for p in f.iterdir() if p.name != "SKILL.md"]
        results.append({
            "name": f.name,
            "description": desc,
            "category": cat,
            "path": str(skill_md),
            "size_bytes": skill_md.stat().st_size,
            "linked_files": linked,
            "content_preview": content[:500],
        })
    return results


def get_skill_content(name: str) -> Optional[str]:
    p = HERMES_HOME / "skills" / name / "SKILL.md"
    if p.exists():
        return p.read_text()
    p2 = HERMES_HOME / "skills" / f"{name}.md"
    if p2.exists():
        return p2.read_text()
    return None


# ── Config ──

_SENSITIVE_KEY_PATTERNS = (
    "api_key", "token", "secret", "password", "private_key",
    "bearer", "authorization", "credential",
)


def _mask_secrets(obj, path=""):
    """Recursively mask sensitive values in config dict."""
    if isinstance(obj, dict):
        masked = {}
        for k, v in obj.items():
            sub_path = f"{path}.{k}" if path else k
            if any(pat in k.lower() for pat in _SENSITIVE_KEY_PATTERNS):
                if isinstance(v, str) and v:
                    masked[k] = v[:4] + "***" if len(v) > 4 else "***"
                else:
                    masked[k] = "***"
            else:
                masked[k] = _mask_secrets(v, sub_path)
        return masked
    elif isinstance(obj, list):
        return [_mask_secrets(item, path) for item in obj]
    return obj


def read_config() -> dict:
    p = HERMES_HOME / "config.yaml"
    if not p.exists():
        return {}
    return yaml.safe_load(p.read_text()) or {}


def read_config_safe() -> dict:
    """Return config with secrets masked for frontend display."""
    return _mask_secrets(read_config())


def read_env_safe() -> dict[str, str]:
    """Return env with secrets masked for frontend display."""
    env = read_env()
    masked = {}
    for k, v in env.items():
        if any(pat in k.lower() for pat in _SENSITIVE_KEY_PATTERNS):
            masked[k] = v[:4] + "***" if len(v) > 4 else "***"
        else:
            masked[k] = v
    return masked


def read_env() -> dict[str, str]:
    p = HERMES_HOME / ".env"
    if not p.exists():
        return {}
    env = {}
    for line in p.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        if "=" in line:
            k, _, v = line.partition("=")
            env[k.strip()] = v.strip().strip("'\"")
    return env


def write_config(data: dict) -> bool:
    """Merge partial config into existing config (preserves keys not in data)."""
    import copy
    existing = read_config()
    if not isinstance(existing, dict):
        existing = {}
    # Deep merge: data overrides existing
    merged = _deep_merge(existing, data)
    p = HERMES_HOME / "config.yaml"
    p.write_text(yaml.dump(merged, default_flow_style=False, allow_unicode=True))
    return True


def _deep_merge(base: dict, override: dict) -> dict:
    """Recursively merge override into base. Override wins on conflict."""
    result = copy.deepcopy(base)
    for k, v in override.items():
        if k in result and isinstance(result[k], dict) and isinstance(v, dict):
            result[k] = _deep_merge(result[k], v)
        else:
            result[k] = copy.deepcopy(v)
    return result


# ── Profiles ──

def list_profiles() -> list[dict]:
    profiles_dir = HERMES_HOME / "profiles"
    if not profiles_dir.exists():
        return []
    active = _get_active_profile()
    results = []
    for d in sorted(profiles_dir.iterdir()):
        if d.is_dir():
            skills = list((d / "skills").glob("*")) if (d / "skills").exists() else []
            plugins = list((d / "plugins").glob("*")) if (d / "plugins").exists() else []
            results.append({
                "name": d.name,
                "active": d.name == active,
                "path": str(d),
                "skills_count": len(skills),
                "plugins_count": len(plugins),
            })
    return results


def _get_active_profile() -> str:
    cfg = read_config()
    return cfg.get("active_profile", "default")


def set_active_profile(name: str) -> bool:
    cfg = read_config()
    cfg["active_profile"] = name
    return write_config(cfg)


# ── Cron ──

def list_cron_jobs() -> list[dict]:
    """List cron jobs via CLI. Tries JSON output first, then falls back to line parsing."""
    # Try JSON output first
    out, code = cli("cron", "list", "--json")
    if code == 0 and out.strip():
        try:
            data = json.loads(out)
            if isinstance(data, list):
                return [_normalize_cron_job(j) for j in data]
            if isinstance(data, dict):
                jobs = data.get("jobs", data.get("crons", []))
                return [_normalize_cron_job(j) for j in jobs]
        except (json.JSONDecodeError, ValueError):
            pass

    # Fallback: parse text output
    out, _ = cli("cron", "list")
    jobs = []
    for line in out.strip().split("\n"):
        if not line.strip() or line.startswith("No") or line.startswith("ID"):
            continue
        parts = line.split(None, 3)
        job = {"id": "", "name": "", "schedule": "", "status": ""}
        if len(parts) >= 1:
            job["id"] = parts[0]
        if len(parts) >= 2:
            job["name"] = parts[1]
        if len(parts) >= 3:
            job["schedule"] = parts[2]
        if len(parts) >= 4:
            job["status"] = parts[3]
        else:
            job["status"] = "active"
        jobs.append(job)
    return jobs


def _normalize_cron_job(j: dict) -> dict:
    """Normalize a cron job dict from various formats."""
    return {
        "id": str(j.get("id", j.get("job_id", ""))),
        "name": str(j.get("name", j.get("prompt", j.get("task", "")))),
        "schedule": str(j.get("schedule", j.get("cron", j.get("interval", "")))),
        "status": str(j.get("status", j.get("enabled", "active"))),
    }


# ── Memory ──

def _read_memory_entries(path: Path) -> list[dict]:
    """Read memory entries from a markdown file (MEMORY.md or USER.md).
    
    Each entry is a paragraph/block separated by blank lines.
    We skip headers, empty lines, and the frontmatter block.
    """
    if not path.exists():
        return []
    text = path.read_text()
    entries = []
    current: list[str] = []
    in_frontmatter = False
    for line in text.split('\n'):
        stripped = line.strip()
        if stripped == '---':
            in_frontmatter = not in_frontmatter
            continue
        if in_frontmatter:
            continue
        if stripped == '':
            if current:
                content = '\n'.join(current).strip()
                if content and not content.startswith('#'):
                    entries.append({'content': content})
                current = []
            continue
        current.append(line)
    if current:
        content = '\n'.join(current).strip()
        if content and not content.startswith('#'):
            entries.append({'content': content})
    return entries


def list_memory(target: str = "memory") -> list[dict]:
    """Return memory entries by reading directly from MEMORY.md or USER.md.
    
    target='memory' → reads ~/.hermes/MEMORY.md
    target='user'   → reads ~/.hermes/USER.md
    """
    if target == "user":
        path = HERMES_HOME / "USER.md"
    else:
        path = HERMES_HOME / "MEMORY.md"
    return _read_memory_entries(path)


# ── Plugins ──

def list_plugins() -> list[dict]:
    plugins_dir = HERMES_HOME / "plugins"
    if not plugins_dir.exists():
        return []
    results = []
    for f in sorted(plugins_dir.iterdir()):
        if f.suffix in (".py", ".yaml", ".yml"):
            results.append({
                "name": f.stem,
                "path": str(f),
                "size_bytes": f.stat().st_size,
            })
    return results


# ── Logs ──

def list_logs(limit: int = 100) -> list[str]:
    log_dir = HERMES_HOME / "logs"
    if not log_dir.exists():
        return []
    log_files = sorted(log_dir.glob("*.log"), key=os.path.getmtime, reverse=True)[:5]
    lines = []
    for lf in log_files:
        try:
            content = lf.read_text(errors="replace")
            for line in content.split("\n")[-limit:]:
                if line.strip():
                    lines.append(f"[{lf.name}] {line}")
        except Exception:
            pass
    return lines[-limit:]


# ── Tools ──

def get_tools_info() -> list[dict]:
    out, _ = cli("tools", "list")
    tools = []
    current_set = "default"
    for line in out.strip().split("\n"):
        line = line.strip()
        if not line:
            continue
        if line.startswith("Toolset"):
            current_set = line.split(":", 1)[1].strip() if ":" in line else "unknown"
        elif line.startswith("- "):
            name = line[2:].split(":")[0].split("—")[0].strip()
            desc = line[2:].split(":", 1)[1].strip() if ":" in line[2:] else line[2:]
            tools.append({"name": name, "description": desc, "toolset": current_set})
    return tools


# ── Providers ──

def get_providers() -> list[dict]:
    cfg = read_config()
    providers = cfg.get("providers", {})
    result = []
    for name, info in providers.items():
        result.append({
            "name": name,
            "model": info.get("model", info.get("default_model", "")),
            "api_base": info.get("api_base", ""),
        })
    return result


# ── Kanban ──

def get_kanban_columns() -> list[dict]:
    kanban_dir = HERMES_HOME / "kanban"
    if not kanban_dir.exists():
        return []
    columns = {"backlog": [], "in_progress": [], "done": []}
    for f in sorted(kanban_dir.glob("*.json")):
        try:
            data = json.loads(f.read_text())
            status = data.get("status", "backlog")
            if status not in columns:
                columns[status] = []
            columns[status].append(data)
        except (json.JSONDecodeError, Exception):
            pass
    result = []
    for status, items in columns.items():
        result.append({"status": status, "items": items, "count": len(items)})
    return result
