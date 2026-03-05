export default function Stats({ status }) {
  if (!status) return <div style={{ color: 'var(--text-dim)', textAlign: 'center', paddingTop: 40 }}>Loading…</div>

  const bins = Math.ceil((status.total_cards || 0) / 1000)

  const stats = [
    { label: 'Total Cards',     value: (status.total_cards || 0).toLocaleString() },
    { label: 'Sets Represented', value: status.sets || 0 },
    { label: 'Physical Bins',   value: bins || 0 },
    { label: 'Flagged',         value: status.flagged || 0 },
    { label: 'Est. Value',      value: status.total_value ? `$${status.total_value.toFixed(2)}` : '—' },
    { label: 'This Session',    value: (status.session_count || 0).toLocaleString() },
  ]

  return (
    <div>
      <div className="stats-grid">
        {stats.map(s => (
          <div key={s.label} className="stat-card">
            <div className="sv">{s.value}</div>
            <div className="sl">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '20px',
      }}>
        <h3 style={{ fontSize: '0.9rem', color: 'var(--text-dim)', marginBottom: 12 }}>📦 Bin Layout</h3>
        {bins === 0 ? (
          <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No cards scanned yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: bins }, (_, i) => {
              const start = i * 1000 + 1
              const end   = Math.min((i + 1) * 1000, status.total_cards)
              const isFull = end - start + 1 >= 1000
              return (
                <div key={i} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  background: 'var(--surface2)', borderRadius: 6, padding: '8px 14px',
                  fontSize: '0.82rem',
                }}>
                  <span style={{ color: 'var(--gold)', fontWeight: 600 }}>Bin {i + 1}</span>
                  <span style={{ color: 'var(--text-dim)' }}>#{start} – #{end}</span>
                  <span style={{ color: isFull ? 'var(--red)' : 'var(--green)', fontSize: '0.72rem' }}>
                    {end - start + 1} cards {isFull ? '(full)' : ''}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
