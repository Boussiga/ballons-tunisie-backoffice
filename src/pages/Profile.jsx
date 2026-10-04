import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/authApi'

export default function Profile() {
  const { admin, setAdmin } = useAuth()
  const [nom, setNom] = useState(admin.nom)
  const [email, setEmail] = useState(admin.email)
  const [motDePasse, setMotDePasse] = useState('')
  const [message, setMessage] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')
    setSaving(true)
    try {
      const payload = { nom, email }
      if (motDePasse) payload.motDePasse = motDePasse // only send if changed
      const updated = await updateProfile(payload)
      setAdmin(updated)
      setMotDePasse('')
      setMessage('Profil mis à jour.')
    } catch (err) {
      const data = err.response?.data
      setMessage(data?.erreurs?.[0]?.message || data?.message || 'Erreur lors de la mise à jour.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-6 font-display text-2xl text-sidebar">MON PROFIL</h1>
      <form onSubmit={handleSubmit} className="rounded-lg bg-white p-6 shadow-sm">
        <label className="mb-1 block text-sm text-slate-600">Nom</label>
        <input
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand"
        />

        <label className="mb-1 block text-sm text-slate-600">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand"
        />

        <label className="mb-1 block text-sm text-slate-600">
          Nouveau mot de passe (laisser vide pour ne pas changer)
        </label>
        <input
          type="password"
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand"
        />

        {message && <p className="mb-4 text-sm text-slate-700">{message}</p>}

        <button
          type="submit"
          disabled={saving}
          className="rounded bg-brand px-5 py-2 font-display tracking-wider text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? 'ENREGISTREMENT…' : 'ENREGISTRER'}
        </button>
      </form>
    </div>
  )
}