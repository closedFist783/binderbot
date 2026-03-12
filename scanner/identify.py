"""
Card identification — OCR the card number + name, look up in local cards.db.
No network calls. Run scripts/build_card_db.py once to populate the database.
"""
import os
import re
import sqlite3

from PIL import Image, ImageFilter, ImageEnhance
import PIL.ImageOps

try:
    import pytesseract
    TESSERACT_OK = True
except ImportError:
    TESSERACT_OK = False
    print('[identify] WARNING: pytesseract not installed — OCR disabled')

CARDS_DB = os.path.join(os.path.dirname(__file__), '..', 'cards.db')

# ── Image preprocessing ───────────────────────────────────────────────────────

def _preprocess(img: Image.Image, threshold: int = 140) -> Image.Image:
    """Greyscale → autocontrast → sharpen → binary threshold → 2× scale."""
    img = img.convert('L')
    img = PIL.ImageOps.autocontrast(img, cutoff=2)
    img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
    img = img.point(lambda x: 0 if x < threshold else 255)
    img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
    return img

# ── OCR helpers ───────────────────────────────────────────────────────────────

_NUMBER_RE = re.compile(r'([A-Za-z]{0,5})\s*(\d{1,4})\s*/\s*(\d{1,4})')

def _fix_digits(s: str) -> str:
    """Correct common OCR digit confusions."""
    return (s.replace('O', '0').replace('o', '0')
             .replace('l', '1').replace('I', '1')
             .replace('B', '8').replace('S', '5')
             .replace('Z', '2').replace('z', '2'))

def ocr_card_number(img: Image.Image) -> tuple[str | None, int | None]:
    """
    Return (card_number, set_total) e.g. ('181', 198), or (None, None).
    Two-pass: broad scan to find the region, then zoom with digits-only whitelist.
    """
    if not TESSERACT_OK:
        return None, None

    w, h = img.size
    bottom = img.crop((0, int(h * 0.50), w, h))
    proc = _preprocess(bottom)

    # Pass 1 — try multiple thresholds and PSM modes until we find a number
    raw = ''
    for thresh in (140, 110, 170):
        proc = _preprocess(bottom, threshold=thresh)
        for psm in (6, 11):
            candidate = pytesseract.image_to_string(proc, config=f'--oem 1 --psm {psm}')
            if _NUMBER_RE.search(candidate):
                raw = candidate
                print(f'[identify] OCR pass1 hit (thresh={thresh} psm={psm}): {candidate.strip()!r}')
                break
        if raw:
            break
    if not raw:
        # Last resort: use the last attempt
        print(f'[identify] OCR pass1 no match found')
    else:
        print(f'[identify] OCR pass1: {raw.strip()!r}')

    # Pass 2 — zoom into the slash-token region with digits-only whitelist
    try:
        data = pytesseract.image_to_data(proc, config='--oem 1 --psm 6',
                                         output_type=pytesseract.Output.DICT)
        slash_idx = next(
            (i for i, t in enumerate(data['text']) if '/' in t and re.search(r'\d', t)),
            None
        )
        if slash_idx is not None:
            idxs = range(max(0, slash_idx - 1), min(len(data['text']), slash_idx + 2))
            x1 = min(data['left'][i] for i in idxs)
            y1 = min(data['top'][i] for i in idxs)
            x2 = max(data['left'][i] + data['width'][i] for i in idxs)
            y2 = max(data['top'][i] + data['height'][i] for i in idxs)
            pad = 12
            region = proc.crop((max(0, x1 - pad), max(0, y1 - pad), x2 + pad, y2 + pad))
            region = region.resize((region.width * 3, region.height * 3), Image.LANCZOS)
            zoomed = pytesseract.image_to_string(
                region,
                config='--oem 1 --psm 7 -c tessedit_char_whitelist=0123456789/'
            ).strip()
            print(f'[identify] OCR pass2 zoom: {zoomed!r}')
            m2 = re.search(r'(\d{1,4})/(\d{1,4})', zoomed)
            if m2:
                return m2.group(1).lstrip('0') or '0', int(m2.group(2))
    except Exception as e:
        print(f'[identify] OCR pass2 error: {e}')

    # Fallback — use pass1 raw with digit correction
    m = _NUMBER_RE.search(raw)
    if m:
        num = _fix_digits(m.group(2)).lstrip('0') or '0'
        total = int(_fix_digits(m.group(3))) if m.group(3).isdigit() else None
        return num, total

    return None, None


def ocr_card_name(img: Image.Image) -> str | None:
    """
    Read the card name from the top of the card.
    Card names are large bold text — try multiple thresholds and crop heights.
    """
    if not TESSERACT_OK:
        return None
    w, h = img.size
    # Try a few crop heights — name bar height varies by card type
    for frac in (0.10, 0.14, 0.18):
        strip = img.crop((0, 0, w, int(h * frac)))
        for thresh in (120, 100, 140):
            proc = _preprocess(strip, threshold=thresh)
            raw = pytesseract.image_to_string(proc, config='--oem 1 --psm 7').strip()
            raw = re.sub(r'[^A-Za-z0-9\'\- ]+', ' ', raw).strip()
            if len(raw) >= 3 and re.search(r'[A-Za-z]{3}', raw):
                print(f'[identify] OCR name (frac={frac} thresh={thresh}): {raw!r}')
                return raw
    return None

