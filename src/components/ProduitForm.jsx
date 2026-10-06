import { useEffect, useState } from 'react'
import { createProduit, updateProduit, uploadImage } from '../api/produitsApi'
import { getErrorMessage } from '../api/errors'
import { imageSrc } from '../utils/format'

const MAX_IMAGE_SIZE = 5 * 1024 * 1024 // same limit as the API (5 Mo)
const inputClass = 'w-full rounded border border-slate-300 px-3 py-2 outline-none focus:border-brand'

function Field({ label, children }) {
  return (
    <label className="block text-sm text-slate-600">
      {label}
      <div className="mt-1">{children}</div>
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

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Nom du ballon">
        <input required minLength={2} maxLength={200} value={nom} onChange={(e) => setNom(e.target.value)} className={inputClass} />
      </Field>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Sport">
          <select required value={categorieId} onChange={(e) => setCategorieId(e.target.value)} className={inputClass}>
            <option value="">Choisir…</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
          {categories.length === 0 && (
            <p className="mt-1 text-xs text-amber-700">Aucun sport disponible : fermez ce formulaire et cliquez sur « + SPORT ».</p>
          )}
        </Field>
        <Field label="Taille (ex: T5)">
          <input maxLength={10} value={taille} onChange={(e) => setTaille(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Prix">
          <input type="number" required min="0.01" max="99999.99" step="0.01" value={prix} onChange={(e) => setPrix(e.target.value)} className={inputClass} />
        </Field>
        <Field label="Stock">
          <input type="number" required min="0" step="1" value={stock} onChange={(e) => setStock(e.target.value)} className={inputClass} />
        </Field>
      </div>

      <Field label="Description">
        <textarea rows={3} maxLength={1000} value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} />
      </Field>

      <div className="text-sm text-slate-600">
        Image (JPG, PNG ou WebP, 5 Mo max)
        <div className="mt-1 flex items-center gap-3">
          {(preview || produit?.imageUrl) && (
            <img src={preview || imageSrc(produit.imageUrl)} alt="" className="h-16 w-16 rounded object-cover" />
          )}
          <label className="cursor-pointer rounded border border-slate-300 px-3 py-2 text-slate-700 hover:bg-slate-50">
            {file ? "Changer l'image" : 'Choisir une image'}
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handleFile} className="hidden" />
          </label>
          {file && <span className="truncate text-xs text-slate-500">{file.name}</span>}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
          Annuler
        </button>
        <button type="submit" disabled={saving} className="rounded bg-brand px-5 py-2 font-display tracking-wider text-white hover:bg-brand-dark disabled:opacity-60">
          {saving ? 'ENREGISTREMENT…' : 'ENREGISTRER'}
        </button>
      </div>
    </form>
  )
}
