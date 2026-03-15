import { useState, useEffect, useMemo } from 'react'
import { META_DECKS } from '../data/meta-decks'

// ── Top 60 Standard ranking (limitlesstcg.com) ────────────────────────────────
const TOP_60 = [
  { rank:  1, name: 'Gardevoir ex',                   share: 7.68, metaId: 'gardevoir-ex' },
  { rank:  2, name: 'Dragapult ex',                   share: 5.82, metaId: 'dragapult-ex' },
  { rank:  3, name: 'Lugia Archeops',                 share: 5.58, metaId: null },
  { rank:  4, name: 'Charizard ex',                   share: 5.16, metaId: 'charizard-ex' },
  { rank:  5, name: 'Lost Zone Box',                  share: 4.56, metaId: null },
  { rank:  6, name: 'Arceus VSTAR',                   share: 4.32, metaId: 'arceus-vstar-expanded' },
  { rank:  7, name: 'Gholdengo ex',                   share: 3.90, metaId: 'gholdengo-ex' },
  { rank:  8, name: 'Mew Genesect Fusion Strike',     share: 3.60, metaId: 'mew-vmax-genesect' },
  { rank:  9, name: 'Zoroark GX',                     share: 3.18, metaId: 'zoroark-gx' },
  { rank: 10, name: 'Raging Bolt ex',                 share: 2.89, metaId: 'raging-bolt-ex' },
  { rank: 11, name: 'Giratina VSTAR',                 share: 2.29, metaId: null },
  { rank: 12, name: 'Regidrago VSTAR',                share: 2.04, metaId: null },
  { rank: 13, name: 'Pikachu & Zekrom Tag Team',      share: 1.90, metaId: 'pikachu-zekrom-gx' },
  { rank: 14, name: 'Palkia VSTAR',                   share: 1.78, metaId: null },
  { rank: 15, name: 'Buzzwole GX',                    share: 1.74, metaId: 'buzzwole-lycanroc' },
  { rank: 16, name: 'Miraidon ex',                    share: 1.57, metaId: 'miraidon-ex' },
  { rank: 17, name: 'Malamar Psychic Recharge',       share: 1.34, metaId: 'malamar-giratina' },
  { rank: 18, name: 'Chien-Pao Baxcalibur',           share: 1.29, metaId: null },
  { rank: 19, name: "Marnie's Grimmsnarl ex",         share: 1.26, metaId: 'marnie-s-grimmsnarl-ex' },
  { rank: 20, name: 'Snorlax Stall',                  share: 1.24, metaId: 'wailord-stall' },
  { rank: 21, name: 'Roaring Moon ex',                share: 1.17, metaId: null },
  { rank: 22, name: 'Mewtwo & Mew Tag Team',          share: 1.06, metaId: 'mewtwo-mew-gx' },
  { rank: 23, name: 'Garbodor Trashalanche',          share: 1.06, metaId: null },
  { rank: 24, name: 'Mega Absol Box',                 share: 1.06, metaId: 'mega-absol-box' },
  { rank: 25, name: 'Reshiram & Charizard Tag Team',  share: 1.04, metaId: 'reshiram-charizard-gx' },
  { rank: 26, name: 'Zacian V',                       share: 0.91, metaId: 'zacian-lucario-vmax' },
  { rank: 27, name: 'Zapdos TEU',                     share: 0.82, metaId: null },
  { rank: 28, name: 'Terapagos ex',                   share: 0.82, metaId: null },
  { rank: 29, name: 'Tera Box',                       share: 0.79, metaId: 'tera-box' },
  { rank: 30, name: 'Joltik Box',                     share: 0.74, metaId: 'joltik-box' },
  { rank: 31, name: 'Decidueye GX',                   share: 0.73, metaId: null },
  { rank: 32, name: 'Yveltal EX',                     share: 0.73, metaId: 'turbo-dark-expanded' },
  { rank: 33, name: 'Regis Ancient Wisdom',           share: 0.66, metaId: null },
  { rank: 34, name: 'Klawf Unhinged Scissors',        share: 0.66, metaId: null },
  { rank: 35, name: 'Pidgeot Control',                share: 0.65, metaId: 'pidgeot-control' },
  { rank: 36, name: 'Volcanion EX',                   share: 0.63, metaId: null },
  { rank: 37, name: 'Greninja Break',                 share: 0.63, metaId: 'greninja-break' },
  { rank: 38, name: 'Archaludon ex',                  share: 0.60, metaId: null },
  { rank: 39, name: 'Flareon ex',                     share: 0.60, metaId: 'flareon-ex' },
  { rank: 40, name: 'Gardevoir GX',                   share: 0.56, metaId: 'gardevoir-sylveon-gx' },
  { rank: 41, name: 'Blacephalon GX',                 share: 0.56, metaId: null },
  { rank: 42, name: 'Vikavolt Strong Charge',         share: 0.55, metaId: null },
  { rank: 43, name: 'Hisuian Goodra VSTAR',           share: 0.54, metaId: null },
  { rank: 44, name: 'Ancient Box',                    share: 0.54, metaId: null },
  { rank: 45, name: 'Darkrai EX Dark Pulse',          share: 0.52, metaId: null },
  { rank: 46, name: "N's Zoroark ex",                 share: 0.52, metaId: 'n-s-zoroark-ex' },
  { rank: 47, name: 'Blacephalon Fireball Circus',    share: 0.51, metaId: null },
  { rank: 48, name: 'Inteleon VMAX Rapid Strike',     share: 0.50, metaId: 'rapid-strike-urshifu' },
  { rank: 49, name: 'Iron Thorns ex',                 share: 0.48, metaId: 'iron-thorns-ex' },
  { rank: 50, name: 'Night March',                    share: 0.44, metaId: 'night-march' },
  { rank: 51, name: 'Seismitoad EX',                  share: 0.44, metaId: null },
  { rank: 52, name: 'Ceruledge ex',                   share: 0.40, metaId: 'ceruledge-ex' },
  { rank: 53, name: 'Arceus & Dialga & Palkia',       share: 0.38, metaId: null },
  { rank: 54, name: 'Wall Stall',                     share: 0.35, metaId: 'wailord-stall' },
  { rank: 55, name: 'Future Box',                     share: 0.34, metaId: null },
  { rank: 56, name: 'Oranguru Control',               share: 0.34, metaId: null },
  { rank: 57, name: 'Mega Rayquaza Emerald Break',    share: 0.32, metaId: 'rayquaza-vmax-flaaffy' },
  { rank: 58, name: 'Darkrai EX Night Spear',         share: 0.32, metaId: null },
  { rank: 59, name: 'Mega Mewtwo Psychic Infinity',   share: 0.31, metaId: 'mewtwo-vmax-expanded' },
  { rank: 60, name: 'Buzzwole Sledgehammer',          share: 0.30, metaId: 'buzzwole-lycanroc' },
]

