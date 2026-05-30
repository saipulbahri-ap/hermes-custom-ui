"""Shared auth utilities for Hermes Custom UI backend."""
import os
from fastapi import HTTPException, status, Depends
from fastapi.security import APIKeyHeader

_UI_API_KEY = os.environ.get("UI_API_KEY", "") "")
_api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)


async def verify_api_key(key: str = Depends(_api_key_header)):
    """Verify X-API-Key header against UI_API_KEY env var.

    If UI_API_KEY is not set, auth is disabled (all requests allowed).
    """
    if not _UI_API_KEY:
        return True  # auth disabled
    if key != _UI_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid API key",
        )
    return True
