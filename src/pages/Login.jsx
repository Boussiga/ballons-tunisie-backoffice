import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import PasswordInput from '../components/PasswordInput'
import loginBg from '../assets/login-bg.png'
import { FormError, inputClass, primaryButton } from '../components/ui'

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
    <div
      className="relative flex min-h-screen items-center justify-center bg-sidebar bg-cover bg-center px-4"
      style={{ backgroundImage: `url(${loginBg})` }}
    >
      {/* dark layer so the form stays readable on any picture */}
      <div className="absolute inset-0 bg-black/55" />

      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-sm rounded-lg bg-white/95 p-8 shadow-2xl backdrop-blur"
      >
        <div className="mb-6 flex flex-col items-center text-center">
          <img src="/logo.png" alt="Ballons Tunisie" className="mb-3 h-20 w-auto" />
          <p className="font-display text-xs tracking-wider text-brand-dark">BACKOFFICE PRO - CONNEXION ADMINISTRATEUR</p>
        </div>

        <label htmlFor="login-email" className="mb-1 block text-sm text-slate-600">Email</label>
        <input
          id="login-email"
          type="email"
          required
          autoFocus
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${inputClass} mb-4`}
        />

        <label htmlFor="login-password" className="mb-1 block text-sm text-slate-600">Mot de passe</label>
        <div className="mb-4">
          <PasswordInput
            id="login-password"
            required
            autoComplete="current-password"
            value={motDePasse}
            onChange={(e) => setMotDePasse(e.target.value)}
          />
        </div>

        {error && (
          <div className="mb-4">
            <FormError>{error}</FormError>
          </div>
        )}

        <button type="submit" disabled={submitting} className={`${primaryButton} w-full py-2.5`}>
          {submitting && <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
          {submitting ? 'CONNEXION…' : 'SE CONNECTER'}
        </button>
      </form>
    </div>
  )
}