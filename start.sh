#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_DIR="$ROOT_DIR/python"
PYTHON_PID_FILE="$ROOT_DIR/.python_api.pid"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Trend Intelligence Dashboard               ║"
echo "║   Starting all services...                   ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

# Ensure data/cache directory exists
mkdir -p "$ROOT_DIR/data/cache"

# ── Start Python FastAPI sidecar ─────────────────────────────
echo "→ Starting Python FastAPI sidecar on :8000..."
cd "$PYTHON_DIR"

# Install Python deps if needed
if ! python3 -c "import fastapi" 2>/dev/null; then
  echo "  Installing Python dependencies..."
  pip3 install -r requirements.txt -q
fi

# Start FastAPI in background
python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload &
PYTHON_PID=$!
echo "$PYTHON_PID" > "$PYTHON_PID_FILE"
echo "  FastAPI started (PID $PYTHON_PID)"

# ── Start Next.js dev server ──────────────────────────────────
cd "$ROOT_DIR"
echo ""
echo "→ Starting Next.js dev server on :3000..."

# Install JS deps if needed
if [ ! -d "node_modules" ]; then
  echo "  Installing npm dependencies..."
  npm install
fi

# Clean up Python process on exit
cleanup() {
  echo ""
  echo "→ Shutting down services..."
  if [ -f "$PYTHON_PID_FILE" ]; then
    kill "$(cat "$PYTHON_PID_FILE")" 2>/dev/null || true
    rm -f "$PYTHON_PID_FILE"
  fi
  echo "  Done."
}
trap cleanup EXIT INT TERM

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Python API:  http://localhost:8000           ║"
echo "║  Dashboard:   http://localhost:3000           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

npm run dev
