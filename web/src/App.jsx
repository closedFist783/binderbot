import { useState, useEffect, useRef } from 'react'
import ScanTab    from './components/ScanTab'
import Collection from './components/Collection'
import Locate     from './components/Locate'
import Stats      from './components/Stats'
import Decks      from './components/Decks'
import { getStatus } from './lib/api'
import './App.css'

const TABS = [
  { id: 'scan',       label: '📷 Scan'       },
  { id: 'collection', label: '📦 Collection'  },
  { id: 'decks',      label: '🃏 Decks'       },
  { id: 'locate',     label: '🔍 Locate'      },
  { id: 'stats',      label: '📊 Stats'       },
]

export default function App() {
  const [tab, setTab]       = useState('scan')
  const [status, setStatus] = useState(null)

  useEffect(() => {
    let alive = true
    async function poll() {
      try {
        const s = await getStatus()
        if (alive) setStatus(s)
      } catch {}
    }
    poll()
    const id = setInterval(poll, 3000)
    return () => { alive = false; clearInterval(id) }
  }, [])

  return (
    <div className="app">
      <header className="topbar">
        <div className="topbar-brand">🃏 BinderBot</div>
        {status && (
          <div className="topbar-stats">
            <span>{status.total_cards?.toLocaleString() ?? 0} cards</span>
            {status.flagged > 0 && <span className="badge-red">{status.flagged} flagged</span>}
            {status.total_value > 0 && <span className="badge-gold">${status.total_value?.toFixed(2)}</span>}
          </div>
        )}
      </header>
      <nav className="tab-bar">
        {TABS.map(t => (
          <button key={t.id} className={`tab-btn${tab === t.id ? ' active' : ''}`} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </nav>
      <main className="main">
        {tab === 'scan'       && <ScanTab    status={status} />}
        {tab === 'collection' && <Collection />}
        {tab === 'decks'      && <Decks      />}
        {tab === 'locate'     && <Locate     />}
        {tab === 'stats'      && <Stats />}
      </main>
    </div>
  )
}
