"""
Flask API server — runs on the Pi, serves data to the React UI.
Also handles the scan loop (manual trigger or auto via GPIO sensor).
"""
import os
import io
import json
import time
import threading
import base64
from datetime import datetime
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS

from db import init_db, get_conn, insert_card, get_all_cards, get_card_by_physical_id, get_stats, mark_reviewed

# Hardware modules — optional (not available when running locally without Pi hardware)
try:
    from identify import identify_card
    from camera import init_camera, capture, close_camera
    from motor import init_motor, feed_card, eject_card, cleanup as motor_cleanup
    HAS_HARDWARE = True
except Exception as _hw_err:
    HAS_HARDWARE = False
    print(f'[binderbot] Hardware unavailable ({_hw_err}) — running in local/API-only mode')
    def identify_card(img): return {}
    def init_camera(): pass
    def capture(): return None
    def close_camera(): pass
    def init_motor(): pass
    def feed_card(): pass
    def eject_card(): pass
    def motor_cleanup(): pass

SCANS_DIR = os.path.join(os.path.dirname(__file__), '..', 'scans')
os.makedirs(SCANS_DIR, exist_ok=True)

WEB_BUILD = os.path.join(os.path.dirname(__file__), '..', 'web', 'dist')

app = Flask(__name__, static_folder=WEB_BUILD if os.path.exists(WEB_BUILD) else None)
CORS(app)

@app.after_request
def add_private_network_header(response):
    response.headers['Access-Control-Allow-Private-Network'] = 'true'
    return response

# ── Scanner state ─────────────────────────────────────────────────────────────

_scan_lock = threading.Lock()
_scan_active = False
_last_scan = {}          # most recently scanned card
_session_count = 0

def _do_scan():
    global _last_scan, _session_count
    with _scan_lock:
        img = capture()
        result = identify_card(img)

        # Save scan image
        scan_path = os.path.join(SCANS_DIR, f'{int(time.time() * 1000)}.jpg')
        img.save(scan_path, 'JPEG', quality=85)
        result['scan_image_path'] = scan_path

        with get_conn() as conn:
            physical_id = insert_card(conn, result)
        result['physical_id'] = physical_id
        _last_scan = {**result, 'scanned_at': datetime.now().isoformat()}
        _session_count += 1
        print(f'[scan] #{physical_id} — {result["name"]} ({result["confidence"]:.0%}) needs_review={result["needs_review"]}')

    eject_card()
    return result

# ── API routes ────────────────────────────────────────────────────────────────

@app.route('/api/status')
def status():
    with get_conn() as conn:
        stats = get_stats(conn)
    return jsonify({
        'ok': True,
        'session_count': _session_count,
        'total_cards': stats['total'],
        'flagged': stats['flagged'],
        'total_value': stats['total_value'],
        'sets': stats['sets'],
        'last_scan': _last_scan,
    })

@app.route('/api/scan', methods=['POST'])
def scan_one():
    """Manually trigger a single scan (called by UI button or foot pedal)."""
    if not HAS_HARDWARE:
        return jsonify({'error': 'Scanner hardware not available in local mode'}), 503
    feed_card()
    time.sleep(0.3)  # let card settle under camera
    result = _do_scan()
    return jsonify(result)

@app.route('/api/cards')
def list_cards():
    search = request.args.get('q', '').strip()
    needs_review = request.args.get('needs_review')
    limit  = int(request.args.get('limit', 100))
    offset = int(request.args.get('offset', 0))
    if needs_review is not None:
        needs_review = needs_review == '1'
    with get_conn() as conn:
        cards = get_all_cards(conn, search=search or None, needs_review=needs_review, limit=limit, offset=offset)
    return jsonify(cards)

@app.route('/api/cards/<int:physical_id>')
def get_card(physical_id):
    with get_conn() as conn:
        card = get_card_by_physical_id(conn, physical_id)
    if not card:
        return jsonify({'error': 'Not found'}), 404
    return jsonify(card)

@app.route('/api/cards/<int:physical_id>/review', methods=['POST'])
def review_card(physical_id):
    """Manually correct a flagged card."""
    body = request.json
    with get_conn() as conn:
        mark_reviewed(
            conn, physical_id,
            body.get('tcg_id'), body.get('name'), body.get('set_name'),
            body.get('set_code'), body.get('card_number'), body.get('image_url'),
            body.get('rarity'), body.get('tcgplayer_price'),
        )
    return jsonify({'ok': True})

@app.route('/api/cards/add', methods=['POST'])
def add_card_manual():
    """Manually add a card to the collection (from UI search)."""
    body = request.json or {}
    qty  = int(body.pop('qty', 1))
    data = {
        'tcg_id':          body.get('tcg_id'),
        'name':            body.get('name'),
        'set_name':        body.get('set_name', ''),
        'set_code':        body.get('set_code', ''),
        'card_number':     body.get('card_number', ''),
        'rarity':          body.get('rarity', ''),
        'supertype':       body.get('supertype', ''),
        'image_url':       body.get('image_url', ''),
        'scan_image_path': None,
        'tcgplayer_price': body.get('tcgplayer_price', 0) or 0,
        'identified_by':   'manual',
        'confidence':      1.0,
        'needs_review':    0,
    }
    ids = []
    with get_conn() as conn:
        for _ in range(max(1, qty)):
            pid = insert_card(conn, data)
            ids.append(pid)
    return jsonify({'ok': True, 'physical_ids': ids})

