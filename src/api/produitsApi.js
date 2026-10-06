import client from './client'

const BASE = '/api/admin/produits'

export async function getProduits({ page = 1, limit = 10, search = '', categorieId, stockFaible = false } = {}) {
  const params = { page, limit }
  if (search) params.search = search
  if (categorieId) params.categorieId = categorieId
  if (stockFaible) params.stockFaible = 'true'
  const { data } = await client.get(`${BASE}/getAllProduits`, { params })
  return data // { data: [...], pagination: {...} }
}

export async function createProduit(values) {
  const { data } = await client.post(`${BASE}/createProduit`, values)
  return data.produit
}

export async function updateProduit(id, values) {
  const { data } = await client.put(`${BASE}/updateProduit/${id}`, values)
  return data.produit
}

// The API refuses numbers sent inside a multipart form, so the image
// travels alone in its own request, after the product has been saved.
export async function uploadImage(id, file) {
  const form = new FormData()
  form.append('image', file)
  const { data } = await client.put(`${BASE}/updateProduit/${id}`, form)
  return data.produit
}

export async function updateStock(id, stock) {
  const { data } = await client.patch(`${BASE}/updateStock/${id}/stock`, { stock })
  return data.produit
}

export async function deleteProduit(id) {
  await client.delete(`${BASE}/deleteProduit/${id}`)
}
