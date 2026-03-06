/**
 * scrape-meta.js — Pull real tournament decklists from limitlesstcg.com
 * Usage: node scripts/scrape-meta.js [--standard] [--expanded] [--limit=N]
 *
 * Output: web/src/data/meta-decks.js (overwrites — keep a backup first)
 */

const { chromium } = require('playwright-core')
const fs = require('fs')
const path = require('path')

// ─── CLI args ─────────────────────────────────────────────────────────────────
const args = process.argv.slice(2)
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '25')
const STANDARD_ONLY = args.includes('--standard')
const EXPANDED_ONLY = args.includes('--expanded')
const DRY = args.includes('--dry')

// ─── Deck metadata we enrich with (not available on Limitless) ────────────────
const DECK_META = {
  'Dragapult':           { archetype: 'aggro',    energy: ['🔮'],         tier: 'S', win_rate: 0.59 },
  'Gardevoir ex':        { archetype: 'midrange',  energy: ['🔮'],         tier: 'S', win_rate: 0.57 },
  'Gholdengo':           { archetype: 'control',   energy: ['⚙️','🔮'],    tier: 'B', win_rate: 0.50 },
  'Charizard':           { archetype: 'midrange',  energy: ['🔥'],         tier: 'S', win_rate: 0.55 },
  'Raging Bolt':         { archetype: 'aggro',     energy: ['⚡','🔥'],    tier: 'A', win_rate: 0.53 },
  'Terapagos':           { archetype: 'midrange',  energy: ['⭐'],         tier: 'A', win_rate: 0.52 },
  'Regidrago':           { archetype: 'combo',     energy: ['🐉','🌿','🔥'], tier: 'A', win_rate: 0.51 },
  'Miraidon':            { archetype: 'aggro',     energy: ['⚡'],         tier: 'A', win_rate: 0.51 },
  'Archaludon':          { archetype: 'midrange',  energy: ['⚡','⚙️'],   tier: 'A', win_rate: 0.50 },
  'Chien-Pao':           { archetype: 'aggro',     energy: ['💧'],         tier: 'A', win_rate: 0.50 },
  'Iron Thorns':         { archetype: 'stall',     energy: ['⚡'],         tier: 'A', win_rate: 0.50 },
  'Lost Box':            { archetype: 'control',   energy: ['⭐','🌿'],    tier: 'B', win_rate: 0.49 },
  'Lugia':               { archetype: 'midrange',  energy: ['⭐'],         tier: 'B', win_rate: 0.48 },
  'Roaring Moon':        { archetype: 'aggro',     energy: ['🌑'],         tier: 'B', win_rate: 0.47 },
  'Pecharunt':           { archetype: 'control',   energy: ['🌑','🔮'],   tier: 'B', win_rate: 0.47 },
  'Palkia':              { archetype: 'aggro',     energy: ['💧'],         tier: 'B', win_rate: 0.47 },
  'Banette':             { archetype: 'aggro',     energy: ['🔮'],         tier: 'B', win_rate: 0.46 },
  'Sandy Shocks':        { archetype: 'aggro',     energy: ['⚡','👊'],   tier: 'B', win_rate: 0.46 },
  'Iron Valiant':        { archetype: 'aggro',     energy: ['🔮','👊'],   tier: 'C', win_rate: 0.44 },
  'Snorlax':             { archetype: 'stall',     energy: ['⭐'],         tier: 'C', win_rate: 0.43 },
  'Brute Bonnet':        { archetype: 'control',   energy: ['🌑','🌿'],   tier: 'C', win_rate: 0.43 },
  'Blissey':             { archetype: 'midrange',  energy: ['⭐'],         tier: 'C', win_rate: 0.42 },
  'Night March':         { archetype: 'aggro',     energy: ['⚡','⭐'],   tier: 'S', win_rate: 0.66 },
  'Mew VMAX':            { archetype: 'combo',     energy: ['🔮'],         tier: 'S', win_rate: 0.63 },
  'Lost Zone Box':       { archetype: 'control',   energy: ['⭐','🌿'],   tier: 'S', win_rate: 0.65 },
  'Trevenant':           { archetype: 'control',   energy: ['🔮'],         tier: 'A', win_rate: 0.58 },
  'Zoroark':             { archetype: 'midrange',  energy: ['🌑','⭐'],   tier: 'A', win_rate: 0.57 },
  'Pikachu & Zekrom':    { archetype: 'aggro',     energy: ['⚡'],         tier: 'A', win_rate: 0.56 },
  'Reshiram & Charizard':{ archetype: 'aggro',     energy: ['🔥'],         tier: 'A', win_rate: 0.55 },
  'Eternatus':           { archetype: 'aggro',     energy: ['🌑'],         tier: 'A', win_rate: 0.55 },
  'Wailord':             { archetype: 'stall',     energy: ['💧'],         tier: 'A', win_rate: 0.59 },
  'Arceus VSTAR':        { archetype: 'midrange',  energy: ['⭐'],         tier: 'A', win_rate: 0.55 },
  'Blastoise':           { archetype: 'combo',     energy: ['💧'],         tier: 'B', win_rate: 0.54 },
  'Buzzwole':            { archetype: 'aggro',     energy: ['👊'],         tier: 'B', win_rate: 0.53 },
  'Malamar':             { archetype: 'midrange',  energy: ['🔮'],         tier: 'B', win_rate: 0.52 },
  'Shadow Rider':        { archetype: 'combo',     energy: ['🔮'],         tier: 'B', win_rate: 0.52 },
  'Rayquaza VMAX':       { archetype: 'aggro',     energy: ['⚡','⭐'],   tier: 'B', win_rate: 0.52 },
  'Mad Party':           { archetype: 'aggro',     energy: ['⚡','⭐'],   tier: 'B', win_rate: 0.51 },
  'Rapid Strike Urshifu':{ archetype: 'aggro',     energy: ['💧','👊'],   tier: 'B', win_rate: 0.51 },
  'Single Strike Urshifu':{ archetype: 'aggro',    energy: ['🌑','👊'],   tier: 'B', win_rate: 0.50 },
  'Mewtwo VMAX':         { archetype: 'aggro',     energy: ['🔮'],         tier: 'B', win_rate: 0.53 },
  'Mewtwo & Mew':        { archetype: 'combo',     energy: ['🔮','⭐'],   tier: 'B', win_rate: 0.50 },
  'Turbo Dark':          { archetype: 'aggro',     energy: ['🌑'],         tier: 'B', win_rate: 0.52 },
  'Greninja BREAK':      { archetype: 'control',   energy: ['💧'],         tier: 'C', win_rate: 0.48 },
  'Ice Rider':           { archetype: 'aggro',     energy: ['💧','🔮'],   tier: 'C', win_rate: 0.48 },
  'Pikachu VMAX':        { archetype: 'aggro',     energy: ['⚡'],         tier: 'C', win_rate: 0.47 },
  'Zacian':              { archetype: 'midrange',  energy: ['⚙️'],         tier: 'C', win_rate: 0.47 },
  'Gardevoir & Sylveon': { archetype: 'midrange',  energy: ['🔮','⭐'],   tier: 'C', win_rate: 0.46 },
  'Golisopod':           { archetype: 'midrange',  energy: ['🌿','🌑'],   tier: 'C', win_rate: 0.46 },
}

