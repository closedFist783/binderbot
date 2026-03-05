import { useState, useEffect, useCallback } from 'react'
import { getCards, reviewCard } from '../lib/api'
import ReviewModal from './ReviewModal'

export default function Collection() {
  const [cards, setCards]           = useState([])
  const [search, setSearch]         = useState('')
  const [flaggedOnly, setFlagged]   = useState(false)
  const [loading, setLoading]       = useState(false)
  const [offset, setOffset]         = useState(0)
  const [reviewing, setReviewing]   = useState(null)
  const LIMIT = 100

  const load = useCallback(async (reset = false) => {
    setLoading(true)
    const off = reset ? 0 : offset
    const params = { limit: LIMIT, offset: off }
    if (search)      params.q = search
    if (flaggedOnly) params.needs_review = '1'
    const data = await getCards(params)
    setCards(reset ? data : prev => [...prev, ...data])
    if (reset) setOffset(LIMIT)
    else setOffset(off + LIMIT)
    setLoading(false)
  }, [search, flaggedOnly, offset])

  useEffect(() => { load(true) }, [search, flaggedOnly])

  async function handleReviewSave(physicalId, data) {
    await reviewCard(physicalId, data)
    setCards(prev => prev.map(c => c.physical_id === physicalId ? { ...c, ...data, needs_review: 0 } : c))
    setReviewing(null)
  }

  return (
    <div>
      <div className="search-bar">
        <input
          type="text" placeholder="Search by name, set, number…"
          value={search} onChange={e => { setSearch(e.target.value); setOffset(0) }}
        />
        <button
          className={`btn ${flaggedOnly ? 'btn-gold' : 'btn-ghost'}`}
          onClick={() => { setFlagged(f => !f); setOffset(0) }}
        >
          ⚠️ Flagged
        </button>
      </div>

      {cards.length === 0 && !loading && (
        <div style={{ textAlign: 'center', color: 'var(--text-dim)', paddingTop: 40 }}>
          {search || flaggedOnly ? 'No cards match.' : 'No cards scanned yet.'}
        </div>
      )}

      <div className="card-grid">
        {cards.map(c => (
          <div
            key={c.physical_id}
            className={`card-tile${c.needs_review ? ' flagged' : ''}`}
            onClick={() => setReviewing(c)}
          >
            {c.image_url
              ? <img src={c.image_url} alt={c.name} loading="lazy" />
              : <div style={{ aspectRatio: '2/3', background: 'var(--surface2)', borderRadius: 4, marginBottom: 8 }} />
            }
            <div className="tile-name">{c.name || '?'}</div>
            <div className="tile-set">{c.set_name || '—'}</div>
            <div className="tile-pid">#{c.physical_id}</div>
            {c.tcgplayer_price && <div className="tile-price">${c.tcgplayer_price.toFixed(2)}</div>}
            {c.needs_review ? <div className="tile-flag">⚠️ Needs review</div> : null}
          </div>
        ))}
      </div>

      {cards.length >= LIMIT && (
        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button className="btn btn-ghost" onClick={() => load(false)} disabled={loading}>
            {loading ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}

      {reviewing && (
        <ReviewModal
          card={reviewing}
          onSave={data => handleReviewSave(reviewing.physical_id, data)}
          onClose={() => setReviewing(null)}
        />
      )}
    </div>
  )
}
