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
    # Detect columns
    cols = [row[1] for row in conn.execute("PRAGMA table_info(sessions)").fetchall()]
    select_cols = ["id"]
    if "title" in cols:
        select_cols.append("title")
    if "started_at" in cols:
        select_cols.append("started_at")
    if "ended_at" in cols:
        select_cols.append("ended_at")
    if "model" in cols:
        select_cols.append("model")
    if "created_at" in cols:
        select_cols.append("created_at")
    if "updated_at" in cols:
        select_cols.append("updated_at")
    
    order_col = "started_at" if "started_at" in cols else ("created_at" if "created_at" in cols else "id")
    
    query = f"SELECT {', '.join(select_cols)} FROM sessions ORDER BY {order_col} DESC LIMIT ? OFFSET ?"
    rows = conn.execute(query, (limit, offset)).fetchall()
    conn.close()
    return [dict(r) for r in rows]


def get_session_messages(session_id: str, limit: int = 100) -> list[dict]:
    db = state_db_path()
    if not db:
        return []
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    # Detect available columns
    cols = [row[1] for row in conn.execute("PRAGMA table_info(messages)").fetchall()]
    # Build query dynamically based on available columns
    select_cols = ["id", "role", "content"]
    if "tool_calls" in cols:
        select_cols.append("tool_calls")
    if "created_at" in cols:
        select_cols.append("created_at")
    elif "timestamp" in cols:
        select_cols.append("timestamp")
    
    order_col = "created_at" if "created_at" in cols else ("timestamp" if "timestamp" in cols else "id")
    
    query = f"SELECT {', '.join(select_cols)} FROM messages WHERE session_id = ? ORDER BY {order_col} LIMIT ?"
    rows = conn.execute(query, (session_id, limit)).fetchall()
    conn.close()
    msgs = []
    for r in rows:
        d = dict(r)
        if d.get("tool_calls"):
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
    try:
        conn = sqlite3.connect(str(db))
        c = conn.execute("SELECT COUNT(*) FROM sessions").fetchone()[0]
        conn.close()
        return c
    except Exception:
        return 0


def search_sessions(q: str, limit: int = 20) -> list[dict]:
    db = state_db_path()
    if not db:
        return []
    conn = sqlite3.connect(str(db))
    conn.row_factory = sqlite3.Row
    cols = [row[1] for row in conn.execute("PRAGMA table_info(sessions)").fetchall()]
    select_cols = ["id"]
    if "title" in cols:
        select_cols.append("title")
    if "started_at" in cols:
        select_cols.append("started_at")
    if "ended_at" in cols:
        select_cols.append("ended_at")
    order_col = "started_at" if "started_at" in cols else ("created_at" if "created_at" in cols else "id")
    
    if "title" in cols:
        rows = conn.execute(
            f"SELECT {', '.join(select_cols)} FROM sessions WHERE title LIKE ? ORDER BY {order_col} DESC LIMIT ?",
            (f"%{q}%", limit),
        ).fetchall()
    else:
        rows = conn.execute(
            f"SELECT {', '.join(select_cols)} FROM sessions ORDER BY {order_col} DESC LIMIT ?",
            (limit,),
        ).fetchall()
    conn.close()
    return [dict(r) for r in rows]


# ── Skills ──

def list_skills() -> list[dict]:
    skills_dir = HERMES_HOME / "skills"
    if not skills_dir.exists():
        return []
    results = []
    # Scan all SKILL.md files recursively
    for skill_md in sorted(skills_dir.rglob("SKILL.md")):
        # Determine skill name from directory structure
        rel = skill_md.relative_to(skills_dir)
        if len(rel.parts) == 1:
            # Top-level SKILL.md (unusual but possible)
            name = skill_md.parent.name
            cat = None
        else:
            # Subdirectory: first part is category, second is skill name
            name = rel.parts[-2]  # parent dir name
            cat = rel.parts[0] if len(rel.parts) > 1 else None
        
        content = skill_md.read_text()
        desc = ""
        for line in content.split("\n"):
            if line.startswith("description:"):
                desc = line.split(":", 1)[1].strip().strip('"')
                break
        
        linked = []
        skill_dir = skill_md.parent
        for p in skill_dir.iterdir():
            if p.name != "SKILL.md":
                linked.append(str(p.relative_to(skill_dir)))
        
        results.append({
            "name": name,
            "description": desc,
            "category": cat,
            "path": str(skill_md),
            "size_bytes": skill_md.stat().st_size,
            "linked_files": linked,
            "content_preview": content[:500],
        })
    return results


