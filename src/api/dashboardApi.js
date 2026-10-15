import client from './client'

const BASE = '/api/admin/dashboard'

// dateDebut / dateFin as 'YYYY-MM-DD' (local days, both included); granularite: 'jour' | 'semaine' | 'mois' (auto if empty)
export async function getStatistiques({ dateDebut = '', dateFin = '', granularite = '' } = {}) {
  const params = {}
  if (dateDebut) params.dateDebut = dateDebut
  if (dateFin) params.dateFin = dateFin
  if (granularite) params.granularite = granularite
  const { data } = await client.get(`${BASE}/getStatistiquesDetaillees`, { params })
  return data
}
