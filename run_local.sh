#!/bin/bash
# Run BinderBot server locally on Mac — no Pi required except for scanning
set -e
cd "$(dirname "$0")/scanner"

# Kill any existing server on port 5001
existing=$(lsof -ti :5001 2>/dev/null || true)
if [ -n "$existing" ]; then
  echo "[setup] Killing existing server on port 5001 (pid $existing)..."
  kill -9 $existing 2>/dev/null || true
  sleep 0.5
fi

if [ ! -d "venv" ]; then
  echo "[setup] Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "[setup] Installing dependencies..."
pip install -q flask flask-cors pillow requests imagehash

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  BinderBot local server → localhost:5001  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
# Load API key from web/.env if present
TCG_KEY=$(grep VITE_TCG_API_KEY ../web/.env 2>/dev/null | cut -d= -f2)
[ -n "$TCG_KEY" ] && export TCG_API_KEY="$TCG_KEY"

# Build local card database if it doesn't exist
if [ ! -f "card_db.json" ]; then
  echo ""
  echo "📦 First run: downloading card database (~20k cards, takes ~2 min)..."
  python3 fetch_cards.py
  echo ""
fi

python3 server.py
