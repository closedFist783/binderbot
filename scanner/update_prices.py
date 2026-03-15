"""
Update prices in card_db.json from pokemontcg.io.
Uses curl_cffi to impersonate Chrome's TLS fingerprint (bypasses Cloudflare).

Run: python3 update_prices.py
Or for a specific set: python3 update_prices.py PAR sv4
"""
import json, os, sys, time

DB_FILE  = os.path.join(os.path.dirname(__file__), 'card_db.json')
API_KEY  = os.environ.get('TCG_API_KEY', '')

def get_price(card_data):
    p = card_data.get('tcgplayer', {}).get('prices', {})
    for variant in ('holofoil', 'normal', 'reverseHolofoil', 'unlimitedHolofoil', '1stEditionHolofoil'):
        v = p.get(variant, {})
        if v and v.get('market'):
            return round(v['market'], 2)
    return 0

def fetch_prices_for_set(session, set_code, page_size=250):
    headers = {}
    if API_KEY:
        headers['X-Api-Key'] = API_KEY
    results = {}
    page = 1
    while True:
        r = session.get(
            'https://api.pokemontcg.io/v2/cards',
            params={'q': f'set.ptcgoCode:{set_code}', 'pageSize': page_size, 'page': page,
                    'select': 'id,number,set,tcgplayer'},
            headers=headers,
            timeout=15,
        )
        data = r.json()
        cards = data.get('data', [])
        if not cards:
            break
        for c in cards:
            number = c.get('number', '')
            results[number] = get_price(c)
        if len(cards) < page_size:
            break
        page += 1
    return results

def main():
    try:
        from curl_cffi import requests as cf_requests
    except ImportError:
        print('Installing curl_cffi...')
        os.system(f'{sys.executable} -m pip install -q curl_cffi')
        from curl_cffi import requests as cf_requests

    if not os.path.exists(DB_FILE):
        print('card_db.json not found — run fetch_cards.py first')
        sys.exit(1)

    with open(DB_FILE) as f:
        db = json.load(f)

    # Determine which sets to update
    filter_sets = set(sys.argv[1:]) if len(sys.argv) > 1 else None

    all_sets = {}
    for card in db:
        s = card.get('set', '')
        if s:
            all_sets.setdefault(s, []).append(card)

    sets_to_update = {s: cards for s, cards in all_sets.items()
                      if not filter_sets or s in filter_sets}

    print(f'Updating prices for {len(sets_to_update)} sets ({sum(len(v) for v in sets_to_update.values())} cards)...')
    if not API_KEY:
        print('Warning: TCG_API_KEY not set — rate limits apply')

    session = cf_requests.Session(impersonate='chrome')
    updated = 0
    failed = []

    for i, (set_code, cards) in enumerate(sets_to_update.items()):
        set_name = cards[0].get('setName', set_code)
        print(f'  [{i+1}/{len(sets_to_update)}] {set_name} ({set_code})...', end=' ', flush=True)
        try:
            prices = fetch_prices_for_set(session, set_code)
            for card in cards:
                p = prices.get(card['number'], 0)
                card['price'] = p
                if p > 0:
                    updated += 1
            print(f'{len(prices)} prices, {sum(1 for c in cards if c["price"] > 0)}/{len(cards)} matched')
        except Exception as e:
            print(f'FAILED: {e}')
            failed.append(set_code)
        time.sleep(0.1)

    print(f'\nSaving updated db ({updated} prices updated)...')
    with open(DB_FILE, 'w') as f:
        json.dump(db, f, separators=(',', ':'))

    if failed:
        print(f'Failed sets: {failed}')
    print('Done!')

if __name__ == '__main__':
    main()
