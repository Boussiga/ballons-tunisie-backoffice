import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { admin, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [email, setEmail] = useState('')
  const [motDePasse, setMotDePasse] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const from = location.state?.from?.pathname || '/'

  if (admin) return <Navigate to={from} replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await login(email, motDePasse)
      navigate(from, { replace: true })
    } catch (err) {
      const status = err.response?.status
      if (status === 401) setError('Email ou mot de passe incorrect.')
      else if (status === 429) setError('Trop de tentatives. Réessayez dans 15 minutes.')
      else if (status === 422) setError(err.response.data.erreurs?.[0]?.message || 'Données invalides.')
      else setError('Impossible de contacter le serveur.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-sidebar px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-lg bg-white p-8 shadow-xl">
        <h1 className="font-display text-3xl tracking-[0.3em] text-sidebar">VISION</h1>
        <p className="mb-6 font-display text-xs tracking-wider text-brand-dark">
          BACKOFFICE PRO - CONNEXION ADMINISTRATEUR
        </p>

        <label className="mb-1 block text-sm text-slate-600">Email</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand"
        />

        <label className="mb-1 block text-sm text-slate-600">Mot de passe</label>
        <input
          type="password"
          required
          value={motDePasse}
          onChange={(e) => setMotDePasse(e.target.value)}
          className="mb-4 w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand"
        />

        {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded bg-brand py-2 font-display tracking-wider text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? 'CONNEXION…' : 'SE CONNECTER'}
        </button>
      </form>
    </div>
  )
}