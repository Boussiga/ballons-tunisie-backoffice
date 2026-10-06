import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { deleteProduit, getProduits, updateStock } from '../api/produitsApi'
import { getCategories } from '../api/categoriesApi'
import { getErrorMessage } from '../api/errors'
import { formatPrix, imageSrc } from '../utils/format'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import ProduitForm from '../components/ProduitForm'
import CategorieForm from '../components/CategorieForm'

function StockBadge({ stock }) {
  if (stock === 0) {
    return <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs text-red-700">Rupture</span>
  }
  if (stock < 5) {
    return <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs text-amber-700">Stock faible</span>
  }
  return <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">En stock</span>
}

// Quick stock edit straight in the table (PATCH /updateStock)
function StockCell({ produit, onUpdated, onError }) {
  const [value, setValue] = useState(String(produit.stock))

  async function save() {
    const stock = Number(value)
    if (value === '' || !Number.isInteger(stock) || stock < 0) {
      setValue(String(produit.stock))
      return
    }
    if (stock === produit.stock) return
    try {
      await updateStock(produit.id, stock)
      onUpdated()
    } catch (err) {
      onError(getErrorMessage(err))
      setValue(String(produit.stock))
    }
  }

  return (
    <input
      type="number"
      min="0"
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
      className="w-20 rounded border border-slate-300 px-2 py-1 text-sm"
    />
  )
}

export default function Produits() {
  const [categories, setCategories] = useState([])
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState('all') // 'all' | 'low' | a category id
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [catReload, setCatReload] = useState(0)
  const [categorieModal, setCategorieModal] = useState(false)
  const [modal, setModal] = useState(null) // null | { produit: object | null }
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
  const [result, setResult] = useState({ key: '', produits: [], pagination: null, error: '' })

  const { produits, pagination, error } = result

  // "loading" = what is on screen does not match the current filters yet
  const key = JSON.stringify({ page, search, filter, reload })
  const loading = result.key !== key

  useEffect(() => {
    getCategories()
      .then(setCategories)
      .catch((err) => setNotice({ type: 'error', text: getErrorMessage(err, 'Impossible de charger les sports.') }))
  }, [catReload])

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

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function handleCategorieSaved() {
    setCategorieModal(false)
    setNotice({ type: 'success', text: 'Sport ajouté.' })
    setCatReload((n) => n + 1)
  }

  function handleSaved(warning) {
    setModal(null)
    setNotice(warning ? { type: 'error', text: warning } : { type: 'success', text: 'Produit enregistré.' })
    refresh()
  }

  async function handleDelete(p) {
    if (!window.confirm(`Supprimer « ${p.nom} » ?`)) return
    try {
      await deleteProduit(p.id)
      if (produits.length === 1 && page > 1) setPage(page - 1)
      setNotice({ type: 'success', text: 'Produit supprimé.' })
      refresh()
    } catch (err) {
      setNotice({
        type: 'error',
        text:
          err.response?.status === 500
            ? 'Suppression impossible : ce produit est peut-être lié à des commandes.'
            : getErrorMessage(err),
      })
    }
  }

  const categorieNom = (id) => categories.find((c) => c.id === id)?.nom ?? '—'

  const tabs = [
    { value: 'all', label: 'Tous les sports' },
    ...categories.map((c) => ({ value: c.id, label: c.nom })),
    { value: 'low', label: 'Stock faible' },
  ]

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs tracking-wider text-brand-dark">GESTION DU CATALOGUE</p>
          <h1 className="font-display text-2xl text-sidebar">STOCKS &amp; PRODUITS</h1>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setCategorieModal(true)}
            className="flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 font-display text-sm tracking-wider text-slate-700 hover:bg-slate-50"
          >
            <Plus size={16} />
            SPORT
          </button>
          <button
            onClick={() => setModal({ produit: null })}
            className="flex items-center gap-2 rounded bg-brand px-4 py-2 font-display text-sm tracking-wider text-white hover:bg-brand-dark"
          >
            <Plus size={16} />
            AJOUTER UN BALLON
          </button>
        </div>
      </div>

      {notice && (
        <div
          className={`mb-4 flex items-center justify-between rounded px-4 py-2 text-sm ${
            notice.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          <span>{notice.text}</span>
          <button onClick={() => setNotice(null)} className="ml-4 text-xs underline">
            Fermer
          </button>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((t) => (
            <button
              key={t.value}
              onClick={() => changeFilter(t.value)}
              className={`rounded px-3 py-1.5 font-display text-xs uppercase tracking-wider ${
                filter === t.value ? 'bg-sidebar text-white' : 'bg-white text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSearch} className="flex items-center rounded border border-slate-300 bg-white">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher un ballon…"
            className="w-56 px-3 py-2 text-sm outline-none"
          />
          <button type="submit" aria-label="Rechercher" className="px-3 text-slate-500 hover:text-brand">
            <Search size={16} />
          </button>
        </form>
      </div>

      <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 font-display text-xs tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">BALLON</th>
              <th className="px-4 py-3">SPORT</th>
              <th className="px-4 py-3">TAILLE</th>
              <th className="px-4 py-3">PRIX</th>
              <th className="px-4 py-3">STOCK</th>
              <th className="px-4 py-3">STATUT</th>
              <th className="px-4 py-3 text-right">ACTIONS</th>
            </tr>
          </thead>
          <tbody className={loading ? 'opacity-50' : ''}>
            {produits.map((p) => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {p.imageUrl ? (
                      <img src={imageSrc(p.imageUrl)} alt={p.nom} className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-slate-200" />
                    )}
                    <span className="font-medium text-slate-800">{p.nom}</span>
                  </div>
                </td>
                <td className="px-4 py-3">{categorieNom(p.categorieId)}</td>
                <td className="px-4 py-3">{p.taille || '—'}</td>
                <td className="px-4 py-3">{formatPrix(p.prix)}</td>
                <td className="px-4 py-3">
                  <StockCell
                    key={`${p.id}-${p.stock}`}
                    produit={p}
                    onUpdated={refresh}
                    onError={(text) => setNotice({ type: 'error', text })}
                  />
                </td>
                <td className="px-4 py-3">
                  <StockBadge stock={p.stock} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-3 text-slate-500">
                    <button onClick={() => setModal({ produit: p })} aria-label="Modifier" className="hover:text-brand">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleDelete(p)} aria-label="Supprimer" className="hover:text-brand">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && produits.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                  {error || 'Aucun produit trouvé.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Pagination pagination={pagination} onPage={setPage} />

      {categorieModal && (
        <Modal title="AJOUTER UN SPORT" onClose={() => setCategorieModal(false)}>
          <CategorieForm onSaved={handleCategorieSaved} onCancel={() => setCategorieModal(false)} />
        </Modal>
      )}

      {modal && (
        <Modal title={modal.produit ? 'MODIFIER LE BALLON' : 'AJOUTER UN BALLON'} onClose={() => setModal(null)}>
          <ProduitForm
            produit={modal.produit}
            categories={categories}
            onSaved={handleSaved}
            onCancel={() => setModal(null)}
          />
        </Modal>
      )}
    </div>
  )
}
