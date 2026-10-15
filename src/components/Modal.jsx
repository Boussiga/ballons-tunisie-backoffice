import { useEffect, useId, useRef } from 'react'
import { X } from 'lucide-react'

export default function Modal({ title, onClose, children, size = 'max-w-lg' }) {
  const titleId = useId()
  const panel = useRef(null)
  const closeRef = useRef(onClose)

  useEffect(() => {
    closeRef.current = onClose
  })

  // Esc closes, the page behind does not scroll, focus goes to the first field
  useEffect(() => {
    const previous = document.activeElement
    const onKey = (e) => {
      // a confirm dialog opened on top handles its own Esc
      if (e.key === 'Escape' && !document.querySelector('[role=alertdialog]')) closeRef.current()
    }
    document.addEventListener('keydown', onKey)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.querySelector('input:not([type=hidden]), select, textarea, button:not([aria-label=Fermer])')?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous?.focus?.()
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={`modal-in flex max-h-[92vh] w-full ${size} flex-col rounded-t-xl bg-white shadow-xl sm:rounded-lg`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <h2 id={titleId} className="font-display text-xl text-sidebar">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="rounded p-1 text-slate-500 hover:bg-slate-100 hover:text-brand">
            <X size={20} />
          </button>
        </div>
        <div className="overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  )
}
