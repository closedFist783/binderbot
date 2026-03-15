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

// ── Tech card recommendations per archetype ───────────────────────────────────
const TECH_CARDS = {
  'gardevoir-ex': [
    { group: 'Attackers', cards: ['Scream Tail (PAR 86)', 'Cornerstone Mask Ogerpon ex (TWM 115)', 'Radiant Greninja (ASR 46)', 'Duskull (PRE 35)'] },
    { group: 'Disruption', cards: ['Path to the Peak (CRE 148)', 'Eri (TWM 176)', 'Lost Vacuum (LOR 162)'] },
    { group: 'Utility', cards: ['Pal Pad (SVI 182)', 'Jacq (SVI 175)', 'Extra Arven', 'Extra Iono'] },
  ],
  'dragapult-ex': [
    { group: 'Attackers', cards: ['Bloodmoon Ursaluna ex (TWM 141)', 'Fezandipiti ex (SFA 38)', 'Latias ex (SSP 76)', 'Hawlucha (SVI 118)'] },
    { group: 'Disruption', cards: ['Jamming Tower (TWM 153)', 'Counter Catcher (PAR 160)'] },
    { group: 'Recovery', cards: ['Night Stretcher (SFA 61)', "Extra Boss's Orders"] },
  ],
  'charizard-ex': [
    { group: 'Attackers', cards: ['Entei V (BRS 22)', 'Moltres (MEW 146)', 'Radiant Charizard (PGO 11)'] },
    { group: 'Disruption', cards: ['Lost Vacuum (LOR 162)', 'Iono (PAL 185)', 'Penny (SVI 183)'] },
    { group: 'Utility', cards: ['Rescue Board (TEF 159)', 'Artazon (PAL 171)', 'Extra Arven'] },
  ],
  'gholdengo-ex': [
    { group: 'Attackers', cards: ['Flutter Mane (PAR 78)', 'Iron Hands ex (PAR 70)', 'Iron Bundle (PAR 56)'] },
    { group: 'Disruption', cards: ['Path to the Peak (CRE 148)', 'Eri (TWM 176)'] },
    { group: 'Utility', cards: ['Box of Disaster (LOR 154)', 'Escape Rope (BST 125)', 'Extra Iono'] },
  ],
  'mew-vmax-genesect': [
    { group: 'Attackers', cards: ['Meloetta (FST 124)', 'Genesect V (FST 185)'] },
    { group: 'Disruption', cards: ['Power Tablet (FST 236)', 'Iono (PAL 185)'] },
    { group: 'Utility', cards: ["Freedom Shovel (FST 224)", "Extra Elesa's Sparkle", 'Cram-o-matic'] },
  ],
  'raging-bolt-ex': [
    { group: 'Attackers', cards: ['Iron Hands ex (PAR 70)', 'Raichu V (SIT 45)', 'Miraidon ex (SVI 81)'] },
    { group: 'Disruption', cards: ['Iono (PAL 185)', 'Counter Catcher (PAR 160)', 'Lightning Storm Rotom (MEW 101)'] },
    { group: 'Utility', cards: ['Energy Search (various)', 'Nest Ball (SVI 181)', 'Extra Terapagos ex'] },
  ],
  'miraidon-ex': [
    { group: 'Attackers', cards: ['Iron Hands ex (PAR 70)', 'Iron Bundle (PAR 56)', 'Raichu V (SIT 45)'] },
    { group: 'Disruption', cards: ['Iono (PAL 185)', 'Path to the Peak (CRE 148)'] },
    { group: 'Utility', cards: ['Escape Rope (BST 125)', 'Extra Energy', 'Cram-o-matic'] },
  ],
  'marnie-s-grimmsnarl-ex': [
    { group: 'Attackers', cards: ['Mimikyu (PAL 97)', 'Galarian Moltres V (EVS 93)', 'Darkrai V (ASR 98)'] },
    { group: 'Disruption', cards: ["Marnie's Pride (MEG 121)", 'Iono (PAL 185)', 'Lost Vacuum'] },
    { group: 'Utility', cards: ['Dark Patch (ASR 139)', "Extra Boss's Orders", 'Counter Catcher'] },
  ],
  'zoroark-gx': [
    { group: 'Partners', cards: ['Lycanroc GX (GRI 74)', 'Alolan Ninetales GX (LOT 132)', 'Weavile GX (UNM 132)'] },
    { group: 'Disruption', cards: ['Guzma (BUS 115)', 'N (FCO 105)', 'Judge (FLI 108)'] },
    { group: 'Utility', cards: ['Tapu Lele GX (GRI 60)', 'Brooklet Hill (GRI 120)', 'Max Potion'] },
  ],
  'pikachu-zekrom-gx': [
    { group: 'Attackers', cards: ['Boltund V (RCL 67)', 'Raichu & Alolan Raichu GX (UNM 54)', 'Tapu Koko Prism Star (TEU 51)'] },
    { group: 'Disruption', cards: ['Electropower (LOT 172)', 'Reset Stamp (UNM 206)', 'Iono'] },
    { group: 'Utility', cards: ['Thunder Mountain Prism Star (LOT 191)', 'Energy Switch', 'Bird Keeper'] },
  ],
  'buzzwole-lycanroc': [
    { group: 'Attackers', cards: ['Buzzwole (FOL 77)', 'Nihilego (LOT 106)', 'Carbink (FST 104)'] },
    { group: 'Disruption', cards: ['Guzma (BUS 115)', 'Judge (FLI 108)', 'Beast Ring (FOL 102)'] },
    { group: 'Utility', cards: ['Brooklet Hill (GRI 120)', 'Max Elixir (BKP 102)', 'Beast Energy Prism Star'] },
  ],
}

