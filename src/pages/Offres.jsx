import { useEffect, useState } from 'react'
import { BadgePercent, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteOffre, getOffres } from '../api/offresApi'
import { getErrorMessage } from '../api/errors'
import { formatDateHeure, statutOffre } from '../utils/format'
import { useConfirm, useToast } from '../context/FeedbackContext'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import OffreForm from '../components/OffreForm'
import { Badge, EmptyState, ErrorState, PageHeader, SearchInput, SkeletonRows, fieldClass, primaryButton, secondaryButton } from '../components/ui'

const STATUTS = {
  'en-cours': { label: 'En cours', className: 'bg-green-100 text-green-800' },
  'a-venir': { label: 'À venir', className: 'bg-blue-100 text-blue-800' },
  terminee: { label: 'Terminée', className: 'bg-slate-200 text-slate-600' },
}

// "" = all, "true" = running now, "false" = finished or not started yet
const FILTRES = [
  { value: '', label: 'Toutes les offres' },
  { value: 'true', label: 'En cours' },
  { value: 'false', label: 'Terminées ou à venir' },
]

const JOUR_MS = 24 * 60 * 60 * 1000

// "dans 3 j", "encore 5 j", "il y a 2 j" — what the admin wants to know at a glance
function delai(offre, statut) {
  const now = Date.now()
  const jours = (date) => Math.max(1, Math.ceil(Math.abs(new Date(date) - now) / JOUR_MS))
  if (statut === 'a-venir') return `commence dans ${jours(offre.dateDebut)} j`
  if (statut === 'en-cours') return `encore ${jours(offre.dateFin)} j`
  return `terminée il y a ${jours(offre.dateFin)} j`
}

function ProduitsOffre({ produits = [] }) {
  if (produits.length === 0) return <span className="text-xs text-amber-700">Aucun produit</span>
  const visibles = produits.slice(0, 2)
  return (
    <div className="flex flex-wrap gap-1" title={produits.map((p) => p.nom).join(', ')}>
      {visibles.map((p) => (
        <span key={p.id} className="max-w-36 truncate rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-700">
          {p.nom}
        </span>
      ))}
      {produits.length > 2 && <span className="rounded bg-slate-100 px-2 py-0.5 text-xs text-slate-500">+{produits.length - 2}</span>}
    </div>
  )
}

export default function Offres() {
  const toast = useToast()
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('')
  const [reload, setReload] = useState(0)
  const [modal, setModal] = useState(null) // null | { offre: object | null }
  const [result, setResult] = useState({ key: '', offres: [], pagination: null, error: '' })

  const { offres, pagination, error } = result

  const key = JSON.stringify({ page, search, filtre, reload })
  const loading = result.key !== key
  const firstLoad = loading && result.key === ''

  useEffect(() => {
    let ignore = false
    const active = filtre === '' ? undefined : filtre === 'true'
    getOffres({ page, search, active })
      .then(({ data, pagination }) => {
        if (!ignore) setResult({ key, offres: data, pagination, error: '' })
      })
      .catch((err) => {
        if (!ignore) {
          setResult({ key, offres: [], pagination: null, error: getErrorMessage(err, 'Impossible de charger les offres.') })
        }
      })
    return () => {
      ignore = true
    }
  }, [key, page, search, filtre])

  const refresh = () => setReload((n) => n + 1)

  function handleSearch(value) {
    setPage(1)
    setSearch(value)
  }

  function handleFiltre(e) {
    setPage(1)
    setFiltre(e.target.value)
  }

  function resetFilters() {
    setPage(1)
    setSearch('')
    setFiltre('')
  }

  function handleSaved() {
    toast.success(modal.offre ? 'Offre mise à jour.' : 'Offre créée.')
    setModal(null)
    refresh()
  }

  async function handleDelete(offre) {
    const ok = await confirm({
      title: 'Supprimer cette offre ?',
      message: `« ${offre.titre} » ne s’appliquera plus aux produits concernés.`,
      confirmLabel: 'SUPPRIMER',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteOffre(offre.id)
      if (offres.length === 1 && page > 1) setPage(page - 1)
      toast.success('Offre supprimée.')
      refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const nouvelle = (
    <button onClick={() => setModal({ offre: null })} className={primaryButton}>
      <Plus size={16} />
      NOUVELLE OFFRE
    </button>
  )

  return (
    <div>
      <PageHeader kicker="GESTION DU CATALOGUE" title="OFFRES">
        {nouvelle}
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput value={search} onSearch={handleSearch} placeholder="Rechercher une offre…" />
        <select value={filtre} onChange={handleFiltre} aria-label="Filtrer par statut" className={fieldClass}>
          {FILTRES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 font-display text-xs tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">OFFRE</th>
              <th className="px-4 py-3">RÉDUCTION</th>
              <th className="hidden px-4 py-3 md:table-cell">PRODUITS</th>
              <th className="hidden px-4 py-3 lg:table-cell">PÉRIODE</th>
              <th className="px-4 py-3">STATUT</th>
              <th className="px-4 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className={`divide-y divide-slate-100 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {firstLoad && <SkeletonRows cols={6} />}
            {offres.map((o) => {
              const code = statutOffre(o)
              const statut = STATUTS[code]
              return (
                <tr key={o.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3">
                    <p className="font-medium text-slate-800">{o.titre}</p>
                    <p className="text-xs text-slate-500 lg:hidden">
                      {formatDateHeure(o.dateDebut)} → {formatDateHeure(o.dateFin)}
                    </p>
                  </td>
                  <td className="px-4 py-3 font-display text-lg text-brand">−{o.pourcentageReduction} %</td>
                  <td className="hidden px-4 py-3 md:table-cell">
                    <ProduitsOffre produits={o.produits} />
                  </td>
                  <td className="hidden whitespace-nowrap px-4 py-3 text-slate-600 lg:table-cell">
                    <p>{formatDateHeure(o.dateDebut)}</p>
                    <p className="text-xs text-slate-500">→ {formatDateHeure(o.dateFin)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={statut.className}>{statut.label}</Badge>
                    <p className="mt-1 whitespace-nowrap text-xs text-slate-500">{delai(o, code)}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1 text-slate-500">
                      <button onClick={() => setModal({ offre: o })} aria-label={`Modifier ${o.titre}`} title="Modifier" className="rounded p-1.5 hover:bg-slate-100 hover:text-brand">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(o)} aria-label={`Supprimer ${o.titre}`} title="Supprimer" className="rounded p-1.5 hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!loading && error && <ErrorState text={error} onRetry={refresh} />}
        {!loading && !error && offres.length === 0 && (
          search || filtre ? (
            <EmptyState
              icon={BadgePercent}
              title="Aucune offre ne correspond"
              text="Modifiez la recherche ou le filtre."
              action={<button onClick={resetFilters} className={secondaryButton}>Réinitialiser les filtres</button>}
            />
          ) : (
            <EmptyState icon={BadgePercent} title="Aucune offre pour l’instant" text="Créez une promotion limitée dans le temps sur une sélection de produits." action={nouvelle} />
          )
        )}
      </div>

      <Pagination pagination={pagination} onPage={setPage} />

      {modal && (
        <Modal title={modal.offre ? 'MODIFIER L’OFFRE' : 'NOUVELLE OFFRE'} onClose={() => setModal(null)}>
          <OffreForm offre={modal.offre} onSaved={handleSaved} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
