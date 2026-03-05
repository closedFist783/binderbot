# BinderBot 🃏

A Raspberry Pi-based Pokémon card scanner and collection manager.
Feed cards in one at a time — each gets a physical ID, is identified via OCR + the PokéTCG API,
and logged to a local SQLite database. A web UI lets you browse your collection and locate any card
by its physical bin and position.

## How it works

1. Cards feed through a roller mechanism past a Pi Camera
2. OCR reads the card number printed at the bottom (e.g. `045/189`)
3. That number is looked up in the PokéTCG API to get name, set, rarity, price
4. If OCR fails, perceptual hash matching against API images is used as fallback
5. Card is assigned a sequential Physical ID and saved to SQLite
6. Cards are stored in order — bin separators every 1,000 cards
7. To find a card IRL: search the UI → it tells you Bin + approx position

## Hardware

- Raspberry Pi 4 (2GB+)
- Pi Camera Module 3 (or any compatible camera)
- L298N or similar motor driver
- Small DC motor + rubber rollers (repurpose from old inkjet printer)
- 3D printed housing (STL files in `hardware/`)
- 5V power supply for Pi, 12V for motor driver

## Software Setup (Pi)

```bash
cd scanner
pip install -r requirements.txt

# Install Tesseract OCR
sudo apt-get install -y tesseract-ocr

# Optional: set your PokéTCG API key (free at pokemontcg.io)
export POKEMON_TCG_API_KEY=your_key_here

python server.py
```

The server runs on `http://0.0.0.0:5000`. Access via `http://raspberrypi.local:5000` from any device on your network.

## Web UI Setup (dev machine or Pi)

```bash
cd web
cp .env.example .env          # edit VITE_API_URL to point at your Pi
npm install
npm run dev                   # dev server
npm run build                 # production build (Flask serves from web/dist)
```

## Database

SQLite at `binderbot.db` (project root). Schema auto-created on first run.

Key table: `cards`
- `physical_id` — sequential scan order, maps to physical location
- `tcg_id` — PokéTCG API card ID
- `needs_review` — 1 if OCR/hash confidence was low; fix via Collection tab

## Physical ID System

Cards are stored in the order they come out of the machine. Every 1,000 cards, put a labeled separator (a spare basic energy or tabbed divider works great).

- Physical ID 1–1,000 → Bin 1
- Physical ID 1,001–2,000 → Bin 2
- etc.

To find a card: open the Locate tab, type the name, it tells you the bin and position.

## GPIO Pin Config (BCM)

| Signal  | Default GPIO |
|---------|-------------|
| IN1     | 17          |
| IN2     | 18          |
| ENA     | 27          |

Override via env vars `MOTOR_IN1`, `MOTOR_IN2`, `MOTOR_ENA`.

## Project Structure

```
binderbot/
├── scanner/
│   ├── server.py      # Flask API + scan loop
│   ├── identify.py    # OCR + PokéTCG lookup + hash fallback
│   ├── camera.py      # Pi Camera / OpenCV abstraction
│   ├── motor.py       # GPIO motor control
│   ├── db.py          # SQLite operations
│   └── requirements.txt
├── web/               # React/Vite UI
│   └── src/
│       ├── components/
│       │   ├── ScanTab.jsx
│       │   ├── Collection.jsx
│       │   ├── Locate.jsx
│       │   ├── Stats.jsx
│       │   └── ReviewModal.jsx
│       └── lib/api.js
├── hardware/          # 3D print files (TODO)
└── binderbot.db       # auto-created
```
