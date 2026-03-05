import { useState } from 'react'
import { getScanImage } from '../lib/api'

export default function ReviewModal({ card, onSave, onClose }) {
  const [form, setForm] = useState({
    name:           card.name || '',
    set_name:       card.set_name || '',
    set_code:       card.set_code || '',
    card_number:    card.card_number || '',
    rarity:         card.rarity || '',
    tcg_id:         card.tcg_id || '',
    image_url:      card.image_url || '',
    tcgplayer_price: card.tcgplayer_price || '',
  })
  const [scanImg, setScanImg]   = useState(null)
  const [loading, setLoading]   = useState(false)

  async function loadScanImg() {
    if (scanImg) return
    const res = await getScanImage(card.physical_id)
    if (res.image) setScanImg(res.image)
  }

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  async function handleSave() {
    setLoading(true)
    await onSave({ ...form, tcgplayer_price: parseFloat(form.tcgplayer_price) || null })
    setLoading(false)
  }

  const bin = ((card.physical_id - 1) / 1000 | 0) + 1
  const pos = ((card.physical_id - 1) % 1000) + 1

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <h2>{card.needs_review ? '⚠️ Review Card' : '✏️ Edit Card'} — #{card.physical_id}</h2>

        <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'flex-start' }}>
          {form.image_url && <img src={form.image_url} alt="" style={{ width: 80, borderRadius: 4 }} />}
          <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', lineHeight: 1.8 }}>
            <div>📦 Bin <strong style={{ color: 'var(--gold)' }}>{bin}</strong></div>
            <div>📍 Position ~{pos}</div>
            <button
              className="btn btn-ghost" style={{ marginTop: 6, fontSize: '0.72rem', padding: '4px 10px' }}
              onClick={loadScanImg}
            >View scan image</button>
          </div>
        </div>

        {scanImg && (
          <img src={scanImg} alt="scan" style={{ width: '100%', borderRadius: 4, marginBottom: 12 }} />
        )}

        <label>Name</label>
        <input value={form.name} onChange={e => set('name', e.target.value)} />

        <label>Set Name</label>
        <input value={form.set_name} onChange={e => set('set_name', e.target.value)} />

        <label>Set Code</label>
        <input value={form.set_code} onChange={e => set('set_code', e.target.value)} placeholder="e.g. sv3" />

        <label>Card Number</label>
        <input value={form.card_number} onChange={e => set('card_number', e.target.value)} placeholder="e.g. 045/189" />

        <label>Rarity</label>
        <input value={form.rarity} onChange={e => set('rarity', e.target.value)} />

        <label>Image URL</label>
        <input value={form.image_url} onChange={e => set('image_url', e.target.value)} />

        <label>TCGPlayer Price ($)</label>
        <input type="number" step="0.01" value={form.tcgplayer_price} onChange={e => set('tcgplayer_price', e.target.value)} />

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn btn-gold" onClick={handleSave} disabled={loading}>
            {loading ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