// ── Core cards for decks without a full metaId decklist ───────────────────────
const CORE_CARDS = {
  'Lugia Archeops': {
    core: [
      { name: 'Lugia V',              set_code: 'SIT', number: '138', qty: 3 },
      { name: 'Lugia VSTAR',          set_code: 'SIT', number: '139', qty: 3 },
      { name: 'Archeops',             set_code: 'SIT', number: '147', qty: 4 },
      { name: "Colress's Experiment", set_code: 'LOR', number: '155', qty: 4 },
      { name: 'Rare Candy',           set_code: '',    number: '',    qty: 4 },
      { name: 'Ultra Ball',           set_code: '',    number: '',    qty: 4 },
    ],
    fillers: ['Energy accelerators', 'Choice Belt', 'Jet Energy', 'supporters'],
  },
  'Lost Zone Box': {
    core: [
      { name: 'Comfey',               set_code: 'LOR', number: '79',  qty: 4 },
      { name: 'Cramorant',            set_code: 'LOR', number: '50',  qty: 2 },
      { name: "Colress's Experiment", set_code: 'LOR', number: '155', qty: 4 },
      { name: 'Mirage Gate',          set_code: 'LOR', number: '163', qty: 4 },
      { name: 'Escape Rope',          set_code: '',    number: '',    qty: 4 },
    ],
    fillers: ['Sableye LOR', 'Path to the Peak', 'Radiant Greninja', 'attackers of choice'],
  },
  'Giratina VSTAR': {
    core: [
      { name: 'Giratina V',           set_code: 'LOR', number: '130', qty: 3 },
      { name: 'Giratina VSTAR',       set_code: 'LOR', number: '131', qty: 3 },
      { name: 'Comfey',               set_code: 'LOR', number: '79',  qty: 4 },
      { name: 'Lost City',            set_code: 'LOR', number: '161', qty: 2 },
      { name: "Colress's Experiment", set_code: 'LOR', number: '155', qty: 4 },
    ],
    fillers: ['Radiant Charizard', 'Sableye LOR', 'Pal Pad', 'supporters'],
  },
  'Regidrago VSTAR': {
    core: [
      { name: 'Regidrago V',          set_code: 'SIT', number: '135', qty: 3 },
      { name: 'Regidrago VSTAR',      set_code: 'SIT', number: '136', qty: 3 },
      { name: 'Regieleki VMAX',       set_code: 'EVS', number: '58',  qty: 2 },
      { name: "Dragon's Call",        set_code: 'SIT', number: '155', qty: 4 },
      { name: 'Ultra Ball',           set_code: '',    number: '',    qty: 4 },
    ],
    fillers: ['Dragon energy attachments', 'various dragon Pokémon for copying', 'Snorlax', 'Cresselia'],
  },
  'Palkia VSTAR': {
    core: [
      { name: 'Palkia V',             set_code: 'ASR', number: '29',  qty: 3 },
      { name: 'Palkia VSTAR',         set_code: 'ASR', number: '30',  qty: 3 },
      { name: 'Sobble',               set_code: 'CRE', number: '41',  qty: 4 },
      { name: 'Drizzile',             set_code: 'SHF', number: '99',  qty: 3 },
      { name: 'Irida',                set_code: 'ASR', number: '147', qty: 4 },
    ],
    fillers: ['Inteleon CRE', 'Choice Belt', 'Cross Switcher', 'energy'],
  },
  'Chien-Pao Baxcalibur': {
    core: [
      { name: 'Chien-Pao ex',         set_code: 'PAL', number: '61',  qty: 3 },
      { name: 'Baxcalibur',           set_code: 'PAL', number: '60',  qty: 3 },
      { name: 'Frigibax',             set_code: 'PAL', number: '57',  qty: 4 },
      { name: 'Irida',                set_code: '',    number: '',    qty: 3 },
      { name: 'Ultra Ball',           set_code: '',    number: '',    qty: 4 },
    ],
    fillers: ["Boss's Orders", 'Iono', 'Path to the Peak', 'Water energy', 'Artazon'],
  },
  'Roaring Moon ex': {
    core: [
      { name: 'Roaring Moon ex',      set_code: 'PAR', number: '124', qty: 4 },
      { name: 'Munkidori',            set_code: 'TWM', number: '95',  qty: 2 },
      { name: 'Radiant Greninja',     set_code: 'ASR', number: '46',  qty: 1 },
      { name: 'Dark Patch',           set_code: 'ASR', number: '139', qty: 4 },
      { name: "Colress's Experiment", set_code: 'LOR', number: '155', qty: 4 },
    ],
    fillers: ['Counter Catcher', 'Iono', "Boss's Orders", 'Dark energy', 'Nest Ball'],
  },
  'Terapagos ex': {
    core: [
      { name: 'Terapagos ex',                    set_code: 'SCR', number: '128', qty: 3 },
      { name: 'Cornerstone Mask Ogerpon ex',     set_code: 'TWM', number: '115', qty: 2 },
      { name: 'Defiance Band',                   set_code: 'SVI', number: '169', qty: 4 },
      { name: 'Iono',                            set_code: '',    number: '',    qty: 4 },
      { name: 'Ultra Ball',                      set_code: '',    number: '',    qty: 4 },
    ],
    fillers: ['Earthen Vessel', 'Arven', 'various Tera type Pokémon', 'energy'],
  },
  'Garbodor Trashalanche': {
    core: [
      { name: 'Garbodor',            set_code: 'BKP', number: '57',  qty: 3 },
      { name: 'Trubbish',            set_code: 'BKP', number: '56',  qty: 4 },
      { name: 'Garbodor GX',         set_code: 'GRI', number: '51',  qty: 2 },
      { name: 'Acerola',             set_code: 'BUS', number: '112', qty: 3 },
      { name: 'Float Stone',         set_code: '',    number: '',    qty: 4 },
    ],
    fillers: ['N', 'Hex Maniac', 'Professor Sycamore', 'various support items'],
  },
  'Decidueye GX': {
    core: [
      { name: 'Decidueye GX',        set_code: 'SHF', number: '7',   qty: 3 },
      { name: 'Rowlet',              set_code: 'SUM', number: '9',   qty: 4 },
      { name: 'Dartrix',             set_code: 'SUM', number: '11',  qty: 3 },
      { name: 'Vileplume',           set_code: 'AOR', number: '3',   qty: 3 },
      { name: 'Alolan Exeggutor',    set_code: 'FLI', number: '2',   qty: 2 },
    ],
    fillers: ['Level Ball', 'Revitalizer', 'Forest of Giant Plants', 'supporters'],
  },
  'Zapdos TEU': {
    core: [
      { name: 'Zapdos',              set_code: 'TEU', number: '40',  qty: 4 },
      { name: 'Jirachi',             set_code: 'TEU', number: '99',  qty: 4 },
      { name: 'Escape Board',        set_code: 'UPR', number: '122', qty: 4 },
      { name: 'Thunder Mountain',    set_code: 'LOT', number: '191', qty: 4 },
    ],
    fillers: ['Tapu Koko Prism Star', 'Electropower', 'Acro Bike', 'Lightning Energy'],
  },
}

