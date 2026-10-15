export const STATUTS = {
  en_attente: { label: 'En attente', className: 'bg-amber-100 text-amber-800' },
  confirmee: { label: 'Confirmée', className: 'bg-blue-100 text-blue-800' },
  livree: { label: 'Livrée', className: 'bg-green-100 text-green-800' },
  annulee: { label: 'Annulée', className: 'bg-red-100 text-red-700' },
}

// The only status the admin can move an order to next ("annulee" has its own button).
export const STATUT_SUIVANT = {
  en_attente: { statut: 'confirmee', label: 'Confirmer la commande' },
  confirmee: { statut: 'livree', label: 'Marquer comme livrée' },
}

// An order can be cancelled until it is delivered (or already cancelled).
export const peutAnnuler = (statut) => statut === 'en_attente' || statut === 'confirmee'

// Short order number shown in lists (the full id is in the detail)
export const numeroCommande = (id) => id.slice(0, 8).toUpperCase()

// Unit price after the offer, if the line has one
export const prixUnitaire = (ligne) =>
  ligne.offre ? ligne.prixInitiale * (1 - ligne.offre.pourcentageReduction / 100) : ligne.prixInitiale

export const totalLigne = (ligne) => prixUnitaire(ligne) * ligne.quantite

export function libelleLigne(ligne) {
  if (ligne.produit) return ligne.produit.taille ? `${ligne.produit.nom} (${ligne.produit.taille})` : ligne.produit.nom
  if (ligne.pack) return `Pack : ${ligne.pack.nom}`
  return 'Article supprimé'
}

// <input type="date"> value (YYYY-MM-DD) -> ISO bounds of that local day, as the API expects
export const debutDeJour = (value) => new Date(`${value}T00:00:00`).toISOString()
export const finDeJour = (value) => new Date(`${value}T23:59:59.999`).toISOString()
