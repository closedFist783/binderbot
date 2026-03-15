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
python3 server.py