const DEFAULT_CORE = { core: [], fillers: ['View full list on Limitless for recommended cards'] }

function getCoreCards(deckName) {
  return CORE_CARDS[deckName] || DEFAULT_CORE
}

// ── Tier / composite score ────────────────────────────────────────────────────

/**
 * Compute composite score and tier.
 * When collectionLoaded=false fall back to share-only heuristic.
 */
function computeTier(share, ownedPct, missingFraction, collectionLoaded) {
  if (!collectionLoaded) {
    if (share >= 5)  return { label: 'S', color: '#c9a84c', composite: null }
    if (share >= 2)  return { label: 'A', color: '#6d3eb0', composite: null }
    if (share >= 1)  return { label: 'B', color: '#2e5fa3', composite: null }
    return              { label: 'C', color: '#3a7a3a', composite: null }
  }

  const win_score     = Math.min((share / 8.0) * 100, 100)
  const owned_score   = ownedPct * 100
  const missing_score = (1 - missingFraction) * 100
  const composite     = win_score * 0.40 + owned_score * 0.35 + missing_score * 0.25

  let label, color
  if (composite >= 70)      { label = 'S'; color = '#c9a84c' }
  else if (composite >= 45) { label = 'A'; color = '#6d3eb0' }
  else if (composite >= 25) { label = 'B'; color = '#2e5fa3' }
  else                      { label = 'C'; color = '#3a7a3a' }

  return {
    label, color, composite: Math.round(composite),
    winScore: Math.round(win_score),
    ownedScore: Math.round(owned_score),
    missingScore: Math.round(missing_score),
  }
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
  const setKey  = `${(card.set_code || '').toUpperCase()}-${card.number}`
  const nameKey = (card.name || '').toLowerCase()
  return Math.max(collection[setKey] || 0, collection[nameKey] || 0)
}

