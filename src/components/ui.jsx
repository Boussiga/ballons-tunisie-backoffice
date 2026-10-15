import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'

// Shared building blocks so every page looks and behaves the same

export const inputClass = 'w-full rounded border border-slate-300 bg-white px-3 py-2 outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'
export const fieldClass = 'rounded border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/15'
export const primaryButton = 'inline-flex items-center justify-center gap-2 rounded bg-brand px-4 py-2 font-display text-sm tracking-wider text-white hover:bg-brand-dark disabled:opacity-60'
export const secondaryButton = 'inline-flex items-center justify-center gap-2 rounded border border-slate-300 bg-white px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-60'

export function PageHeader({ kicker, title, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        {kicker && <p className="font-display text-xs tracking-wider text-brand-dark">{kicker}</p>}
        <h1 className="font-display text-2xl text-sidebar">{title}</h1>
      </div>
      {children && <div className="flex flex-wrap gap-3">{children}</div>}
    </div>
  )
}

// Searches while typing (debounced); Enter searches right away, the cross clears
export function SearchInput({ value, onSearch, placeholder, className = 'w-full sm:w-64' }) {
  const [text, setText] = useState(value)
  const [lastValue, setLastValue] = useState(value)
  const timer = useRef(null)

  // the page cleared the search (e.g. "reset filters"): show it
  if (value !== lastValue) {
    setLastValue(value)
    if (value !== text.trim()) setText(value)
  }

  useEffect(() => () => clearTimeout(timer.current), [])

  function change(next, delay = 350) {
    setText(next)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => {
      if (next.trim() !== value) onSearch(next.trim())
    }, delay)
  }

  return (
    <form
      role="search"
      onSubmit={(e) => {
        e.preventDefault()
        change(text, 0)
      }}
      className={`flex items-center rounded border border-slate-300 bg-white focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 ${className}`}
    >
      <Search size={16} className="ml-3 shrink-0 text-slate-400" />
      <input
        type="search"
        value={text}
        onChange={(e) => change(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full min-w-0 bg-transparent px-2 py-2 text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button type="button" onClick={() => change('', 0)} aria-label="Effacer la recherche" className="px-2.5 text-slate-400 hover:text-brand">
          <X size={16} />
        </button>
      )}
    </form>
  )
}

export function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      {Icon && (
        <span className="mb-3 flex size-12 items-center justify-center rounded-full bg-slate-100 text-slate-400">
          <Icon size={24} />
        </span>
      )}
      <p className="font-medium text-slate-700">{title}</p>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-500">{text}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

export function ErrorState({ text, onRetry }) {
  return (
    <div className="flex flex-col items-center px-4 py-10 text-center">
      <p className="text-sm text-red-700">{text}</p>
      {onRetry && (
        <button type="button" onClick={onRetry} className={`${secondaryButton} mt-3`}>
          Réessayer
        </button>
      )}
    </div>
  )
}

export function Skeleton({ className = '' }) {
  return <span className={`block animate-pulse rounded bg-slate-200 ${className}`} />
}

// Placeholder rows while a table loads for the first time
export function SkeletonRows({ rows = 5, cols }) {
  return Array.from({ length: rows }, (_, r) => (
    <tr key={r} className="border-t border-slate-100">
      {Array.from({ length: cols }, (_, c) => (
        <td key={c} className="px-4 py-4">
          <Skeleton className={`h-4 ${c === 0 ? 'w-40' : 'w-16'}`} />
        </td>
      ))}
    </tr>
  ))
}

export function Badge({ className, children }) {
  return <span className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${className}`}>{children}</span>
}

export function FormError({ children }) {
  if (!children) return null
  return (
    <p role="alert" className="rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
      {children}
    </p>
  )
}

export function FormActions({ saving, onCancel, label = 'ENREGISTRER' }) {
  return (
    <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
      <button type="button" onClick={onCancel} disabled={saving} className={secondaryButton}>
        Annuler
      </button>
      <button type="submit" disabled={saving} className={`${primaryButton} px-5`}>
        {saving && <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
        {saving ? 'ENREGISTREMENT…' : label}
      </button>
    </div>
  )
}
