import { useEffect, useState } from 'react'
import { Eye, Search } from 'lucide-react'
import { getCommandes } from '../api/commandesApi'
import { getErrorMessage } from '../api/errors'
import { formatDateHeure, formatPrix } from '../utils/format'
import { STATUTS, debutDeJour, finDeJour, numeroCommande } from '../utils/commandes'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import CommandeDetail from '../components/CommandeDetail'

const fieldClass = 'rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand'

export default function Commandes() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [statut, setStatut] = useState('')
  const [du, setDu] = useState('') // YYYY-MM-DD
  const [au, setAu] = useState('')
  const [reload, setReload] = useState(0)
  const [selectedId, setSelectedId] = useState(null) // order open in the detail modal
  const [result, setResult] = useState({ key: '', commandes: [], pagination: null, error: '' })

  const { commandes, pagination, error } = result

  const key = JSON.stringify({ page, search, statut, du, au, reload })
  const loading = result.key !== key

  useEffect(() => {
    let ignore = false
    getCommandes({
      page,
      search,
      statut,
      dateDebut: du ? debutDeJour(du) : '',
      dateFin: au ? finDeJour(au) : '',
    })
      .then(({ data, pagination }) => {
        if (!ignore) setResult({ key, commandes: data, pagination, error: '' })
      })
      .catch((err) => {
        if (!ignore) {
          setResult({ key, commandes: [], pagination: null, error: getErrorMessage(err, 'Impossible de charger les commandes.') })
        }
      })
    return () => {
      ignore = true
    }
  }, [key, page, search, statut, du, au])

  const refresh = () => setReload((n) => n + 1)

  // any filter change goes back to page 1
  function onFilter(setter) {
    return (e) => {
      setPage(1)
      setter(e.target.value)
    }
  }

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  const hasFilters = search || statut || du || au

  function resetFilters() {
    setPage(1)
    setSearchInput('')
    setSearch('')
    setStatut('')
    setDu('')
    setAu('')
  }

  return (
    <div>
      <div className="mb-6">
        <p className="font-display text-xs tracking-wider text-brand-dark">GESTION DES VENTES</p>
        <h1 className="font-display text-2xl text-sidebar">COMMANDES</h1>
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <form onSubmit={handleSearch} className="flex w-fit items-center rounded border border-slate-300 bg-white">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Nom ou téléphone du client…"
            className="w-64 px-3 py-2 text-sm outline-none"
          />
          <button type="submit" aria-label="Rechercher" className="px-3 text-slate-500 hover:text-brand">
            <Search size={16} />
          </button>
        </form>

        <select value={statut} onChange={onFilter(setStatut)} aria-label="Filtrer par statut" className={fieldClass}>
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([value, { label }]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>

        <label className="text-xs text-slate-500">
          Du
          <input type="date" value={du} max={au || undefined} onChange={onFilter(setDu)} className={`${fieldClass} ml-2`} />
        </label>
        <label className="text-xs text-slate-500">
          Au
          <input type="date" value={au} min={du || undefined} onChange={onFilter(setAu)} className={`${fieldClass} ml-2`} />
        </label>

        {hasFilters && (
          <button onClick={resetFilters} className="text-sm text-slate-500 underline hover:text-brand">
            Réinitialiser
          </button>
        )}
      </div>

      <div className={`overflow-x-auto rounded-lg bg-white shadow-sm ${loading ? 'opacity-50' : ''}`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">N°</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3 text-right">Articles</th>
              <th className="px-4 py-3 text-right">Total</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Détail</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commandes.map((c) => {
              const s = STATUTS[c.statut]
              return (
                <tr key={c.id} className="cursor-pointer hover:bg-slate-50" onClick={() => setSelectedId(c.id)}>
                  <td className="px-4 py-3 font-mono text-xs text-slate-600">{numeroCommande(c.id)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateHeure(c.dateCommande)}</td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-slate-800">{c.nomClient}</span>
                    <span className="text-xs text-slate-500">{c.telephoneClient}</span>
                  </td>
                  <td className="px-4 py-3 text-right text-slate-600">{c.lignes.reduce((n, l) => n + l.quantite, 0)}</td>
                  <td className="px-4 py-3 text-right font-display text-lg text-brand">{formatPrix(c.total)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.className}`}>{s.label}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button aria-label="Voir la commande" className="text-slate-500 hover:text-brand">
                      <Eye size={16} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!loading && commandes.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500">{error || 'Aucune commande trouvée.'}</p>
        )}
      </div>

      <Pagination pagination={pagination} onPage={setPage} />

      {selectedId && (
        <Modal title="DÉTAIL DE LA COMMANDE" size="max-w-3xl" onClose={() => setSelectedId(null)}>
          <CommandeDetail id={selectedId} onChanged={refresh} onClose={() => setSelectedId(null)} />
        </Modal>
      )}
    </div>
  )
}
