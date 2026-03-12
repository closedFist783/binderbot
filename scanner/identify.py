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

# ── OCR helpers ──────────────────────────────────────────────────────────────

def preprocess_for_ocr(img: Image.Image) -> Image.Image:
    """Crop bottom strip of card (card number lives there), boost contrast."""
    w, h = img.size
    # Card number is roughly bottom 12% of the card
    strip = img.crop((0, int(h * 0.85), w, h))
    strip = strip.convert('L')                          # grayscale
    strip = ImageEnhance.Contrast(strip).enhance(3.0)   # crank contrast
    strip = strip.filter(ImageFilter.SHARPEN)
    strip = strip.resize((strip.width * 3, strip.height * 3), Image.LANCZOS)
    return strip

def ocr_card_number(img: Image.Image) -> str | None:
    """Return raw card number string like '045/189' or 'SVIm 181/198', or None."""
    if not TESSERACT_OK:
        return None
    strip = preprocess_for_ocr(img)
    # Try multiple PSM modes — card numbers are short, single-line text
    for psm in (7, 6, 8):
        raw = pytesseract.image_to_string(strip, config=f'--psm {psm}')
        raw = raw.strip()
        print(f'[identify] OCR psm={psm} raw: {raw!r}')
        # Match number patterns: 181/198, SV181/SV198, SVIm 181/198 etc.
        m = re.search(r'([A-Za-z]{0,5})\s*(\d{1,4})\s*/\s*(\d{1,4})', raw)
        if m:
            num = f'{m.group(2)}/{m.group(3)}'
            print(f'[identify] OCR matched: {num!r}')
            return num
    return None

# ── PokéTCG API ──────────────────────────────────────────────────────────────

def _api_get(path, params=None):
    headers = {'X-Api-Key': API_KEY} if API_KEY else {}
    r = requests.get(f'{POKEMON_TCG_API}/{path}', params=params, headers=headers, timeout=10)
    r.raise_for_status()
    return r.json()

def search_by_number(card_number: str) -> list[dict]:
    """Query API for cards matching this number. Returns list of candidates."""
    # card_number e.g. '045/189' → number part is '45'
    num_part = card_number.split('/')[0].lstrip('0') or '0'
    # Remove letter prefix for query (SV045 → 045 → 45)
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

    # Step 2: Pick best match (hash comparison if multiple)
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
