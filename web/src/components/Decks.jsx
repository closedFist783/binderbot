import { useState, useMemo } from 'react'

// Top 60 Standard decks — source: limitlesstcg.com/decks?format=standard
const DECKS = [
  { rank:  1, name: 'Gardevoir ex',                    share: 7.68 },
  { rank:  2, name: 'Dragapult ex',                    share: 5.82 },
  { rank:  3, name: 'Lugia Archeops',                  share: 5.58 },
  { rank:  4, name: 'Charizard ex',                    share: 5.16 },
  { rank:  5, name: 'Lost Zone Box',                   share: 4.56 },
  { rank:  6, name: 'Arceus VSTAR',                    share: 4.32 },
  { rank:  7, name: 'Gholdengo ex',                    share: 3.90 },
  { rank:  8, name: 'Mew Genesect Fusion Strike',      share: 3.60 },
  { rank:  9, name: 'Zoroark GX',                      share: 3.18 },
  { rank: 10, name: 'Raging Bolt ex',                  share: 2.89 },
  { rank: 11, name: 'Giratina VSTAR',                  share: 2.29 },
  { rank: 12, name: 'Regidrago VSTAR',                 share: 2.04 },
  { rank: 13, name: 'Pikachu & Zekrom Tag Team',       share: 1.90 },
  { rank: 14, name: 'Palkia VSTAR',                    share: 1.78 },
  { rank: 15, name: 'Buzzwole GX',                     share: 1.74 },
  { rank: 16, name: 'Miraidon ex',                     share: 1.57 },
  { rank: 17, name: 'Malamar Psychic Recharge',        share: 1.34 },
  { rank: 18, name: 'Chien-Pao Baxcalibur',            share: 1.29 },
  { rank: 19, name: "Marnie's Grimmsnarl ex",          share: 1.26 },
  { rank: 20, name: 'Snorlax Stall',                   share: 1.24 },
  { rank: 21, name: 'Roaring Moon ex',                 share: 1.17 },
  { rank: 22, name: 'Mewtwo & Mew Tag Team',           share: 1.06 },
  { rank: 23, name: 'Garbodor Trashalanche',           share: 1.06 },
  { rank: 24, name: 'Mega Absol Box',                  share: 1.06 },
  { rank: 25, name: 'Reshiram & Charizard Tag Team',   share: 1.04 },
  { rank: 26, name: 'Zacian V',                        share: 0.91 },
  { rank: 27, name: 'Zapdos TEU',                      share: 0.82 },
  { rank: 28, name: 'Terapagos ex',                    share: 0.82 },
  { rank: 29, name: 'Tera Box',                        share: 0.79 },
  { rank: 30, name: 'Joltik Box',                      share: 0.74 },
  { rank: 31, name: 'Decidueye GX',                    share: 0.73 },
  { rank: 32, name: 'Yveltal EX',                      share: 0.73 },
  { rank: 33, name: 'Regis Ancient Wisdom',            share: 0.66 },
  { rank: 34, name: 'Klawf Unhinged Scissors',         share: 0.66 },
  { rank: 35, name: 'Pidgeot Control',                 share: 0.65 },
  { rank: 36, name: 'Volcanion EX',                    share: 0.63 },
  { rank: 37, name: 'Greninja Break',                  share: 0.63 },
  { rank: 38, name: 'Archaludon ex',                   share: 0.60 },
  { rank: 39, name: 'Flareon ex',                      share: 0.60 },
  { rank: 40, name: 'Gardevoir GX',                    share: 0.56 },
  { rank: 41, name: 'Blacephalon GX',                  share: 0.56 },
  { rank: 42, name: 'Vikavolt Strong Charge',          share: 0.55 },
  { rank: 43, name: 'Hisuian Goodra VSTAR',            share: 0.54 },
  { rank: 44, name: 'Ancient Box',                     share: 0.54 },
  { rank: 45, name: 'Darkrai EX Dark Pulse',           share: 0.52 },
  { rank: 46, name: "N's Zoroark ex",                  share: 0.52 },
  { rank: 47, name: 'Blacephalon Fireball Circus',     share: 0.51 },
  { rank: 48, name: 'Inteleon VMAX Rapid Strike',      share: 0.50 },
  { rank: 49, name: 'Iron Thorns ex',                  share: 0.48 },
  { rank: 50, name: 'Night March',                     share: 0.44 },
  { rank: 51, name: 'Seismitoad EX',                   share: 0.44 },
  { rank: 52, name: 'Ceruledge ex',                    share: 0.40 },
  { rank: 53, name: 'Arceus & Dialga & Palkia',        share: 0.38 },
  { rank: 54, name: 'Wall Stall',                      share: 0.35 },
  { rank: 55, name: 'Future Box',                      share: 0.34 },
  { rank: 56, name: 'Oranguru Control',                share: 0.34 },
  { rank: 57, name: 'Mega Rayquaza Emerald Break',     share: 0.32 },
  { rank: 58, name: 'Darkrai EX Night Spear',          share: 0.32 },
  { rank: 59, name: 'Mega Mewtwo Psychic Infinity',    share: 0.31 },
  { rank: 60, name: 'Buzzwole Sledgehammer',           share: 0.30 },
]

