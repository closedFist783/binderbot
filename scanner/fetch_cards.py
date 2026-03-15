"""
One-time script: download all Pokémon TCG cards from pokemontcg.io
and save a slim local database to card_db.json.

Uses curl to bypass Cloudflare TLS fingerprinting.
Run once: python3 fetch_cards.py
"""
import subprocess, json, os, sys, time

API_KEY = os.environ.get('TCG_API_KEY', '')
OUT_FILE = os.path.join(os.path.dirname(__file__), 'card_db.json')
PAGE_SIZE = 250

def curl_get(url):
    cmd = ['curl', '-s', '--max-time', '30', '-H', 'Accept: application/json']
    if API_KEY:
        cmd += ['-H', 'X-Api-Key: ' + API_KEY]
    cmd.append(url)
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=35)
    if r.returncode != 0 or not r.stdout.strip():
        raise RuntimeError('curl error: ' + r.stderr)
    return json.loads(r.stdout)

def slim(card):
    """Keep only what the UI needs."""
    p = card.get('tcgplayer', {}).get('prices', {})
    price = (
        (p.get('holofoil') or p.get('normal') or p.get('reverseHolofoil') or
         p.get('unlimitedHolofoil') or p.get('1stEditionHolofoil') or {})
        .get('market', 0) or 0
    )
    return {
        'id':       card.get('id', ''),
        'name':     card.get('name', ''),
        'set':      card.get('set', {}).get('ptcgoCode') or card.get('set', {}).get('id', ''),
        'setName':  card.get('set', {}).get('name', ''),
        'number':   card.get('number', ''),
        'rarity':   card.get('rarity', ''),
        'type':     card.get('supertype', ''),
        'img':      card.get('images', {}).get('small', ''),
        'price':    round(price, 2),
    }

def main():
    print(f'Fetching card database (key {"SET" if API_KEY else "NOT SET"})...')

    # Get total count first
    data = curl_get(f'https://api.pokemontcg.io/v2/cards?pageSize=1&page=1')
    total = data.get('totalCount', 0)
    pages = (total + PAGE_SIZE - 1) // PAGE_SIZE
    print(f'Total cards: {total} ({pages} pages)')

    all_cards = []
    for page in range(1, pages + 1):
        url = f'https://api.pokemontcg.io/v2/cards?pageSize={PAGE_SIZE}&page={page}&orderBy=name'
        print(f'  Page {page}/{pages}...', end=' ', flush=True)
        data = curl_get(url)
        cards = data.get('data', [])
        all_cards.extend(slim(c) for c in cards)
        print(f'{len(cards)} cards (total so far: {len(all_cards)})')
        time.sleep(0.1)  # be polite

    print(f'\nSaving {len(all_cards)} cards to {OUT_FILE}...')
    with open(OUT_FILE, 'w') as f:
        json.dump(all_cards, f, separators=(',', ':'))

    size_mb = os.path.getsize(OUT_FILE) / 1024 / 1024
    print(f'Done! {size_mb:.1f} MB')

if __name__ == '__main__':
    main()
