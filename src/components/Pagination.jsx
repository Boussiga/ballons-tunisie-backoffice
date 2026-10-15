import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.total === 0) return null

  const { page, limit, total, totalPages } = pagination
  const from = (page - 1) * limit + 1
  const to = Math.min(page * limit, total)
  const button = 'flex size-8 items-center justify-center rounded border border-slate-300 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white'

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-600">
      <span>
        {from}–{to} sur {total} résultat{total > 1 ? 's' : ''}
      </span>
      {totalPages > 1 && (
        <div className="flex items-center gap-2">
          <button disabled={!pagination.hasPrevPage} onClick={() => onPage(page - 1)} aria-label="Page précédente" className={button}>
            <ChevronLeft size={16} />
          </button>
          <span className="px-1">
            Page {page} / {totalPages}
          </span>
          <button disabled={!pagination.hasNextPage} onClick={() => onPage(page + 1)} aria-label="Page suivante" className={button}>
            <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}
