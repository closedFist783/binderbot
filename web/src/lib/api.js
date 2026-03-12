const BASE = import.meta.env.VITE_API_URL || ''

async function req(path, opts = {}) {
  const r = await fetch(`${BASE}${path}`, opts)
  return r.json()
}

export const getStatus    = ()             => req('/api/status')
export const triggerScan  = ()             => req('/api/scan', { method: 'POST' })
export const getCards     = (params = {})  => req('/api/cards?' + new URLSearchParams(params))
export const getCard      = (id)           => req(`/api/cards/${id}`)
export const locateCard   = (name)         => req(`/api/locate/${encodeURIComponent(name)}`)
export const getScanImage = (id)           => req(`/api/scan-image/${id}`)
export const reviewCard   = (id, data)     => req(`/api/cards/${id}/review`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
})
