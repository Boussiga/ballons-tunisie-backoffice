import { useState } from 'react'
import { createCategorie } from '../api/categoriesApi'
import { getErrorMessage } from '../api/errors'
import { FormActions, FormError, inputClass } from './ui'

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
        Nom du sport<span className="text-brand"> *</span>
        <input
          required
          minLength={2}
          maxLength={100}
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          placeholder="Ex : Volleyball"
          className={`${inputClass} mt-1`}
        />
      </label>

      <FormError>{error}</FormError>
      <FormActions saving={saving} onCancel={onCancel} label="AJOUTER" />
    </form>
  )
}
