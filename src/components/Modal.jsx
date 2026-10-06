import { X } from 'lucide-react'

export default function Modal({ title, onClose, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg bg-white p-6 shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl text-sidebar">{title}</h2>
          <button onClick={onClose} aria-label="Fermer" className="text-slate-500 hover:text-brand">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}
