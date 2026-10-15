import { useEffect, useState } from 'react'
import { Check, ImageOff, Package, Pencil, Plus, Trash2 } from 'lucide-react'
import { deleteProduit, getProduits, updateStock } from '../api/produitsApi'
import { getCategories } from '../api/categoriesApi'
import { getErrorMessage } from '../api/errors'
import { formatPrix, imageSrc } from '../utils/format'
import { useConfirm, useToast } from '../context/FeedbackContext'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import ProduitForm from '../components/ProduitForm'
import CategorieForm from '../components/CategorieForm'
import { Badge, EmptyState, ErrorState, PageHeader, SearchInput, SkeletonRows, primaryButton, secondaryButton } from '../components/ui'

function StockBadge({ stock }) {
  if (stock === 0) return <Badge className="bg-red-100 text-red-700">Rupture</Badge>
  if (stock < 5) return <Badge className="bg-amber-100 text-amber-800">Stock faible</Badge>
  return <Badge className="bg-green-100 text-green-700">En stock</Badge>
}

// Quick stock edit straight in the table (PATCH /updateStock)
function StockCell({ produit, onUpdated }) {
  const toast = useToast()
  const [value, setValue] = useState(String(produit.stock))
  const [state, setState] = useState('idle') // 'idle' | 'saving' | 'saved'

  async function save() {
    const stock = Number(value)
    if (value === '' || !Number.isInteger(stock) || stock < 0) {
      setValue(String(produit.stock))
      return
    }
    if (stock === produit.stock) return
    setState('saving')
    try {
      await updateStock(produit.id, stock)
      setState('saved')
      toast.success(`Stock de « ${produit.nom} » mis à jour : ${stock}.`)
      onUpdated()
    } catch (err) {
      toast.error(getErrorMessage(err))
      setValue(String(produit.stock))
      setState('idle')
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        min="0"
        value={value}
        aria-label={`Stock de ${produit.nom}`}
        onChange={(e) => setValue(e.target.value)}
        onFocus={(e) => e.target.select()}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') e.currentTarget.blur()
          if (e.key === 'Escape') {
            setValue(String(produit.stock))
            e.currentTarget.blur()
          }
        }}
        disabled={state === 'saving'}
        className="w-20 rounded border border-slate-300 px-2 py-1 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15"
      />
      {state === 'saving' && <span className="size-3.5 animate-spin rounded-full border-2 border-slate-300 border-t-brand" />}
      {state === 'saved' && <Check size={16} className="text-green-600" />}
    </div>
  )
}

function Vignette({ produit }) {
  return produit.imageUrl ? (
    <img src={imageSrc(produit.imageUrl)} alt="" className="size-11 shrink-0 rounded object-cover ring-1 ring-slate-200" />
  ) : (
    <span className="flex size-11 shrink-0 items-center justify-center rounded bg-slate-100 text-slate-400">
      <ImageOff size={18} />
    </span>
  )
}