def get_skill_content(name: str) -> Optional[str]:
    skills_dir = HERMES_HOME / "skills"
    # Try direct match: skills/name/SKILL.md
    p = skills_dir / name / "SKILL.md"
    if p.exists():
        return p.read_text()
    # Try as file: skills/name.md
    p2 = skills_dir / f"{name}.md"
    if p2.exists():
        return p2.read_text()
    # Try finding in subdirectories
    for skill_md in skills_dir.rglob("SKILL.md"):
        if skill_md.parent.name == name:
            return skill_md.read_text()
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
    # Output format: ASCII table with blocks separated by blank lines
    # Each block starts with job_id [status] then Name:, Schedule:, etc.
    current_job = {}
    for line in out.strip().split("\n"):
        stripped = line.strip()
        if not stripped:
            if current_job.get("id"):
                jobs.append(_finalize_cron_job(current_job))
                current_job = {}
            continue
        # Skip decorative lines (box drawing, headers)
        if stripped.startswith(("┌", "└", "│", "─", "━")):
            continue
        if stripped.startswith(("No ", "Create", "Usage", "Use ")):
            continue
        # Job line: "f20c9b3f5f8d [active]" or just "f20c9b3f5f8d"
        if "Name:" not in stripped and "Schedule:" not in stripped and "Next" not in stripped and "Repeat:" not in stripped and "Deliver:" not in stripped and "Prompt" not in stripped:
            # This is likely the job ID line
            parts = stripped.split()
            if parts and not current_job.get("id"):
                job_id = parts[0]
                status_val = ""
                if len(parts) >= 2:
                    status_val = parts[1].strip("[]")
                current_job = {"id": job_id, "status": status_val or "active"}
                continue
        # Key-value lines: "Name: test-ui", "Schedule: every 360m"
        if ":" in stripped:
            key, _, val = stripped.partition(":")
            key = key.strip().lower()
            val = val.strip()
            if key == "name":
                current_job["name"] = val
            elif key == "schedule":
                current_job["schedule"] = val
            elif key == "status":
                current_job["status"] = val
            elif key == "next run":
                current_job["next_run"] = val
            elif key == "repeat":
                current_job["repeat"] = val
            elif key == "deliver":
                current_job["deliver"] = val
    if current_job.get("id"):
        jobs.append(_finalize_cron_job(current_job))
    return jobs


def _finalize_cron_job(job: dict) -> dict:
    """Ensure all fields present in cron job dict."""
    return {
        "id": job.get("id", ""),
        "name": job.get("name", ""),
        "schedule": job.get("schedule", ""),
        "status": job.get("status", "active"),
        "next_run": job.get("next_run", ""),
        "repeat": job.get("repeat", ""),
        "deliver": job.get("deliver", ""),
    }


def _normalize_cron_job(j: dict) -> dict:
    """Normalize a cron job dict from various formats."""
    return {
        "id": str(j.get("id", j.get("job_id", ""))),
        "name": str(j.get("name", j.get("prompt", j.get("task", "")))),
        "schedule": str(j.get("schedule", j.get("cron", j.get("interval", "")))),
        "status": str(j.get("status", j.get("enabled", "active"))),
    }


