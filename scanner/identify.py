"""
Card identification — OCR the full card image, look up in local cards.db.
No network calls. Run scripts/build_card_db.py once to populate the database.

Confidence levels:
  >= 0.88  — name + number match, single candidate         → auto-accepted
  >= 0.75  — name match with multiple candidates, best pick → auto-accepted
  >= 0.50  — partial match, low certainty                   → flagged for review
  <  0.50  — failed / wild guess                            → flagged for review
"""
import os
import re
import sqlite3

from PIL import Image, ImageFilter
import PIL.ImageOps

try:
    import pytesseract
    TESSERACT_OK = True
except ImportError:
    TESSERACT_OK = False
    print('[identify] WARNING: pytesseract not installed — OCR disabled')

CARDS_DB = os.path.join(os.path.dirname(__file__), '..', 'cards.db')

# ── Preprocessing ─────────────────────────────────────────────────────────────

def _preprocess(img: Image.Image, threshold: int = 140) -> Image.Image:
    """Greyscale → autocontrast → sharpen → binary threshold → 2× scale."""
    img = img.convert('L')
    img = PIL.ImageOps.autocontrast(img, cutoff=2)
    img = img.filter(ImageFilter.UnsharpMask(radius=1, percent=150, threshold=3))
    img = img.point(lambda x: 0 if x < threshold else 255)
    img = img.resize((img.width * 2, img.height * 2), Image.LANCZOS)
    return img

# ── OCR ───────────────────────────────────────────────────────────────────────

_NUMBER_RE = re.compile(r'[A-Za-z]{0,5}\s*(\d{1,4})\s*/\s*(\d{1,4})')

_BODY_WORDS = {
    'search', 'your', 'deck', 'pokemon', 'bench', 'shuffle', 'play',
    'turn', 'during', 'item', 'trainer', 'supporter', 'stadium', 'tool',
    'damage', 'energy', 'discard', 'attach', 'draw', 'hand', 'card',
    'flip', 'coin', 'heads', 'tails', 'effect', 'active', 'retreat',
    'evolve', 'basic', 'stage', 'special', 'switch',
}

def _fix_digits(s: str) -> str:
    return (s.replace('O', '0').replace('o', '0')
             .replace('l', '1').replace('B', '8')
             .replace('S', '5').replace('Z', '2').replace('z', '2'))


def ocr_scan(img: Image.Image) -> tuple[str | None, int | None, str | None]:
    """
    Scan the full image and return (number, set_total, name).
    Tries multiple threshold values until it finds a card number.
    """
    if not TESSERACT_OK:
        return None, None, None

    number, set_total, name = None, None, None
    best_raw = ''

    for thresh in (140, 110, 170, 90):
        proc = _preprocess(img, threshold=thresh)
        raw = pytesseract.image_to_string(proc, config='--oem 1 --psm 6')

        # Find card number
        m = _NUMBER_RE.search(raw)
        if m and not number:
            try:
                n = _fix_digits(m.group(1)).lstrip('0') or '0'
                t = int(_fix_digits(m.group(2)))
                number, set_total = n, t
                best_raw = raw
                print(f'[identify] OCR number={number}/{set_total} (thresh={thresh})')
            except ValueError:
                pass

        # Find card name — first clean non-body line
        if not name:
            for line in raw.splitlines():
                clean = re.sub(r'[^A-Za-z0-9\'\- ]+', ' ', line).strip()
                words = clean.split()
                if (1 <= len(words) <= 5
                        and re.search(r'[A-Za-z]{3}', clean)
                        and not re.search(r'\d{2,}', clean)
                        and len(clean) >= 3
                        and not any(w in _BODY_WORDS for w in clean.lower().split())):
                    name = clean
                    print(f'[identify] OCR name={name!r} (thresh={thresh})')
                    break

        if number and name:
            break

    # Pass 2: zoom into number region for digit accuracy
    if number and set_total:
        try:
            proc = _preprocess(img, threshold=140)
            data = pytesseract.image_to_data(
                proc, config='--oem 1 --psm 6',
                output_type=pytesseract.Output.DICT
            )
            slash_idx = next(
                (i for i, t in enumerate(data['text'])
                 if '/' in t and re.search(r'\d', t)), None
            )
            if slash_idx is not None:
                idxs = range(max(0, slash_idx - 1), min(len(data['text']), slash_idx + 2))
                x1 = min(data['left'][i] for i in idxs)
                y1 = min(data['top'][i] for i in idxs)
                x2 = max(data['left'][i] + data['width'][i] for i in idxs)
                y2 = max(data['top'][i] + data['height'][i] for i in idxs)
                pad = 12
                region = proc.crop((max(0, x1-pad), max(0, y1-pad), x2+pad, y2+pad))
                region = region.resize((region.width * 3, region.height * 3), Image.LANCZOS)
                zoomed = pytesseract.image_to_string(
                    region,
                    config='--oem 1 --psm 7 -c tessedit_char_whitelist=0123456789/'
                ).strip()
                m2 = re.search(r'(\d{1,4})/(\d{1,4})', zoomed)
                if m2:
                    number = m2.group(1).lstrip('0') or '0'
                    set_total = int(m2.group(2))
                    print(f'[identify] OCR zoom: {number}/{set_total}')
        except Exception as e:
            print(f'[identify] OCR zoom error: {e}')

    return number, set_total, name

