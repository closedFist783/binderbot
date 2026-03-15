import { useState, useRef, useCallback } from 'react'

const BASE    = import.meta.env.VITE_API_URL || ''
const TCG_API = '/tcg/cards'   // proxied by Vite dev server → api.pokemontcg.io/v2/cards

function getPrice(card) {
  const p = card.tcgplayer?.prices
  if (!p) return 0
  return (
    p.holofoil?.market ||
    p.normal?.market ||
    p['1stEditionHolofoil']?.market ||
    p.reverseHolofoil?.market ||
    p.unlimitedHolofoil?.market ||
    0
  )
}

export default function AddCard() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [adding, setAdding]   = useState(null)
  const [added, setAdded]     = useState({})
  const [error, setError]     = useState('')
  const [qty, setQty]         = useState(1)
  const debounceRef           = useRef(null)

  const search = useCallback((q) => {
    if (!q.trim() || q.trim().length < 2) { setResults([]); return }
    setLoading(true)
    setError('')
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: `name:${q.trim()}`,
          pageSize: '30',
          orderBy: '-set.releaseDate',
        })
        const r = await fetch(`${TCG_API}?${params}`)
        if (!r.ok) throw new Error(`HTTP ${r.status}`)
        const data = await r.json()
        setResults(data.data || [])
        if (!data.data?.length) setError('No cards found.')
      } catch (e) {
        setError(`Search failed: ${e.message}`)
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 400)
  }, [])

  function handleInput(e) {
    const v = e.target.value
    setQuery(v)
    search(v)
  }

  async function addCard(card) {
    setAdding(card.id)
    setError('')
    try {
      const payload = {
        tcg_id:          card.id,
        name:            card.name,
        set_name:        card.set?.name || '',
        set_code:        card.set?.ptcgoCode || card.set?.id || '',
        card_number:     card.number,
        rarity:          card.rarity || '',
        supertype:       card.supertype || '',
        image_url:       card.images?.small || '',
        scan_image_path: null,
        tcgplayer_price: getPrice(card),
        identified_by:   'manual',
        confidence:      1.0,
        needs_review:    0,
      }
      for (let i = 0; i < qty; i++) {
        const r = await fetch(`${BASE}/api/cards/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!r.ok) throw new Error(`Server error ${r.status}`)
      }
      setAdded(prev => ({ ...prev, [card.id]: (prev[card.id] || 0) + qty }))
    } catch (e) {
      setError(`Failed to add: ${e.message}`)
    } finally {
      setAdding(null)
    }
  }

  const totalAdded = Object.values(added).reduce((s, n) => s + n, 0)

  return (
    <div>
      {/* Search bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
          <input
            type="text"
            placeholder="Search for a card (e.g. Charizard, Pikachu ex…)"
            value={query}
            onChange={handleInput}
            autoComplete="off"
            spellCheck={false}
            autoFocus
            style={{
              flex: 1, padding: '10px 14px',
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.9rem',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Qty</span>
            {[1, 2, 3, 4].map(n => (
              <button key={n} onClick={() => setQty(n)}
                style={{
                  width: 32, height: 32, borderRadius: 4, cursor: 'pointer', fontSize: '0.82rem',
                  border: `1px solid ${qty === n ? 'var(--gold)' : 'var(--border)'}`,
                  background: qty === n ? 'rgba(201,168,76,0.15)' : 'var(--surface)',
                  color: qty === n ? 'var(--gold)' : 'var(--text-dim)',
                }}>
                {n}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          fontSize: '0.75rem', color: 'var(--text-dim)' }}>
          <span>
            {loading && '🔍 Searching…'}
            {!loading && results.length > 0 && `${results.length} results`}
          </span>
          {totalAdded > 0 && (
            <span style={{ color: '#4caf50' }}>
              ✅ {totalAdded} card{totalAdded !== 1 ? 's' : ''} added this session
            </span>
          )}
        </div>

        {error && (
          <div style={{ marginTop: 8, padding: '8px 12px', background: 'rgba(229,115,115,0.1)',
            border: '1px solid #e57373', borderRadius: 6, fontSize: '0.8rem', color: '#e57373' }}>
            {error}
          </div>
        )}
      </div>

      {/* Results grid */}
      {results.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
          {results.map(card => {
            const price      = getPrice(card)
            const addedCount = added[card.id] || 0
            const isAdding   = adding === card.id

            return (
              <div key={card.id}
                style={{
                  background: 'var(--surface)',
                  border: `1px solid ${addedCount > 0 ? 'var(--gold-dim)' : 'var(--border)'}`,
                  borderRadius: 'var(--radius)', overflow: 'hidden',
                  display: 'flex', flexDirection: 'column',
                }}>
                <div style={{ position: 'relative' }}>
                  {card.images?.small ? (
                    <img src={card.images.small} alt={card.name}
                      style={{ width: '100%', display: 'block', aspectRatio: '3/4', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', aspectRatio: '3/4', background: 'var(--surface2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                      No image
                    </div>
                  )}
                  {addedCount > 0 && (
                    <div style={{ position: 'absolute', top: 6, right: 6, background: '#4caf50',
                      color: '#fff', borderRadius: '50%', width: 22, height: 22,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '0.72rem', fontWeight: 700 }}>
                      {addedCount}
                    </div>
                  )}
                </div>

                <div style={{ padding: '8px 10px', flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.82rem', lineHeight: 1.2 }}>{card.name}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>{card.set?.name}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)' }}>
                    #{card.number} · {card.rarity || '—'}
                  </div>
                  {price > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#4caf50', fontWeight: 600 }}>
                      ${price.toFixed(2)}
                    </div>
                  )}
                </div>

                <button
                  onClick={() => addCard(card)}
                  disabled={isAdding}
                  style={{
                    margin: '0 10px 10px', padding: '7px 0', borderRadius: 4,
                    cursor: isAdding ? 'wait' : 'pointer',
                    border: `1px solid ${addedCount > 0 ? 'var(--gold-dim)' : 'var(--border)'}`,
                    background: addedCount > 0 ? 'rgba(201,168,76,0.12)' : 'var(--surface2)',
                    color: addedCount > 0 ? 'var(--gold)' : 'var(--text-dim)',
                    fontSize: '0.78rem', fontWeight: 600,
                  }}>
                  {isAdding ? '⏳' : addedCount > 0 ? `✓ Add ${qty} more` : `+ Add ×${qty}`}
                </button>
              </div>
            )
          })}
        </div>
      )}

      {!loading && query.length < 2 && results.length === 0 && (
        <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-dim)' }}>
          <div style={{ fontSize: '2rem', marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: '0.9rem' }}>Search any Pokémon card to add it to your collection</div>
        </div>
      )}
    </div>
  )
}
