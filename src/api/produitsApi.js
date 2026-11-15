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

// A product has a gallery of up to MAX_IMAGES images, the first one is the main image
export const MAX_IMAGES = 5

// The API refuses numbers sent inside a multipart form, so the images
// travel alone in their own request, after the product has been saved.
// They are added after the current images of the product.
export async function uploadImages(id, files) {
  const form = new FormData()
  files.forEach((file) => form.append('images', file))
  const { data } = await client.put(`${BASE}/updateProduit/${id}`, form)
  return data.produit
}

export async function deleteImage(id, imageId) {
  const { data } = await client.delete(`${BASE}/deleteImage/${id}/images/${imageId}`)
  return data.produit
}

export async function setImagePrincipale(id, imageId) {
  const { data } = await client.patch(`${BASE}/setImagePrincipale/${id}/images/${imageId}`)
  return data.produit
}

export async function updateStock(id, stock) {
  const { data } = await client.patch(`${BASE}/updateStock/${id}/stock`, { stock })
  return data.produit
}

export async function deleteProduit(id) {
  await client.delete(`${BASE}/deleteProduit/${id}`)
}