function getTier(share) {
  if (share >= 5)   return { label: 'S', color: '#c9a84c' }
  if (share >= 2)   return { label: 'A', color: '#6d3eb0' }
  if (share >= 1)   return { label: 'B', color: '#2e5fa3' }
  return               { label: 'C', color: '#3a7a3a' }
}

function getLimitlessUrl(name) {
  return `https://limitlesstcg.com/decks?format=standard&name=${encodeURIComponent(name)}`
}

export default function Decks() {
  const [search, setSearch] = useState('')
  const [tierFilter, setTierFilter] = useState([])

  const filtered = useMemo(() => {
    return DECKS.filter(d => {
      const tier = getTier(d.share).label
      if (tierFilter.length > 0 && !tierFilter.includes(tier)) return false
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, tierFilter])

  function toggleTier(t) {
    setTierFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const tiers = [
    { label: 'S', color: '#c9a84c', desc: '5%+' },
    { label: 'A', color: '#6d3eb0', desc: '2–5%' },
    { label: 'B', color: '#2e5fa3', desc: '1–2%' },
    { label: 'C', color: '#3a7a3a', desc: '<1%' },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 12 }}>
          Top 60 Standard decks · Source:{' '}
          <a href="https://limitlesstcg.com/decks?format=standard" target="_blank" rel="noreferrer"
            style={{ color: 'var(--gold)' }}>limitlesstcg.com</a>
        </div>

        {/* Search */}
        <input
          type="text"
          placeholder="Search decks..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{
            width: '100%', padding: '9px 12px', marginBottom: 12,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.85rem',
            boxSizing: 'border-box',
          }}
        />

        {/* Tier filter */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tiers.map(t => (
            <button key={t.label} onClick={() => toggleTier(t.label)}
              style={{
                padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem',
                border: `1px solid ${tierFilter.includes(t.label) ? t.color : 'var(--border)'}`,
                background: tierFilter.includes(t.label) ? `${t.color}22` : 'var(--surface)',
                color: tierFilter.includes(t.label) ? t.color : 'var(--text-dim)',
              }}>
              {t.label}-Tier <span style={{ opacity: 0.6 }}>({t.desc})</span>
            </button>
          ))}
          {(search || tierFilter.length > 0) && (
            <button onClick={() => { setSearch(''); setTierFilter([]) }}
              style={{ padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem',
                border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-dim)' }}>
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Count */}
      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 10 }}>
        {filtered.length} deck{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Deck list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(d => {
          const tier = getTier(d.share)
          return (
            <a key={d.rank}
              href={getLimitlessUrl(d.name)}
              target="_blank" rel="noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <div style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '12px 16px',
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', cursor: 'pointer',
                transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-dim)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                {/* Rank */}
                <div style={{ minWidth: 28, textAlign: 'right', fontSize: '0.78rem', color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
                  #{d.rank}
                </div>

                {/* Tier badge */}
                <div style={{
                  minWidth: 28, textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
                  padding: '2px 6px', borderRadius: 3,
                  background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}`,
                }}>
                  {tier.label}
                </div>

                {/* Name */}
                <div style={{ flex: 1, fontWeight: 500, fontSize: '0.92rem', color: 'var(--text)' }}>
                  {d.name}
                </div>

                {/* Share bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <div style={{ width: 80, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', borderRadius: 2,
                      width: `${Math.min((d.share / 8) * 100, 100)}%`,
                      background: tier.color,
                    }} />
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', minWidth: 38, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                    {d.share}%
                  </div>
                </div>

                {/* External link hint */}
                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', flexShrink: 0 }}>↗</div>
              </div>
            </a>
          )
        })}
      </div>
    </div>
  )
}
