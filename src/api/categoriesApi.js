import client from './client'

export async function getCategories() {
  const { data } = await client.get('/api/admin/categories/getAllCategories')
  return data.data
}

export async function createCategorie({ nom }) {
  const { data } = await client.post('/api/admin/categories/createCategorie', { nom })
  return data.categorie
}
