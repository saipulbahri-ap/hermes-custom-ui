#!/usr/bin/env bash
set -euo pipefail

echo "=== Hermes Custom UI Setup ==="

# Backend
echo "[1/3] Installing backend dependencies..."
cd "$(dirname "$0")/backend"
pip install -r requirements.txt -q
cd ..

# Frontend
echo "[2/3] Installing frontend dependencies..."
cd frontend
npm install --silent
cd ..

# Make start script executable
chmod +x start.sh

echo "[3/3] Done!"
echo ""
echo "Run:  bash start.sh"
echo "  → Backend : http://localhost:8643"
echo "  → Frontend: http://localhost:5173"
echo "  → API docs: http://localhost:8643/docs"
