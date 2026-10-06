export default function Pagination({ pagination, onPage }) {
  if (!pagination) return null

  return (
    <div className="mt-4 flex items-center justify-between text-sm text-slate-600">
      <span>{pagination.total} résultat(s)</span>
      <div className="flex items-center gap-3">
        <button
          disabled={!pagination.hasPrevPage}
          onClick={() => onPage(pagination.page - 1)}
          className="rounded border border-slate-300 bg-white px-3 py-1 disabled:opacity-40"
        >
          Précédent
        </button>
        <span>
          Page {pagination.page} / {pagination.totalPages || 1}
        </span>
        <button
          disabled={!pagination.hasNextPage}
          onClick={() => onPage(pagination.page + 1)}
          className="rounded border border-slate-300 bg-white px-3 py-1 disabled:opacity-40"
        >
          Suivant
        </button>
      </div>
    </div>
  )
}
