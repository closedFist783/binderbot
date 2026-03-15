import { useState, useEffect, useMemo } from 'react'

const BASE = () => import.meta.env.VITE_API_URL || ''

async function fetchJSON(path) {
  const r = await fetch(`${BASE()}${path}`)
  if (!r.ok) throw new Error(r.status)
  return r.json()
}

export default function Stats() {
  const [cards, setCards]         = useState(null)
  const [status, setStatus]       = useState(null)
  const [sets, setSets]           = useState({})   // setCode → { name, total }
  const [error, setError]         = useState(false)
  const [loadingSets, setLoadingSets] = useState(false)

  // Fetch all cards + status from Pi
  useEffect(() => {
    Promise.all([
      fetchJSON('/api/cards?limit=10000'),
      fetchJSON('/api/status'),
    ])
      .then(([c, s]) => {
        setCards(Array.isArray(c) ? c : [])
        setStatus(s)
      })
      .catch(() => setError(true))
  }, [])

  // Fetch set totals from PokéTCG API (for set completion %)
  useEffect(() => {
    if (!cards || cards.length === 0) return
    const codes = [...new Set(cards.map(c => c.set_code).filter(Boolean))]
    if (codes.length === 0) return
    setLoadingSets(true)
    fetch('https://api.pokemontcg.io/v2/sets?pageSize=250')
      .then(r => r.json())
      .then(data => {
        const map = {}
        for (const s of (data.data || [])) {
          map[s.ptcgoCode || s.id] = { name: s.name, total: s.total }
        }
        setSets(map)
        setLoadingSets(false)
      })
      .catch(() => setLoadingSets(false))
  }, [cards])

  // ── Derived stats ──────────────────────────────────────────────────────────

  const topCards = useMemo(() => {
    if (!cards) return []
    return [...cards]
      .filter(c => c.tcgplayer_price > 0)
      .sort((a, b) => b.tcgplayer_price - a.tcgplayer_price)
      .slice(0, 15)
  }, [cards])

  const setBreakdown = useMemo(() => {
    if (!cards) return []
    const map = {}
    for (const c of cards) {
      const code = c.set_code || '???'
      if (!map[code]) map[code] = { code, name: c.set_name || code, count: 0, value: 0 }
      map[code].count++
      map[code].value += c.tcgplayer_price || 0
    }
    return Object.values(map).sort((a, b) => b.count - a.count)
  }, [cards])

  // ── Loading / error states ─────────────────────────────────────────────────

  if (error) return (
    <div style={{ textAlign: 'center', paddingTop: 60 }}>
      <div style={{ fontSize: '2rem', marginBottom: 12 }}>📡</div>
      <div style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: 8 }}>
        Can't reach the Pi
      </div>
      <div style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
        Make sure the scanner is running at the configured API URL.
      </div>
    </div>
  )

  if (!cards) return (
    <div style={{ textAlign: 'center', paddingTop: 60, color: 'var(--text-dim)' }}>
      <div style={{ fontSize: '1.2rem', marginBottom: 8 }}>⏳</div>
      Loading stats…
    </div>
  )

  const totalCards = cards.length
  const totalValue = cards.reduce((s, c) => s + (c.tcgplayer_price || 0), 0)
  const flagged    = cards.filter(c => c.needs_review).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* ── Summary cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
        {[
          { label: 'Total Cards',    value: totalCards.toLocaleString(),           color: 'var(--gold)' },
          { label: 'Collection Value', value: `$${totalValue.toFixed(2)}`,         color: '#4caf50' },
          { label: 'Sets',           value: setBreakdown.length,                   color: '#2196f3' },
          { label: 'Flagged',        value: flagged,                               color: flagged > 0 ? '#e57373' : 'var(--text-dim)' },
          { label: 'This Session',   value: status?.session_count ?? '—',          color: 'var(--text-dim)' },
          { label: 'Bins Used',      value: Math.ceil(totalCards / 1000) || 0,     color: 'var(--text-dim)' },
        ].map(s => (
          <div key={s.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '16px 12px', textAlign: 'center' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, color: s.color, lineHeight: 1 }}>
              {s.value}
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* ── Most valuable cards ── */}
      {topCards.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            💰 Most Valuable Cards
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {topCards.map((c, i) => (
              <div key={c.physical_id} style={{ display: 'flex', alignItems: 'center', gap: 10,
                padding: '6px 0', borderBottom: '1px solid var(--border)', fontSize: '0.82rem' }}>
                <span style={{ minWidth: 20, color: 'var(--text-dim)', fontSize: '0.72rem', textAlign: 'right' }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1 }}>{c.name || 'Unknown'}</span>
                <span style={{ color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                  {c.set_code} {c.card_number}
                </span>
                <span style={{ color: '#4caf50', fontWeight: 600, minWidth: 52, textAlign: 'right',
                  fontVariantNumeric: 'tabular-nums' }}>
                  ${c.tcgplayer_price.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Set completion ── */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            📦 Set Completion
          </div>
          {loadingSets && <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Loading set sizes…</span>}
        </div>

        {setBreakdown.length === 0 ? (
          <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem' }}>No cards scanned yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {setBreakdown.map(s => {
              const setInfo = sets[s.code]
              const total   = setInfo?.total || null
              const pct     = total ? Math.min(Math.round((s.count / total) * 100), 100) : null
              const name    = setInfo?.name || s.name || s.code
              return (
                <div key={s.code}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3,
                    fontSize: '0.78rem' }}>
                    <span style={{ color: 'var(--text)' }}>{name}</span>
                    <span style={{ color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                      {s.count}{total ? `/${total}` : ''} cards
                      {pct !== null && <span style={{ color: pct >= 100 ? '#4caf50' : 'var(--gold)', marginLeft: 6 }}>{pct}%</span>}
                      {s.value > 0 && <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>${s.value.toFixed(2)}</span>}
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 2,
                      width: `${pct ?? Math.min((s.count / 200) * 100, 100)}%`,
                      background: pct >= 100 ? '#4caf50' : 'var(--gold)',
                      transition: 'width 0.4s' }} />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Bin layout ── */}
      {totalCards > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 16 }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-dim)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            🗃️ Bin Layout
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: Math.ceil(totalCards / 1000) }, (_, i) => {
              const start  = i * 1000 + 1
              const end    = Math.min((i + 1) * 1000, totalCards)
              const count  = end - start + 1
              const pct    = Math.round((count / 1000) * 100)
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ minWidth: 48, color: 'var(--gold)', fontWeight: 600, fontSize: '0.82rem' }}>
                    Bin {i + 1}
                  </span>
                  <div style={{ flex: 1, height: 6, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`,
                      background: pct >= 100 ? '#e57373' : 'var(--gold)' }} />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', minWidth: 80, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    #{start}–#{end}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

    </div>
  )
}
