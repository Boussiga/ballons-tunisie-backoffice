import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute() {
  const { admin, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <span className="size-8 animate-spin rounded-full border-4 border-slate-300 border-t-brand" aria-label="Chargement" />
      </div>
    )
  }
  if (!admin) return <Navigate to="/login" replace state={{ from: location }} />

  return <Outlet />
}