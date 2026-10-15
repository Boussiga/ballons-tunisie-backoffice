import { useEffect, useState } from 'react'
import { ChevronRight, ClipboardList } from 'lucide-react'
import { getCommandes } from '../api/commandesApi'
import { getErrorMessage } from '../api/errors'
import { formatDateHeure, formatPrix } from '../utils/format'
import { STATUTS, debutDeJour, finDeJour, numeroCommande } from '../utils/commandes'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import CommandeDetail from '../components/CommandeDetail'
import { Badge, EmptyState, ErrorState, PageHeader, SearchInput, SkeletonRows, fieldClass, secondaryButton } from '../components/ui'

export default function Commandes() {
  const [page, setPage] = useState(1)
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
  const firstLoad = loading && result.key === ''

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

  function handleSearch(value) {
    setPage(1)
    setSearch(value)
  }

  const hasFilters = search || statut || du || au

  function resetFilters() {
    setPage(1)
    setSearch('')
    setStatut('')
    setDu('')
    setAu('')
  }

  return (
    <div>
      <PageHeader kicker="GESTION DES VENTES" title="COMMANDES" />

      {/* status shortcuts: one click to see what needs handling */}
      <div className="-mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0">
        {[['', 'Toutes'], ...Object.entries(STATUTS).map(([v, s]) => [v, s.label])].map(([v, label]) => (
          <button
            key={v}
            onClick={() => {
              setPage(1)
              setStatut(v)
            }}
            aria-pressed={statut === v}
            className={`shrink-0 rounded px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-colors ${
              statut === v ? 'bg-sidebar text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mb-4 flex flex-wrap items-end gap-3">
        <SearchInput value={search} onSearch={handleSearch} placeholder="Nom ou téléphone du client…" className="w-full sm:w-72" />

        <label className="flex items-center gap-2 text-xs text-slate-500">
          Du
          <input type="date" value={du} max={au || undefined} onChange={onFilter(setDu)} className={fieldClass} />
        </label>
        <label className="flex items-center gap-2 text-xs text-slate-500">
          Au
          <input type="date" value={au} min={du || undefined} onChange={onFilter(setAu)} className={fieldClass} />
        </label>

        {hasFilters && (
          <button onClick={resetFilters} className="py-2 text-sm text-slate-500 underline hover:text-brand">
            Réinitialiser
          </button>
        )}
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 font-display text-xs tracking-wider text-slate-500">
            <tr>
              <th className="hidden px-4 py-3 sm:table-cell">N°</th>
              <th className="hidden px-4 py-3 md:table-cell">DATE</th>
              <th className="px-4 py-3">CLIENT</th>
              <th className="hidden px-4 py-3 text-right sm:table-cell">ARTICLES</th>
              <th className="px-4 py-3 text-right">TOTAL</th>
              <th className="px-4 py-3">STATUT</th>
              <th className="hidden px-2 py-3 sm:table-cell"><span className="sr-only">Détail</span></th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {firstLoad && <SkeletonRows cols={7} />}
            {commandes.map((c) => {
              const s = STATUTS[c.statut]
              return (
                <tr
                  key={c.id}
                  tabIndex={0}
                  className="cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50"
                  onClick={() => setSelectedId(c.id)}
                  onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), setSelectedId(c.id))}
                  aria-label={`Commande ${numeroCommande(c.id)} de ${c.nomClient}`}
                >
                  <td className="hidden px-4 py-3 font-mono text-xs text-slate-600 sm:table-cell">{numeroCommande(c.id)}</td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 md:table-cell">{formatDateHeure(c.dateCommande)}</td>
                  <td className="px-4 py-3">
                    <span className="block font-medium text-slate-800">{c.nomClient}</span>
                    <span className="text-xs text-slate-500">{c.telephoneClient}</span>
                    <span className="block text-xs text-slate-400 md:hidden">
                      <span className="font-mono sm:hidden">{numeroCommande(c.id)} · </span>
                      {formatDateHeure(c.dateCommande)}
                    </span>
                  </td>
                  <td className="hidden px-4 py-3 text-right text-slate-600 sm:table-cell">{c.lignes.reduce((n, l) => n + l.quantite, 0)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-right font-display text-lg text-brand">{formatPrix(c.total)}</td>
                  <td className="px-4 py-3">
                    <Badge className={s.className}>{s.label}</Badge>
                  </td>
                  <td className="hidden px-2 py-3 text-slate-400 sm:table-cell">
                    <ChevronRight size={18} />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!loading && error && <ErrorState text={error} onRetry={refresh} />}
        {!loading && !error && commandes.length === 0 && (
          hasFilters ? (
            <EmptyState
              icon={ClipboardList}
              title="Aucune commande ne correspond"
              text="Modifiez la recherche, le statut ou les dates."
              action={<button onClick={resetFilters} className={secondaryButton}>Réinitialiser les filtres</button>}
            />
          ) : (
            <EmptyState icon={ClipboardList} title="Aucune commande pour l’instant" text="Les commandes passées sur la boutique apparaîtront ici." />
          )
        )}
      </div>

      <Pagination pagination={pagination} onPage={setPage} />

      {selectedId && (
        <Modal title={`COMMANDE ${numeroCommande(selectedId)}`} size="max-w-3xl" onClose={() => setSelectedId(null)}>
          <CommandeDetail id={selectedId} onChanged={refresh} onClose={() => setSelectedId(null)} />
        </Modal>
      )}
    </div>
  )
}
