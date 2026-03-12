#!/usr/bin/env python3
"""
Download all Pokémon TCG card data from the official data repo and
import into a local SQLite database for offline lookup.

Uses curl -4 for downloads (bypasses the Python HTTPS/H2 issue on Pi).

Usage:
    python3 scripts/build_card_db.py
    python3 scripts/build_card_db.py --update   # re-download and refresh
"""
import io
import json
import os
import sqlite3
import subprocess
import sys
import zipfile

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'cards.db')
DATA_ZIP_URL = 'https://github.com/PokemonTCG/pokemon-tcg-data/archive/refs/heads/master.zip'


def download(url: str) -> bytes:
    print(f'Downloading {url} ...')
    result = subprocess.run(
        ['curl', '-4', '-L', '--max-time', '180', '-s', '--retry', '3', url],
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f'curl failed: {result.stderr.decode()}')
    print(f'  {len(result.stdout):,} bytes received')
    return result.stdout


def init_db(conn: sqlite3.Connection):
    conn.execute('''
        CREATE TABLE IF NOT EXISTS cards (
            id              TEXT PRIMARY KEY,
            name            TEXT,
            number          TEXT,
            set_id          TEXT,
            set_name        TEXT,
            set_total       INTEGER,
            set_printed_total INTEGER,
            rarity          TEXT,
            supertype       TEXT,
            image_small     TEXT,
            image_large     TEXT,
            price_market    REAL
        )
    ''')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_number   ON cards(number)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_set_id   ON cards(set_id)')
    conn.execute('CREATE INDEX IF NOT EXISTS idx_set_num  ON cards(set_id, number)')
    conn.commit()


def import_set(conn: sqlite3.Connection, cards: list) -> int:
    rows = []
    for c in cards:
        prices = c.get('tcgplayer', {}).get('prices', {})
        price = None
        for cat in ('holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil'):
            p = prices.get(cat, {}).get('market')
            if p:
                price = p
                break
        s = c.get('set', {})
        rows.append((
            c['id'],
            c.get('name'),
            c.get('number'),
            s.get('id'),
            s.get('name'),
            s.get('total'),
            s.get('printedTotal') or s.get('total'),
            c.get('rarity'),
            c.get('supertype'),
            c.get('images', {}).get('small'),
            c.get('images', {}).get('large'),
            price,
        ))
    conn.executemany('''
        INSERT OR REPLACE INTO cards
        (id, name, number, set_id, set_name, set_total, set_printed_total,
         rarity, supertype, image_small, image_large, price_market)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', rows)
    conn.commit()
    return len(rows)


def main():
    print(f'Target DB: {DB_PATH}')
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)

    zip_bytes = download(DATA_ZIP_URL)
    z = zipfile.ZipFile(io.BytesIO(zip_bytes))

    card_files = sorted(
        n for n in z.namelist()
        if '/cards/en/' in n and n.endswith('.json')
    )
    print(f'Found {len(card_files)} set files\n')

    total = 0
    for fname in card_files:
        set_id = fname.split('/')[-1].replace('.json', '')
        cards = json.loads(z.read(fname))
        n = import_set(conn, cards)
        print(f'  {set_id:20s}  {n:4d} cards')
        total += n

    conn.close()
    print(f'\n✅  Done — {total:,} cards imported to cards.db')


if __name__ == '__main__':
    main()
