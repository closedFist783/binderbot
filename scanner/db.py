import sqlite3
import os

DB_PATH = os.environ.get('BINDERBOT_DB', os.path.join(os.path.dirname(__file__), '..', 'binderbot.db'))

def get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with get_conn() as conn:
        conn.executescript('''
            CREATE TABLE IF NOT EXISTS cards (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                physical_id      INTEGER UNIQUE NOT NULL,
                scanned_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                tcg_id           TEXT,
                name             TEXT,
                set_name         TEXT,
                set_code         TEXT,
                card_number      TEXT,
                rarity           TEXT,
                supertype        TEXT,
                image_url        TEXT,
                scan_image_path  TEXT,
                tcgplayer_price  REAL,
                identified_by    TEXT,
                confidence       REAL,
                needs_review     INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS scan_sessions (
                id            INTEGER PRIMARY KEY AUTOINCREMENT,
                started_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                ended_at      TIMESTAMP,
                cards_scanned INTEGER DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS card_cache (
                tcg_id       TEXT PRIMARY KEY,
                data         TEXT,
                cached_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        ''')

def next_physical_id(conn):
    row = conn.execute('SELECT MAX(physical_id) as m FROM cards').fetchone()
    return (row['m'] or 0) + 1

def insert_card(conn, data: dict) -> int:
    physical_id = next_physical_id(conn)
    conn.execute('''
        INSERT INTO cards
            (physical_id, tcg_id, name, set_name, set_code, card_number,
             rarity, supertype, image_url, scan_image_path,
             tcgplayer_price, identified_by, confidence, needs_review)
        VALUES
            (:physical_id, :tcg_id, :name, :set_name, :set_code, :card_number,
             :rarity, :supertype, :image_url, :scan_image_path,
             :tcgplayer_price, :identified_by, :confidence, :needs_review)
    ''', {**data, 'physical_id': physical_id})
    conn.commit()
    return physical_id

def get_all_cards(conn, search=None, needs_review=None, limit=200, offset=0):
    where, params = [], []
    if search:
        where.append("(name LIKE ? OR set_name LIKE ? OR card_number LIKE ?)")
        params += [f'%{search}%', f'%{search}%', f'%{search}%']
    if needs_review is not None:
        where.append("needs_review = ?")
        params.append(int(needs_review))
    sql = 'SELECT * FROM cards'
    if where:
        sql += ' WHERE ' + ' AND '.join(where)
    sql += ' ORDER BY physical_id DESC LIMIT ? OFFSET ?'
    return [dict(r) for r in conn.execute(sql, params + [limit, offset]).fetchall()]

def get_card_by_physical_id(conn, physical_id):
    row = conn.execute('SELECT * FROM cards WHERE physical_id = ?', (physical_id,)).fetchone()
    return dict(row) if row else None

def get_stats(conn):
    row = conn.execute('''
        SELECT
            COUNT(*) as total,
            SUM(CASE WHEN needs_review = 1 THEN 1 ELSE 0 END) as flagged,
            SUM(tcgplayer_price) as total_value,
            COUNT(DISTINCT set_code) as sets
        FROM cards
    ''').fetchone()
    return dict(row)

def mark_reviewed(conn, physical_id, tcg_id, name, set_name, set_code, card_number, image_url, rarity, price):
    conn.execute('''
        UPDATE cards SET needs_review=0, tcg_id=?, name=?, set_name=?, set_code=?,
        card_number=?, image_url=?, rarity=?, tcgplayer_price=?, identified_by='manual'
        WHERE physical_id=?
    ''', (tcg_id, name, set_name, set_code, card_number, image_url, rarity, price, physical_id))
    conn.commit()
