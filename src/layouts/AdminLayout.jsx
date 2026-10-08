import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { LayoutDashboard, Package, Boxes, BadgePercent, UserRound, LogOut } from 'lucide-react'

const links = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/produits', label: 'Stocks & Ballons', icon: Package },
  { to: '/packs', label: 'Packs', icon: Boxes },
  { to: '/offres', label: 'Offres', icon: BadgePercent },
  { to: '/profile', label: 'Mon profil', icon: UserRound },
]


export default function AdminLayout() {
  const { admin, logout } = useAuth()

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="w-56 shrink-0 bg-sidebar text-white">
        <div className="px-4 py-5 font-display text-2xl tracking-[0.3em]">VISION</div>
        <nav className="flex flex-col gap-1 px-2">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded px-3 py-2 text-sm ${
                  isActive ? 'bg-brand text-white' : 'text-slate-300 hover:bg-white/10'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-slate-200 bg-white px-6">
          <span className="font-display text-xs tracking-wider text-brand-dark">
            BACKOFFICE PRO - VISION SPORTS
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{admin.nom}</span>
            <NavLink
              to="/profile"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-white"
            >
              <UserRound size={14} />
            </NavLink>
            <button
              onClick={logout}
              className="flex items-center gap-1 text-sm text-slate-500 hover:text-brand"
            >
              <LogOut size={16} />
              Déconnexion
            </button>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}