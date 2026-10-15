import { useEffect, useState } from 'react'
import { AlertTriangle, Info, OctagonAlert, TrendingDown, TrendingUp } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getStatistiques } from '../api/dashboardApi'
import { getErrorMessage } from '../api/errors'
import { formatPrix } from '../utils/format'
import { STATUTS } from '../utils/commandes'
import { BarList, ColumnChart, StackedBar } from '../components/DashboardCharts'
import { PageHeader, Skeleton, fieldClass } from '../components/ui'


// Same hues as the status badges of the orders page
const COULEURS_STATUT = { en_attente: '#f59e0b', confirmee: '#3b82f6', livree: '#16a34a', annulee: '#ef4444' }

const PRESETS = [
  { jours: 7, label: '7 jours' },
  { jours: 30, label: '30 jours' },
  { jours: 90, label: '90 jours' },
  { jours: 365, label: '12 mois' },
]

const METRIQUES = {
  chiffreAffaires: { label: 'Chiffre d’affaires', format: formatPrix },
  commandes: { label: 'Commandes', format: (v) => `${v} commande(s)` },
  panierMoyen: { label: 'Panier moyen', format: formatPrix },
}

const ALERTES = {
  danger: { icon: OctagonAlert, className: 'border-red-200 bg-red-50 text-red-800' },
  warning: { icon: AlertTriangle, className: 'border-amber-200 bg-amber-50 text-amber-800' },
  info: { icon: Info, className: 'border-blue-200 bg-blue-50 text-blue-800' },
}

// ── Dates ────────────────────────────────────────────────────────────────────
const pad = (n) => String(n).padStart(2, '0')
const jourLocal = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const parseJour = (s) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d || 1)
}
const formatJour = (s, opts = { day: 'numeric', month: 'short' }) => parseJour(s).toLocaleDateString('fr-FR', opts)
const DATE_LONGUE = { day: 'numeric', month: 'short', year: 'numeric' }

function periodeDepuis(jours) {
  const fin = new Date()
  const debut = new Date(fin.getFullYear(), fin.getMonth(), fin.getDate() - jours + 1)
  return { du: jourLocal(debut), au: jourLocal(fin) }
}

// x-axis label of a time bucket ('AAAA-MM-JJ' or 'AAAA-MM' for months)
function libellePeriode(cle, granularite) {
  if (granularite === 'mois') return formatJour(cle, { month: 'long', year: 'numeric' })
  if (granularite === 'semaine') return `Semaine du ${formatJour(cle)}`
  return formatJour(cle, { weekday: 'short', day: 'numeric', month: 'short' })
}
const libelleCourt = (cle, granularite) =>
  granularite === 'mois' ? formatJour(cle, { month: 'short' }) : formatJour(cle, { day: '2-digit', month: '2-digit' })

const nombre = (v) => v.toLocaleString('fr-FR')
const pourcent = (v) => `${v.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %`

// ── Small building blocks ────────────────────────────────────────────────────
function Carte({ titre, action, children, className = '' }) {
  return (
    <section className={`rounded-lg bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-sm tracking-wider text-sidebar">{titre}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}

// Variation vs the previous period; `inverse` when a rise is bad news (cancellations)
function Evolution({ valeur, inverse = false }) {
  if (valeur === null) return <span className="text-xs text-slate-500">nouveau</span>
  if (valeur === 0) return <span className="text-xs text-slate-500">= stable</span>
  const hausse = valeur > 0
  const bon = hausse !== inverse
  const Icon = hausse ? TrendingUp : TrendingDown
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-medium ${bon ? 'text-green-700' : 'text-red-700'}`}>
      <Icon size={14} />
      {hausse ? '+' : ''}
      {pourcent(valeur)}
    </span>
  )
}

function Kpi({ label, valeur, comparaison, inverse, format }) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 font-display text-2xl text-sidebar">{valeur}</p>
      {comparaison && (
        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          <Evolution valeur={comparaison.evolution} inverse={inverse} />
          <span>vs {format(comparaison.precedent)}</span>
        </p>
      )}
    </div>
  )
}

