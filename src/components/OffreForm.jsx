import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import { getProduits } from '../api/produitsApi'
import { createOffre, updateOffre } from '../api/offresApi'
import { getErrorMessage } from '../api/errors'
import { formatPrix, fromInputDateTime, toInputDateTime } from '../utils/format'
import { FormActions, FormError, inputClass } from './ui'

export default function OffreForm({ offre, onSaved, onCancel }) {
  const [titre, setTitre] = useState(offre?.titre ?? '')
  // kept as text while typing, converted to a number on submit
  const [pourcentage, setPourcentage] = useState(offre ? String(offre.pourcentageReduction) : '')
  const [dateDebut, setDateDebut] = useState(offre ? toInputDateTime(offre.dateDebut) : '')
  const [dateFin, setDateFin] = useState(offre ? toInputDateTime(offre.dateFin) : '')
  // IDs of the products the offer applies to
  const [produitIds, setProduitIds] = useState(() => offre?.produits?.map((p) => p.id) ?? [])
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

  // name/price of a product: from the catalogue, or from the offer being edited
  const infoProduit = (id) => catalogue.find((p) => p.id === id) ?? offre?.produits?.find((p) => p.id === id)

  const disponibles = catalogue.filter((p) => !produitIds.includes(p.id))
  const pct = Number(pourcentage)
  const pctValide = Number.isFinite(pct) && pct > 0 && pct <= 100

  function addProduit() {
    if (!choix) return
    setProduitIds([...produitIds, Number(choix)])
    setChoix('')
  }

  function removeProduit(id) {
    setProduitIds(produitIds.filter((pid) => pid !== id))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (!pctValide) {
      setError('Le pourcentage doit être supérieur à 0 et inférieur ou égal à 100.')
      return
    }
    if (new Date(dateDebut) >= new Date(dateFin)) {
      setError('La date de début doit être antérieure à la date de fin.')
      return
    }
    if (produitIds.length === 0) {
      setError('Une offre doit concerner au moins un produit.')
      return
    }

    // always send all the fields, so the API can compare the two dates
    const values = {
      produitIds,
      titre: titre.trim(),
      pourcentageReduction: pct,
      dateDebut: fromInputDateTime(dateDebut),
      dateFin: fromInputDateTime(dateFin),
    }

    setSaving(true)
    try {
      if (offre) await updateOffre(offre.id, values)
      else await createOffre(values)
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-slate-600">
        Titre de l’offre<span className="text-brand"> *</span>
        <input
          required
          minLength={3}
          maxLength={200}
          value={titre}
          onChange={(e) => setTitre(e.target.value)}
          placeholder="Ex : Soldes de la rentrée"
          className={`${inputClass} mt-1`}
        />
      </label>

      <label className="block text-sm text-slate-600">
        Réduction (%)<span className="text-brand"> *</span>
        <input
          required
          type="number"
          min="0.01"
          max="100"
          step="any"
          value={pourcentage}
          onChange={(e) => setPourcentage(e.target.value)}
          className={`${inputClass} mt-1`}
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-slate-600">
          Début<span className="text-brand"> *</span>
          <input
            required
            type="datetime-local"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm text-slate-600">
          Fin<span className="text-brand"> *</span>
          <input
            required
            type="datetime-local"
            value={dateFin}
            min={dateDebut || undefined}
            onChange={(e) => setDateFin(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>

      <div className="text-sm text-slate-600">
        Produits concernés<span className="text-brand"> *</span>
        <div className="mt-1 flex gap-2">
          <select value={choix} onChange={(e) => setChoix(e.target.value)} className={inputClass} disabled={catalogueState !== 'ready'}>
            <option value="">
              {catalogueState === 'loading' ? 'Chargement…' : catalogueState === 'error' ? 'Erreur de chargement' : 'Choisir un produit…'}
            </option>
            {disponibles.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nom} — {formatPrix(p.prix)}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={addProduit}
            disabled={!choix}
            className="shrink-0 rounded bg-sidebar px-4 text-sm text-white hover:bg-black disabled:opacity-40"
          >
            Ajouter
          </button>
        </div>

        <ul className="mt-3 max-h-56 divide-y divide-slate-100 overflow-y-auto rounded border border-slate-200">
          {produitIds.map((id) => {
            const p = infoProduit(id)
            return (
              <li key={id} className="flex items-center gap-3 px-3 py-2">
                <span className="flex-1 truncate text-slate-800">{p?.nom ?? `Produit #${id}`}</span>
                {p && (
                  <span className="text-xs text-slate-500">
                    {pctValide && <span className="mr-1 line-through">{formatPrix(p.prix)}</span>}
                    {formatPrix(pctValide ? Math.round(p.prix * (1 - pct / 100) * 100) / 100 : p.prix)}
                  </span>
                )}
                <button type="button" onClick={() => removeProduit(id)} aria-label={`Retirer ${p?.nom ?? 'le produit'}`} className="rounded p-1 text-slate-500 hover:bg-red-50 hover:text-red-600">
                  <Trash2 size={16} />
                </button>
              </li>
            )
          })}
          {produitIds.length === 0 && <li className="px-3 py-3 text-slate-500">Aucun produit sélectionné.</li>}
        </ul>
      </div>

      <p className="text-xs text-slate-500">
        L’offre n’est valide qu’entre ces deux dates. Hors de cette période, elle n’apparaît plus sur la boutique.
      </p>

      <FormError>{error}</FormError>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  )
}