// Index meta-decks by id for fast lookup
const META_BY_ID = Object.fromEntries(META_DECKS.map(d => [d.id, d]))

function getTier(share) {
  if (share >= 5)  return { label: 'S', color: '#c9a84c' }
  if (share >= 2)  return { label: 'A', color: '#6d3eb0' }
  if (share >= 1)  return { label: 'B', color: '#2e5fa3' }
  return              { label: 'C', color: '#3a7a3a' }
}

// Build collection lookup from Pi card list
function buildCollection(cards) {
  const lookup = {}
  for (const c of cards) {
    if (c.set_code && c.card_number) {
      const key = `${c.set_code.toUpperCase()}-${c.card_number}`
      lookup[key] = (lookup[key] || 0) + 1
    }
    if (c.name) {
      const nk = c.name.toLowerCase()
      lookup[nk] = (lookup[nk] || 0) + 1
    }
  }
  return lookup
}

function getOwned(card, collection) {
  const setKey = `${(card.set_code || '').toUpperCase()}-${card.number}`
  const nameKey = (card.name || '').toLowerCase()
  return Math.max(collection[setKey] || 0, collection[nameKey] || 0)
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Decks() {
  const [collection, setCollection] = useState({})
  const [collectionLoaded, setCollectionLoaded] = useState(false)
  const [expanded, setExpanded]     = useState(null)
  const [search, setSearch]         = useState('')
  const [tierFilter, setTierFilter] = useState([])

  // Fetch all cards from Pi
  useEffect(() => {
    const BASE = import.meta.env.VITE_API_URL || ''
    fetch(`${BASE}/api/cards?limit=10000`)
      .then(r => r.json())
      .then(cards => {
        if (Array.isArray(cards)) {
          setCollection(buildCollection(cards))
          setCollectionLoaded(true)
        }
      })
      .catch(() => setCollectionLoaded(true)) // no Pi connected — still show list
  }, [])

  const filtered = useMemo(() => {
    return TOP_60.filter(d => {
      const tier = getTier(d.share).label
      if (tierFilter.length > 0 && !tierFilter.includes(tier)) return false
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, tierFilter])

  function toggle(rank) {
    setExpanded(prev => prev === rank ? null : rank)
  }

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
            Top 60 Standard · <a href="https://limitlesstcg.com/decks?format=standard" target="_blank" rel="noreferrer"
              style={{ color: 'var(--gold)' }}>limitlesstcg.com</a>
          </div>
          <div style={{ fontSize: '0.72rem', color: collectionLoaded ? 'var(--text-dim)' : 'var(--gold)' }}>
            {collectionLoaded ? '✓ Collection loaded' : '⏳ Loading collection…'}
          </div>
        </div>

        <input type="text" placeholder="Search decks…" value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ width: '100%', padding: '9px 12px', marginBottom: 10, boxSizing: 'border-box',
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.85rem' }} />

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {tiers.map(t => (
            <button key={t.label} onClick={() => toggleTier(t.label)}
              style={{ padding: '5px 12px', borderRadius: 4, cursor: 'pointer', fontSize: '0.78rem',
                border: `1px solid ${tierFilter.includes(t.label) ? t.color : 'var(--border)'}`,
                background: tierFilter.includes(t.label) ? `${t.color}22` : 'var(--surface)',
                color: tierFilter.includes(t.label) ? t.color : 'var(--text-dim)' }}>
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

      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 10 }}>
        {filtered.length} deck{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* Deck rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {filtered.map(d => (
          <DeckRow key={d.rank} deck={d} collection={collection}
            metaDeck={d.metaId ? META_BY_ID[d.metaId] : null}
            expanded={expanded === d.rank}
            onToggle={() => toggle(d.rank)} />
        ))}
      </div>
    </div>
  )
}

// ── Deck Row ──────────────────────────────────────────────────────────────────

function DeckRow({ deck, collection, metaDeck, expanded, onToggle }) {
  const tier = getTier(deck.share)

  // Calculate collection stats if we have a decklist
  const stats = useMemo(() => {
    if (!metaDeck) return null
    let totalCards = 0, ownedCards = 0, missingCards = [], totalMissingCost = 0
    for (const c of metaDeck.cards) {
      totalCards += c.qty
      const have = Math.min(getOwned(c, collection), c.qty)
      ownedCards += have
      const need = c.qty - have
      if (need > 0) {
        missingCards.push({ ...c, have, need })
      }
    }
    const pct = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0
    return { totalCards, ownedCards, missingCards, pct, totalMissingCost }
  }, [metaDeck, collection])

  const limitlessUrl = `https://limitlesstcg.com/decks?format=standard&name=${encodeURIComponent(deck.name)}`

  return (
    <div style={{ background: 'var(--surface)', border: `1px solid ${expanded ? 'var(--gold-dim)' : 'var(--border)'}`,
      borderRadius: 'var(--radius)', overflow: 'hidden' }}>

      {/* Header row — always visible */}
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px', cursor: 'pointer' }}>

        {/* Rank */}
        <div style={{ minWidth: 28, textAlign: 'right', fontSize: '0.78rem',
          color: 'var(--text-dim)', fontVariantNumeric: 'tabular-nums' }}>
          #{deck.rank}
        </div>

        {/* Tier badge */}
        <div style={{ minWidth: 28, textAlign: 'center', fontSize: '0.72rem', fontWeight: 700,
          padding: '2px 6px', borderRadius: 3,
          background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}` }}>
          {tier.label}
        </div>

        {/* Name */}
        <div style={{ flex: 1, fontWeight: 500, fontSize: '0.92rem' }}>{deck.name}</div>

        {/* Owned % if we have data */}
        {stats && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
            <div style={{ width: 60, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', borderRadius: 2, width: `${stats.pct}%`,
                background: stats.pct === 100 ? '#4caf50' : stats.pct >= 50 ? 'var(--gold)' : tier.color }} />
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', minWidth: 34, textAlign: 'right' }}>
              {stats.pct}%
            </span>
          </div>
        )}

        {/* Share bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div style={{ width: 60, height: 4, background: 'var(--surface2)', borderRadius: 2, overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: 2,
              width: `${Math.min((deck.share / 8) * 100, 100)}%`, background: tier.color }} />
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', minWidth: 38,
            textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
            {deck.share}%
          </div>
        </div>

        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', flexShrink: 0 }}>
          {expanded ? '▲' : '▼'}
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div style={{ borderTop: '1px solid var(--border)', padding: 16 }}>
          {metaDeck ? (
            <DeckDetail metaDeck={metaDeck} stats={stats} collection={collection}
              limitlessUrl={limitlessUrl} />
          ) : (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ color: 'var(--text-dim)', fontSize: '0.82rem', marginBottom: 12 }}>
                Full decklist not available locally.
              </div>
              <a href={limitlessUrl} target="_blank" rel="noreferrer"
                style={{ color: 'var(--gold)', fontSize: '0.85rem', textDecoration: 'none' }}>
                View on Limitless ↗
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Deck Detail ───────────────────────────────────────────────────────────────

function DeckDetail({ metaDeck, stats, collection, limitlessUrl }) {
  return (
    <div>
      {/* Summary bar */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 16,
        fontSize: '0.82rem', color: 'var(--text-dim)' }}>
        <span style={{ color: stats.pct === 100 ? '#4caf50' : 'var(--text)' }}>
          ✅ <strong>{stats.ownedCards}/{stats.totalCards}</strong> cards owned ({stats.pct}%)
        </span>
        <span>🃏 <strong>{stats.missingCards.reduce((s, c) => s + c.need, 0)}</strong> missing</span>
        <a href={limitlessUrl} target="_blank" rel="noreferrer"
          style={{ marginLeft: 'auto', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.78rem' }}>
          View on Limitless ↗
        </a>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Full card list */}
        <div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>
            FULL DECKLIST ({stats.totalCards} cards)
          </div>
          <div style={{ maxHeight: 340, overflowY: 'auto' }}>
            {metaDeck.cards.map((c, i) => {
              const have = Math.min(getOwned(c, collection), c.qty)
              const ok   = have >= c.qty
              const partial = have > 0 && !ok
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                  padding: '3px 0', borderBottom: '1px solid var(--border)', fontSize: '0.78rem' }}>
                  <span style={{ color: ok ? '#4caf50' : partial ? 'var(--gold)' : 'var(--red,#e57373)',
                    minWidth: 12, fontSize: '0.7rem' }}>
                    {ok ? '✓' : partial ? '~' : '✗'}
                  </span>
                  <span style={{ color: 'var(--text-dim)', minWidth: 16, textAlign: 'right' }}>{c.qty}×</span>
                  <span style={{ flex: 1 }}>{c.name}</span>
                  <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                    {c.set_code} {c.number}
                  </span>
                  {!ok && (
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem', minWidth: 28, textAlign: 'right' }}>
                      {have}/{c.qty}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Missing cards */}
        <div>
          {stats.missingCards.length === 0 ? (
            <div style={{ textAlign: 'center', paddingTop: 40 }}>
              <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✅</div>
              <div style={{ color: '#4caf50', fontWeight: 600 }}>You own all the cards!</div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>
                MISSING ({stats.missingCards.reduce((s, c) => s + c.need, 0)} cards)
              </div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', marginBottom: 8, fontStyle: 'italic' }}>
                Connect Pi with PokéTCG API key for live prices
              </div>
              <div style={{ maxHeight: 310, overflowY: 'auto' }}>
                {stats.missingCards.map((c, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                    padding: '3px 0', borderBottom: '1px solid var(--border)', fontSize: '0.78rem' }}>
                    <span style={{ color: '#e57373', minWidth: 16 }}>{c.need}×</span>
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                      {c.set_code} {c.number}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
