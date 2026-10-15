import client from './client'

const BASE = '/api/admin/commandes'

// statut: en_attente | confirmee | livree | annulee
// dateDebut / dateFin: ISO strings (with "Z")
export async function getCommandes({ page = 1, limit = 10, statut = '', search = '', dateDebut = '', dateFin = '' } = {}) {
  const params = { page, limit }
  if (statut) params.statut = statut
  if (search) params.search = search
  if (dateDebut) params.dateDebut = dateDebut
  if (dateFin) params.dateFin = dateFin
  const { data } = await client.get(`${BASE}/getAllCommandes`, { params })
  return data // { data: [...], pagination: {...} }
}

// one order with its lines (produit / pack / offre included)
export async function getCommande(id) {
  const { data } = await client.get(`${BASE}/getCommandeById/${id}`)
  return data
}

export async function updateStatut(id, statut) {
  const { data } = await client.patch(`${BASE}/updateStatutCommande/${id}/statut`, { statut })
  return data.commande
}

// the API refuses to cancel an order that is already delivered
export async function annulerCommande(id) {
  const { data } = await client.patch(`${BASE}/annulerCommande/${id}/annuler`)
  return data.commande
}

// recalculates the total from the order lines and saves it
export async function recalculerTotal(id) {
  const { data } = await client.get(`${BASE}/calculerTotal/${id}/total`)
  return data.total
}
