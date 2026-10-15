import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react'

// Toasts (short-lived notices) + a confirm dialog that replaces window.confirm
const FeedbackContext = createContext(null)

const TOAST_MS = 4000

const TOAST_STYLES = {
  success: { icon: CheckCircle2, className: 'border-green-200 bg-white text-green-800', iconClass: 'text-green-600' },
  error: { icon: XCircle, className: 'border-red-200 bg-white text-red-800', iconClass: 'text-red-600' },
}

function ConfirmDialog({ options, onAnswer }) {
  const confirmRef = useRef(null)

  useEffect(() => {
    confirmRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onAnswer(false)
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onAnswer])

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onMouseDown={() => onAnswer(false)}>
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="w-full max-w-sm rounded-lg bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex gap-3">
          <span className={`flex size-10 shrink-0 items-center justify-center rounded-full ${options.danger ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-600'}`}>
            <AlertTriangle size={20} />
          </span>
          <div>
            <h2 id="confirm-title" className="font-display text-lg text-sidebar">{options.title}</h2>
            {options.message && <p className="mt-1 text-sm text-slate-600">{options.message}</p>}
          </div>
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={() => onAnswer(false)} className="rounded border border-slate-300 px-4 py-2 text-sm text-slate-600 hover:bg-slate-50">
            {options.cancelLabel ?? 'Annuler'}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={() => onAnswer(true)}
            className={`rounded px-5 py-2 font-display tracking-wider text-white ${options.danger ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark'}`}
          >
            {options.confirmLabel ?? 'CONFIRMER'}
          </button>
        </div>
      </div>
    </div>
  )
}

export function FeedbackProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [confirmState, setConfirmState] = useState(null) // { options, resolve }
  const nextId = useRef(0)

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), [])

  const push = useCallback(
    (type, text) => {
      const id = ++nextId.current
      setToasts((list) => [...list.slice(-3), { id, type, text }])
      setTimeout(() => dismiss(id), TOAST_MS)
    },
    [dismiss]
  )

  const toast = useMemo(
    () => ({ success: (text) => push('success', text), error: (text) => push('error', text) }),
    [push]
  )

  // const ok = await confirm({ title, message, confirmLabel, danger })
  const confirm = useCallback((options) => new Promise((resolve) => setConfirmState({ options, resolve })), [])

  const answer = useCallback(
    (value) => {
      confirmState?.resolve(value)
      setConfirmState(null)
    },
    [confirmState]
  )

  return (
    <FeedbackContext.Provider value={{ toast, confirm }}>
      {children}

      <div aria-live="polite" className="pointer-events-none fixed inset-x-4 bottom-4 z-[70] flex flex-col items-end gap-2 sm:left-auto">
        {toasts.map((t) => {
          const { icon: Icon, className, iconClass } = TOAST_STYLES[t.type]
          return (
            <div key={t.id} role="status" className={`toast-in pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg ${className}`}>
              <Icon size={18} className={`mt-0.5 shrink-0 ${iconClass}`} />
              <span className="flex-1">{t.text}</span>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Fermer" className="text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>
          )
        })}
      </div>

      {confirmState && <ConfirmDialog options={confirmState.options} onAnswer={answer} />}
    </FeedbackContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useToast = () => useContext(FeedbackContext).toast
// eslint-disable-next-line react-refresh/only-export-components
export const useConfirm = () => useContext(FeedbackContext).confirm