export default function Produits() {
  const toast = useToast()
  const confirm = useConfirm()
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all') // 'all' | 'low' | a category id
  const [search, setSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [catReload, setCatReload] = useState(0)
  const [categorieModal, setCategorieModal] = useState(false)
  const [modal, setModal] = useState(null) // null | { produit: object | null }
  const [result, setResult] = useState({ key: '', produits: [], pagination: null, error: '' })

  const { produits, pagination, error } = result

  // "loading" = what is on screen does not match the current filters yet
  const key = JSON.stringify({ page, search, filter, reload })
  const loading = result.key !== key
  const firstLoad = loading && result.key === ''

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => toast.error(getErrorMessage(err, 'Impossible de charger les sports.')))
  }, [catReload, toast])

  useEffect(() => {
    let ignore = false
    const query = { page, search }
    if (filter === 'low') query.stockFaible = true
    else if (filter !== 'all') query.categorieId = filter

    getProduits(query)
      .then(({ data, pagination }) => {
        if (!ignore) setResult({ key, produits: data, pagination, error: '' })
      })
      .catch((err) => {
        if (!ignore) {
          setResult({ key, produits: [], pagination: null, error: getErrorMessage(err, 'Impossible de charger les produits.') })
        }
      })
    return () => {
      ignore = true
    }
  }, [key, page, search, filter])

  const refresh = () => setReload((n) => n + 1)

  function changeFilter(value) {
    setFilter(value)
    setPage(1)
  }

  function handleSearch(value) {
    setPage(1)
    setSearch(value)
  }

  function resetFilters() {
    setFilter('all')
    setSearch('')
    setPage(1)
  }

  function handleCategorieSaved() {
    setCategorieModal(false)
    toast.success('Sport ajouté.')
    setCatReload((n) => n + 1)
  }

  function handleSaved(warning) {
    const creation = !modal.produit
    setModal(null)
    if (warning) toast.error(warning)
    else toast.success(creation ? 'Ballon ajouté au catalogue.' : 'Ballon mis à jour.')
    refresh()
  }

  async function handleDelete(p) {
    const ok = await confirm({
      title: 'Supprimer ce ballon ?',
      message: `« ${p.nom} » sera retiré du catalogue. Cette action est définitive.`,
      confirmLabel: 'SUPPRIMER',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteProduit(p.id)
      if (produits.length === 1 && page > 1) setPage(page - 1)
      toast.success('Ballon supprimé.')
      refresh()
    } catch (err) {
      toast.error(
        err.response?.status === 500 ? 'Suppression impossible : ce produit est peut-être lié à des commandes.' : getErrorMessage(err)
      )
    }
  }

  const categorieNom = (id) => categories.find((c) => c.id === id)?.nom

  const tabs = [
    { value: 'all', label: 'Tous les sports' },
    ...categories.map((c) => ({ value: c.id, label: c.nom })),
    { value: 'low', label: 'Stock faible' },
  ]

  const hasFilters = search || filter !== 'all'

  return (
    <div>
      <PageHeader kicker="GESTION DU CATALOGUE" title="STOCKS & PRODUITS">
        <button onClick={() => setCategorieModal(true)} className={`${secondaryButton} font-display tracking-wider`}>
          <Plus size={16} />
          SPORT
        </button>
        <button onClick={() => setModal({ produit: null })} className={primaryButton}>
          <Plus size={16} />
          AJOUTER UN BALLON
        </button>
      </PageHeader>

      <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0 sm:pb-0" role="tablist" aria-label="Filtrer par sport">
          {tabs.map((t) => (
            <button
              key={t.value}
              role="tab"
              aria-selected={filter === t.value}
              onClick={() => changeFilter(t.value)}
              className={`shrink-0 rounded px-3 py-1.5 font-display text-xs uppercase tracking-wider transition-colors ${
                filter === t.value ? 'bg-sidebar text-white' : 'bg-white text-slate-600 shadow-sm hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <SearchInput value={search} onSearch={handleSearch} placeholder="Rechercher un ballon…" />
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 font-display text-xs tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">BALLON</th>
              <th className="hidden px-4 py-3 md:table-cell">SPORT</th>
              <th className="hidden px-4 py-3 md:table-cell">TAILLE</th>
              <th className="px-4 py-3 text-right">PRIX</th>
              <th className="px-4 py-3">STOCK</th>
              <th className="hidden px-4 py-3 sm:table-cell">STATUT</th>
              <th className="px-4 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className={`transition-opacity ${loading ? 'opacity-50' : ''}`}>
            {firstLoad && <SkeletonRows cols={7} />}
            {produits.map((p) => (
              <tr key={p.id} className="border-t border-slate-100 hover:bg-slate-50/70">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Vignette produit={p} />
                    <div className="min-w-0">
                      <p className="font-medium text-slate-800">{p.nom}</p>
                      <p className="text-xs text-slate-500 md:hidden">
                        {[categorieNom(p.categorieId), p.taille].filter(Boolean).join(' · ') || '—'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  {categorieNom(p.categorieId) ?? <span className="text-slate-400">Sans sport</span>}
                </td>
                <td className="hidden px-4 py-3 md:table-cell">{p.taille || <span className="text-slate-400">—</span>}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right font-medium text-slate-800">{formatPrix(p.prix)}</td>
                <td className="px-4 py-3">
                  <StockCell key={`${p.id}-${p.stock}`} produit={p} onUpdated={refresh} />
                </td>
                <td className="hidden px-4 py-3 sm:table-cell">
                  <StockBadge stock={p.stock} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1 text-slate-500">
                    <button onClick={() => setModal({ produit: p })} aria-label={`Modifier ${p.nom}`} title="Modifier" className="rounded p-1.5 hover:bg-slate-100 hover:text-brand">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p)} aria-label={`Supprimer ${p.nom}`} title="Supprimer" className="rounded p-1.5 hover:bg-red-50 hover:text-red-600">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!loading && error && <ErrorState text={error} onRetry={refresh} />}
        {!loading && !error && produits.length === 0 && (
          hasFilters ? (
            <EmptyState
              icon={Package}
              title="Aucun ballon ne correspond"
              text="Essayez un autre sport ou une autre recherche."
              action={<button onClick={resetFilters} className={secondaryButton}>Réinitialiser les filtres</button>}
            />
          ) : (
            <EmptyState
              icon={Package}
              title="Le catalogue est vide"
              text="Ajoutez votre premier ballon pour commencer à vendre."
              action={<button onClick={() => setModal({ produit: null })} className={primaryButton}><Plus size={16} />AJOUTER UN BALLON</button>}
            />
          )
        )}
      </div>

      <Pagination pagination={pagination} onPage={setPage} />

      {categorieModal && (
        <Modal title="AJOUTER UN SPORT" onClose={() => setCategorieModal(false)}>
          <CategorieForm onSaved={handleCategorieSaved} onCancel={() => setCategorieModal(false)} />
        </Modal>
      )}

      {modal && (
        <Modal title={modal.produit ? 'MODIFIER LE BALLON' : 'AJOUTER UN BALLON'} onClose={() => setModal(null)}>
          <ProduitForm produit={modal.produit} categories={categories} onSaved={handleSaved} onCancel={() => setModal(null)} />
        </Modal>
      )}
    </div>
  )
}