function Chiffre({ label, valeur }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="font-display text-lg text-sidebar">{valeur}</p>
    </div>
  )
}

function Bascule({ options, valeur, onChange }) {
  return (
    <div className="flex rounded border border-slate-300 text-xs">
      {options.map(([v, label]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          className={`px-2.5 py-1 ${valeur === v ? 'bg-sidebar text-white' : 'text-slate-600 hover:bg-slate-50'}`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { admin } = useAuth()
  const [periode, setPeriode] = useState(() => periodeDepuis(30))
  const [granularite, setGranularite] = useState('') // '' = chosen by the API from the period length
  const [metrique, setMetrique] = useState('chiffreAffaires')
  const [triProduits, setTriProduits] = useState('chiffreAffaires')
  const [result, setResult] = useState({ key: '', stats: null, error: '' })

  const { du, au } = periode
  const key = JSON.stringify({ du, au, granularite })
  const loading = result.key !== key
  const { stats, error } = result

  useEffect(() => {
    let ignore = false
    getStatistiques({ dateDebut: du, dateFin: au, granularite })
      .then((data) => {
        if (!ignore) setResult({ key, stats: data, error: '' })
      })
      .catch((err) => {
        if (!ignore) setResult((r) => ({ key, stats: r.stats, error: getErrorMessage(err, 'Impossible de charger les statistiques.') }))
      })
    return () => {
      ignore = true
    }
  }, [key, du, au, granularite])

  const presetActif = PRESETS.find((p) => {
    const ref = periodeDepuis(p.jours)
    return ref.du === du && ref.au === au
  })

  return (
    <div>
      <PageHeader kicker={`BIENVENUE ${admin.nom.toUpperCase()}`} title="TABLEAU DE BORD" />

      {/* Filters: one row above everything */}
      <div className="mb-2 flex flex-wrap items-end gap-3">
        <Bascule
          options={PRESETS.map((p) => [p.jours, p.label])}
          valeur={presetActif?.jours}
          onChange={(jours) => setPeriode(periodeDepuis(jours))}
        />
        <label className="text-xs text-slate-500">
          Du
          <input
            type="date"
            required
            value={du}
            max={au}
            onChange={(e) => e.target.value && setPeriode({ du: e.target.value, au })}
            className={`${fieldClass} ml-2`}
          />
        </label>
        <label className="text-xs text-slate-500">
          Au
          <input
            type="date"
            required
            value={au}
            min={du}
            onChange={(e) => e.target.value && setPeriode({ du, au: e.target.value })}
            className={`${fieldClass} ml-2`}
          />
        </label>
        <select value={granularite} onChange={(e) => setGranularite(e.target.value)} aria-label="Granularité" className={fieldClass}>
          <option value="">Regroupement auto</option>
          <option value="jour">Par jour</option>
          <option value="semaine">Par semaine</option>
          <option value="mois">Par mois</option>
        </select>
      </div>
      {stats && (
        <p className="mb-6 text-xs text-slate-500">
          {stats.periode.nbJours} jours, comparés à la période précédente (du {formatJour(stats.periode.periodePrecedente.dateDebut, DATE_LONGUE)} au{' '}
          {formatJour(stats.periode.periodePrecedente.dateFin, DATE_LONGUE)}).
        </p>
      )}

      {error && <p className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {!stats && !error && (
        <div className="space-y-6" aria-label="Chargement des statistiques">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            {Array.from({ length: 6 }, (_, i) => (
              <div key={i} className="space-y-2 rounded-lg bg-white p-4 shadow-sm">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-7 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            ))}
          </div>
          <Skeleton className="h-72 w-full rounded-lg" />
        </div>
      )}

      {stats && <Contenu stats={stats} loading={loading} metrique={metrique} setMetrique={setMetrique} triProduits={triProduits} setTriProduits={setTriProduits} />}
    </div>
  )
}

function Contenu({ stats, loading, metrique, setMetrique, triProduits, setTriProduits }) {
  const { resume, comparaison, periode } = stats
  const m = METRIQUES[metrique]

  const serie = stats.evolution.map((p) => ({
    label: libellePeriode(p.periode, periode.granularite),
    short: libelleCourt(p.periode, periode.granularite),
    value: p[metrique],
    details: [
      ...(metrique !== 'commandes' ? [['Commandes', nombre(p.commandes)]] : []),
      ['Articles vendus', nombre(p.articlesVendus)],
      ...(p.commandesAnnulees ? [['Annulées', nombre(p.commandesAnnulees)]] : []),
    ],
  }))

  const produits = triProduits === 'quantite' ? stats.produits.topParQuantite : stats.produits.topParChiffreAffaires

  return (
    <div className={`space-y-6 ${loading ? 'opacity-50' : ''}`}>
      {stats.alertes.length > 0 && (
        <ul className="space-y-2">
          {stats.alertes.map((a) => {
            const { icon: Icon, className } = ALERTES[a.niveau] ?? ALERTES.info
            return (
              <li key={a.message} className={`flex items-center gap-2 rounded border px-4 py-2.5 text-sm ${className}`}>
                <Icon size={16} className="shrink-0" />
                {a.message}
              </li>
            )
          })}
        </ul>
      )}

      {/* Headline numbers */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Chiffre d’affaires" valeur={formatPrix(resume.chiffreAffaires)} comparaison={comparaison.chiffreAffaires} format={formatPrix} />
        <Kpi label="Commandes" valeur={nombre(resume.commandesValides)} comparaison={comparaison.commandes} format={nombre} />
        <Kpi label="Panier moyen" valeur={formatPrix(resume.panierMoyen)} comparaison={comparaison.panierMoyen} format={formatPrix} />
        <Kpi label="Articles vendus" valeur={nombre(resume.articlesVendus)} comparaison={comparaison.articlesVendus} format={nombre} />
        <Kpi label="Clients" valeur={nombre(resume.clientsUniques)} comparaison={comparaison.clients} format={nombre} />
        <Kpi label="Annulations" valeur={nombre(resume.commandesAnnulees)} comparaison={comparaison.commandesAnnulees} format={nombre} inverse />
      </div>

      <Carte
        titre="ÉVOLUTION"
        action={
          <Bascule options={Object.entries(METRIQUES).map(([k, v]) => [k, v.label])} valeur={metrique} onChange={setMetrique} />
        }
      >
        <p className="mb-4 text-sm text-slate-500">
          {m.label} par {periode.granularite} · moyenne de {formatPrix(resume.caMoyenParJour)} de CA par jour
        </p>
        <ColumnChart data={serie} format={m.format} />
      </Carte>

      <div className="grid gap-6 lg:grid-cols-2">
        <Carte titre="COMMANDES PAR STATUT">
          <StackedBar
            format={nombre}
            segments={Object.entries(stats.commandesParStatut).map(([statut, s]) => ({
              key: statut,
              label: STATUTS[statut]?.label ?? statut,
              value: s.nombre,
              color: COULEURS_STATUT[statut] ?? '#94a3b8',
            }))}
          />
          <div className="mt-5 grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
            <Chiffre label="Encaissé (livré)" valeur={formatPrix(resume.chiffreAffairesEncaisse)} />
            <Chiffre label="En cours" valeur={formatPrix(resume.chiffreAffairesEnCours)} />
            <Chiffre label="Perdu (annulé)" valeur={formatPrix(resume.chiffreAffairesPerdu)} />
          </div>
          <div className="mt-3 grid grid-cols-3 gap-3">
            <Chiffre label="Taux de livraison" valeur={pourcent(resume.tauxLivraison)} />
            <Chiffre label="Taux d’annulation" valeur={pourcent(resume.tauxAnnulation)} />
            <Chiffre label="Articles / commande" valeur={nombre(resume.articlesParCommande)} />
          </div>
        </Carte>

        <Carte titre="VENTES PAR CATÉGORIE">
          <BarList
            format={formatPrix}
            items={stats.categories.map((c) => ({
              key: `${c.nom}-${c.id}`,
              label: c.nom,
              value: c.chiffreAffaires,
              sub: pourcent(c.part),
            }))}
          />
        </Carte>

        <Carte
          titre="TOP PRODUITS"
          action={
            <Bascule
              options={[['chiffreAffaires', 'CA'], ['quantite', 'Quantité']]}
              valeur={triProduits}
              onChange={setTriProduits}
            />
          }
        >
          <BarList
            format={triProduits === 'quantite' ? (v) => `${nombre(v)} vendu(s)` : formatPrix}
            items={produits.map((p) => ({
              key: p.id,
              label: p.nom,
              value: p[triProduits],
              sub: triProduits === 'quantite' ? formatPrix(p.chiffreAffaires) : `${nombre(p.quantite)} vendu(s)`,
            }))}
          />
        </Carte>

        <Carte titre="VENTES PAR GOUVERNORAT">
          <BarList
            format={formatPrix}
            items={stats.regions.map((r) => ({
              key: r.gouvernorat,
              label: r.gouvernorat,
              value: r.chiffreAffaires,
              sub: `${nombre(r.commandes)} cmd · ${pourcent(r.part)}`,
            }))}
          />
        </Carte>

        <Carte titre="PACKS">
          <BarList
            format={formatPrix}
            vide="Aucun pack vendu sur la période."
            items={stats.packs.map((p) => ({ key: p.id, label: p.nom, value: p.chiffreAffaires, sub: `${nombre(p.quantite)} vendu(s)` }))}
          />
        </Carte>

        <Carte titre="OFFRES">
          <div className="mb-4 grid grid-cols-3 gap-3">
            <Chiffre label="Commandes avec offre" valeur={nombre(stats.offres.commandesAvecOffre)} />
            <Chiffre label="Part des commandes" valeur={pourcent(stats.offres.partCommandesAvecOffre)} />
            <Chiffre label="Remises accordées" valeur={formatPrix(stats.offres.remisesAccordees)} />
          </div>
          <BarList
            format={formatPrix}
            vide="Aucune offre utilisée sur la période."
            items={stats.offres.details.map((o) => ({
              key: o.id,
              label: `${o.titre} (−${o.pourcentageReduction} %)`,
              value: o.chiffreAffaires,
              sub: `remise ${formatPrix(o.remiseAccordee)}`,
            }))}
          />
        </Carte>
      </div>

      <Carte titre="CLIENTS">
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Chiffre label="Clients uniques" valeur={nombre(stats.clients.uniques)} />
          <Chiffre label="Nouveaux" valeur={nombre(stats.clients.nouveaux)} />
          <Chiffre label="Déjà venus" valeur={nombre(stats.clients.recurrents)} />
          <Chiffre label="Fidèles (2+ cmd)" valeur={nombre(stats.clients.fideles)} />
          <Chiffre label="Taux de fidélité" valeur={pourcent(stats.clients.tauxFidelite)} />
          <Chiffre label="Valeur moyenne" valeur={formatPrix(stats.clients.valeurMoyenneClient)} />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-2 pr-4">Client</th>
                <th className="py-2 pr-4">Téléphone</th>
                <th className="py-2 pr-4 text-right">Commandes</th>
                <th className="py-2 text-right">Total dépensé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats.clients.topClients.map((c) => (
                <tr key={c.telephoneClient}>
                  <td className="py-2 pr-4 text-slate-800">{c.nomClient}</td>
                  <td className="py-2 pr-4 text-slate-600">{c.telephoneClient}</td>
                  <td className="py-2 pr-4 text-right text-slate-600">{nombre(c.commandes)}</td>
                  <td className="py-2 text-right text-slate-800">{formatPrix(c.chiffreAffaires)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {stats.clients.topClients.length === 0 && <p className="py-6 text-center text-sm text-slate-500">Aucun client sur la période.</p>}
        </div>
      </Carte>

      <div className="grid gap-6 lg:grid-cols-2">
        <Carte titre="COMMANDES PAR JOUR DE LA SEMAINE">
          <ColumnChart
            height={140}
            format={(v) => `${v} commande(s)`}
            data={stats.habitudes.parJourSemaine.map((j) => ({
              label: j.jour,
              short: j.jour.slice(0, 3),
              value: j.commandes,
              details: [['CA', formatPrix(j.chiffreAffaires)]],
            }))}
          />
        </Carte>
        <Carte titre="COMMANDES PAR HEURE">
          <ColumnChart
            height={140}
            format={(v) => `${v} commande(s)`}
            data={stats.habitudes.parHeure.map((h) => ({
              label: `${h.heure}h – ${h.heure + 1}h`,
              short: `${h.heure}h`,
              value: h.commandes,
              details: [['CA', formatPrix(h.chiffreAffaires)]],
            }))}
          />
        </Carte>
      </div>

      <Stock stock={stats.stock} />
    </div>
  )
}

function Stock({ stock }) {
  return (
    <Carte titre="STOCK">
      <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Chiffre label="Valeur du stock" valeur={formatPrix(stock.valeurStock)} />
        <Chiffre label="Produits" valeur={nombre(stock.totalProduits)} />
        <Chiffre label="En rupture" valeur={nombre(stock.ruptures.length)} />
        <Chiffre label="Stock faible (< 5)" valeur={nombre(stock.stockFaible.length)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">Risque de rupture (moins de 14 jours)</h3>
          {stock.risqueRupture.length === 0 ? (
            <p className="text-sm text-slate-500">Aucun produit menacé au rythme actuel.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-1.5 pr-3">Produit</th>
                  <th className="py-1.5 pr-3 text-right">Stock</th>
                  <th className="py-1.5 pr-3 text-right">Ventes / jour</th>
                  <th className="py-1.5 text-right">Jours restants</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.risqueRupture.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1.5 pr-3 text-slate-800">{p.nom}</td>
                    <td className="py-1.5 pr-3 text-right text-slate-600">{p.stock}</td>
                    <td className="py-1.5 pr-3 text-right text-slate-600">{nombre(p.ventesParJour)}</td>
                    <td className="py-1.5 text-right font-medium text-red-700">{p.joursRestants} j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {(stock.ruptures.length > 0 || stock.stockFaible.length > 0) && (
            <div className="mt-4 space-y-2 text-sm">
              {stock.ruptures.length > 0 && (
                <p>
                  <span className="mr-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">Rupture</span>
                  {stock.ruptures.map((p) => p.nom).join(', ')}
                </p>
              )}
              {stock.stockFaible.length > 0 && (
                <p>
                  <span className="mr-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Stock faible</span>
                  {stock.stockFaible.map((p) => `${p.nom} (${p.stock})`).join(', ')}
                </p>
              )}
            </div>
          )}
        </div>

        <div>
          <h3 className="mb-2 text-sm font-medium text-slate-700">
            Sans vente sur la période · {nombre(stock.sansVente.nombre)} produit(s), {formatPrix(stock.sansVente.valeurImmobilisee)} immobilisés
          </h3>
          {stock.sansVente.produits.length === 0 ? (
            <p className="text-sm text-slate-500">Tous les produits en stock se sont vendus.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-slate-500">
                <tr>
                  <th className="py-1.5 pr-3">Produit</th>
                  <th className="py-1.5 pr-3 text-right">Stock</th>
                  <th className="py-1.5 text-right">Valeur</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stock.sansVente.produits.map((p) => (
                  <tr key={p.id}>
                    <td className="py-1.5 pr-3 text-slate-800">{p.nom}</td>
                    <td className="py-1.5 pr-3 text-right text-slate-600">{p.stock}</td>
                    <td className="py-1.5 text-right text-slate-800">{formatPrix(p.valeurStock)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Carte>
  )
}
