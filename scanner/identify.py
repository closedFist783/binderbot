"""
Card identification: OCR the card number → PokéTCG API lookup.
Falls back to perceptual hash matching if OCR fails.
"""
import re
import json
import os
import time
import requests
import sqlite3
from PIL import Image, ImageFilter, ImageEnhance
import imagehash

try:
    import pytesseract
    TESSERACT_OK = True
except ImportError:
    TESSERACT_OK = False

POKEMON_TCG_API = 'https://api.pokemontcg.io/v2'
API_KEY = os.environ.get('POKEMON_TCG_API_KEY', '')  # optional — raises rate limit from 100 to 1000/day

CACHE_DIR = os.path.join(os.path.dirname(__file__), '..', 'cache')
os.makedirs(CACHE_DIR, exist_ok=True)

CARDS_DB = os.path.join(os.path.dirname(__file__), '..', 'cards.db')

# ── OCR helpers ──────────────────────────────────────────────────────────────

def preprocess_for_ocr(img: Image.Image) -> Image.Image:
    """
    Prepare image for OCR: autocontrast, sharpen, binarize.
    Avoids over-boosting contrast which blows out light card backgrounds.
    """
    import PIL.ImageOps
    img = img.convert('L')
    # Autocontrast: stretch histogram without crushing highlights
    img = PIL.ImageOps.autocontrast(img, cutoff=2)
    img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
    # Binary threshold — text is dark on light background
    img = img.point(lambda x: 0 if x < 160 else 255)
    # Scale up for Tesseract
    img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
    return img

def _ocr_zoom_number(img: Image.Image, raw_text: str) -> str | None:
    """
    Given OCR text that contains a rough number match, find the bounding box
    of that text region and re-OCR it zoomed in with digits-only whitelist.
    Falls back to correcting common digit confusions in the raw match.
    """
    # Common OCR digit confusion fixes: 0↔O, 1↔l↔I, 8↔B, 5↔S, 2↔Z
    def fix_digits(s: str) -> str:
        return (s.replace('O', '0').replace('o', '0')
                 .replace('l', '1').replace('I', '1')
                 .replace('B', '8').replace('S', '5')
                 .replace('Z', '2').replace('z', '2'))

    matches = re.findall(r'([A-Za-z]{0,5})\s*(\d{1,4})\s*/\s*(\d{1,4})', raw_text)
    if not matches:
        return None
    m = matches[-1]
    num = f'{fix_digits(m[1])}/{fix_digits(m[2])}'
    print(f'[identify] OCR matched (corrected): {num!r}')
    return num

def ocr_card_number(img: Image.Image) -> str | None:
    """
    Two-pass OCR:
    1. Full bottom-40% scan to find approximate number location
    2. Zoom into the number region and re-OCR with digits-only for accuracy
    """
    if not TESSERACT_OK:
        return None

    # Pass 1: try bottom 50% with PSM 6, then PSM 11 if nothing found
    w, h = img.size
    bottom = img.crop((0, int(h * 0.50), w, h))
    processed = preprocess_for_ocr(bottom)

    raw = pytesseract.image_to_string(processed, config='--oem 1 --psm 6')
    print(f'[identify] OCR pass1 raw: {raw!r}')

    # If PSM 6 found nothing, try PSM 11 (sparse — finds any text anywhere)
    if not re.search(r'\d{2,4}\s*/\s*\d{2,4}', raw):
        raw2 = pytesseract.image_to_string(processed, config='--oem 1 --psm 11')
        print(f'[identify] OCR pass1 psm11 raw: {raw2!r}')
        if re.search(r'\d{2,4}\s*/\s*\d{2,4}', raw2):
            raw = raw2

    # Pass 2: find the slash-number substring, re-OCR it with digits-only whitelist
    # Extract bounding boxes for digit clusters near a slash
    try:
        data = pytesseract.image_to_data(processed, config='--oem 1 --psm 6', output_type=pytesseract.Output.DICT)
        texts = data['text']
        # Find index of a token containing '/'
        slash_idx = next((i for i, t in enumerate(texts) if '/' in t and re.search(r'\d', t)), None)
        if slash_idx is not None:
            # Grab surrounding tokens too
            x1 = min(data['left'][max(0, slash_idx-1):slash_idx+2])
            y1 = min(data['top'][max(0, slash_idx-1):slash_idx+2])
            x2 = max(data['left'][i] + data['width'][i] for i in range(max(0, slash_idx-1), min(len(texts), slash_idx+2)))
            y2 = max(data['top'][i] + data['height'][i] for i in range(max(0, slash_idx-1), min(len(texts), slash_idx+2)))
            pad = 10
            region = processed.crop((max(0, x1-pad), max(0, y1-pad), x2+pad, y2+pad))
            region = region.resize((region.width * 3, region.height * 3), Image.LANCZOS)
            raw2 = pytesseract.image_to_string(
                region,
                config='--oem 1 --psm 7 -c tessedit_char_whitelist=0123456789/'
            ).strip()
            print(f'[identify] OCR pass2 zoom raw: {raw2!r}')
            m2 = re.search(r'(\d{1,4})/(\d{1,4})', raw2)
            if m2:
                num = f'{m2.group(1)}/{m2.group(2)}'
                print(f'[identify] OCR result (zoom): {num!r}')
                return num
    except Exception as e:
        print(f'[identify] OCR pass2 failed: {e}')

    # Fallback: use pass1 result with digit correction
    return _ocr_zoom_number(img, raw)

