import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/FeedbackContext'
import { updateProfile } from '../api/authApi'
import PasswordInput from '../components/PasswordInput'
import { FormError, PageHeader, inputClass, primaryButton } from '../components/ui'

export default function Profile() {
  const { admin, setAdmin } = useAuth()
  const toast = useToast()
  const [nom, setNom] = useState(admin.nom)
  const [email, setEmail] = useState(admin.email)
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const modifie = nom !== admin.nom || email !== admin.email || motDePasse !== ''

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const payload = { nom, email }
      if (motDePasse) payload.motDePasse = motDePasse // only send if changed
      const updated = await updateProfile(payload)
      setAdmin(updated)
      setMotDePasse('')
      toast.success(motDePasse ? 'Profil et mot de passe mis à jour.' : 'Profil mis à jour.')
    } catch (err) {
      const data = err.response?.data
      setError(data?.erreurs?.[0]?.message || data?.message || 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <PageHeader kicker="COMPTE ADMINISTRATEUR" title="MON PROFIL" />

      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg bg-white p-6 shadow-sm">
        <label className="block text-sm text-slate-600">
          Nom<span className="text-brand"> *</span>
          <input required value={nom} onChange={(e) => setNom(e.target.value)} autoComplete="name" className={`${inputClass} mt-1`} />
        </label>

        <label className="block text-sm text-slate-600">
          Email<span className="text-brand"> *</span>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" className={`${inputClass} mt-1`} />
        </label>

        <div className="border-t border-slate-100 pt-4">
          <label className="block text-sm text-slate-600">
            Nouveau mot de passe
            <div className="mt-1">
              <PasswordInput autoComplete="new-password" value={motDePasse} onChange={(e) => setMotDePasse(e.target.value)} />
            </div>
          </label>
          <p className="mt-1 text-xs text-slate-500">Laissez vide pour garder le mot de passe actuel.</p>
        </div>

        <FormError>{error}</FormError>

        <div className="flex items-center justify-end gap-3 pt-2">
          {modifie && !saving && <span className="text-xs text-slate-500">Modifications non enregistrées</span>}
          <button type="submit" disabled={saving || !modifie} className={`${primaryButton} px-5`}>
            {saving ? 'ENREGISTREMENT…' : 'ENREGISTRER'}
          </button>
        </div>
      </form>
    </div>
  )
}
