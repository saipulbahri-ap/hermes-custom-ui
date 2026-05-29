"""Hermes Custom UI - Backend Config"""
import os
from pathlib import Path

HERMES_HOME = Path(os.environ.get("HERMES_HOME", Path.home() / ".hermes"))
HERMES_API_URL = os.environ.get("HERMES_API_URL", "http://localhost:8642/v1")
HERMES_API_KEY = os.environ.get("HERMES_API_KEY", "")
HOST = os.environ.get("HOST", "0.0.0.0")
PORT = int(os.environ.get("PORT", "8643"))
