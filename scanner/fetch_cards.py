"""
One-time script: build local card database from the official
PokemonTCG/pokemon-tcg-data GitHub repo (no API key, no Cloudflare).

Run once: python3 fetch_cards.py
"""
import subprocess, json, os, sys, time, urllib.request

OUT_FILE = os.path.join(os.path.dirname(__file__), 'card_db.json')
RAW = 'https://raw.githubusercontent.com/PokemonTCG/pokemon-tcg-data/master'

def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'binderbot/1.0'})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())

def get_price(card):
    # GitHub data doesn't have prices — use 0, can be updated manually
    return 0

def slim(card, set_info):
    return {
        'id':      set_info.get('id', '') + '-' + card.get('number', ''),
        'name':    card.get('name', ''),
        'set':     set_info.get('ptcgoCode') or set_info.get('id', ''),
        'setName': set_info.get('name', ''),
        'number':  card.get('number', ''),
        'rarity':  card.get('rarity', ''),
        'type':    card.get('supertype', ''),
        'img':     (card.get('images') or {}).get('small', ''),
        'price':   0,
    }

def main():
    print('Fetching set list from GitHub...')
    sets = fetch(f'{RAW}/sets/en.json')
    print(f'Found {len(sets)} sets')

    all_cards = []
    failed = []

    for i, s in enumerate(sets):
        sid = s.get('id', '')
        name = s.get('name', sid)
        print(f'  [{i+1}/{len(sets)}] {name} ({sid})...', end=' ', flush=True)
        try:
            cards = fetch(f'{RAW}/cards/en/{sid}.json')
            slim_cards = [slim(c, s) for c in cards]
            all_cards.extend(slim_cards)
            print(f'{len(cards)} cards')
        except Exception as e:
            print(f'FAILED: {e}')
            failed.append(sid)
        time.sleep(0.05)

    if failed:
        print(f'\nFailed sets: {failed}')

    print(f'\nSaving {len(all_cards)} cards to {OUT_FILE}...')
    with open(OUT_FILE, 'w') as f:
        json.dump(all_cards, f, separators=(',', ':'))

    size_mb = os.path.getsize(OUT_FILE) / 1024 / 1024
    print(f'Done! {size_mb:.1f} MB — {len(all_cards)} cards total')

if __name__ == '__main__':
    main()