# ── DB lookup ─────────────────────────────────────────────────────────────────

def _db_conn():
    conn = sqlite3.connect(CARDS_DB)
    conn.row_factory = sqlite3.Row
    return conn


def _to_card(r) -> dict:
    return {
        'id': r['id'], 'name': r['name'], 'number': r['number'],
        'set_id': r['set_id'], 'set_name': r['set_name'], 'set_total': r['set_total'],
        'rarity': r['rarity'], 'supertype': r['supertype'],
        'image_small': r['image_small'], 'price_market': r['price_market'],
    }


def _name_variants(name: str) -> list[str]:
    """Generate OCR-error variants of a name to try in DB searches."""
    variants = [name]
    # Common OCR letter confusions in words: i↔l, rn↔m, 0↔O, etc.
    subs = [('i', 'l'), ('l', 'i'), ('rn', 'm'), ('m', 'rn'),
            ('ii', 'll'), ('ll', 'ii'), ('1', 'l'), ('0', 'o')]
    for a, b in subs:
        v = name.replace(a, b)
        if v != name and v not in variants:
            variants.append(v)
    return variants


def db_search_name(name: str) -> list[dict]:
    if not os.path.exists(CARDS_DB):
        return []
    try:
        conn = _db_conn()
        rows = []

        # 1. Exact match
        rows = conn.execute(
            'SELECT * FROM cards WHERE LOWER(name) = ? LIMIT 20', (name.lower(),)
        ).fetchall()

        # 2. Try OCR variants (e.g. "Nest Bail" → "Nest Ball")
        if not rows:
            for variant in _name_variants(name):
                if variant == name:
                    continue
                rows = conn.execute(
                    'SELECT * FROM cards WHERE LOWER(name) = ? LIMIT 20',
                    (variant.lower(),)
                ).fetchall()
                if rows:
                    print(f'[identify] Name variant match: "{name}" → "{variant}"')
                    break

        # 3. Full phrase LIKE
        if not rows:
            rows = conn.execute(
                'SELECT * FROM cards WHERE LOWER(name) LIKE ? LIMIT 20',
                (f'%{name.lower()}%',)
            ).fetchall()

        # 4. Word-by-word: search by each significant word individually
        if not rows:
            words = [w for w in name.split() if len(w) >= 4]
            for word in words:
                for variant in _name_variants(word):
                    r = conn.execute(
                        'SELECT * FROM cards WHERE LOWER(name) LIKE ? LIMIT 20',
                        (f'%{variant.lower()}%',)
                    ).fetchall()
                    if r:
                        rows = r
                        print(f'[identify] Word match: "{word}" → "{variant}"')
                        break
                if rows:
                    break

        conn.close()
        result = [_to_card(r) for r in rows]
        print(f'[identify] DB name search "{name}": {len(result)} results')
        return result
    except Exception as e:
        print(f'[identify] DB error: {e}')
        return []


