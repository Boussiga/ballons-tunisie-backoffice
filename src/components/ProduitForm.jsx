import { useEffect, useRef, useState } from 'react'
import { ImagePlus, Star, X } from 'lucide-react'
import { MAX_IMAGES, createProduit, deleteImage, setImagePrincipale, updateProduit, uploadImages } from '../api/produitsApi'
import { getErrorMessage } from '../api/errors'
import { DEVISE, imageSrc } from '../utils/format'
import { FormActions, FormError, inputClass } from './ui'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // same limit as the API (5 Mo per image)

// Images already saved for the product, main image first. A product saved before
// the gallery existed only has imageUrl (id null: shown, but no action on it).
function imagesDuProduit(produit) {
  if (produit?.images?.length) return produit.images.map(({ id, url }) => ({ cle: `e${id}`, id, url }))
  return produit?.imageUrl ? [{ cle: 'legacy', id: null, url: produit.imageUrl }] : []
}

function Tuile({ src, principale, nouvelle, onPrincipale, onRetirer, nom }) {
  return (
    <div className={`relative aspect-square overflow-hidden rounded-lg bg-slate-50 ring-2 ${principale ? 'ring-brand' : 'ring-slate-200'}`}>
      <img src={src} alt="" className="size-full object-cover" />
      {principale && <span className="absolute bottom-1 left-1 rounded bg-brand px-1.5 py-0.5 text-[10px] font-medium text-white">Principale</span>}
      {!principale && nouvelle && <span className="absolute bottom-1 left-1 rounded bg-slate-800/80 px-1.5 py-0.5 text-[10px] text-white">Nouvelle</span>}
      <div className="absolute right-1 top-1 flex gap-1">
        {!principale && onPrincipale && (
          <button type="button" onClick={onPrincipale} title="Définir comme image principale" aria-label={`Définir ${nom} comme image principale`} className="flex size-6 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow hover:text-brand">
            <Star size={13} />
          </button>
        )}
        {onRetirer && (
          <button type="button" onClick={onRetirer} title="Retirer cette image" aria-label={`Retirer ${nom}`} className="flex size-6 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow hover:text-red-600">
            <X size={13} />
          </button>
        )}
      </div>
    </div>
  )
}

function Field({ label, required, hint, children }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      {required && <span className="text-brand"> *</span>}
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </label>
  )
}

