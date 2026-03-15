#!/bin/bash
# Run BinderBot server locally (no Pi hardware needed)
# Collections/cards stored in scanner/cards.db on this machine

set -e
cd "$(dirname "$0")/scanner"

# Create venv if it doesn't exist
if [ ! -d "venv" ]; then
  echo "[setup] Creating virtual environment..."
  python3 -m venv venv
fi

source venv/bin/activate

echo "[setup] Installing dependencies..."
pip install -q flask flask-cors pillow requests imagehash

echo "[binderbot] Starting local server on http://localhost:5000"
python3 server.py
