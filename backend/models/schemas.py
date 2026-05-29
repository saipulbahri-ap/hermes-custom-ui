"""Hermes Custom UI - Schema Models"""
from pydantic import BaseModel
from typing import Any, Optional

# ── System ──
class HealthInfo(BaseModel):
    status: str
    uptime: float
    hermes_home: str
    state_db: bool
    config_yaml: bool
    api_server: bool

# ── Chat ──
class ChatRequest(BaseModel):
    message: str
    model: str = "default"
    session_id: Optional[str] = None
    stream: bool = False

class ChatResponse(BaseModel):
    reply: str
    session_id: str
    model: str
    usage: Optional[dict] = None

# ── Sessions ──
class SessionSummary(BaseModel):
    id: str
    title: str
    created_at: str
    message_count: int
    model: Optional[str] = None

class SessionDetail(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: Optional[str] = None
    model: Optional[str] = None
    messages: list[dict] = []

# ── Skills ──
class SkillInfo(BaseModel):
    name: str
    description: str
    category: Optional[str] = None
    path: str
    size_bytes: int
    linked_files: list[str] = []
    content_preview: Optional[str] = None

# ── Memory ──
class MemoryEntry(BaseModel):
    id: Any = None
    content: str
    target: str = "memory"
    score: Optional[float] = None

# ── Cron ──
class CronJob(BaseModel):
    id: str
    name: Optional[str] = None
    schedule: str
    prompt: Optional[str] = None
    enabled: bool = True
    last_run: Optional[str] = None
    next_run: Optional[str] = None
    skills: list[str] = []
    script: Optional[str] = None

# ── Config ──
class ConfigData(BaseModel):
    yaml: dict[str, Any] = {}
    env: dict[str, str] = {}
    yaml_path: str = ""
    env_path: str = ""

# ── Profile ──
class ProfileInfo(BaseModel):
    name: str
    active: bool = False
    path: str
    skills_count: int = 0
    plugins_count: int = 0

# ── Tools ──
class ToolInfo(BaseModel):
    name: str
    description: str
    toolset: str
    parameters: list[dict] = []
