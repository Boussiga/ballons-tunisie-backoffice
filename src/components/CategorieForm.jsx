import { useState } from 'react'
import { createCategorie } from '../api/categoriesApi'
import { getErrorMessage } from '../api/errors'

export default function CategorieForm({ onSaved, onCancel }) {
  const [nom, setNom] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      await createCategorie({ nom })
      onSaved()
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block text-sm text-slate-600">
        Nom du sport (ex: Volleyball)
        <input
          required
          minLength={2}
          maxLength={100}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="mt-1 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand"
        />
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3">
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="rounded bg-brand px-5 py-2 font-display tracking-wider text-white hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'ENREGISTREMENT…' : 'AJOUTER'}
        </button>
      </div>
    </form>
  )
}
