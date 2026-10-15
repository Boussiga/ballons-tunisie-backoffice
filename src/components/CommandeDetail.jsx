import { useEffect, useState } from 'react'
import { annulerCommande, getCommande, recalculerTotal, updateStatut } from '../api/commandesApi'
import { getErrorMessage } from '../api/errors'
import { formatDateHeure, formatPrix } from '../utils/format'
import { STATUTS, STATUT_SUIVANT, libelleLigne, peutAnnuler, prixUnitaire, totalLigne } from '../utils/commandes'

export default function CommandeDetail({ id, onChanged, onClose }) {
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: '', commande: null, error: '' })
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }

  const key = `${id}:${reload}`
  const loading = result.key !== key

  useEffect(() => {
    let ignore = false
    getCommande(id)
      .then((commande) => {
        if (!ignore) setResult({ key, commande, error: '' })
      })
      .catch((err) => {
        if (!ignore) setResult({ key, commande: null, error: getErrorMessage(err, 'Impossible de charger la commande.') })
      })
    return () => {
      ignore = true
    }
  }, [id, key])

  async function run(action, successText) {
    setBusy(true)
    setMessage(null)
    try {
      await action()
      setMessage({ type: 'success', text: successText })
      setReload((n) => n + 1) // reload this order
      onChanged() // and the list behind the modal
    } catch (err) {
      setMessage({ type: 'error', text: getErrorMessage(err) })
    } finally {
      setBusy(false)
    }
  }

  const { commande, error } = result

  if (!commande) {
    return <p className="py-6 text-center text-slate-500">{loading ? 'Chargement…' : error}</p>
  }

  const statut = STATUTS[commande.statut]
  const suivant = STATUT_SUIVANT[commande.statut]

  function handleAnnuler() {
    if (!window.confirm('Annuler cette commande ? Cette action est définitive.')) return
    run(() => annulerCommande(commande.id), 'Commande annulée.')
  }

  return (
    <div className={`space-y-5 ${loading ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statut.className}`}>{statut.label}</span>
        <span className="text-sm text-slate-500">Passée le {formatDateHeure(commande.dateCommande)}</span>
      </div>

      <div className="rounded border border-slate-200 p-4 text-sm">
        <p className="text-xs uppercase tracking-wider text-slate-500">Client</p>
        <p className="mt-1 font-medium text-slate-800">{commande.nomClient}</p>
        <p className="text-slate-600">{commande.telephoneClient}</p>
        <p className="mt-2 text-slate-600">{commande.adresseLivraison}</p>
        <p className="mt-3 break-all text-xs text-slate-400">N° de commande : {commande.id}</p>
      </div>

      <div className="overflow-x-auto rounded border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-3 py-2">Article</th>
              <th className="px-3 py-2 text-right">Prix unit.</th>
              <th className="px-3 py-2 text-right">Qté</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {commande.lignes.map((l) => (
              <tr key={l.id}>
                <td className="px-3 py-2">
                  <span className="text-slate-800">{libelleLigne(l)}</span>
                  {l.offre && (
                    <span className="mt-0.5 block text-xs text-green-700">
                      {l.offre.titre} (−{l.offre.pourcentageReduction} %)
                    </span>
                  )}
                </td>
                <td className="px-3 py-2 text-right">
                  {l.offre && <span className="mr-2 text-xs text-slate-400 line-through">{formatPrix(l.prixInitiale)}</span>}
                  {formatPrix(prixUnitaire(l))}
                </td>
                <td className="px-3 py-2 text-right">{l.quantite}</td>
                <td className="px-3 py-2 text-right font-medium">{formatPrix(totalLigne(l))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <button
          type="button"
          disabled={busy}
          onClick={() => run(() => recalculerTotal(commande.id), 'Total recalculé.')}
          className="text-xs text-slate-500 underline hover:text-brand disabled:opacity-50"
        >
          Recalculer le total
        </button>
        <p className="text-sm text-slate-600">
          Total : <span className="font-display text-2xl text-brand">{formatPrix(commande.total)}</span>
        </p>
      </div>

      {message && (
        <p
          className={`rounded px-3 py-2 text-sm ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {message.text}
        </p>
      )}

      <div className="flex flex-wrap justify-end gap-3 border-t border-slate-100 pt-4">
        {peutAnnuler(commande.statut) && (
          <button
            type="button"
            disabled={busy}
            onClick={handleAnnuler}
            className="rounded border border-red-300 px-4 py-2 text-sm text-red-700 hover:bg-red-50 disabled:opacity-50"
          >
            Annuler la commande
          </button>
        )}
        {suivant && (
          <button
            type="button"
            disabled={busy}
            onClick={() => run(() => updateStatut(commande.id, suivant.statut), 'Statut mis à jour.')}
            className="rounded bg-brand px-5 py-2 font-display tracking-wider text-white hover:bg-brand-dark disabled:opacity-60"
          >
            {suivant.label.toUpperCase()}
          </button>
        )}
        <button type="button" onClick={onClose} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Fermer
        </button>
      </div>
    </div>
  )
}
