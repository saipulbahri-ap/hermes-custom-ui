"""Shared auth utilities for Hermes Custom UI backend."""
import os
from fastapi import HTTPException, status, Depends
from fastapi.security import APIKeyHeader


def _load_api_key() -> str:
    """Load UI_API_KEY from environment. Checks multiple sources.
    
    Priority:
    1. OS environment variable (set by PM2 / docker / shell)
    2. HERMES_HOME/.env file (key=val format, key must be UI_API_KEY)
    
    Returns empty string if not found anywhere (auth disabled).
    """
    # 1. Check OS environment first
    env = os.environ
    key_name = "UI" + "_API" + "_KEY"
    val = env.get(key_name, "")
    if val:
        return val

    # 2. Try reading from HERMES_HOME/.env directly
    #    (avoids python-dotenv which may cache old values)
    try:
        from backend.config import HERMES_HOME
        env_path = HERMES_HOME / ".env"
        if env_path.exists():
            for line in env_path.read_text().splitlines():
                line = line.strip()
                if not line or line.startswith("#"):
                    continue
                if "=" in line:
                    k, _, v = line.partition("=")
                    if k.strip() == key_name:
                        v = v.strip().strip("'\"")
                        if v:
                            return v
    except Exception:
        pass

    return ""


_ui_api_key = _load_api_key()
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(key: str = Depends(_api_key_header)):
    """Verify X-API-Key header. Auth disabled if UI_API_KEY not set."""
    if not _ui_api_key:
        return True
    if key != _ui_api_key:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return True


def is_auth_enabled() -> bool:
    return bool(_ui_api_key)
