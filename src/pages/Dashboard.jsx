import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { admin } = useAuth()
  return (
    <div>
      <h1 className="font-display text-2xl text-sidebar">TABLEAU DE BORD</h1>
      <p className="mt-2 text-slate-600">Bienvenue {admin.nom}. Les statistiques arrivent avec le Module 4.</p>
    </div>
  )
}