#!/usr/bin/env bash
set -euo pipefail

DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend
echo "[Backend] Starting on :8643..."
cd "$DIR/backend"
python main.py &
BACKEND_PID=$!

# Start frontend
echo "[Frontend] Starting on :5173..."
cd "$DIR/frontend"
npx vite --host &
FRONTEND_PID=$!

echo ""
echo "=== Hermes Custom UI ==="
echo "  Backend : http://localhost:8643"
echo "  Frontend: http://localhost:5173"
echo "  API docs: http://localhost:8643/docs"
echo ""
echo "Press Ctrl+C to stop"

trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM
wait