// Compute stats for a list of cards (used for both full decks and core cards)
function computeStats(cards, collection) {
  let totalCards = 0, ownedCards = 0
  const missingCards = []
  for (const c of cards) {
    totalCards += c.qty
    const have = Math.min(getOwned(c, collection), c.qty)
    ownedCards += have
    const need = c.qty - have
    if (need > 0) missingCards.push({ ...c, have, need })
  }
  const pct = totalCards > 0 ? Math.round((ownedCards / totalCards) * 100) : 0
  return { totalCards, ownedCards, missingCards, pct }
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function Decks() {
  const [collection, setCollection]             = useState({})
  const [collectionLoaded, setCollectionLoaded] = useState(false)
  const [search, setSearch]                     = useState('')
  const [tierFilter, setTierFilter]             = useState([])
  // Detail page state
  const [view, setView]                         = useState('list')   // 'list' | 'detail'
  const [selectedDeck, setSelectedDeck]         = useState(null)
  const [detailTab, setDetailTab]               = useState('list')   // 'list' | 'missing' | 'recommended'

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
      .catch(() => setCollectionLoaded(true))
  }, [])

  function openDetail(deck) {
    setSelectedDeck(deck)
    setView('detail')
    setDetailTab('list')
  }

  function backToList() {
    setView('list')
    setSelectedDeck(null)
    setDetailTab('list')
  }

  const filtered = useMemo(() => {
    return TOP_60.filter(d => {
      const metaDeck   = d.metaId ? META_BY_ID[d.metaId] : null
      const cards      = metaDeck ? metaDeck.cards : getCoreCards(d.name).core
      const stats      = computeStats(cards, collection)
      const ownedPct   = stats.totalCards > 0 ? stats.ownedCards / stats.totalCards : 0
      const missingFrac = stats.totalCards > 0 ? (stats.totalCards - stats.ownedCards) / stats.totalCards : 1
      const tier       = computeTier(d.share, ownedPct, missingFrac, collectionLoaded)
      if (tierFilter.length > 0 && !tierFilter.includes(tier.label)) return false
      if (search && !d.name.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
  }, [search, tierFilter, collection, collectionLoaded])

  function toggleTier(t) {
    setTierFilter(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t])
  }

  const tiers = [
    { label: 'S', color: '#c9a84c', desc: 'composite ≥70' },
    { label: 'A', color: '#6d3eb0', desc: '45–69' },
    { label: 'B', color: '#2e5fa3', desc: '25–44' },
    { label: 'C', color: '#3a7a3a', desc: '<25' },
  ]

  // ── Detail page ─────────────────────────────────────────────────────────────
  if (view === 'detail' && selectedDeck) {
    const d         = selectedDeck
    const metaDeck  = d.metaId ? META_BY_ID[d.metaId] : null
    const coreData  = getCoreCards(d.name)
    const cards     = metaDeck ? metaDeck.cards : coreData.core
    const stats     = computeStats(cards, collection)
    const ownedPct  = stats.totalCards > 0 ? stats.ownedCards / stats.totalCards : 0
    const missFrac  = stats.totalCards > 0 ? (stats.totalCards - stats.ownedCards) / stats.totalCards : 1
    const tier      = computeTier(d.share, ownedPct, missFrac, collectionLoaded)
    const limitlessUrl = `https://limitlesstcg.com/decks?format=standard&name=${encodeURIComponent(d.name)}`
    const totalMissing = stats.missingCards.reduce((s, c) => s + c.need, 0)

    return (
      <div>
        {/* Back button + header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={backToList}
            style={{ background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', padding: '6px 14px', cursor: 'pointer',
              color: 'var(--text)', fontSize: '0.82rem' }}>
            ← Back
          </button>
          <span style={{ color: 'var(--text-dim)', fontSize: '0.75rem' }}>Deck Detail</span>
        </div>

        {/* Deck title row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>#{d.rank}</span>
          <h2 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700 }}>{d.name}</h2>
          <span style={{ fontSize: '0.75rem', padding: '2px 8px', borderRadius: 3, fontWeight: 700,
            background: `${tier.color}22`, color: tier.color, border: `1px solid ${tier.color}` }}>
            {tier.label}
          </span>
          <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>{d.share}% meta share</span>
          <a href={limitlessUrl} target="_blank" rel="noreferrer"
            style={{ marginLeft: 'auto', color: 'var(--gold)', textDecoration: 'none', fontSize: '0.82rem' }}>
            View on Limitless ↗
          </a>
        </div>

        {/* Composite score breakdown */}
        {tier.composite !== null && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '12px 16px', marginBottom: 16 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: 10 }}>
              COMPOSITE SCORE
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ fontSize: '2rem', fontWeight: 700, color: tier.color }}>{tier.composite}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
                <ScoreBar label={`Win Rate`} value={tier.winScore} weight="40%" color="#4caf50" />
                <ScoreBar label={`Owned`}    value={tier.ownedScore}   weight="35%" color="var(--gold)" />
                <ScoreBar label={`Completeness`} value={tier.missingScore} weight="25%" color="#64b5f6" />
              </div>
            </div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', marginTop: 8 }}>
              composite = win_rate×40% + owned×35% + completeness×25%
            </div>
          </div>
        )}
        {tier.composite === null && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius)', padding: '10px 16px', marginBottom: 16,
            fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Tier based on meta share only — connect your collection for composite scoring.
          </div>
        )}

        {/* ── Summary bar — always visible above tabs ── */}
        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 12,
          fontSize: '0.82rem', color: 'var(--text-dim)',
          padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
          <span style={{ color: stats.pct === 100 ? '#4caf50' : 'var(--text)' }}>
            <strong>{stats.ownedCards}/{stats.totalCards}</strong> cards owned ({stats.pct}%)
          </span>
          <span>🃏 <strong>{totalMissing}</strong> missing</span>
          {!metaDeck && stats.totalCards > 0 && (
            <span style={{ fontSize: '0.72rem', opacity: 0.7 }}>(core cards only)</span>
          )}
        </div>

        {/* ── Tab bar ── */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[
            { key: 'list',        label: 'Decklist' },
            { key: 'missing',     label: 'Missing' },
            { key: 'recommended', label: 'Recommended' },
          ].map(({ key, label }) => {
            const active = detailTab === key
            return (
              <button key={key} onClick={() => setDetailTab(key)}
                style={{
                  padding: '7px 16px',
                  borderRadius: 'var(--radius)',
                  cursor: 'pointer',
                  fontSize: '0.82rem',
                  fontWeight: active ? 600 : 400,
                  border: active ? 'none' : '1px solid var(--border)',
                  background: active ? 'var(--gold)' : 'var(--surface)',
                  color: active ? '#0b0b10' : 'var(--text-dim)',
                }}>
                {label}
              </button>
            )
          })}
        </div>

        {/* ── Decklist tab ── */}
        {detailTab === 'list' && (
          <div>
            {!metaDeck && (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 14,
                padding: '10px 14px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
                <span>⚠️ Full decklist not available locally — showing core cards only.</span>
                <a href={limitlessUrl} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--gold)', textDecoration: 'none', marginLeft: 'auto' }}>
                  View on Limitless ↗
                </a>
              </div>
            )}
            {cards.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                No card data available.{' '}
                <a href={limitlessUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>
                  View on Limitless ↗
                </a>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>
                  {metaDeck ? `FULL DECKLIST (${stats.totalCards} cards)` : `CORE CARDS (${stats.totalCards} cards)`}
                </div>
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {cards.map((c, i) => {
                    const have    = Math.min(getOwned(c, collection), c.qty)
                    const ok      = have >= c.qty
                    const partial = have > 0 && !ok
                    return (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                        padding: '3px 0', borderBottom: '1px solid var(--border)', fontSize: '0.78rem' }}>
                        <span style={{ color: ok ? '#4caf50' : partial ? 'var(--gold)' : '#e57373',
                          minWidth: 12, fontSize: '0.7rem' }}>
                          {ok ? '✓' : partial ? '~' : '✗'}
                        </span>
                        <span style={{ color: 'var(--text-dim)', minWidth: 16, textAlign: 'right' }}>{c.qty}×</span>
                        <span style={{ flex: 1 }}>{c.name}</span>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                          {c.set_code && c.number ? `${c.set_code} ${c.number}` : ''}
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
              </>
            )}
          </div>
        )}

        {/* ── Missing tab ── */}
        {detailTab === 'missing' && (
          <div>
            {stats.missingCards.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 40 }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>✅</div>
                <div style={{ color: '#4caf50', fontWeight: 600 }}>You own all the cards!</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: 8, fontWeight: 600 }}>
                  MISSING ({totalMissing} cards)
                </div>
                <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                  {stats.missingCards.map((c, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6,
                      padding: '3px 0', borderBottom: '1px solid var(--border)', fontSize: '0.78rem' }}>
                      <span style={{ color: '#e57373', minWidth: 52 }}>need×{c.need}</span>
                      <span style={{ flex: 1 }}>{c.name}</span>
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.68rem' }}>
                        {c.set_code && c.number ? `${c.set_code} ${c.number}` : ''}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Recommended tab ── */}
        {detailTab === 'recommended' && (
          <div>
            {/* Deck complete note */}
            {stats.pct === 100 && (
              <div style={{ fontSize: '0.78rem', color: '#4caf50', marginBottom: 14,
                padding: '8px 12px', background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)' }}>
                ✅ Deck complete — here are popular tech swaps
              </div>
            )}

            {metaDeck ? (
              /* Has full decklist */
              TECH_CARDS[d.metaId] ? (
                <div>
                  {TECH_CARDS[d.metaId].map((group, gi) => (
                    <div key={gi} style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: 6 }}>
                        {group.group.toUpperCase()}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {group.cards.map((card, ci) => (
                          <span key={ci} style={{
                            padding: '3px 10px',
                            borderRadius: 20,
                            background: 'var(--surface2)',
                            border: '1px solid var(--border)',
                            fontSize: '0.75rem',
                            color: 'var(--text)',
                          }}>
                            {card}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)', padding: '12px 0' }}>
                  Check{' '}
                  <a href={limitlessUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--gold)' }}>
                    Limitless
                  </a>{' '}
                  for popular tech choices in this archetype.
                </div>
              )
            ) : (
              /* Core cards only (null metaId) */
              <div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 600, marginBottom: 8 }}>
                  COMMONLY PAIRED CARDS
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                  {coreData.fillers.map((f, i) => (
                    <span key={i} style={{
                      padding: '3px 10px',
                      borderRadius: 20,
                      background: 'var(--surface2)',
                      border: '1px solid var(--border)',
                      fontSize: '0.75rem',
                      color: 'var(--text)',
                    }}>
                      {f}
                    </span>
                  ))}
                </div>
                <a href={limitlessUrl} target="_blank" rel="noreferrer"
                  style={{ color: 'var(--gold)', fontSize: '0.82rem', textDecoration: 'none' }}>
                  View full list on Limitless ↗
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ── List page ────────────────────────────────────────────────────────────────
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
          <DeckRow key={d.rank} deck={d} collection={collection} collectionLoaded={collectionLoaded}
            metaDeck={d.metaId ? META_BY_ID[d.metaId] : null}
            onOpen={() => openDetail(d)} />
        ))}
      </div>
    </div>
  )
}

// ── Score bar sub-component ───────────────────────────────────────────────────

function ScoreBar({ label, value, weight, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.75rem' }}>
      <span style={{ minWidth: 90, color: 'var(--text-dim)' }}>{label} <span style={{ opacity: 0.55 }}>({weight})</span></span>
      <div style={{ flex: 1, height: 5, background: 'var(--surface2)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, borderRadius: 3 }} />
      </div>
      <span style={{ minWidth: 30, textAlign: 'right', color: 'var(--text)' }}>{value}%</span>
    </div>
  )
}

// ── Deck Row (list view) ──────────────────────────────────────────────────────

function DeckRow({ deck, collection, collectionLoaded, metaDeck, onOpen }) {
  const cards   = metaDeck ? metaDeck.cards : getCoreCards(deck.name).core
  const stats   = useMemo(() => computeStats(cards, collection), [cards, collection])
  const ownedPct = stats.totalCards > 0 ? stats.ownedCards / stats.totalCards : 0
  const missFrac = stats.totalCards > 0 ? (stats.totalCards - stats.ownedCards) / stats.totalCards : 1
  const tier    = computeTier(deck.share, ownedPct, missFrac, collectionLoaded)
  const hasData = stats.totalCards > 0

  return (
    <div onClick={onOpen}
      style={{ background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', overflow: 'hidden', cursor: 'pointer',
        transition: 'border-color 0.15s' }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--gold-dim)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>

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

        {/* Owned % bar */}
        {hasData && (
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

        <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', flexShrink: 0 }}>▶</div>
      </div>
    </div>
  )
}
