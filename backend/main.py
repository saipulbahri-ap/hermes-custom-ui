"""Hermes Custom UI — Main entry point"""
import os
import sys

# ensure backend/ is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.config import HOST, PORT
from backend.routers.system import router as system_router
from backend.routers.chat import router as chat_router
from backend.routers.hermes import router as hermes_router
from backend.routers.events import router as events_router

app = FastAPI(title="Hermes Custom UI", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system_router)
app.include_router(chat_router)
app.include_router(hermes_router)
app.include_router(events_router)


@app.get("/")
async def root():
    return {"app": "Hermes Custom UI", "docs": "/docs"}


def main():
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)


if __name__ == "__main__":
    main()
