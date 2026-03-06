#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║   Trend Intelligence Dashboard               ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

mkdir -p "$ROOT_DIR/data/cache"
cd "$ROOT_DIR"

if [ ! -d "node_modules" ]; then
  echo "→ Installing npm dependencies..."
  npm install
fi

echo ""
echo "╔══════════════════════════════════════════════╗"
echo "║  Dashboard:   http://localhost:3000           ║"
echo "╚══════════════════════════════════════════════╝"
echo ""

npm run dev
