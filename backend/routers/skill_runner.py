"""Skill Runner routes"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services import run_skill, list_skills, get_skill_content

router = APIRouter(prefix="/api/skill-runner", tags=["skill-runner"])


class RunBody(BaseModel):
    name: str
    params: dict = None


@router.post("/run")
async def run(body: RunBody):
    """Run a skill by name with optional parameters."""
    result = run_skill(body.name, body.params or {})
    return result


@router.get("/{name}/params")
async def get_skill_params(name: str):
    """Get skill parameters from SKILL.md frontmatter."""
    content = get_skill_content(name)
    if not content:
        raise HTTPException(status_code=404, detail=f"Skill '{name}' not found")

    # Parse frontmatter for params
    params = []
    in_fm = False
    for line in content.split("\n"):
        if line.strip() == "---":
            in_fm = not in_fm
            continue
        if in_fm and ":" in line:
            key, _, val = line.partition(":")
            key = key.strip()
            val = val.strip().strip('"')
            if key not in ("name", "description", "category", "version", "author"):
                params.append({"name": key, "value": val, "required": False})

    # Also look for parameter definitions in body
    for line in content.split("\n"):
        if line.strip().startswith("- ") and ":" in line:
            # Could be a param definition
            pass

    return {"skill": name, "params": params}