# ── Local DB lookup ───────────────────────────────────────────────────────────

def _db_search_by_name(name: str) -> list[dict]:
    """Fuzzy search cards.db by card name."""
    if not os.path.exists(CARDS_DB):
        return []
    try:
        conn = sqlite3.connect(CARDS_DB)
        conn.row_factory = sqlite3.Row
        # Exact match first
        rows = conn.execute(
            'SELECT * FROM cards WHERE LOWER(name) = ? LIMIT 10',
            (name.lower(),)
        ).fetchall()
        if not rows:
            # Contains match
            rows = conn.execute(
                'SELECT * FROM cards WHERE LOWER(name) LIKE ? LIMIT 20',
                (f'%{name.lower()}%',)
            ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f'[identify] DB name search error: {e}')
        return []


def _db_search(number: str, set_total: int | None = None) -> list[dict]:
    """Query cards.db by card number (and optionally set total)."""
    if not os.path.exists(CARDS_DB):
        print('[identify] cards.db not found — run scripts/build_card_db.py')
        return []
    try:
        conn = sqlite3.connect(CARDS_DB)
        conn.row_factory = sqlite3.Row
        if set_total:
            rows = conn.execute(
                '''SELECT * FROM cards
                   WHERE CAST(LTRIM(number, "0ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") AS TEXT) = ?
                   AND set_total = ?
                   LIMIT 10''',
                (number, set_total)
            ).fetchall()
        else:
            rows = conn.execute(
                '''SELECT * FROM cards
                   WHERE CAST(LTRIM(number, "0ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") AS TEXT) = ?
                   LIMIT 20''',
                (number,)
            ).fetchall()
        conn.close()
        return [dict(r) for r in rows]
    except Exception as e:
        print(f'[identify] DB error: {e}')
        return []


def _pick_best(candidates: list[dict], ocr_name: str | None) -> tuple[dict | None, float]:
    """
    Pick the best candidate. If we have an OCR name, score by name similarity.
    Otherwise pick the one from the most recent set (highest set_id alphabetically).
    """
    if not candidates:
        return None, 0.0
    if len(candidates) == 1:
        return candidates[0], 0.88

    if ocr_name:
        ocr_lower = ocr_name.lower()
        def name_score(c):
            name = (c.get('name') or '').lower()
            # Simple overlap score
            matches = sum(1 for w in name.split() if w in ocr_lower or ocr_lower in w)
            return matches
        ranked = sorted(candidates, key=name_score, reverse=True)
        best = ranked[0]
        score = name_score(best)
        confidence = min(0.92, 0.70 + score * 0.08) if score > 0 else 0.65
        return best, confidence

    # No name — prefer most recent set (sort by set_id desc as proxy for recency)
    ranked = sorted(candidates, key=lambda c: c.get('set_id') or '', reverse=True)
    return ranked[0], 0.70

# ── Main entry point ──────────────────────────────────────────────────────────

def identify_card(img: Image.Image) -> dict:
    """
    Given a PIL Image of a card, return identification dict.
    Queries local cards.db — no network calls.
    """
    result = {
        'tcg_id': None, 'name': 'Unknown', 'set_name': None, 'set_code': None,
        'card_number': None, 'rarity': None, 'supertype': None,
        'image_url': None, 'tcgplayer_price': None,
        'identified_by': 'failed', 'confidence': 0.0, 'needs_review': 1,
    }

    # Step 1: OCR card number and name in parallel
    number, set_total = ocr_card_number(img)
    ocr_name = ocr_card_name(img)
    print(f'[identify] OCR number={number!r} set_total={set_total!r} name={ocr_name!r}')

    result['card_number'] = f'{number}/{set_total}' if number and set_total else (number or None)

    # Step 2: Name-first lookup — most reliable when name OCR works
    candidates = []
    if ocr_name:
        candidates = _db_search_by_name(ocr_name)
        print(f'[identify] DB by name: {len(candidates)} candidates')
        # If we also have a number, filter name results by set_total
        if candidates and set_total:
            filtered = [c for c in candidates if c.get('set_total') == set_total]
            if filtered:
                candidates = filtered
                print(f'[identify] Filtered by set_total={set_total}: {len(candidates)}')

    # Step 3: Fallback to number lookup
    if not candidates and number:
        candidates = _db_search(number, set_total)
        print(f'[identify] DB by number: {len(candidates)} candidates')
        if not candidates:
            candidates = _db_search(number)
            print(f'[identify] DB by number (no set filter): {len(candidates)} candidates')

    if not candidates:
        result['identified_by'] = 'failed'
        return result

    # Step 4: Pick best candidate
    card, confidence = _pick_best(candidates, ocr_name)

    if card:
        result.update({
            'tcg_id':          card['id'],
            'name':            card['name'],
            'set_name':        card['set_name'],
            'set_code':        card['set_id'],
            'card_number':     card['number'],
            'rarity':          card['rarity'],
            'supertype':       card['supertype'],
            'image_url':       card['image_small'],
            'tcgplayer_price': card['price_market'],
            'identified_by':   'local_db',
            'confidence':      round(confidence, 3),
            'needs_review':    0 if confidence >= 0.75 else 1,
        })

    return result
