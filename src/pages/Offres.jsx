import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, Trash2 } from 'lucide-react'
import { deleteOffre, getOffres } from '../api/offresApi'
import { getErrorMessage } from '../api/errors'
import { formatDateHeure, statutOffre } from '../utils/format'
import Modal from '../components/Modal'
import Pagination from '../components/Pagination'
import OffreForm from '../components/OffreForm'

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

export default function Offres() {
  const [page, setPage] = useState(1)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [filtre, setFiltre] = useState('')
  const [reload, setReload] = useState(0)
  const [modal, setModal] = useState(null) // null | { offre: object | null }
  const [notice, setNotice] = useState(null) // { type: 'success' | 'error', text }
  const [result, setResult] = useState({ key: '', offres: [], pagination: null, error: '' })

  const { offres, pagination, error } = result

  const key = JSON.stringify({ page, search, filtre, reload })
  const loading = result.key !== key

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

  function handleSearch(e) {
    e.preventDefault()
    setPage(1)
    setSearch(searchInput.trim())
  }

  function handleFiltre(e) {
    setPage(1)
    setFiltre(e.target.value)
  }

  function handleSaved() {
    setModal(null)
    setNotice({ type: 'success', text: 'Offre enregistrée.' })
    refresh()
  }

  async function handleDelete(offre) {
    if (!window.confirm(`Supprimer l’offre « ${offre.titre} » ?`)) return
    try {
      await deleteOffre(offre.id)
      if (offres.length === 1 && page > 1) setPage(page - 1)
      setNotice({ type: 'success', text: 'Offre supprimée.' })
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
          <h1 className="font-display text-2xl text-sidebar">OFFRES</h1>
        </div>
        <button
          onClick={() => setModal({ offre: null })}
          className="flex items-center gap-2 rounded bg-brand px-4 py-2 font-display text-sm tracking-wider text-white hover:bg-brand-dark"
        >
          <Plus size={16} />
          NOUVELLE OFFRE
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

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <form onSubmit={handleSearch} className="flex w-fit items-center rounded border border-slate-300 bg-white">
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Rechercher une offre…"
            className="w-64 px-3 py-2 text-sm outline-none"
          />
          <button type="submit" aria-label="Rechercher" className="px-3 text-slate-500 hover:text-brand">
            <Search size={16} />
          </button>
        </form>

        <select
          value={filtre}
          onChange={handleFiltre}
          aria-label="Filtrer par statut"
          className="rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand"
        >
          {FILTRES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className={`overflow-x-auto rounded-lg bg-white shadow-sm ${loading ? 'opacity-50' : ''}`}>
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-4 py-3">Offre</th>
              <th className="px-4 py-3">Réduction</th>
              <th className="px-4 py-3">Début</th>
              <th className="px-4 py-3">Fin</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {offres.map((o) => {
              const statut = STATUTS[statutOffre(o)]
              return (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-medium text-slate-800">{o.titre}</td>
                  <td className="px-4 py-3 font-display text-lg text-brand">−{o.pourcentageReduction} %</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateHeure(o.dateDebut)}</td>
                  <td className="px-4 py-3 text-slate-600">{formatDateHeure(o.dateFin)}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${statut.className}`}>{statut.label}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-3 text-slate-500">
                      <button onClick={() => setModal({ offre: o })} aria-label="Modifier" className="hover:text-brand">
                        <Pencil size={16} />
                      </button>
                      <button onClick={() => handleDelete(o)} aria-label="Supprimer" className="hover:text-brand">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {!loading && offres.length === 0 && (
          <p className="px-4 py-8 text-center text-slate-500">{error || 'Aucune offre trouvée.'}</p>
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
