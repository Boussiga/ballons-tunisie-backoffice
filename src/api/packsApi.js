import client from './client'

const BASE = '/api/admin/packs'

export async function getPacks({ page = 1, limit = 9, search = '' } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  const { data } = await client.get(`${BASE}/getAllPacks`, { params })
  return data // { data: [...], pagination: {...} }
}

// values = { nom, description, produits: [{ produitId, quantite }] }
// the API calculates the pack price itself (sum of price x quantity)
export async function createPack(values) {
  const { data } = await client.post(`${BASE}/createPack`, values)
  return data.pack
}

export async function updatePack(id, values) {
  const { data } = await client.put(`${BASE}/updatePack/${id}`, values)
  return data.pack
}

export async function deletePack(id) {
  await client.delete(`${BASE}/deletePack/${id}`)
}
