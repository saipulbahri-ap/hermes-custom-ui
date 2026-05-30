"""Vector Memory routes"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel

from backend.services import (
    get_vector_memory_collections,
    vector_memory_search,
    vector_memory_add,
    vector_memory_delete,
)

router = APIRouter(prefix="/api/vector-memory", tags=["vector-memory"])


@router.get("/collections")
async def list_collections():
    """List all vector memory collections."""
    return get_vector_memory_collections()


class SearchBody(BaseModel):
    query: str
    collection: str = "general"
    limit: int = 10


@router.get("/search")
async def search(
    q: str = "",
    collection: str = "general",
    limit: int = 10,
):
    """Search vector memory."""
    if not q.strip():
        raise HTTPException(status_code=400, detail="Query required")
    results = vector_memory_search(q, collection, limit)
    return {"query": q, "collection": collection, "results": results, "count": len(results)}


class AddBody(BaseModel):
    collection: str = "general"
    content: str
    metadata: dict = None


@router.post("/add")
async def add_entry(body: AddBody):
    """Add entry to vector memory."""
    if not body.content.strip():
        raise HTTPException(status_code=400, detail="Content required")
    result = vector_memory_add(body.collection, body.content, body.metadata)
    if not result.get("ok"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to add entry"))
    return result


@router.delete("/{collection}/{entry_id}")
async def delete_entry(collection: str, entry_id: str):
    """Delete entry from vector memory."""
    result = vector_memory_delete(collection, entry_id)
    if not result.get("ok"):
        raise HTTPException(status_code=404, detail=result.get("error", "Entry not found"))
    return result