def db_search_number(number: str, set_total: int | None = None) -> list[dict]:
    if not os.path.exists(CARDS_DB):
        return []
    try:
        conn = _db_conn()
        # Strip leading zeros and letters from stored number for comparison
        if set_total:
            rows = conn.execute(
                '''SELECT * FROM cards
                   WHERE CAST(LTRIM(number,"0ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") AS TEXT) = ?
                   AND set_total = ? LIMIT 20''',
                (number, set_total)
            ).fetchall()
        else:
            rows = conn.execute(
                '''SELECT * FROM cards
                   WHERE CAST(LTRIM(number,"0ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") AS TEXT) = ?
                   LIMIT 20''',
                (number,)
            ).fetchall()
        conn.close()
        result = [_to_card(r) for r in rows]
        print(f'[identify] DB number search {number}/{set_total}: {len(result)} results')
        return result
    except Exception as e:
        print(f'[identify] DB error: {e}')
        return []


def _name_score(candidate_name: str, ocr_name: str) -> float:
    """0–1 similarity score between a DB card name and OCR-read name."""
    a = candidate_name.lower()
    b = ocr_name.lower()
    if a == b:
        return 1.0
    if a in b or b in a:
        return 0.85
    a_words = set(a.split())
    b_words = set(b.split())
    overlap = a_words & b_words
    if overlap:
        return 0.5 + 0.3 * (len(overlap) / max(len(a_words), len(b_words)))
    return 0.0


def pick_best(candidates: list[dict], ocr_name: str | None) -> tuple[dict | None, float]:
    if not candidates:
        return None, 0.0
    if len(candidates) == 1:
        base = 0.88 if ocr_name else 0.72
        return candidates[0], base

    if ocr_name:
        scored = [(c, _name_score(c['name'], ocr_name)) for c in candidates]
        scored.sort(key=lambda x: x[1], reverse=True)
        best, score = scored[0]
        confidence = min(0.95, 0.60 + score * 0.35)
        return best, confidence

    # No name — prefer most recent set
    ranked = sorted(candidates, key=lambda c: c.get('set_id') or '', reverse=True)
    return ranked[0], 0.60

# ── Main entry point ──────────────────────────────────────────────────────────

def identify_card(img: Image.Image) -> dict:
    """
    Identify a Pokémon card from a PIL Image. Returns a result dict.
    Confidence: 0.0–1.0. Cards below 0.75 are flagged needs_review=1.
    """
    result = {
        'tcg_id': None, 'name': 'Unknown', 'set_name': None, 'set_code': None,
        'card_number': None, 'rarity': None, 'supertype': None,
        'image_url': None, 'tcgplayer_price': None,
        'identified_by': 'failed', 'confidence': 0.0, 'needs_review': 1,
    }

    number, set_total, ocr_name = ocr_scan(img)
    result['card_number'] = f'{number}/{set_total}' if number and set_total else number

    candidates = []

    # Name-first: most reliable signal
    if ocr_name:
        candidates = db_search_name(ocr_name)
        if candidates and set_total:
            filtered = [c for c in candidates if c.get('set_total') == set_total]
            if filtered:
                candidates = filtered

    # Number fallback
    if not candidates and number:
        candidates = db_search_number(number, set_total)
    if not candidates and number:
        candidates = db_search_number(number)

    if not candidates:
        return result

    card, confidence = pick_best(candidates, ocr_name)
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