# ── Local card database ───────────────────────────────────────────────────────

_card_db = None
_card_db_path = os.path.join(os.path.dirname(__file__), 'card_db.json')

def _load_card_db():
    global _card_db
    if _card_db is None:
        if os.path.exists(_card_db_path):
            with open(_card_db_path) as f:
                _card_db = json.load(f)
            print(f'[tcg] loaded {len(_card_db)} cards from local db')
        else:
            _card_db = []
            print('[tcg] card_db.json not found — run fetch_cards.py to build it')
    return _card_db

@app.route('/api/tcg/test')
def tcg_test():
    db = _load_card_db()
    return jsonify({'ok': len(db) > 0, 'card_count': len(db),
                    'db_path': _card_db_path, 'db_exists': os.path.exists(_card_db_path)})

@app.route('/api/tcg/sets')
def tcg_sets():
    db = _load_card_db()
    seen, sets = set(), []
    for c in db:
        key = c.get('set', '')
        if key and key not in seen:
            seen.add(key)
            sets.append({'id': key, 'ptcgoCode': key, 'name': c.get('setName', key), 'total': 0})
    return jsonify({'data': sets})

@app.route('/api/tcg/cards')
def tcg_search():
    """Search local card database."""
    q = request.args.get('q', '').strip()
    # parse "name:charizard" format
    name_query = ''
    if q.lower().startswith('name:'):
        name_query = q[5:].strip().lower()
    else:
        name_query = q.lower()

    if not name_query:
        return jsonify({'data': []})

    db = _load_card_db()
    results = [c for c in db if name_query in c.get('name', '').lower()]
    # Sort: exact prefix first, then alphabetical
    results.sort(key=lambda c: (not c['name'].lower().startswith(name_query), c['name'], c.get('set', '')))
    # Convert to pokemontcg.io response format so frontend works unchanged
    formatted = [{
        'id':         c['id'],
        'name':       c['name'],
        'number':     c['number'],
        'rarity':     c.get('rarity', ''),
        'supertype':  c.get('type', ''),
        'set':        {'name': c.get('setName', ''), 'ptcgoCode': c.get('set', ''), 'id': c.get('set', '')},
        'images':     {'small': c.get('img', '')},
        'tcgplayer':  {'prices': {'normal': {'market': c.get('price', 0)}}},
    } for c in results[:40]]
    return jsonify({'data': formatted})

@app.route('/api/locate/<name>')
def locate_card(name):
    """Find a card by name — returns physical_id and bin info."""
    with get_conn() as conn:
        cards = get_all_cards(conn, search=name, limit=10)
    results = []
    for c in cards:
        pid = c['physical_id']
        bin_num = ((pid - 1) // 1000) + 1
        pos_in_bin = ((pid - 1) % 1000) + 1
        results.append({**c, 'bin': bin_num, 'position_in_bin': pos_in_bin})
    return jsonify(results)

@app.route('/api/preview')
def preview():
    """Return a live camera snapshot as a JPEG image — open directly in browser."""
    if not HAS_HARDWARE:
        return jsonify({'error': 'Camera not available in local mode'}), 503
    from flask import Response
    img = capture()
    buf = io.BytesIO()
    img.save(buf, 'JPEG', quality=75)
    buf.seek(0)
    return Response(buf.read(), mimetype='image/jpeg')

@app.route('/api/preview-ocr')
def preview_ocr():
    """Return the preprocessed OCR image — shows exactly what Tesseract sees."""
    if not HAS_HARDWARE:
        return jsonify({'error': 'Camera not available in local mode'}), 503
    from flask import Response
    from identify import _preprocess
    img = capture()
    processed = _preprocess(img)
    buf = io.BytesIO()
    processed.save(buf, 'JPEG', quality=90)
    buf.seek(0)
    return Response(buf.read(), mimetype='image/jpeg')

@app.route('/api/scan-image/<int:physical_id>')
def scan_image(physical_id):
    """Return scan image as raw JPEG."""
    from flask import Response
    with get_conn() as conn:
        card = get_card_by_physical_id(conn, physical_id)
    if not card or not card.get('scan_image_path') or not os.path.exists(card['scan_image_path']):
        return jsonify({'error': 'No image'}), 404
    with open(card['scan_image_path'], 'rb') as f:
        return Response(f.read(), mimetype='image/jpeg')

# Serve React build in production
if os.path.exists(WEB_BUILD):
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve_ui(path):
        if path and os.path.exists(os.path.join(WEB_BUILD, path)):
            return send_from_directory(WEB_BUILD, path)
        return send_from_directory(WEB_BUILD, 'index.html')

if __name__ == '__main__':
    print('[binderbot] Initialising...')
    init_db()
    init_camera()
    init_motor()
    port = int(os.environ.get('PORT', 5001))
    print(f'[binderbot] Ready. http://localhost:{port}')
    try:
        port = int(os.environ.get('PORT', 5001))
        app.run(host='0.0.0.0', port=port, debug=False)
    finally:
        close_camera()
        motor_cleanup()