function getMeta(name) {
  for (const [key, val] of Object.entries(DECK_META)) {
    if (name.toLowerCase().includes(key.toLowerCase())) return val
  }
  return { archetype: 'aggro', energy: ['⭐'], tier: 'B', win_rate: 0.50 }
}

function toId(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

// ─── Scraping helpers ─────────────────────────────────────────────────────────
async function getDeckRows(page, url) {
  await page.goto(url, { waitUntil: 'networkidle' })
  return page.$$eval('a[href^="/decks/"]', links =>
    [...new Map(
      links
        .filter(a => /^\/decks\/\d+$/.test(a.getAttribute('href')))
        .map(a => [a.getAttribute('href'), { href: a.getAttribute('href'), name: a.textContent.trim() }])
    ).values()]
  )
}

async function getFirstListHref(page, deckHref) {
  await page.goto(`https://limitlesstcg.com${deckHref}`, { waitUntil: 'networkidle' })
  return page.$eval('a[href^="/decks/list/"]', a => a.getAttribute('href')).catch(() => null)
}

async function scrapeDecklist(page, listHref) {
  await page.goto(`https://limitlesstcg.com${listHref}`, { waitUntil: 'networkidle' })

  const cards = await page.$$eval('a[href^="/cards/"]', links =>
    links
      .map(a => {
        const href = a.getAttribute('href') || ''
        const parts = href.split('/').filter(Boolean) // ['cards', 'TWM', '128']
        if (parts.length < 3) return null
        const set_code = parts[1]
        const number = parts[2]
        const text = a.textContent.trim().replace(/\s+/g, ' ')
        const match = text.match(/^(\d+)\s+(.+)$/)
        if (!match) return null
        const qty = parseInt(match[1])
        const name = match[2].trim()
        if (isNaN(qty) || qty < 1 || !name) return null
        return { qty, name, set_code, number }
      })
      .filter(Boolean)
  )

  return cards
}

// ─── Main ─────────────────────────────────────────────────────────────────────
;(async () => {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.setDefaultTimeout(25000)

  const allDecks = []

  async function scrapeFormat(label, url) {
    console.log(`\n══ ${label.toUpperCase()} ══`)
    const rows = await getDeckRows(page, url)
    console.log(`  Found ${rows.length} deck archetypes`)

    let count = 0
    for (const row of rows) {
      if (count >= LIMIT) break
      try {
        process.stdout.write(`  → ${row.name} `)
        const listHref = await getFirstListHref(page, row.href)
        if (!listHref) { console.log('(no list)'); continue }

        const cards = await scrapeDecklist(page, listHref)
        const total = cards.reduce((s,c) => s+c.qty, 0)
        console.log(`(${total} cards, ${cards.length} unique)`)

        if (total < 55 || total > 65) {
          console.log(`    ⚠️  Unexpected total ${total}, skipping`)
          continue
        }

        const meta = getMeta(row.name)
        allDecks.push({
          id: toId(row.name),
          name: row.name,
          format: label,
          tier: meta.tier,
          archetype: meta.archetype,
          energy: meta.energy,
          win_rate: meta.win_rate,
          cost_usd: 0,
          description: `${row.name} — top tournament list from limitlesstcg.com`,
          source: `https://limitlesstcg.com${listHref}`,
          cards,
        })
        count++
      } catch (e) {
        console.log(`(error: ${e.message.split('\n')[0]})`)
      }
    }
  }

  if (!EXPANDED_ONLY) await scrapeFormat('standard', 'https://limitlesstcg.com/decks')
  if (!STANDARD_ONLY) {
    // Expanded — Limitless doesn't have a clean expanded URL; use the BW-on era
    // For now fetch from the general page and filter known expanded archetypes
    await scrapeFormat('expanded', 'https://limitlesstcg.com/decks?era=BW')
  }

  await browser.close()

  // ── Sanity check totals ───────────────────────────────────────────────────
  console.log('\n── Results ──')
  let allGood = true
  for (const d of allDecks) {
    const total = d.cards.reduce((s,c) => s+c.qty, 0)
    const ok = total === 60
    if (!ok) { console.log(`  ⚠️  ${d.name}: ${total} cards`); allGood = false }
  }
  if (allGood) console.log('  ✓ All decks = 60 cards')
  console.log(`  Total decks scraped: ${allDecks.length}`)

  if (DRY) { console.log('(dry run — not writing)'); return }

  // ── Generate JS ───────────────────────────────────────────────────────────
  const metaExports = `
export const META_DECKS = ${JSON.stringify(allDecks, null, 2)}

export const FORMATS = ['standard', 'expanded']
export const TIERS = ['S', 'A', 'B', 'C']
export const ARCHETYPES = ['aggro', 'control', 'combo', 'midrange', 'stall']
export const ENERGY_TYPES = ['🔥', '💧', '🌿', '⚡', '🔮', '👊', '🌑', '⚙️', '🐉', '⭐']

export const TIER_COLORS = { S: '#c9a84c', A: '#6d3eb0', B: '#2e5fa3', C: '#3a7a3a' }

export function deckTotal(deck) {
  return deck.cards.reduce((s, c) => s + c.qty, 0)
}

export function countOwned(deck, collection) {
  let owned = 0
  for (const c of deck.cards) {
    const key1 = \`\${c.set_code}-\${c.number}\`.toLowerCase()
    const key2 = c.name.toLowerCase()
    const have = collection[key1] ?? collection[key2] ?? 0
    owned += Math.min(have, c.qty)
  }
  return owned
}

export function missingCards(deck, collection) {
  return deck.cards.filter(c => {
    const key1 = \`\${c.set_code}-\${c.number}\`.toLowerCase()
    const key2 = c.name.toLowerCase()
    const have = collection[key1] ?? collection[key2] ?? 0
    return have < c.qty
  }).map(c => {
    const key1 = \`\${c.set_code}-\${c.number}\`.toLowerCase()
    const key2 = c.name.toLowerCase()
    const have = collection[key1] ?? collection[key2] ?? 0
    return { ...c, have, need: c.qty - have }
  })
}

export function costToComplete(deck, collection) {
  return deck.cost_usd ?? 0
}

export function deckScore(deck, collection, weights = { win_rate: 0.4, ownership: 0.4, cost: 0.2 }) {
  const total = deckTotal(deck)
  if (total === 0) return 0
  const owned = countOwned(deck, collection)
  const ownershipPct = owned / total
  const costScore = Math.max(0, 1 - (costToComplete(deck, collection) / 300))
  const raw =
    deck.win_rate * weights.win_rate +
    ownershipPct * weights.ownership +
    costScore * weights.cost
  const wsum = Object.values(weights).reduce((a, b) => a + b, 1e-9)
  return Math.round((raw / wsum) * 100)
}
`

  const outPath = path.join(__dirname, '../web/src/data/meta-decks.js')
  // Backup existing
  const backupPath = outPath.replace('.js', `-backup-${Date.now()}.js`)
  if (fs.existsSync(outPath)) fs.copyFileSync(outPath, backupPath)

  fs.writeFileSync(outPath, `// AUTO-GENERATED by scripts/scrape-meta.js — ${new Date().toISOString()}\n// Source: limitlesstcg.com\n` + metaExports)
  console.log(`\n✓ Wrote ${allDecks.length} decks → ${outPath}`)
  console.log(`  Backup: ${backupPath}`)
})()
