import { useState } from 'react'
import { triggerScan } from '../lib/api'

export default function ScanTab({ status }) {
  const [scanning, setScanning]   = useState(false)
  const [feedLog, setFeedLog]     = useState([])
  const [lastCard, setLastCard]   = useState(null)
  const [error, setError]         = useState(null)

  async function handleScan() {
    setScanning(true)
    setError(null)
    try {
      const result = await triggerScan()
      if (result.error) throw new Error(result.error)
      setLastCard(result)
      setFeedLog(prev => [result, ...prev].slice(0, 50))
    } catch (e) {
      setError(e.message)
    } finally {
      setScanning(false)
    }
  }

  return (
    <div className="scan-panel">
      <button className="scan-btn" onClick={handleScan} disabled={scanning}>
        {scanning ? '⏳ Scanning…' : '📷 Scan Card'}
      </button>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
        Press the button (or connect a foot pedal to GPIO) to feed and scan one card.
      </div>

      {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem' }}>{error}</div>}

      {lastCard && (
        <div className="last-scan-card">
          {/* Scan image from camera — URL is stable per physical_id, no polling */}
          <img
            src={`${import.meta.env.VITE_API_URL}/api/scan-image/${lastCard.physical_id}`}
            alt="scan"
            style={{ width: 80, height: 112, objectFit: 'cover', borderRadius: 4, flexShrink: 0, background: 'var(--surface2)' }}
            onError={e => { e.target.style.display = 'none' }}
          />
          {/* API card image if identified */}
          {lastCard.image_url
            ? <img src={lastCard.image_url} alt={lastCard.name} style={{ width: 80, height: 112, objectFit: 'contain', borderRadius: 4, flexShrink: 0 }} />
            : <div style={{ width: 80, height: 112, background: 'var(--surface2)', borderRadius: 4, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>?</div>
          }
          <div className="last-scan-info">
            <div className="pid-badge">#{lastCard.physical_id}</div>
            <h3>{lastCard.name || 'Unknown'}</h3>
            <p>
              {lastCard.set_name && <>{lastCard.set_name} · </>}
              {lastCard.card_number && <>{lastCard.card_number} · </>}
              {lastCard.rarity && <>{lastCard.rarity}</>}
            </p>
            {lastCard.tcgplayer_price && (
              <p style={{ color: 'var(--gold)', marginTop: 4 }}>${lastCard.tcgplayer_price.toFixed(2)}</p>
            )}
            <p style={{ marginTop: 6 }}>
              Confidence:{' '}
              <span className={lastCard.confidence >= 0.75 ? 'conf-ok' : 'conf-low'}>
                {(lastCard.confidence * 100).toFixed(0)}%
              </span>
              {lastCard.needs_review ? ' · ⚠️ Needs review' : ' · ✓ Identified'}
            </p>
          </div>
        </div>
      )}

      {feedLog.length > 0 && (
        <div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
            Session log ({feedLog.length} cards)
          </div>
          <div className="feed-log">
            {feedLog.map((c, i) => (
              <div key={i} className="feed-row">
                <span className="f-pid">#{c.physical_id}</span>
                <span className="f-name">{c.name || '?'}</span>
                <span className="f-set">{c.set_name || ''}</span>
                {c.needs_review ? <span className="f-flag">⚠️</span> : <span style={{ color: 'var(--green)' }}>✓</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {feedLog.length === 0 && (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', paddingTop: 40, fontSize: '0.9rem' }}>
          No cards scanned this session yet.
        </div>
      )}
    </div>
  )
}
