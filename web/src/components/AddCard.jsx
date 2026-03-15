import { useState } from 'react'

const BASE = import.meta.env.VITE_API_URL || ''

const SETS = [
  'SVI','PAL','OBF','MEW','PAR','PAF','TEF','TWM','SFA','SCR','SSP','PRE',
  'SVP','BRS','ASR','LOR','SIT','CRZ','SHF','FST','CEL','EVS','CRE','BST',
  'VIV','CPA','DAA','SSH','RCL','SHF','UNB','DET','TEU','LOT','CEL','UPR',
  'FLI','UPR','CES','DRM','GRI','BUS','SUM','GEN','FCO','STS','EVO','BKT',
  'AOR','BKP','PGO',
].filter((v, i, a) => a.indexOf(v) === i).sort()

const SUPERTYPES = ['Pokémon', 'Trainer', 'Energy']

export default function AddCard() {
  const [form, setForm] = useState({
    name: '', set_code: '', card_number: '', rarity: '',
    supertype: 'Pokémon', tcgplayer_price: '', qty: 1,
  })
  const [status, setStatus]   = useState(null)   // null | 'adding' | 'ok' | 'error'
  const [error, setError]     = useState('')
  const [addedCount, setAddedCount] = useState(0)

  function set(field, val) {
    setForm(f => ({ ...f, [field]: val }))
    setStatus(null)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) { setError('Card name is required.'); return }
    setStatus('adding')
    setError('')
    try {
      const payload = {
        name:            form.name.trim(),
        set_code:        form.set_code.trim().toUpperCase(),
        card_number:     form.card_number.trim(),
        rarity:          form.rarity.trim(),
        supertype:       form.supertype,
        set_name:        '',
        image_url:       '',
        tcgplayer_price: parseFloat(form.tcgplayer_price) || 0,
        identified_by:   'manual',
        confidence:      1.0,
        needs_review:    0,
      }
      for (let i = 0; i < form.qty; i++) {
        const r = await fetch(`${BASE}/api/cards/add`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!r.ok) throw new Error(`Server error ${r.status}`)
      }
      setAddedCount(n => n + form.qty)
      setStatus('ok')
      // Clear name + number, keep set/type for batch entry
      setForm(f => ({ ...f, name: '', card_number: '', tcgplayer_price: '' }))
      setTimeout(() => setStatus(null), 2000)
    } catch (e) {
      setError(e.message)
      setStatus('error')
    }
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', boxSizing: 'border-box',
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', color: 'var(--text)', fontSize: '0.9rem',
  }
  const labelStyle = {
    display: 'block', fontSize: '0.72rem', color: 'var(--text-dim)',
    marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em',
  }

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>
          Manually add cards to your collection
        </div>
        {addedCount > 0 && (
          <div style={{ fontSize: '0.78rem', color: '#4caf50', fontWeight: 600 }}>
            ✅ {addedCount} added this session
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit}>
        {/* Card name */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Card Name *</label>
          <input
            type="text"
            placeholder="e.g. Charizard ex"
            value={form.name}
            onChange={e => set('name', e.target.value)}
            style={inputStyle}
            autoComplete="off"
            autoFocus
          />
        </div>

        {/* Set + Number side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Set Code</label>
            <input
              type="text"
              placeholder="e.g. PAR"
              value={form.set_code}
              onChange={e => set('set_code', e.target.value)}
              style={inputStyle}
              autoComplete="off"
              maxLength={6}
            />
          </div>
          <div>
            <label style={labelStyle}>Card Number</label>
            <input
              type="text"
              placeholder="e.g. 201"
              value={form.card_number}
              onChange={e => set('card_number', e.target.value)}
              style={inputStyle}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Type + Rarity side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
          <div>
            <label style={labelStyle}>Type</label>
            <select
              value={form.supertype}
              onChange={e => set('supertype', e.target.value)}
              style={{ ...inputStyle, cursor: 'pointer' }}>
              {SUPERTYPES.map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Rarity</label>
            <input
              type="text"
              placeholder="e.g. Rare Holo ex"
              value={form.rarity}
              onChange={e => set('rarity', e.target.value)}
              style={inputStyle}
              autoComplete="off"
            />
          </div>
        </div>

        {/* Price */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Market Price (USD)</label>
          <input
            type="number"
            placeholder="e.g. 12.50"
            value={form.tcgplayer_price}
            onChange={e => set('tcgplayer_price', e.target.value)}
            style={inputStyle}
            min="0"
            step="0.01"
          />
        </div>

        {/* Qty + Submit */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Qty</span>
            {[1, 2, 3, 4].map(n => (
              <button type="button" key={n} onClick={() => set('qty', n)}
                style={{
                  width: 34, height: 34, borderRadius: 4, cursor: 'pointer', fontSize: '0.85rem',
                  border: `1px solid ${form.qty === n ? 'var(--gold)' : 'var(--border)'}`,
                  background: form.qty === n ? 'rgba(201,168,76,0.15)' : 'var(--surface)',
                  color: form.qty === n ? 'var(--gold)' : 'var(--text-dim)',
                }}>
                {n}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={status === 'adding'}
            style={{
              flex: 1, padding: '10px 0', borderRadius: 'var(--radius)', cursor: status === 'adding' ? 'wait' : 'pointer',
              border: '1px solid var(--gold-dim)',
              background: status === 'ok' ? 'rgba(76,175,80,0.15)' : 'rgba(201,168,76,0.12)',
              color: status === 'ok' ? '#4caf50' : 'var(--gold)',
              fontSize: '0.9rem', fontWeight: 700,
              transition: 'all 0.15s',
            }}>
            {status === 'adding' ? '⏳ Adding…' : status === 'ok' ? `✓ Added ×${form.qty > 1 ? form.qty : ''}1`.replace('×1', '') : `+ Add ×${form.qty}`}
          </button>
        </div>

        {error && (
          <div style={{ marginTop: 12, padding: '8px 12px', background: 'rgba(229,115,115,0.1)',
            border: '1px solid #e57373', borderRadius: 6, fontSize: '0.8rem', color: '#e57373' }}>
            {error}
          </div>
        )}
      </form>

      {/* Batch entry tip */}
      <div style={{ marginTop: 24, padding: '10px 14px', background: 'var(--surface)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
        fontSize: '0.75rem', color: 'var(--text-dim)', lineHeight: 1.5 }}>
        💡 <strong>Batch tip:</strong> Set code and type are remembered between entries. 
        Just change the name and number to quickly add multiple cards from the same set.
      </div>
    </div>
  )
}
