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
from difflib import get_close_matches, SequenceMatcher

from PIL import Image, ImageFilter
import PIL.ImageOps

# Cache of all card names loaded from DB at first use
_name_cache: list[str] | None = None

def _get_name_cache() -> list[str]:
    global _name_cache
    if _name_cache is not None:
        return _name_cache
    if not os.path.exists(CARDS_DB):
        return []
    try:
        conn = sqlite3.connect(CARDS_DB)
        rows = conn.execute('SELECT DISTINCT LOWER(name) FROM cards').fetchall()
        conn.close()
        _name_cache = [r[0] for r in rows]
        print(f'[identify] Loaded {len(_name_cache)} card names into cache')
    except Exception as e:
        print(f'[identify] Name cache error: {e}')
        _name_cache = []
    return _name_cache

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


def ocr_scan(img: Image.Image) -> tuple[str | None, int | None, str | None, str | None]:
    """
    Scan the full image and return (number_stripped, set_total, name, number_display).
    - number_stripped: e.g. '181'  — used for DB lookup (leading zeros removed)
    - set_total:       e.g. 198    — used for DB filtering
    - name:            e.g. 'Nest Ball' — used for fuzzy name search
    - number_display:  e.g. '181/198'  — shown in UI (preserves original OCR string)
    """
    if not TESSERACT_OK:
        return None, None, None, None

    number, set_total, name, number_display = None, None, None, None

    # Try thresholds until we find both number and name (or exhaust options)
    for thresh in (140, 110, 170, 90):
        proc = _preprocess(img, threshold=thresh)
        raw = pytesseract.image_to_string(proc, config='--oem 1 --psm 6')

        # ── Card number ───────────────────────────────────────────────────────
        # Pattern: optional prefix letters, then NNN/NNN (e.g. 181/198, 005/064)
        if not number:
            # Look for ALL slash-number matches, take the last one (closest to bottom)
            all_matches = list(re.finditer(r'(\d{1,4})\s*/\s*(\d{2,4})', raw))
            if all_matches:
                m = all_matches[-1]
                raw_n = _fix_digits(m.group(1))
                raw_t = _fix_digits(m.group(2))
                try:
                    t = int(raw_t)
                    # Sanity check: set total should be plausible (10–300)
                    if 10 <= t <= 400:
                        number = raw_n.lstrip('0') or '0'
                        number_display = f'{raw_n}/{raw_t}'
                        set_total = t
                        print(f'[identify] OCR number: {number_display} (thresh={thresh})')
                except ValueError:
                    pass

        # ── Card name ─────────────────────────────────────────────────────────
        # Score every non-empty line against the card name cache; pick best.
        if not name:
            cache = _get_name_cache()
            best_line, best_score = None, 0.0
            for line in raw.splitlines():
                clean = re.sub(r'[^A-Za-z0-9\'\- ]+', ' ', line).strip()
                if not clean or len(clean) < 3:
                    continue
                close = get_close_matches(clean.lower(), cache, n=1, cutoff=0.4)
                if close:
                    score = SequenceMatcher(None, clean.lower(), close[0]).ratio()
                    if score > best_score:
                        best_score, best_line = score, clean
            if best_line and best_score >= 0.55:
                name = best_line
                print(f'[identify] OCR name: {name!r} score={best_score:.2f} (thresh={thresh})')

        if number and name:
            break

    return number, set_total, name, number_display

# ── DB lookup ─────────────────────────────────────────────────────────────────

def _db_conn():
    conn = sqlite3.connect(CARDS_DB)
    conn.row_factory = sqlite3.Row
    return conn


def _to_card(r) -> dict:
    keys = r.keys()
    return {
        'id': r['id'], 'name': r['name'], 'number': r['number'],
        'set_id': r['set_id'], 'set_name': r['set_name'], 'set_total': r['set_total'],
        'set_printed_total': r['set_printed_total'] if 'set_printed_total' in keys else None,
        'rarity': r['rarity'], 'supertype': r['supertype'],
        'image_small': r['image_small'], 'price_market': r['price_market'],
    }