# ── PokéTCG API ──────────────────────────────────────────────────────────────

import ssl
import http.client
import urllib.parse
import json as _json

def _api_get(path, params=None, retries=2):
    """HTTP/1.1 only via stdlib http.client — avoids H2 ALPN stall on Pi."""
    url_path = f'/v2/{path}'
    if params:
        url_path += '?' + urllib.parse.urlencode(params)
    hdrs = {'X-Api-Key': API_KEY} if API_KEY else {}
    last_err = None
    for attempt in range(retries + 1):
        try:
            ctx = ssl.create_default_context()
            ctx.set_alpn_protocols(['http/1.1'])  # prevent H2 negotiation stall
            conn = http.client.HTTPSConnection('api.pokemontcg.io', context=ctx, timeout=15)
            conn.request('GET', url_path, headers=hdrs)
            resp = conn.getresponse()
            data = _json.loads(resp.read().decode())
            conn.close()
            return data
        except Exception as e:
            last_err = e
            if attempt < retries:
                print(f'[identify] API attempt {attempt+1} failed, retrying... ({e})')
                time.sleep(1)
    raise last_err

def _local_search(card_number: str) -> list[dict]:
    """Search the local cards.db for this card number."""
    if not os.path.exists(CARDS_DB):
        return []
    import sqlite3 as _sqlite3
    num_part = card_number.split('/')[0].lstrip('0') or '0'
    num_clean = re.sub(r'^[A-Za-z]+', '', num_part).lstrip('0') or '0'
    try:
        conn = _sqlite3.connect(CARDS_DB)
        conn.row_factory = _sqlite3.Row
        rows = conn.execute(
            'SELECT * FROM cards WHERE CAST(LTRIM(number, "0") AS TEXT) = ? LIMIT 30',
            (num_clean,)
        ).fetchall()
        conn.close()
        # Convert to API-compatible dict format
        result = []
        for r in rows:
            result.append({
                'id': r['id'],
                'name': r['name'],
                'number': r['number'],
                'set': {'id': r['set_id'], 'name': r['set_name'], 'total': r['set_total']},
                'rarity': r['rarity'],
                'supertype': r['supertype'],
                'images': {'small': r['image_small'], 'large': r['image_large']},
                'tcgplayer': {'prices': {'normal': {'market': r['price_market']}}} if r['price_market'] else {},
            })
        print(f'[identify] Local DB: {len(result)} candidates for number {num_clean!r}')
        return result
    except Exception as e:
        print(f'[identify] Local DB error: {e}')
        return []


def search_by_number(card_number: str) -> list[dict]:
    """Search local DB first, fall back to API."""
    # Try local DB first
    candidates = _local_search(card_number)
    if candidates:
        return candidates

    # Fall back to API
    num_part = card_number.split('/')[0].lstrip('0') or '0'
    num_clean = re.sub(r'^[A-Z]+', '', num_part).lstrip('0') or '0'
    try:
        data = _api_get('cards', {'q': f'number:{num_clean}', 'pageSize': 20})
        return data.get('data', [])
    except Exception as e:
        print(f'[identify] API error: {e}')
        return []

