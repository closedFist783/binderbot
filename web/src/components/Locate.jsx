import { useState } from 'react'
import { locateCard } from '../lib/api'

export default function Locate() {
  const [query, setQuery]     = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    const data = await locateCard(query.trim())
    setResults(data)
    setLoading(false)
  }

  return (
    <div>
      <form className="search-bar" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Card name to locate…"
          value={query}
          onChange={e => setQuery(e.target.value)}
          autoFocus
        />
        <button className="btn btn-gold" type="submit" disabled={loading}>
          {loading ? '…' : '🔍 Find'}
        </button>
      </form>

      {results !== null && results.length === 0 && (
        <div style={{ color: 'var(--text-dim)', textAlign: 'center', paddingTop: 40 }}>
          No cards found matching "{query}".
        </div>
      )}

      {results && results.map(r => (
        <div key={r.physical_id} className="locate-result">
          <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            {r.image_url && <img src={r.image_url} alt={r.name} style={{ width: 64, borderRadius: 4 }} />}
            <div style={{ flex: 1 }}>
              <h3>{r.name}</h3>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: 8 }}>
                {r.set_name} · {r.card_number} · {r.rarity}
              </div>
              <div className="locate-bin">
                Bin {r.bin} <span>· approx. position {r.position_in_bin}</span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginTop: 4 }}>
                Physical ID #{r.physical_id}
                {r.tcgplayer_price && <span style={{ color: 'var(--gold)', marginLeft: 10 }}>${r.tcgplayer_price.toFixed(2)}</span>}
              </div>
            </div>
          </div>
        </div>
      ))}

      {!results && (
        <div style={{ color: 'var(--text-dim)', textAlign: 'center', paddingTop: 60, fontSize: '0.9rem', lineHeight: 2 }}>
          Type a card name to find it in your physical collection.<br />
          Results show which bin and approximate position.
        </div>
      )}
    </div>
  )
}
