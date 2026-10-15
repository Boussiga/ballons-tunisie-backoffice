import { useEffect, useState } from 'react'
import { ImagePlus } from 'lucide-react'
import { createProduit, updateProduit, uploadImage } from '../api/produitsApi'
import { getErrorMessage } from '../api/errors'
import { DEVISE, imageSrc } from '../utils/format'
import { FormActions, FormError, inputClass } from './ui'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // same limit as the API (5 Mo)

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
  const [file, setFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  // free the temporary preview URL when it changes or when the form closes
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  function handleFile(e) {
    const chosen = e.target.files[0]
    if (chosen && chosen.size > MAX_IMAGE_SIZE) {
      setError('Image trop volumineuse (5 Mo maximum).')
      e.target.value = ''
      setFile(null)
      setPreview(null)
      return
    }
    setError('')
    setFile(chosen || null)
    setPreview(chosen ? URL.createObjectURL(chosen) : null)
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

    // Step 2: send the image, if one was chosen
    if (file) {
      try {
        await uploadImage(saved.id, file)
      } catch (err) {
        onSaved(`Produit enregistré, mais l'image n'a pas pu être envoyée : ${getErrorMessage(err)}`)
        return
      }
    }

    onSaved()
  }

  const image = preview || imageSrc(produit?.imageUrl)

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-4">
        <label className="group relative flex size-24 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 text-slate-400 hover:border-brand hover:text-brand">
          {image ? (
            <>
              <img src={image} alt="" className="size-full object-cover" />
              <span className="absolute inset-0 flex items-center justify-center bg-black/40 text-xs text-white opacity-0 group-hover:opacity-100">
                Changer
              </span>
            </>
          ) : (
            <span className="flex flex-col items-center gap-1 text-xs">
              <ImagePlus size={22} />
              Image
            </span>
          )}
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="sr-only" aria-label="Choisir une image" />
        </label>
        <div className="flex-1">
          <Field label="Nom du ballon" required>
            <input required minLength={2} maxLength={200} value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} />
          </Field>
          <p className="mt-2 truncate text-xs text-slate-500">{file ? file.name : 'JPG, PNG ou WebP, 5 Mo max.'}</p>
        </div>
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
