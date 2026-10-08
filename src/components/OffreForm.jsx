import { useState } from 'react'
import { createOffre, updateOffre } from '../api/offresApi'
import { getErrorMessage } from '../api/errors'
import { fromInputDateTime, toInputDateTime } from '../utils/format'

const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand'

export default function OffreForm({ offre, onSaved, onCancel }) {
  const [titre, setTitre] = useState(offre?.titre ?? '')
  // kept as text while typing, converted to a number on submit
  const [pourcentage, setPourcentage] = useState(offre ? String(offre.pourcentageReduction) : '')
  const [dateDebut, setDateDebut] = useState(offre ? toInputDateTime(offre.dateDebut) : '')
  const [dateFin, setDateFin] = useState(offre ? toInputDateTime(offre.dateFin) : '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    const pct = Number(pourcentage)
    if (!Number.isFinite(pct) || pct <= 0 || pct > 100) {
      setError('Le pourcentage doit être supérieur à 0 et inférieur ou égal à 100.')
      return
    }
    if (new Date(dateDebut) >= new Date(dateFin)) {
      setError('La date de début doit être antérieure à la date de fin.')
      return
    }

    // always send all four fields, so the API can compare the two dates
    const values = {
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
        Titre de l’offre
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
        Réduction (%)
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
          Début
          <input
            required
            type="datetime-local"
            value={dateDebut}
            onChange={(e) => setDateDebut(e.target.value)}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block text-sm text-slate-600">
          Fin
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

      <p className="text-xs text-slate-500">
        L’offre n’est valide qu’entre ces deux dates. Hors de cette période, elle n’apparaît plus sur la boutique.
      </p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="rounded bg-brand px-5 py-2 font-display tracking-wider text-white hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'ENREGISTREMENT…' : 'ENREGISTRER'}
        </button>
      </div>
    </form>
  )
}
