import { useEffect, useState } from 'react'
import { Check, MapPin, Phone } from 'lucide-react'
import { annulerCommande, getCommande, recalculerTotal, updateStatut } from '../api/commandesApi'
import { getErrorMessage } from '../api/errors'
import { formatDateHeure, formatPrix } from '../utils/format'
import { STATUTS, STATUT_SUIVANT, libelleLigne, peutAnnuler, prixUnitaire, totalLigne } from '../utils/commandes'
import { useConfirm, useToast } from '../context/FeedbackContext'
import { Badge, Skeleton, primaryButton, secondaryButton } from './ui'

const ETAPES = ['en_attente', 'confirmee', 'livree']

// en attente → confirmée → livrée (a cancelled order shows where it stopped)
function Avancement({ statut }) {
  if (statut === 'annulee') return null
  const actuelle = ETAPES.indexOf(statut)
  return (
    <ol className="flex items-center">
      {ETAPES.map((e, i) => {
        const fait = i <= actuelle
        return (
          <li key={e} className={`flex items-center ${i < ETAPES.length - 1 ? 'flex-1' : ''}`}>
            <span className="flex items-center gap-2">
              <span
                className={`flex size-6 items-center justify-center rounded-full text-xs ${
                  fait ? 'bg-brand text-white' : 'border-2 border-slate-300 text-slate-400'
                }`}
              >
                {i < actuelle ? <Check size={14} /> : i + 1}
              </span>
              <span className={`text-xs ${fait ? 'font-medium text-slate-800' : 'text-slate-500'}`}>{STATUTS[e].label}</span>
            </span>
            {i < ETAPES.length - 1 && <span className={`mx-3 h-0.5 flex-1 ${i < actuelle ? 'bg-brand' : 'bg-slate-200'}`} />}
          </li>
        )
      })}
    </ol>
  )
}

export default function CommandeDetail({ id, onChanged, onClose }) {
  const [reload, setReload] = useState(0)
  const [result, setResult] = useState({ key: '', commande: null, error: '' })
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const confirm = useConfirm()

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
    try {
      await action()
      toast.success(successText)
      setReload((n) => n + 1) // reload this order
      onChanged() // and the list behind the modal
    } catch (err) {
      toast.error(getErrorMessage(err))
    } finally {
      setBusy(false)
    }
  }

  const { commande, error } = result

  if (!commande) {
    if (!loading) return <p className="py-6 text-center text-red-700">{error}</p>
    return (
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    )
  }

  const statut = STATUTS[commande.statut]
  const suivant = STATUT_SUIVANT[commande.statut]

  async function handleAnnuler() {
    const ok = await confirm({
      title: 'Annuler cette commande ?',
      message: `La commande de ${commande.nomClient} (${formatPrix(commande.total)}) sera annulée. Cette action est définitive.`,
      confirmLabel: 'ANNULER LA COMMANDE',
      cancelLabel: 'Retour',
      danger: true,
    })
    if (!ok) return
    run(() => annulerCommande(commande.id), 'Commande annulée.')
  }

  return (
    <div className={`space-y-5 ${loading ? 'opacity-60' : ''}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Badge className={statut.className}>{statut.label}</Badge>
        <span className="text-sm text-slate-500">Passée le {formatDateHeure(commande.dateCommande)}</span>
      </div>

      <Avancement statut={commande.statut} />

      <div className="rounded border border-slate-200 p-4 text-sm">
        <p className="text-xs uppercase tracking-wider text-slate-500">Client</p>
        <p className="mt-1 font-medium text-slate-800">{commande.nomClient}</p>
        <a href={`tel:${commande.telephoneClient}`} className="mt-1 inline-flex items-center gap-1.5 text-slate-600 hover:text-brand">
          <Phone size={14} />
          {commande.telephoneClient}
        </a>
        <p className="mt-1 flex items-start gap-1.5 text-slate-600">
          <MapPin size={14} className="mt-0.5 shrink-0" />
          {commande.adresseLivraison}
        </p>
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
            className={`${primaryButton} px-5`}
          >
            {suivant.label.toUpperCase()}
          </button>
        )}
        <button type="button" onClick={onClose} className={secondaryButton}>
          Fermer
        </button>
      </div>
    </div>
  )
}
