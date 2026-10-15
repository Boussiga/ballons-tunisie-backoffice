import { useEffect, useState } from 'react'
import { Boxes, Pencil, Plus, Trash2 } from 'lucide-react'
import { deletePack, getPacks } from '../api/packsApi'
import { getErrorMessage } from '../api/errors'
import { formatPrix } from '../utils/format'
import { useConfirm, useToast } from '../context/FeedbackContext'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import PackForm from '../components/PackForm'
import { Badge, EmptyState, ErrorState, PageHeader, SearchInput, Skeleton, primaryButton, secondaryButton } from '../components/ui'

const sommeProduits = (pack) => pack.produits.reduce((sum, l) => sum + l.produit.prix * l.quantite, 0)

// The API stores the pack price when it is saved. If a product price changed
// since then, the stored price no longer matches the products minus the discount.
function isPriceStale(pack) {
  const attendu = Math.round(sommeProduits(pack) * (1 - (pack.pourcentageRemise ?? 0) / 100) * 100) / 100
  return Math.abs(attendu - pack.prixPack) > 0.01
}

function PackCard({ pack, onEdit, onDelete }) {
  const total = sommeProduits(pack)
  const remise = pack.pourcentageRemise ?? 0
  const economie = total - pack.prixPack

  return (
    <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg text-sidebar">{pack.nom}</h3>
          {pack.description && <p className="mt-0.5 text-sm text-slate-500">{pack.description}</p>}
        </div>
        {remise > 0 && <Badge className="shrink-0 bg-brand/10 text-brand-dark">−{remise} %</Badge>}
      </div>

      <ul className="mt-4 flex-1 space-y-1.5 border-t border-slate-100 pt-3 text-sm">
        {pack.produits.map((l) => (
          <li key={l.produitId} className="flex justify-between gap-3">
            <span className="truncate text-slate-700">
              <span className="text-slate-400">{l.quantite} ×</span> {l.produit.nom}
            </span>
            <span className="whitespace-nowrap text-slate-500">{formatPrix(l.produit.prix * l.quantite)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-end justify-between gap-3">
        <div>
          {economie > 0.005 && <p className="text-xs text-slate-400 line-through">{formatPrix(total)}</p>}
          <p className="font-display text-2xl leading-none text-brand">{formatPrix(pack.prixPack)}</p>
          {economie > 0.005 && <p className="mt-1 text-xs text-green-700">Le client économise {formatPrix(economie)}</p>}
        </div>
        <div className="flex gap-1 text-slate-500">
          <button onClick={() => onEdit(pack)} aria-label={`Modifier ${pack.nom}`} title="Modifier" className="rounded p-1.5 hover:bg-slate-100 hover:text-brand">
            <Pencil size={16} />
          </button>
          <button onClick={() => onDelete(pack)} aria-label={`Supprimer ${pack.nom}`} title="Supprimer" className="rounded p-1.5 hover:bg-red-50 hover:text-red-600">
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {isPriceStale(pack) && (
        <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Un produit a changé de prix. Modifiez puis enregistrez le pack pour recalculer son prix.
        </p>
      )}
    </div>
  )
}

function PackSkeleton() {
  return (
    <div className="space-y-3 rounded-lg bg-white p-5 shadow-sm">
      <Skeleton className="h-5 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-7 w-1/3" />
    </div>
  )
}

export default function Packs() {
  const toast = useToast()
  const confirm = useConfirm()
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [modal, setModal] = useState(null) // null | { pack: object | null }
  const [result, setResult] = useState({ key: '', packs: [], pagination: null, error: '' })

  const { packs, pagination, error } = result

  const key = JSON.stringify({ page, search, reload })
  const loading = result.key !== key
  const firstLoad = loading && result.key === ''

  useEffect(() => {
    let ignore = false
    getPacks({ page, search })
      .then(({ data, pagination }) => {
        if (!ignore) setResult({ key, packs: data, pagination, error: '' })
      })
      .catch((err) => {
        if (!ignore) {
          setResult({ key, packs: [], pagination: null, error: getErrorMessage(err, 'Impossible de charger les packs.') })
        }
      })
    return () => {
      ignore = true
    }
  }, [key, page, search])

  const refresh = () => setReload((n) => n + 1)

  function handleSearch(value) {
    setPage(1)
    setSearch(value)
  }

  function handleSaved() {
    toast.success(modal.pack ? 'Pack mis à jour.' : 'Pack créé.')
    setModal(null)
    refresh()
  }

  async function handleDelete(pack) {
    const ok = await confirm({
      title: 'Supprimer ce pack ?',
      message: `« ${pack.nom} » ne sera plus proposé aux clients. Les produits qu’il contient sont conservés.`,
      confirmLabel: 'SUPPRIMER',
      danger: true,
    })
    if (!ok) return
    try {
      await deletePack(pack.id)
      if (packs.length === 1 && page > 1) setPage(page - 1)
      toast.success('Pack supprimé.')
      refresh()
    } catch (err) {
      toast.error(getErrorMessage(err))
    }
  }

  const nouveau = (
    <button onClick={() => setModal({ pack: null })} className={primaryButton}>
      <Plus size={16} />
      NOUVEAU PACK
    </button>
  )

  return (
    <div>
      <PageHeader kicker="GESTION DU CATALOGUE" title="PACKS">
        {nouveau}
      </PageHeader>

      <SearchInput value={search} onSearch={handleSearch} placeholder="Rechercher un pack…" className="mb-4 w-full sm:w-72" />

      <div className={`grid gap-4 transition-opacity sm:grid-cols-2 xl:grid-cols-3 ${loading && !firstLoad ? 'opacity-50' : ''}`}>
        {firstLoad && [0, 1, 2].map((i) => <PackSkeleton key={i} />)}
        {packs.map((p) => (
          <PackCard key={p.id} pack={p} onEdit={(pack) => setModal({ pack })} onDelete={handleDelete} />
        ))}
      </div>

      {!loading && (error || packs.length === 0) && (
        <div className="rounded-lg bg-white shadow-sm">
          {error ? (
            <ErrorState text={error} onRetry={refresh} />
          ) : search ? (
            <EmptyState
              icon={Boxes}
              title="Aucun pack ne correspond"
              text={`Aucun résultat pour « ${search} ».`}
              action={<button onClick={() => handleSearch('')} className={secondaryButton}>Effacer la recherche</button>}
            />
          ) : (
            <EmptyState icon={Boxes} title="Aucun pack pour l’instant" text="Regroupez plusieurs produits avec une remise pour augmenter le panier moyen." action={nouveau} />
          )}
        </div>
      )}

      <Pagination pagination={pagination} onPage={setPage} />

      {modal && (
        <Modal title={modal.pack ? 'MODIFIER LE PACK' : 'NOUVEAU PACK'} onClose={() => setModal(null)}>
          <PackForm pack={modal.pack} onSaved={handleSaved} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
