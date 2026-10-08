import client from './client'

const BASE = '/api/admin/offres'

// active: undefined = all offers, true = running now, false = expired or not started yet
export async function getOffres({ page = 1, limit = 10, search = '', active } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (active !== undefined) params.active = String(active)
  const { data } = await client.get(`${BASE}/getAllOffres`, { params })
  return data // { data: [...], pagination: {...} }
}

// values = { titre, pourcentageReduction, dateDebut, dateFin } (dates as ISO strings)
export async function createOffre(values) {
  const { data } = await client.post(`${BASE}/createOffre`, values)
  return data.offre
}

export async function updateOffre(id, values) {
  const { data } = await client.put(`${BASE}/updateOffre/${id}`, values)
  return data.offre
}

export async function deleteOffre(id) {
  await client.delete(`${BASE}/deleteOffre/${id}`)
}
