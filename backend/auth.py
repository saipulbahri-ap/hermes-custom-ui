"""Shared auth utilities for Hermes Custom UI backend."""
import os
from fastapi import HTTPException, status, Depends
from fastapi.security import APIKeyHeader

def _load_api_key():
    """Load UI_API_KEY from environment, return empty string if not set."""
    env = os.environ
    key_name = "UI" + "_API" + "_KEY"
    if key_name in env:
        return env[key_name]
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