def cron_create(name: str, schedule: str, prompt: str) -> dict:
    """Create a cron job via CLI. Returns dict with job info or error."""
    # hermes cron create <schedule> [prompt] --name X
    out, code = cli("cron", "create", schedule, prompt, "--name", name)
    if code == 0:
        # Try to parse JSON output
        try:
            data = json.loads(out)
            if isinstance(data, dict):
                return {"ok": True, "job": _normalize_cron_job(data)}
            if isinstance(data, list) and data:
                return {"ok": True, "job": _normalize_cron_job(data[-1])}
        except (json.JSONDecodeError, ValueError):
            pass
        # Fallback: return raw output
        return {"ok": True, "output": out.strip()}
    return {"ok": False, "error": out.strip() or f"exit code {code}"}


def cron_pause(job_id: str) -> dict:
    """Pause a cron job via CLI."""
    out, code = cli("cron", "pause", job_id)
    if code == 0:
        return {"ok": True, "output": out.strip()}
    # Try alternative command names
    out, code = cli("cron", "disable", job_id)
    if code == 0:
        return {"ok": True, "output": out.strip()}
    out, code = cli("cron", "update", job_id, "--enabled", "false")
    if code == 0:
        return {"ok": True, "output": out.strip()}
    return {"ok": False, "error": out.strip() or f"exit code {code}"}


def cron_resume(job_id: str) -> dict:
    """Resume a cron job via CLI."""
    out, code = cli("cron", "resume", job_id)
    if code == 0:
        return {"ok": True, "output": out.strip()}
    # Try alternative command names
    out, code = cli("cron", "enable", job_id)
    if code == 0:
        return {"ok": True, "output": out.strip()}
    out, code = cli("cron", "update", job_id, "--enabled", "true")
    if code == 0:
        return {"ok": True, "output": out.strip()}
    return {"ok": False, "error": out.strip() or f"exit code {code}"}


def cron_run(job_id: str) -> dict:
    """Trigger a cron job run via CLI."""
    out, code = cli("cron", "run", job_id)
    if code == 0:
        return {"ok": True, "output": out.strip()}
    # Try alternative: run now
    out, code = cli("cron", "trigger", job_id)
    if code == 0:
        return {"ok": True, "output": out.strip()}
    return {"ok": False, "error": out.strip() or f"exit code {code}"}


def cron_delete(job_id: str) -> dict:
    """Delete a cron job via CLI."""
    out, code = cli("cron", "delete", job_id)
    if code == 0:
        return {"ok": True, "output": out.strip()}
    # Try alternative command names
    out, code = cli("cron", "remove", job_id)
    if code == 0:
        return {"ok": True, "output": out.strip()}
    return {"ok": False, "error": out.strip() or f"exit code {code}"}