def best_card_match(candidates: list[dict], img: Image.Image) -> tuple[dict | None, float]:
    """
    Pick best match from API candidates using perceptual hash comparison
    against the card's API image. Returns (card, confidence 0-1).
    """
    if not candidates:
        return None, 0.0
    if len(candidates) == 1:
        return candidates[0], 0.85

    scan_hash = imagehash.phash(img)
    best, best_score = None, float('inf')
    for card in candidates:
        img_url = card.get('images', {}).get('small')
        if not img_url:
            continue
        cached = _cached_hash(card['id'])
        if cached is None:
            try:
                resp = requests.get(img_url, timeout=8)
                ref_img = Image.open(__import__('io').BytesIO(resp.content))
                cached = imagehash.phash(ref_img)
                _store_hash(card['id'], str(cached))
            except Exception:
                continue
        diff = scan_hash - cached
        if diff < best_score:
            best_score, best = diff, card

    # phash diff: 0 = identical, >15 = probably wrong card
    confidence = max(0.0, 1.0 - (best_score / 20.0))
    return best, confidence

def _cached_hash(tcg_id: str):
    path = os.path.join(CACHE_DIR, f'{tcg_id}.hash')
    if os.path.exists(path):
        with open(path) as f:
            return imagehash.hex_to_hash(f.read().strip())
    return None

def _store_hash(tcg_id: str, h: str):
    with open(os.path.join(CACHE_DIR, f'{tcg_id}.hash'), 'w') as f:
        f.write(h)

# ── Main entry point ─────────────────────────────────────────────────────────

def identify_card(img: Image.Image) -> dict:
    """
    Given a PIL Image of a card, return identification dict:
    {
        tcg_id, name, set_name, set_code, card_number, rarity,
        supertype, image_url, tcgplayer_price,
        identified_by, confidence, needs_review
    }
    """
    result = {
        'tcg_id': None, 'name': 'Unknown', 'set_name': None, 'set_code': None,
        'card_number': None, 'rarity': None, 'supertype': None,
        'image_url': None, 'tcgplayer_price': None,
        'identified_by': 'failed', 'confidence': 0.0, 'needs_review': 1,
    }

    # Step 1: OCR the card number
    card_number = ocr_card_number(img)
    print(f'[identify] OCR result: {card_number!r}')

    candidates = []
    if card_number:
        result['card_number'] = card_number
        candidates = search_by_number(card_number)

    # Step 1b: narrow candidates by set total (the second number, e.g. 198 in 181/198)
    if card_number and '/' in card_number:
        try:
            set_total = int(card_number.split('/')[1])
            filtered = [c for c in candidates if c.get('set', {}).get('total') == set_total]
            if filtered:
                print(f'[identify] Filtered to {len(filtered)} candidates by set total={set_total}')
                candidates = filtered
        except (ValueError, IndexError):
            pass

    # Step 2: Pick best match (hash comparison if multiple, direct if only one)
    if len(candidates) == 1:
        card, confidence = candidates[0], 0.88
    else:
        card, confidence = best_card_match(candidates, img)

    if card and confidence >= 0.5:
        prices = card.get('tcgplayer', {}).get('prices', {})
        # Try to get market price from any available price category
        price = None
        for cat in ['holofoil', 'reverseHolofoil', 'normal', '1stEditionHolofoil']:
            p = prices.get(cat, {}).get('market')
            if p:
                price = p
                break

        result.update({
            'tcg_id':         card['id'],
            'name':           card.get('name', 'Unknown'),
            'set_name':       card.get('set', {}).get('name'),
            'set_code':       card.get('set', {}).get('id'),
            'card_number':    card.get('number', card_number),
            'rarity':         card.get('rarity'),
            'supertype':      card.get('supertype'),
            'image_url':      card.get('images', {}).get('small'),
            'tcgplayer_price': price,
            'identified_by':  'ocr' if card_number else 'image_hash',
            'confidence':     round(confidence, 3),
            'needs_review':   0 if confidence >= 0.75 else 1,
        })
    else:
        # Flag for manual review
        result['needs_review'] = 1
        result['identified_by'] = 'failed'

    return result