def db_search_name(name: str) -> list[dict]:
    """
    Fuzzy name search using difflib against the full card name list.
    Handles any OCR error, not just known substitutions.
    """
    if not os.path.exists(CARDS_DB):
        return []
    try:
        all_names = _get_name_cache()
        query = name.lower()

        # Find closest matching names (cutoff=0.6 = 60% similarity)
        matches = get_close_matches(query, all_names, n=5, cutoff=0.6)
        if not matches:
            # Try with each word individually as fallback
            for word in query.split():
                if len(word) >= 4:
                    word_matches = get_close_matches(word, all_names, n=5, cutoff=0.65)
                    matches.extend(word_matches)
            matches = list(dict.fromkeys(matches))  # dedupe

        if not matches:
            print(f'[identify] No fuzzy matches for "{name}"')
            return []

        print(f'[identify] Fuzzy matches for "{name}": {matches}')

        conn = _db_conn()
        placeholders = ','.join('?' * len(matches))
        rows = conn.execute(
            f'SELECT * FROM cards WHERE LOWER(name) IN ({placeholders}) LIMIT 30',
            matches
        ).fetchall()
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
        num_expr = 'CAST(LTRIM(number,"0ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz") AS TEXT)'
        if set_total:
            # Match against both set_total (API total) and set_printed_total (printed on card)
            rows = conn.execute(
                f'''SELECT * FROM cards
                    WHERE {num_expr} = ?
                    AND (set_total = ? OR set_printed_total = ?) LIMIT 20''',
                (number, set_total, set_total)
            ).fetchall()
        else:
            rows = conn.execute(
                f'SELECT * FROM cards WHERE {num_expr} = ? LIMIT 20',
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


# Lower index = more common/preferred rarity
_RARITY_RANK = {
    'energy':          0,
    'common':          1,
    'uncommon':        2,
    'rare':            3,
    'rare holo':       4,
    'rare holo v':     5,
    'rare ultra':      6,
    'rare rainbow':    7,
    'rare secret':     8,
    'hyper rare':      9,
    'special illustration rare': 10,
    'illustration rare': 7,
}

def _rarity_rank(card: dict) -> int:
    r = (card.get('rarity') or '').lower()
    return _RARITY_RANK.get(r, 5)  # unknown rarity = mid-tier


def pick_best(candidates: list[dict], ocr_name: str | None) -> tuple[dict | None, float]:
    if not candidates:
        return None, 0.0
    if len(candidates) == 1:
        base = 0.88 if ocr_name else 0.72
        return candidates[0], base

    if ocr_name:
        scored = [(c, _name_score(c['name'], ocr_name)) for c in candidates]
        # Sort by name score desc, then rarity rank asc (prefer common over hyper rare)
        scored.sort(key=lambda x: (-x[1], _rarity_rank(x[0])))
        best, score = scored[0]
        confidence = min(0.95, 0.60 + score * 0.35)
        return best, confidence

    # No name — prefer common rarity, then most recent set
    ranked = sorted(candidates, key=lambda c: (_rarity_rank(c), -(ord(c.get('set_id', ' ')[0]) if c.get('set_id') else 0)))
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

    number, set_total, ocr_name, number_display = ocr_scan(img)
    result['card_number'] = number_display or (f'{number}/{set_total}' if number and set_total else number)

    # Get candidates from both signals independently
    name_candidates = db_search_name(ocr_name) if ocr_name else []
    num_candidates  = db_search_number(number, set_total) if number else []
    if not num_candidates and number:
        num_candidates = db_search_number(number)

    # If name search returned multiple candidates but number search failed,
    # try to narrow by set_total — the printed total on the card tells us which set
    if name_candidates and set_total and not num_candidates:
        filtered_by_total = [
            c for c in name_candidates
            if c.get('set_total') == set_total
            or c.get('set_printed_total') == set_total
        ]
        if filtered_by_total:
            print(f'[identify] Filtered {len(name_candidates)} → {len(filtered_by_total)} by set_total={set_total}')
            name_candidates = filtered_by_total

    # Cross-reference: cards in BOTH lists get highest confidence
    if name_candidates and num_candidates:
        name_ids = {c['id'] for c in name_candidates}
        num_ids  = {c['id'] for c in num_candidates}
        intersection_ids = name_ids & num_ids
        if intersection_ids:
            candidates = [c for c in name_candidates if c['id'] in intersection_ids]
            print(f'[identify] Cross-ref hit: {len(candidates)} card(s) in both name+number results')
            card, confidence = pick_best(candidates, ocr_name)
            confidence = min(0.97, confidence + 0.10)
        else:
            candidates = name_candidates or num_candidates
            print(f'[identify] No cross-ref overlap — using {"name" if name_candidates else "number"} results')
            card, confidence = pick_best(candidates, ocr_name)
            confidence = max(0.0, confidence - 0.10)
    elif name_candidates:
        candidates = name_candidates
        card, confidence = pick_best(candidates, ocr_name)
    elif num_candidates:
        candidates = num_candidates
        card, confidence = pick_best(candidates, ocr_name)
    else:
        return result
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
