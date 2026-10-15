import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { getProduits } from '../api/produitsApi'
import { createPack, updatePack } from '../api/packsApi'
import { getErrorMessage } from '../api/errors'
import { formatPrix } from '../utils/format'
import { FormActions, FormError, inputClass } from './ui'

export default function PackForm({ pack, onSaved, onCancel }) {
  const [nom, setNom] = useState(pack?.nom ?? '')
  // stored discount; older packs without it: deduce it from the stored price
  const [pourcentage, setPourcentage] = useState(() => {
    if (!pack) return ''
    if (pack.pourcentageRemise) return String(pack.pourcentageRemise)
    const somme = pack.produits.reduce((s, l) => s + l.produit.prix * l.quantite, 0)
    return somme > 0 && pack.prixPack < somme ? String(Math.round((1 - pack.prixPack / somme) * 100)) : ''
  })
  const [description, setDescription] = useState(pack?.description ?? '')
  // one line per product in the pack: { produitId, quantite } (quantite kept as text while typing)
  const [lignes, setLignes] = useState(() =>
    pack ? pack.produits.map((l) => ({ produitId: l.produitId, quantite: String(l.quantite) })) : []
  )
  const [catalogue, setCatalogue] = useState([]) // all products the admin can pick from
  const [catalogueState, setCatalogueState] = useState('loading') // 'loading' | 'ready' | 'error'
  const [choix, setChoix] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getProduits({ limit: 100 })
      .then(({ data }) => {
        setCatalogue(data)
        setCatalogueState('ready')
      })
      .catch(() => setCatalogueState('error'))
  }, [])

  // name/price of a product: from the catalogue, or from the pack being edited
  const infoProduit = (id) =>
    catalogue.find((p) => p.id === id) ?? pack?.produits.find((l) => l.produitId === id)?.produit

  const disponibles = catalogue.filter((p) => !lignes.some((l) => l.produitId === p.id))

  const total = lignes.reduce(
    (sum, l) => sum + (infoProduit(l.produitId)?.prix ?? 0) * (Number(l.quantite) || 0),
    0
  )
  const pct = Math.min(100, Math.max(0, Number(pourcentage) || 0))
  const prixFinal = Math.round(total * (1 - pct / 100) * 100) / 100

  function addLigne() {
    if (!choix) return
    setLignes([...lignes, { produitId: Number(choix), quantite: '1' }])
    setChoix('')
  }

  function setQuantite(produitId, value) {
    setLignes(lignes.map((l) => (l.produitId === produitId ? { ...l, quantite: value } : l)))
  }

  function removeLigne(produitId) {
    setLignes(lignes.filter((l) => l.produitId !== produitId))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (lignes.length < 2) {
      setError('Un pack doit contenir au moins 2 produits.')
      return
    }
    if (!lignes.every((l) => Number.isInteger(Number(l.quantite)) && Number(l.quantite) >= 1)) {
      setError('Chaque quantité doit être un nombre entier d’au moins 1.')
      return
    }

    const values = {
      nom,
      description,
      produits: lignes.map((l) => ({ produitId: l.produitId, quantite: Number(l.quantite) })),
      pourcentageRemise: pct,
    }

    setSaving(true)
    try {
      if (pack) await updatePack(pack.id, values)
      else await createPack(values)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-slate-600">
        Nom du pack<span className="text-brand"> *</span>
        <input required minLength={2} maxLength={200} value={nom} onChange={(e) => setNom(e.target.value)} className={`${inputClass} mt-1`} />
      </label>

      <label className="block text-sm text-slate-600">
        Description
        <textarea rows={2} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} className={`${inputClass} mt-1`} />
      </label>

      <div className="text-sm text-slate-600">
        Produits du pack<span className="text-brand"> *</span> <span className="text-xs text-slate-500">(au moins 2)</span>
        <div className="mt-1 flex gap-2">
          <select value={choix} onChange={(e) => setChoix(e.target.value)} className={inputClass} disabled={catalogueState !== 'ready'}>
            <option value="">
              {catalogueState === 'loading' ? 'Chargement…' : catalogueState === 'error' ? 'Erreur de chargement' : 'Choisir un produit…'}
            </option>
            {disponibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} — {formatPrix(p.prix)}
                {p.stock === 0 ? ' (rupture)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addLigne}
            disabled={!choix}
            className="shrink-0 rounded bg-sidebar px-4 text-sm text-white hover:bg-black disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>

        <ul className="mt-3 divide-y divide-slate-100 rounded border border-slate-200">
          {lignes.map((l) => {
            const p = infoProduit(l.produitId)
            return (
              <li key={l.produitId} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 truncate text-slate-800">{p?.nom ?? `Produit #${l.produitId}`}</span>
                <span className="text-xs text-slate-500">{p ? formatPrix(p.prix) : ''}</span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  aria-label="Quantité"
                  value={l.quantite}
                  onChange={(e) => setQuantite(l.produitId, e.target.value)}
                  className="w-16 rounded border border-slate-300 px-2 py-1 outline-none focus:border-brand"
                />
                <button type="button" onClick={() => removeLigne(l.produitId)} aria-label={`Retirer ${p?.nom ?? 'le produit'}`} className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </li>
            )
          })}
          {lignes.length === 0 && <li className="px-3 py-3 text-slate-500">Aucun produit ajouté.</li>}
        </ul>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded bg-slate-50 px-3 py-2.5">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            Remise (%)
            <input
              type="number" min="0" max="100" step="1"
              value={pourcentage}
              onChange={(e) => setPourcentage(e.target.value)}
              className="w-20 rounded border border-slate-300 bg-white px-2 py-1 outline-none focus:border-brand"
            />
          </label>
          <p className="text-right text-sm">
            {pct > 0 && <span className="mr-2 text-slate-400 line-through">{formatPrix(total)}</span>}
            Prix du pack : <span className="font-display text-lg text-brand">{formatPrix(prixFinal)}</span>
          </p>
        </div>
      </div>

      <FormError>{error}</FormError>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  )
}
