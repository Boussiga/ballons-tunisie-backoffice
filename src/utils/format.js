export const formatPrix = (prix) => `${Number(prix).toFixed(2)} €`

// Images are served by the API under /uploads/...
export const imageSrc = (url) => (url ? `${import.meta.env.VITE_API_URL || ''}${url}` : null)

// ── Dates (offers) ───────────────────────────────────────────────────────────
export const formatDateHeure = (iso) =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

// ISO string (UTC) -> value for <input type="datetime-local"> (local time)
export function toInputDateTime(iso) {
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

// <input type="datetime-local"> value -> ISO string with "Z", as the API expects
export const fromInputDateTime = (value) => new Date(value).toISOString()

// 'a-venir' | 'en-cours' | 'terminee'
export function statutOffre(offre) {
  const now = new Date()
  if (now < new Date(offre.dateDebut)) return 'a-venir'
  if (now > new Date(offre.dateFin)) return 'terminee'
  return 'en-cours'
}
