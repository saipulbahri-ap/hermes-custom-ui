"""Provider Health Check routes"""
from fastapi import APIRouter

from backend.services import check_provider_health, get_providers, get_gateway_channels, get_gateway_message_log

router = APIRouter(prefix="/api", tags=["providers", "gateway"])


@router.get("/providers/health")
async def providers_health():
    """Check health of all configured providers."""
    return check_provider_health()


@router.get("/gateway/channels")
async def gateway_channels():
    """Get gateway channel status."""
    return get_gateway_channels()


@router.get("/gateway/messages")
async def gateway_messages(limit: int = 50):
    """Get recent gateway message log."""
    return {"messages": get_gateway_message_log(limit)}
