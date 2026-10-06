import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { deletePack, getPacks } from '../api/packsApi'
import { getErrorMessage } from '../api/errors'
import { formatPrix } from '../utils/format'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import PackForm from '../components/PackForm'

// The API stores the pack price when it is saved. If a product price changed
// since then, the stored price no longer matches the current total.
function isPriceStale(pack) {
  const current = pack.produits.reduce((sum, l) => sum + l.produit.prix * l.quantite, 0)
  return Math.abs(current - pack.prixPack) > 0.005
}

function PackCard({ pack, onEdit, onDelete }) {
  return (
    <div className="flex flex-col rounded-lg bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg text-sidebar">{pack.nom}</h3>
        <span className="font-display text-lg text-brand">{formatPrix(pack.prixPack)}</span>
      </div>

      {pack.description && <p className="mt-1 text-sm text-slate-500">{pack.description}</p>}

      <ul className="mt-3 flex-1 space-y-1 text-sm">
        {pack.produits.map((l) => (
          <li key={l.produitId} className="flex justify-between gap-3">
            <span className="truncate text-slate-700">
              {l.quantite} × {l.produit.nom}
            </span>
            <span className="text-slate-500">{formatPrix(l.produit.prix * l.quantite)}</span>
          </li>
        ))}
      </ul>

      {isPriceStale(pack) && (
        <p className="mt-3 rounded bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Un produit a changé de prix. Modifiez puis enregistrez le pack pour recalculer son prix.
        </p>
      )}

      <div className="mt-4 flex justify-end gap-3 border-t border-slate-100 pt-3 text-slate-500">
        <button onClick={() => onEdit(pack)} aria-label="Modifier" className="hover:text-brand">
          <Pencil size={16} />
        </button>
        <button onClick={() => onDelete(pack)} aria-label="Supprimer" className="hover:text-brand">
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function Packs() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [reload, setReload] = useState(0)
  const [modal, setModal] = useState(null) // null | { pack: object | null }
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
  const [result, setResult] = useState({ key: '', packs: [], pagination: null, error: '' })

  const { packs, pagination, error } = result

  const key = JSON.stringify({ page, search, reload })
  const loading = result.key !== key

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

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function handleSaved() {
    setModal(null)
    setNotice({ type: 'success', text: 'Pack enregistré.' })
    refresh()
  }

  async function handleDelete(pack) {
    if (!window.confirm(`Supprimer le pack « ${pack.nom} » ?`)) return
    try {
      await deletePack(pack.id)
      if (packs.length === 1 && page > 1) setPage(page - 1)
      setNotice({ type: 'success', text: 'Pack supprimé.' })
      refresh()
    } catch (err) {
      setNotice({ type: 'error', text: getErrorMessage(err) })
    }
  }

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-display text-xs tracking-wider text-brand-dark">GESTION DU CATALOGUE</p>
          <h1 className="font-display text-2xl text-sidebar">PACKS</h1>
        </div>
        <button
          onClick={() => setModal({ pack: null })}
          className="flex items-center gap-2 rounded bg-brand px-4 py-2 font-display text-sm tracking-wider text-white hover:bg-brand-dark"
        >
          <Plus size={16} />
          NOUVEAU PACK
        </button>
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

      <form onSubmit={handleSearch} className="mb-4 flex w-fit items-center rounded border border-slate-300 bg-white">
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder="Rechercher un pack…"
          className="w-64 px-3 py-2 text-sm outline-none"
        />
        <button type="submit" aria-label="Rechercher" className="px-3 text-slate-500 hover:text-brand">
          <Search size={16} />
        </button>
      </form>

      <div className={`grid gap-4 sm:grid-cols-2 xl:grid-cols-3 ${loading ? 'opacity-50' : ''}`}>
        {packs.map((p) => (
          <PackCard key={p.id} pack={p} onEdit={(pack) => setModal({ pack })} onDelete={handleDelete} />
        ))}
      </div>

      {!loading && packs.length === 0 && (
        <p className="rounded-lg bg-white px-4 py-8 text-center text-slate-500 shadow-sm">
          {error || 'Aucun pack trouvé.'}
        </p>
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
