import { useState, useMemo } from 'react'
import {
  META_DECKS, TIER_COLORS,
  deckTotal, countOwned, missingCards, costToComplete, deckScore,
} from '../data/meta-decks'

// ── Helpers ───────────────────────────────────────────────────────────────────

const ENERGY_ICONS = {
  fire:'🔥', water:'💧', grass:'🌿', lightning:'⚡', psychic:'🔮',
  fighting:'👊', dark:'🌑', metal:'⚙️', dragon:'🐉', colorless:'⭐',
}

const TIER_LABELS = { S:'S-Tier', A:'A-Tier', B:'B-Tier', C:'C-Tier' }

const SORTS = [
  { id: 'score',    label: '🏆 Value Score'      },
  { id: 'owned',   label: '✅ Most Owned'        },
  { id: 'missing', label: '🃏 Fewest Missing'    },
  { id: 'cost',    label: '💰 Cheapest to Build' },
  { id: 'winrate', label: '📈 Highest Win Rate'  },
  { id: 'name',    label: '🔤 Alphabetical'      },
]

function parseImport(text) {
  /**
   * Parse PTCGL export format:
   *   Pokémon: 12
   *   4 Charizard ex OBF 228
   *   ...
   * Returns { "SET-NUMBER": qty, "name": qty }
   */
  const result = {}
  for (const line of text.split('\n')) {
    const m = line.trim().match(/^(\d+)\s+(.+?)\s+([A-Z\-]+)\s+([\w]+)\s*$/)
    if (m) {
      const [, qty, name, set, num] = m
      const key = `${set}-${num}`.toLowerCase()
      result[key] = (result[key] ?? 0) + parseInt(qty)
      const nk = name.toLowerCase()
      result[nk] = (result[nk] ?? 0) + parseInt(qty)
    }
  }
  return result
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function Decks() {
  // Collection: in real use, fetched from Pi API. For now, manual import or empty.
  const [collection, setCollection]     = useState({})
  const [importText, setImportText]     = useState('')
  const [showImport, setShowImport]     = useState(false)
  const [selectedDeck, setSelectedDeck] = useState(null)

  // Filters
  const [format, setFormat]             = useState('both')       // 'standard' | 'expanded' | 'both'
  const [tiers, setTiers]               = useState(['S','A','B','C'])
  const [archetypes, setArchetypes]     = useState([])           // empty = all
  const [maxCost, setMaxCost]           = useState(500)
  const [minOwned, setMinOwned]         = useState(0)
  const [energyFilter, setEnergyFilter] = useState([])

  // Sort
  const [sortBy, setSortBy]             = useState('score')

  // Score weights
  const [weights, setWeights] = useState({ winrate: 40, ownership: 40, cost: 20 })
  const [showWeights, setShowWeights] = useState(false)

  const normWeights = useMemo(() => ({
    winrate:   weights.winrate   / 100,
    ownership: weights.ownership / 100,
    cost:      weights.cost      / 100,
  }), [weights])

  const priceMap = {} // Future: pull from Pi API /api/prices

  // Computed deck list with stats
  const deckList = useMemo(() => {
    return META_DECKS.map(deck => {
      const total    = deckTotal(deck)
      const owned    = countOwned(deck, collection)
      const missing  = missingCards(deck, collection)
      const cost     = costToComplete(deck, collection, priceMap)
      const score    = deckScore(deck, collection, priceMap, normWeights)
      const ownedPct = total > 0 ? owned / total : 0
      return { deck, total, owned, missing, cost, score, ownedPct }
    })
  }, [collection, normWeights])

  // Filter
  const filtered = useMemo(() => {
    return deckList.filter(({ deck, cost, ownedPct }) => {
      if (format !== 'both' && deck.format !== format) return false
      if (!tiers.includes(deck.tier)) return false
      if (archetypes.length > 0 && !archetypes.includes(deck.archetype)) return false
      if (energyFilter.length > 0 && !energyFilter.some(e => deck.energy.includes(e))) return false
      if (cost > maxCost) return false
      if (ownedPct * 100 < minOwned) return false
      return true
    })
  }, [deckList, format, tiers, archetypes, energyFilter, maxCost, minOwned])

  // Sort
  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'score':   return b.score - a.score
        case 'owned':   return b.ownedPct - a.ownedPct
        case 'missing': return a.missing.length - b.missing.length
        case 'cost':    return a.cost - b.cost
        case 'winrate': return b.deck.win_rate - a.deck.win_rate
        case 'name':    return a.deck.name.localeCompare(b.deck.name)
        default:        return 0
      }
    })
  }, [filtered, sortBy])

  function handleImport() {
    const parsed = parseImport(importText)
    setCollection(prev => ({ ...prev, ...parsed }))
    setShowImport(false)
    setImportText('')
  }

  function toggleTier(t) {
    setTiers(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  function toggleArchetype(a) {
    setArchetypes(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  function toggleEnergy(e) {
    setEnergyFilter(prev => prev.includes(e) ? prev.filter(x => x !== e) : [...prev, e])
  }

  const hasCollection = Object.keys(collection).length > 0

  return (
    <div>

      {/* ── Toolbar ── */}
      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:16, alignItems:'center' }}>
        <select
          value={sortBy} onChange={e => setSortBy(e.target.value)}
          style={{ padding:'8px 12px', background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', color:'var(--text)', fontSize:'0.85rem' }}
        >
          {SORTS.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>

        {/* Format toggle */}
        {['both','standard','expanded'].map(f => (
          <button key={f} onClick={() => setFormat(f)}
            style={{ padding:'7px 12px', borderRadius:'var(--radius)', border:'1px solid var(--border)',
              background: format === f ? 'var(--gold)' : 'var(--surface)',
              color: format === f ? '#0b0b10' : 'var(--text-dim)', cursor:'pointer', fontSize:'0.82rem' }}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}

        <button onClick={() => setShowImport(true)}
          style={{ marginLeft:'auto', padding:'7px 14px', borderRadius:'var(--radius)',
            background:'var(--surface)', border:'1px solid var(--border)', color:'var(--text-dim)',
            cursor:'pointer', fontSize:'0.82rem' }}>
          📥 Import Collection
        </button>
        <button onClick={() => setShowWeights(w => !w)}
          style={{ padding:'7px 14px', borderRadius:'var(--radius)',
            background: showWeights ? 'rgba(201,168,76,0.15)' : 'var(--surface)',
            border: `1px solid ${showWeights ? 'var(--gold)' : 'var(--border)'}`,
            color: showWeights ? 'var(--gold)' : 'var(--text-dim)', cursor:'pointer', fontSize:'0.82rem' }}>
          ⚖️ Weights
        </button>
      </div>

      {/* ── Weight sliders ── */}
      {showWeights && (
        <div style={{ background:'var(--surface)', border:'1px solid var(--border)', borderRadius:'var(--radius)', padding:16, marginBottom:16 }}>
          <div style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginBottom:12 }}>
            Adjust how the Value Score is calculated. Weights are normalised automatically.
          </div>
          {[
            { key:'winrate',   label:'Win Rate',        color:'#4caf50' },
            { key:'ownership', label:'Cards Owned',     color:'var(--gold)' },
            { key:'cost',      label:'Low Cost Bonus',  color:'#2196f3' },
          ].map(({ key, label, color }) => (
            <div key={key} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
              <div style={{ width:100, fontSize:'0.8rem', color:'var(--text-dim)' }}>{label}</div>
              <input type="range" min={0} max={100} value={weights[key]}
                onChange={e => setWeights(w => ({ ...w, [key]: parseInt(e.target.value) }))}
                style={{ flex:1, accentColor: color }} />
              <div style={{ width:28, fontSize:'0.8rem', color, textAlign:'right' }}>{weights[key]}</div>
            </div>
          ))}
          <div style={{ fontSize:'0.72rem', color:'var(--text-dim)', marginTop:4 }}>
            Score formula: (Win Rate × {weights.winrate}) + (Owned × {weights.ownership}) + (Cost × {weights.cost}) / {weights.winrate+weights.ownership+weights.cost} × 100
          </div>
        </div>
      )}

      {/* ── Filter row ── */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:16 }}>
        {/* Tier */}
        {['S','A','B','C'].map(t => (
          <button key={t} onClick={() => toggleTier(t)}
            style={{ padding:'4px 10px', borderRadius:4, fontSize:'0.75rem', cursor:'pointer',
              border: `1px solid ${tiers.includes(t) ? TIER_COLORS[t] : 'var(--border)'}`,
              background: tiers.includes(t) ? `${TIER_COLORS[t]}22` : 'var(--surface)',
              color: tiers.includes(t) ? TIER_COLORS[t] : 'var(--text-dim)' }}>
            {TIER_LABELS[t]}
          </button>
        ))}
        <div style={{ width:1, background:'var(--border)', margin:'0 4px' }} />
        {/* Archetypes */}
        {['aggro','control','combo','midrange','stall'].map(a => (
          <button key={a} onClick={() => toggleArchetype(a)}
            style={{ padding:'4px 10px', borderRadius:4, fontSize:'0.75rem', cursor:'pointer',
              border: `1px solid ${archetypes.includes(a) ? 'var(--gold)' : 'var(--border)'}`,
              background: archetypes.includes(a) ? 'rgba(201,168,76,0.12)' : 'var(--surface)',
              color: archetypes.includes(a) ? 'var(--gold)' : 'var(--text-dim)' }}>
            {a}
          </button>
        ))}
        <div style={{ width:1, background:'var(--border)', margin:'0 4px' }} />
        {/* Energy */}
        {Object.entries(ENERGY_ICONS).map(([e, icon]) => (
          <button key={e} onClick={() => toggleEnergy(e)} title={e}
            style={{ padding:'4px 8px', borderRadius:4, fontSize:'0.82rem', cursor:'pointer',
              border: `1px solid ${energyFilter.includes(e) ? 'var(--gold)' : 'var(--border)'}`,
              background: energyFilter.includes(e) ? 'rgba(201,168,76,0.12)' : 'var(--surface)' }}>
            {icon}
          </button>
        ))}
      </div>

      {/* ── Budget + min owned sliders ── */}
      <div style={{ display:'flex', gap:20, flexWrap:'wrap', marginBottom:16 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.8rem', color:'var(--text-dim)' }}>
          <span>Max cost to complete:</span>
          <input type="range" min={0} max={500} step={25} value={maxCost}
            onChange={e => setMaxCost(parseInt(e.target.value))} style={{ accentColor:'var(--gold)', width:100 }} />
          <span style={{ color:'var(--gold)', minWidth:40 }}>${maxCost}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:'0.8rem', color:'var(--text-dim)' }}>
          <span>Min cards owned:</span>
          <input type="range" min={0} max={100} step={5} value={minOwned}
            onChange={e => setMinOwned(parseInt(e.target.value))} style={{ accentColor:'var(--gold)', width:100 }} />
          <span style={{ color:'var(--gold)', minWidth:32 }}>{minOwned}%</span>
        </div>
      </div>

      {/* ── Collection warning ── */}
      {!hasCollection && (
        <div style={{ background:'rgba(201,168,76,0.08)', border:'1px solid var(--gold-dim)', borderRadius:'var(--radius)',
          padding:'12px 16px', marginBottom:16, fontSize:'0.82rem', color:'var(--text-dim)', lineHeight:1.6 }}>
          📥 No collection loaded — scores show deck quality only (ownership = 0%). <br/>
          Import a PTCGL export or scan cards with BinderBot to see personalised scores.
        </div>
      )}

      {/* ── Results count ── */}
      <div style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginBottom:12 }}>
        {sorted.length} deck{sorted.length !== 1 ? 's' : ''} · sorted by {SORTS.find(s => s.id === sortBy)?.label}
      </div>

      {/* ── Deck list ── */}
      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {sorted.map(({ deck, total, owned, missing, cost, score, ownedPct }) => (
          <DeckRow key={deck.id} deck={deck} total={total} owned={owned}
            missing={missing} cost={cost} score={score} ownedPct={ownedPct}
            collection={collection}
            selected={selectedDeck === deck.id}
            onSelect={() => setSelectedDeck(selectedDeck === deck.id ? null : deck.id)}
          />
        ))}
      </div>

      {/* ── Import modal ── */}
      {showImport && (
        <div className="modal-backdrop" onClick={() => setShowImport(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>📥 Import PTCGL Collection</h2>
            <p style={{ fontSize:'0.8rem', color:'var(--text-dim)', marginBottom:12, lineHeight:1.6 }}>
              Export your collection from Pokémon TCG Live or any deck editor in PTCGL format, then paste it below. <br/>
              Format: <code style={{ color:'var(--gold)' }}>4 Charizard ex OBF 228</code>
            </p>
            <textarea
              value={importText} onChange={e => setImportText(e.target.value)}
              placeholder={"Pokémon: 12\n4 Charizard ex OBF 228\n2 Pidgeot ex OBF 164\n...\nTrainer: 36\n4 Arven SVI 166\n..."}
              style={{ width:'100%', height:200, background:'var(--surface2)', border:'1px solid var(--border)',
                borderRadius:6, color:'var(--text)', fontSize:'0.82rem', padding:'10px 12px',
                resize:'vertical', fontFamily:'monospace' }}
            />
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setShowImport(false)}>Cancel</button>
              <button className="btn btn-gold" onClick={handleImport} disabled={!importText.trim()}>Import</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Deck Row ─────────────────────────────────────────────────────────────────

function ScoreBadge({ score }) {
  const color = score >= 75 ? '#4caf50' : score >= 50 ? 'var(--gold)' : score >= 25 ? '#2196f3' : 'var(--text-dim)'
  return (
    <div style={{ textAlign:'center', minWidth:52 }}>
      <div style={{ fontSize:'1.6rem', fontWeight:700, color, lineHeight:1 }}>{score}</div>
      <div style={{ fontSize:'0.6rem', color:'var(--text-dim)', marginTop:2 }}>VALUE</div>
    </div>
  )
}

function DeckRow({ deck, total, owned, missing, cost, score, ownedPct, collection, selected, onSelect }) {
  const ownedPctDisplay = Math.round(ownedPct * 100)

  return (
    <div style={{ background:'var(--surface)', border:`1px solid ${selected ? 'var(--gold-dim)' : 'var(--border)'}`,
      borderRadius:'var(--radius)', overflow:'hidden', cursor:'pointer' }} onClick={onSelect}>

      {/* Header row */}
      <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 16px' }}>
        <ScoreBadge score={score} />

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:4, flexWrap:'wrap' }}>
            <div style={{ fontWeight:600, fontSize:'1rem' }}>{deck.name}</div>
            <span style={{ fontSize:'0.72rem', fontWeight:700, padding:'2px 7px', borderRadius:3,
              background:`${TIER_COLORS[deck.tier]}22`, color:TIER_COLORS[deck.tier], border:`1px solid ${TIER_COLORS[deck.tier]}` }}>
              {deck.tier}
            </span>
            <span style={{ fontSize:'0.72rem', color:'var(--text-dim)', padding:'2px 7px', borderRadius:3,
              background:'var(--surface2)', border:'1px solid var(--border)' }}>
              {deck.format}
            </span>
            <span style={{ fontSize:'0.72rem', color:'var(--text-dim)' }}>{deck.archetype}</span>
            <span style={{ fontSize:'0.82rem' }}>
              {deck.energy.map(e => ENERGY_ICONS[e] ?? e).join(' ')}
            </span>
          </div>

          {/* Stats bar */}
          <div style={{ display:'flex', gap:16, flexWrap:'wrap', fontSize:'0.78rem', color:'var(--text-dim)' }}>
            <span>📈 {deck.win_rate}% win rate</span>
            <span style={{ color: ownedPctDisplay === 100 ? '#4caf50' : ownedPctDisplay >= 50 ? 'var(--gold)' : 'var(--text-dim)' }}>
              ✅ {owned}/{total} cards ({ownedPctDisplay}%)
            </span>
            {missing.length > 0 && <span>🃏 {missing.length} missing types</span>}
            {cost > 0 ? <span>💰 ~${cost.toFixed(0)} to complete</span> : <span style={{ color:'#4caf50' }}>💰 Ready to build</span>}
          </div>

          {/* Ownership progress bar */}
          <div style={{ marginTop:8, height:4, background:'var(--surface2)', borderRadius:2, overflow:'hidden' }}>
            <div style={{ height:'100%', width:`${ownedPctDisplay}%`, borderRadius:2,
              background: ownedPctDisplay === 100 ? '#4caf50' : 'var(--gold)', transition:'width 0.3s' }} />
          </div>
        </div>

        <div style={{ fontSize:'0.8rem', color:'var(--text-dim)', flexShrink:0 }}>
          {selected ? '▲' : '▼'}
        </div>
      </div>

      {/* Expanded detail */}
      {selected && (
        <div style={{ borderTop:'1px solid var(--border)', padding:'16px' }}>
          <p style={{ fontSize:'0.82rem', color:'var(--text-dim)', marginBottom:16, lineHeight:1.6 }}>
            {deck.description}
          </p>

          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            {/* Full card list */}
            <div>
              <div style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginBottom:8, fontWeight:600 }}>
                Full Decklist ({total} cards)
              </div>
              <div style={{ maxHeight:320, overflowY:'auto' }}>
                {deck.cards.map((c, i) => {
                  const key   = `${c.set_code}-${c.number}`.toLowerCase()
                  const nk    = c.name.toLowerCase()
                  const have  = collection[key] ?? collection[nk] ?? 0
                  const owned = Math.min(have, c.qty)
                  const ok    = owned >= c.qty
                  return (
                    <div key={i} style={{ display:'flex', alignItems:'center', gap:6,
                      padding:'4px 0', borderBottom:'1px solid var(--border)', fontSize:'0.78rem' }}>
                      <span style={{ minWidth:14, color: ok ? '#4caf50' : have > 0 ? 'var(--gold)' : 'var(--red)' }}>
                        {ok ? '✓' : have > 0 ? '~' : '✗'}
                      </span>
                      <span style={{ color:'var(--text-dim)', minWidth:14 }}>{c.qty}×</span>
                      <span style={{ flex:1 }}>{c.name}</span>
                      <span style={{ color:'var(--text-dim)', fontSize:'0.68rem' }}>{c.set_code} {c.number}</span>
                      {!ok && <span style={{ color:'var(--text-dim)', fontSize:'0.68rem' }}>({have}/{c.qty})</span>}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Missing cards */}
            <div>
              {missing.length === 0 ? (
                <div style={{ textAlign:'center', paddingTop:40 }}>
                  <div style={{ fontSize:'1.5rem', marginBottom:8 }}>✅</div>
                  <div style={{ color:'#4caf50', fontWeight:600 }}>You own all the cards!</div>
                  <div style={{ color:'var(--text-dim)', fontSize:'0.8rem', marginTop:4 }}>This deck is ready to build.</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize:'0.78rem', color:'var(--text-dim)', marginBottom:8, fontWeight:600 }}>
                    Missing ({missing.reduce((s, c) => s + c.need, 0)} cards)
                    {cost > 0 && <span style={{ color:'var(--gold)', marginLeft:8 }}>~${cost.toFixed(2)} total</span>}
                  </div>
                  <div style={{ maxHeight:320, overflowY:'auto' }}>
                    {missing.map((c, i) => (
                      <div key={i} style={{ display:'flex', alignItems:'center', gap:6,
                        padding:'4px 0', borderBottom:'1px solid var(--border)', fontSize:'0.78rem' }}>
                        <span style={{ color:'var(--red)', minWidth:16 }}>{c.need}×</span>
                        <span style={{ flex:1 }}>{c.name}</span>
                        <span style={{ color:'var(--text-dim)', fontSize:'0.68rem' }}>{c.set_code} {c.number}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