export default function ProduitForm({ produit, categories, onSaved, onCancel }) {
  const [nom, setNom] = useState(produit?.nom ?? '')
  const [categorieId, setCategorieId] = useState(String(produit?.categorieId ?? ''))
  const [taille, setTaille] = useState(produit?.taille ?? '')
  const [prix, setPrix] = useState(produit ? String(produit.prix) : '')
  const [stock, setStock] = useState(produit ? String(produit.stock) : '0')
  const [description, setDescription] = useState(produit?.description ?? '')
  // Gallery changes are kept here and only sent when the form is saved
  const [existantes, setExistantes] = useState(() => imagesDuProduit(produit))
  const [nouvelles, setNouvelles] = useState([]) // [{ cle, file, url }]
  const [principale, setPrincipale] = useState(() => imagesDuProduit(produit)[0]?.cle ?? null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const compteur = useRef(0)

  // free the temporary preview URLs when the form closes
  const nouvellesRef = useRef(nouvelles)
  useEffect(() => {
    nouvellesRef.current = nouvelles
  }, [nouvelles])
  useEffect(() => () => nouvellesRef.current.forEach((n) => URL.revokeObjectURL(n.url)), [])

  const total = existantes.length + nouvelles.length
  // Final order: main image first, then the saved images, then the new ones
  const tuiles = [...existantes, ...nouvelles.map((n) => ({ ...n, nouvelle: true }))]
  const clePrincipale = tuiles.some((t) => t.cle === principale) ? principale : tuiles[0]?.cle
  tuiles.sort((a, b) => (b.cle === clePrincipale) - (a.cle === clePrincipale))

  function handleFiles(e) {
    const choisis = [...e.target.files]
    e.target.value = ''
    const place = MAX_IMAGES - total
    const tropGrandes = choisis.filter((f) => f.size > MAX_IMAGE_SIZE)
    const valides = choisis.filter((f) => f.size <= MAX_IMAGE_SIZE)
    const messages = []
    if (tropGrandes.length) messages.push(`${tropGrandes.length} image(s) trop volumineuse(s) ignorée(s) (5 Mo maximum).`)
    if (valides.length > place) messages.push(`${MAX_IMAGES} images maximum par ballon : les images en trop sont ignorées.`)
    setError(messages.join(' '))
    setNouvelles((liste) => [
      ...liste,
      ...valides.slice(0, place).map((file) => ({ cle: `n${compteur.current++}`, file, url: URL.createObjectURL(file) })),
    ])
  }

  function retirer(tuile) {
    if (tuile.nouvelle) {
      URL.revokeObjectURL(tuile.url)
      setNouvelles((liste) => liste.filter((n) => n.cle !== tuile.cle))
    } else {
      setExistantes((liste) => liste.filter((i) => i.cle !== tuile.cle))
    }
  }

  // Applies the gallery changes once the product is saved; returns a warning or ''
  async function enregistrerImages(id) {
    try {
      const gardees = new Set(existantes.map((i) => i.id))
      for (const image of imagesDuProduit(produit)) {
        if (image.id !== null && !gardees.has(image.id)) await deleteImage(id, image.id)
      }
      let apres = null
      if (nouvelles.length) apres = await uploadImages(id, nouvelles.map((n) => n.file))

      // The new images are added after the saved ones, in the same order
      let idPrincipale = existantes.find((i) => i.cle === clePrincipale)?.id ?? null
      const k = nouvelles.findIndex((n) => n.cle === clePrincipale)
      if (k >= 0 && apres) idPrincipale = apres.images[existantes.length + k]?.id ?? null
      const premiere = apres ? apres.images[0]?.id : existantes[0]?.id
      if (idPrincipale !== null && idPrincipale !== premiere) await setImagePrincipale(id, idPrincipale)
      return ''
    } catch (err) {
      return `Produit enregistré, mais les images n'ont pas toutes été mises à jour : ${getErrorMessage(err)}`
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)

    const values = {
      nom,
      categorieId: Number(categorieId),
      taille,
      prix: Number(prix),
      stock: Number(stock),
      description,
    }

    // Step 1: save the product data (JSON)
    let saved
    try {
      saved = produit ? await updateProduit(produit.id, values) : await createProduit(values)
    } catch (err) {
      setError(getErrorMessage(err))
      setSaving(false)
      return
    }

    // Step 2: gallery changes (removed images, new images, main image)
    const warning = await enregistrerImages(saved.id)
    if (warning) {
      onSaved(warning)
      return
    }
    onSaved()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nom du ballon" required>
        <input required minLength={2} maxLength={200} value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} />
      </Field>

      <div>
        <div className="flex items-baseline justify-between text-sm text-slate-600">
          <span>Images</span>
          <span className="text-xs text-slate-500">{total} / {MAX_IMAGES}</span>
        </div>
        <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-5">
          {tuiles.map((t, i) => (
            <Tuile
              key={t.cle}
              src={t.nouvelle ? t.url : imageSrc(t.url)}
              nom={`l'image ${i + 1}`}
              principale={t.cle === clePrincipale}
              nouvelle={t.nouvelle}
              onPrincipale={t.id === null && !t.nouvelle ? null : () => setPrincipale(t.cle)}
              onRetirer={t.id === null && !t.nouvelle ? null : () => retirer(t)}
            />
          ))}
          {total < MAX_IMAGES && (
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-xs text-slate-400 hover:border-brand hover:text-brand">
              <ImagePlus size={22} />
              Ajouter
              <input type="file" multiple accept="image/png,image/jpeg,image/webp" onChange={handleFiles} className="sr-only" aria-label="Ajouter des images" />
            </label>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-500">
          JPG, PNG ou WebP, 5 Mo max par image. L'image principale est affichée dans les listes : cliquez sur l'étoile pour en choisir une autre.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label="Sport"
          required
          hint={categories.length === 0 ? 'Aucun sport disponible : fermez ce formulaire et cliquez sur « + SPORT ».' : null}
        >
          <select required value={categorieId} onChange={(e) => setCategorieId(e.target.value)} className={inputClass}>
            <option value="">Choisir…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Taille" hint="Ex : T5, Unique, L">
          <input maxLength={10} value={taille} onChange={(e) => setTaille(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`Prix (${DEVISE})`} required>
          <input type="number" inputMode="decimal" required min="0.01" max="99999.99" step="0.01" value={prix} onChange={(e) => setPrix(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Stock" required>
          <input type="number" inputMode="numeric" required min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Description">
        <textarea rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </Field>

      <FormError>{error}</FormError>
      <FormActions saving={saving} onCancel={onCancel} />
    </form>
  )
}