def delete_session(session_id: str) -> dict:
    """Delete a session and its messages from the state database."""
    db = state_db_path()
    if not db:
        return {"ok": False, "error": "state.db not found"}
    try:
        conn = sqlite3.connect(str(db))
        # Delete messages first (foreign key safety)
        conn.execute("DELETE FROM messages WHERE session_id = ?", (session_id,))
        # Delete session
        cur = conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        deleted = cur.rowcount
        conn.close()
        if deleted > 0:
            return {"ok": True, "deleted": deleted}
        return {"ok": False, "error": f"session {session_id} not found"}
    except sqlite3.Error as e:
        return {"ok": False, "error": str(e)}


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
    
    target='memory' → reads ~/.hermes/memories/MEMORY.md
    target='user'   → reads ~/.hermes/memories/USER.md
    """
    if target == "user":
        path = HERMES_HOME / "memories" / "USER.md"
    else:
        path = HERMES_HOME / "memories" / "MEMORY.md"
    # Fallback: try root-level if memories/ doesn't exist
    if not path.exists():
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
    """Return available tools. Tries CLI first, falls back to static list."""
    out, code = cli("tools", "list")
    tools = []
    current_set = "default"
    
    if code == 0 and out.strip():
        for line in out.strip().split("\n"):
            line = line.strip()
            if not line:
                continue
            if line.startswith("Toolset"):
                current_set = line.split(":", 1)[1].strip() if ":" in line else "unknown"
            elif line.startswith("- "):
                name = line[2:].split(":")[0].split("—")[0].strip()
                desc = ""
                if ":" in line[2:]:
                    desc = line[2:].split(":", 1)[1].strip()
                elif "—" in line[2:]:
                    desc = line[2:].split("—", 1)[1].strip()
                tools.append({"name": name, "description": desc, "toolset": current_set})
    
    if not tools:
        # Fallback: return known built-in tools
        tools = [
            {"name": "web_search", "description": "Search the web", "toolset": "web"},
            {"name": "web_fetch", "description": "Fetch web page content", "toolset": "web"},
            {"name": "terminal", "description": "Execute shell commands", "toolset": "terminal"},
            {"name": "read_file", "description": "Read file contents", "toolset": "file"},
            {"name": "write_file", "description": "Write file contents", "toolset": "file"},
            {"name": "browser_navigate", "description": "Navigate browser", "toolset": "browser"},
            {"name": "image_generate", "description": "Generate images", "toolset": "image_gen"},
            {"name": "cronjob", "description": "Manage cron jobs", "toolset": "cronjob"},
            {"name": "memory", "description": "Persistent memory", "toolset": "memory"},
            {"name": "session_search", "description": "Search sessions", "toolset": "session_search"},
        ]
    
    return tools


# ── Providers ──

def get_providers() -> list[dict]:
    """Return providers from config. Handles multiple config structures."""
    cfg = read_config()
    result = []

    # 1. Check model.fallback array (current bravo-dev structure)
    model_cfg = cfg.get("model", {})
    fallback = model_cfg.get("fallback", [])
    if isinstance(fallback, list):
        for p in fallback:
            if isinstance(p, dict):
                result.append({
                    "name": p.get("provider", p.get("name", "")),
                    "model": p.get("model", ""),
                    "api_base": p.get("base_url", p.get("api_base", "")),
                })

    # 2. Check model.provider (primary provider string)
    primary = model_cfg.get("provider", "")
    if primary:
        if not any(r["name"] == primary for r in result):
            result.insert(0, {
                "name": primary,
                "model": model_cfg.get("default", ""),
                "api_base": model_cfg.get("base_url", ""),
            })

    # 3. Check model.providers dict
    providers_dict = model_cfg.get("providers", {})
    if isinstance(providers_dict, dict):
        for name, info in providers_dict.items():
            if isinstance(info, dict):
                result.append({
                    "name": name,
                    "model": info.get("model", info.get("default_model", "")),
                    "api_base": info.get("api_base", ""),
                })
            else:
                result.append({"name": name, "model": str(info), "api_base": ""})

    # 4. Check root-level providers dict (legacy)
    root_providers = cfg.get("providers", {})
    if isinstance(root_providers, dict):
        for name, info in root_providers.items():
            if not any(r["name"] == name for r in result):
                if isinstance(info, dict):
                    result.append({
                        "name": name,
                        "model": info.get("model", ""),
                        "api_base": info.get("api_base", ""),
                    })
                else:
                    result.append({"name": name, "model": str(info), "api_base": ""})

    # 5. Also check fallback_providers key
    fb2 = model_cfg.get("fallback_providers", [])
    for p in fb2:
        if isinstance(p, dict):
            pname = p.get("provider", p.get("name", ""))
            if not any(r["name"] == pname for r in result):
                result.append({
                    "name": pname,
                    "model": p.get("model", ""),
                    "api_base": p.get("base_url", p.get("api_base", "")),
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


# ── Vector Memory ──

def get_vector_memory_collections() -> list[dict]:
    """Get vector memory collections. Tries ChromaDB first, falls back to file scan."""
    collections = []

    # Try ChromaDB
    try:
        import chromadb
        vm_dir = HERMES_HOME / "vector-memory"
        if vm_dir.exists():
            client = chromadb.PersistentClient(path=str(vm_dir))
            for col in client.list_collections():
                count = col.count()
                collections.append({
                    "name": col.name,
                    "count": count,
                    "metadata": col.metadata or {},
                })
    except ImportError:
        pass
    except Exception:
        pass

    # Fallback: scan vector-memory directory
    if not collections:
        vm_dir = HERMES_HOME / "vector-memory"
        if vm_dir.exists():
            for d in sorted(vm_dir.iterdir()):
                if d.is_dir():
                    # Count files as proxy for entries
                    files = list(d.rglob("*.json")) + list(d.rglob("*.sqlite")) + list(d.rglob("*.db"))
                    collections.append({
                        "name": d.name,
                        "count": len(files),
                        "metadata": {},
                    })

    return collections


def vector_memory_search(query: str, collection: str = "general", limit: int = 10) -> list[dict]:
    """Search vector memory using semantic search. Tries ChromaDB first."""
    results = []

    # Try ChromaDB with embedding
    try:
        import chromadb
        vm_dir = HERMES_HOME / "vector-memory"
        if vm_dir.exists():
            client = chromadb.PersistentClient(path=str(vm_dir))
            try:
                col = client.get_collection(collection)
            except Exception:
                # Try default collection
                try:
                    col = client.get_collection("general")
                except Exception:
                    col = None

            if col:
                # Try query with embedding
                try:
                    query_result = col.query(query_texts=[query], n_results=limit)
                    if query_result and query_result.get("documents"):
                        for i, doc in enumerate(query_result["documents"][0]):
                            meta = {}
                            if query_result.get("metadatas") and query_result["metadatas"][0]:
                                meta = query_result["metadatas"][0][i] or {}
                            dist = 0.0
                            if query_result.get("distances") and query_result["distances"][0]:
                                dist = query_result["distances"][0][i]
                            results.append({
                                "content": doc,
                                "metadata": meta,
                                "score": 1.0 - float(dist) if dist else 0.5,
                            })
                except Exception:
                    pass
    except ImportError:
        pass
    except Exception:
        pass

    # Fallback: keyword search in memory files
    if not results:
        vm_dir = HERMES_HOME / "vector-memory"
        if vm_dir.exists():
            search_dir = vm_dir / collection if (vm_dir / collection).exists() else vm_dir
            query_lower = query.lower()
            for f in sorted(search_dir.rglob("*.md")) + sorted(search_dir.rglob("*.txt")) + sorted(search_dir.rglob("*.json")):
                try:
                    text = f.read_text()
                    if query_lower in text.lower():
                        idx = text.lower().index(query_lower)
                        snippet = text[max(0, idx-100):idx+200]
                        score = 0.3  # keyword match baseline
                        results.append({
                            "content": snippet,
                            "metadata": {"source": str(f.relative_to(vm_dir))},
                            "score": score,
                        })
                        if len(results) >= limit:
                            break
                except Exception:
                    pass

    return results[:limit]


def vector_memory_add(collection: str, content: str, metadata: dict = None) -> dict:
    """Add entry to vector memory. Tries ChromaDB, falls back to file."""
    entry_id = f"entry_{int(__import__('time').time() * 1000)}"

    # Try ChromaDB
    try:
        import chromadb
        vm_dir = HERMES_HOME / "vector-memory"
        vm_dir.mkdir(exist_ok=True)
        client = chromadb.PersistentClient(path=str(vm_dir))
        col = client.get_or_create_collection(collection)
        col.add(
            documents=[content],
            ids=[entry_id],
            metadatas=[metadata or {}],
        )
        return {"ok": True, "id": entry_id, "collection": collection}
    except ImportError:
        pass
    except Exception as e:
        pass

    # Fallback: write to file
    try:
        vm_dir = HERMES_HOME / "vector-memory" / collection
        vm_dir.mkdir(parents=True, exist_ok=True)
        entry_file = vm_dir / f"{entry_id}.md"
        meta_str = ""
        if metadata and isinstance(metadata, dict):
            meta_str = "---\n" + yaml.dump(metadata, default_flow_style=False) + "---\n\n"
        entry_file.write_text(f"{meta_str}{content}")
        return {"ok": True, "id": entry_id, "collection": collection}
    except Exception as e:
        return {"ok": False, "error": str(e)}


def vector_memory_delete(collection: str, entry_id: str) -> dict:
    """Delete entry from vector memory."""
    # Try ChromaDB
    try:
        import chromadb
        vm_dir = HERMES_HOME / "vector-memory"
        if vm_dir.exists():
            client = chromadb.PersistentClient(path=str(vm_dir))
            try:
                col = client.get_collection(collection)
                col.delete(ids=[entry_id])
                return {"ok": True, "id": entry_id}
            except Exception:
                pass
    except ImportError:
        pass
    except Exception:
        pass

    # Fallback: delete file
    try:
        vm_dir = HERMES_HOME / "vector-memory"
        for f in vm_dir.rglob(f"{entry_id}.*"):
            f.unlink()
            return {"ok": True, "id": entry_id}
    except Exception:
        pass

    return {"ok": False, "error": "Entry not found"}


# ── Skill Runner ──

def run_skill(name: str, params: dict = None) -> dict:
    """Run a skill by name with optional parameters.
    
    Tries to find the skill's SKILL.md and execute its scripts.
    Returns execution result or error.
    """
    skills_dir = HERMES_HOME / "skills"
    skill_dir = None

    # Find skill directory
    if (skills_dir / name).exists() and (skills_dir / name).is_dir():
        skill_dir = skills_dir / name
    else:
        for d in skills_dir.rglob(name):
            if d.is_dir() and (d / "SKILL.md").exists():
                skill_dir = d
                break

    if not skill_dir:
        return {"ok": False, "error": f"Skill '{name}' not found"}

    result = {
        "ok": True,
        "skill": name,
        "skill_dir": str(skill_dir),
        "scripts_found": [],
        "execution_output": "",
    }

    # Check for scripts
    scripts_dir = skill_dir / "scripts"
    if scripts_dir.exists():
        for script in sorted(scripts_dir.iterdir()):
            if script.suffix in ('.sh', '.py', '.bash'):
                result["scripts_found"].append(str(script))

    # Try running the skill via hermes CLI
    out, code = cli("skill", "run", name)
    if code == 0 and out.strip():
        result["execution_output"] = out.strip()
        result["via"] = "cli"
        return result

    # Fallback: try running scripts directly
    if result["scripts_found"]:
        script_path = result["scripts_found"][0]
        try:
            import stat
            script_file = Path(script_path)
            script_file.chmod(script_file.stat().st_mode | stat.S_IEXEC)
            
            cmd = ["bash", script_path] if script_path.endswith('.sh') else ["python3", script_path]
            if params:
                for k, v in params.items():
                    cmd.extend([f"--{k}", str(v)])
            
            r = subprocess.run(
                cmd,
                capture_output=True, text=True, timeout=60,
                cwd=str(skill_dir),
                env={**os.environ, "SKILL_DIR": str(skill_dir), "HERMES_HOME": str(HERMES_HOME)},
            )
            result["execution_output"] = r.stdout.strip() or r.stderr.strip()
            result["exit_code"] = r.returncode
            result["via"] = "script"
            if r.returncode != 0:
                result["ok"] = False
                result["error"] = f"Script exited with code {r.returncode}"
            return result
        except subprocess.TimeoutExpired:
            return {"ok": False, "error": "Script execution timed out (60s)"}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    return result


# ── Provider Health Check ──

def check_provider_health() -> list[dict]:
    """Check health of all configured providers. Returns list of provider status."""
    import time as _time
    
    providers = get_providers()
    results = []

    for p in providers:
        name = p.get("name", "unknown")
        model = p.get("model", "")
        api_base = p.get("api_base", "")

        status_info = {
            "name": name,
            "model": model,
            "api_base": api_base,
            "status": "unknown",
            "latency_ms": None,
            "error": None,
        }

        # Determine API URL
        api_url = api_base or p.get("base_url", "")
        api_key = ""

        # Try to find API key from config/env
        cfg = read_raw_config()
        providers_cfg = cfg.get("providers", {})
        if isinstance(providers_cfg, dict) and name in providers_cfg:
            p_cfg = providers_cfg[name]
            if isinstance(p_cfg, dict):
                api_key = p_cfg.get("api_key", p_cfg.get("token", p_cfg.get("key", "")))

        if not api_key:
            env_cfg = read_env()
            key_variants = [
                f"{name.upper()}_API_KEY",
                f"{name.upper()}_KEY",
                f"{name.upper()}_TOKEN",
                "OPENROUTER_API_KEY",
                "OPENAI_API_KEY",
                "HERMES_API_KEY",
            ]
            for kv in key_variants:
                if kv in env_cfg and env_cfg[kv]:
                    api_key = env_cfg[kv]
                    break

        # Try health check via HTTP
        if api_url:
            try:
                import urllib.request
                import urllib.parse
                import json as _json

                headers = {"Content-Type": "application/json"}
                if api_key:
                    headers["Authorization"] = f"Bearer {api_key}"

                # Try /models endpoint
                models_url = api_url.rstrip("/") + "/models"
                req = urllib.request.Request(models_url, headers=headers)
                
                start = _time.time()
                try:
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        elapsed = (_time.time() - start) * 1000
                        status_info["status"] = "healthy"
                        status_info["latency_ms"] = round(elapsed, 1)
                except urllib.error.HTTPError as e:
                    elapsed = (_time.time() - start) * 1000
                    if e.code in (401, 403):
                        status_info["status"] = "auth_error"
                        status_info["latency_ms"] = round(elapsed, 1)
                        status_info["error"] = f"Auth error: {e.code}"
                    elif e.code >= 500:
                        status_info["status"] = "error"
                        status_info["latency_ms"] = round(elapsed, 1)
                        status_info["error"] = f"Server error: {e.code}"
                    else:
                        # 404 on /models may mean URL is wrong but reachable
                        status_info["status"] = "reachable"
                        status_info["latency_ms"] = round(elapsed, 1)
                        status_info["error"] = f"HTTP {e.code}"
                except urllib.error.URLError as e:
                    status_info["status"] = "unreachable"
                    status_info["error"] = str(e.reason)
            except Exception as e:
                status_info["status"] = "error"
                status_info["error"] = str(e)
        else:
            status_info["status"] = "no_url"

        results.append(status_info)

    return results


def read_raw_config() -> dict:
    """Read config.yaml without masking."""
    return read_config()


# ── Gateway Monitor ──

def get_gateway_channels() -> list[dict]:
    """Get gateway channel status."""
    cfg = read_config()
    platforms = cfg.get("platforms", {})
    if not platforms:
        for key in ("telegram", "discord", "slack", "signal", "whatsapp", "matrix"):
            if key in cfg and isinstance(cfg[key], dict):
                platforms[key] = cfg[key]

    channels = []
    for name, info in platforms.items():
        if not isinstance(info, dict):
            continue
        channels.append({
            "name": name,
            "enabled": info.get("enabled", True),
            "type": info.get("type", name),
            "connected": info.get("connected", None),  # null = unknown
        })
    return channels


def get_gateway_message_log(limit: int = 50) -> list[dict]:
    """Get recent gateway message log from hermes logs."""
    log_dir = HERMES_HOME / "logs"
    if not log_dir.exists():
        return []

    messages = []
    log_files = sorted(log_dir.glob("*.log"), key=lambda f: f.stat().st_mtime, reverse=True)[:3]

    for lf in log_files:
        try:
            content = lf.read_text(errors="replace")
            for line in content.split("
"):
                line = line.strip()
                if not line:
                    continue
                # Filter gateway-related lines
                lower = line.lower()
                if any(kw in lower for kw in ["gateway", "telegram", "discord", "slack", "message", "incoming", "outgoing"]):
                    messages.append({
                        "timestamp": line[:19] if len(line) > 19 else "",
                        "source": lf.name,
                        "message": line,
                    })
                    if len(messages) >= limit:
                        return messages
        except Exception:
            pass

    return messages[:limit]
