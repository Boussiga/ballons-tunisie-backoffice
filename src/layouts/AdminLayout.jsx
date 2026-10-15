import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useConfirm } from '../context/FeedbackContext'
import { LayoutDashboard, Package, Boxes, BadgePercent, ClipboardList, UserRound, LogOut, Menu, X } from 'lucide-react'

const links = [
  { to: '/', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/produits', label: 'Stocks & Ballons', icon: Package },
  { to: '/packs', label: 'Packs', icon: Boxes },
  { to: '/offres', label: 'Offres', icon: BadgePercent },
  { to: '/commandes', label: 'Commandes', icon: ClipboardList },
  { to: '/profile', label: 'Mon profil', icon: UserRound },
]

const initiales = (nom = '') =>
  nom
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0].toUpperCase())
    .join('')

export default function AdminLayout() {
  const { admin, logout } = useAuth()
  const confirm = useConfirm()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPath, setMenuPath] = useState(location.pathname)

  // close the mobile menu after navigating
  if (menuPath !== location.pathname) {
    setMenuPath(location.pathname)
    setMenuOpen(false)
  }

  const current = links.find((l) => (l.end ? location.pathname === l.to : location.pathname.startsWith(l.to)))

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e) => e.key === 'Escape' && setMenuOpen(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [menuOpen])

  useEffect(() => {
    document.title = current ? `${current.label} · Ballons Tunisie Admin` : 'Ballons Tunisie Admin'
  }, [current])

  async function handleLogout() {
    if (await confirm({ title: 'Se déconnecter ?', message: 'Vous devrez saisir à nouveau vos identifiants.', confirmLabel: 'DÉCONNEXION' })) {
      logout()
    }
  }

  return (
    <div className="flex min-h-screen bg-slate-100">
      {menuOpen && <div className="fixed inset-0 z-30 bg-black/50 lg:hidden" onClick={() => setMenuOpen(false)} />}

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-sidebar text-white transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-3 px-4 py-5">
          <img src="/logo-mark-white.png" alt="" className="size-10 object-contain" />
          <div className="font-display leading-tight">
            <p className="text-lg tracking-[0.2em]">BALLONS</p>
            <p className="text-xs tracking-[0.35em] text-slate-400">TUNISIE</p>
          </div>
          <button onClick={() => setMenuOpen(false)} aria-label="Fermer le menu" className="ml-auto rounded p-1 text-slate-400 hover:text-white lg:hidden">
            <X size={20} />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1 px-2" aria-label="Navigation principale">
          {links.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded px-3 py-2.5 text-sm transition-colors ${
                  isActive ? 'bg-brand text-white shadow-sm' : 'text-slate-300 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 p-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <LogOut size={18} />
            Déconnexion
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button onClick={() => setMenuOpen(true)} aria-label="Ouvrir le menu" className="rounded p-1.5 text-slate-600 hover:bg-slate-100 lg:hidden">
              <Menu size={20} />
            </button>
            <span className="truncate font-display text-xs tracking-wider text-brand-dark">
              <span className="hidden sm:inline">BACKOFFICE PRO - BALLONS TUNISIE</span>
              <span className="sm:hidden">{current?.label.toUpperCase() ?? 'BACKOFFICE'}</span>
            </span>
          </div>
          <NavLink to="/profile" className="flex items-center gap-2 rounded-full py-1 pl-3 pr-1 text-sm text-slate-600 hover:bg-slate-100">
            <span className="hidden sm:inline">{admin.nom}</span>
            <span className="flex size-8 items-center justify-center rounded-full bg-brand font-display text-xs text-white">
              {initiales(admin.nom) || <UserRound size={14} />}
            </span>
          </NavLink>
        </header>

        <main className="page-in flex-1 p-4 sm:p-6" key={location.pathname}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
