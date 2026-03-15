#!/bin/bash
# Run BinderBot server locally on Mac — no Pi required except for scanning
# Cards stored in scanner/cards.db on this machine

set -e
cd "$(dirname "$0")/scanner"

if [ ! -d "venv" ]; then
  echo "[setup] Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "[setup] Installing dependencies..."
pip install -q flask flask-cors pillow requests imagehash

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  BinderBot local server → localhost:5000  ║"
echo "╚══════════════════════════════════════════╝"
echo ""
python3 server.py
