import { useState } from 'react'

// Single-series chart color (blue, kept apart from the brand red used for alerts)
const SERIE = '#2a78d6'

// Round the axis max up to a clean number (1, 2, 4, 5, 10 × 10^n)
function niceMax(v) {
  if (v <= 0) return 1
  const p = 10 ** Math.floor(Math.log10(v))
  const n = v / p
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 4 ? 4 : n <= 5 ? 5 : 10) * p
}

const compact = (v) =>
  v >= 1000 ? `${(v / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })}K` : v.toLocaleString('fr-FR')

/**
 * Column chart with a y-axis and a hover tooltip.
 * data = [{ label, value, details: [[name, formattedValue], ...] }]
 */
export function ColumnChart({ data, format, height = 180 }) {
  const [hover, setHover] = useState(null)
  const max = niceMax(Math.max(0, ...data.map((d) => d.value)))
  const ticks = [max, max / 2, 0]
  // show at most ~8 x labels so they never collide
  const pas = Math.max(1, Math.ceil(data.length / 8))

  return (
    <div className="flex gap-2">
      <div className="flex flex-col justify-between text-right text-[11px] text-slate-500" style={{ height }}>
        {ticks.map((t) => (
          <span key={t} className="-translate-y-1/2 first:translate-y-0 last:translate-y-0">{compact(t)}</span>
        ))}
      </div>

      <div className="relative min-w-0 flex-1">
        <div className="relative border-b border-slate-300" style={{ height }}>
          <div className="pointer-events-none absolute inset-x-0 top-0 border-t border-slate-100" />
          <div className="pointer-events-none absolute inset-x-0 top-1/2 border-t border-slate-100" />

          <div className="absolute inset-0 flex">
            {data.map((d, i) => (
              <div
                key={d.label}
                className={`flex flex-1 items-end justify-center ${hover === i ? 'bg-slate-100/70' : ''}`}
                onMouseEnter={() => setHover(i)}
                onMouseLeave={() => setHover(null)}
              >
                <div
                  className="w-full max-w-6 rounded-t"
                  style={{
                    height: `${(d.value / max) * 100}%`,
                    background: SERIE,
                    margin: '0 1px',
                    opacity: hover === null || hover === i ? 1 : 0.5,
                  }}
                />
              </div>
            ))}
          </div>

          {hover !== null && (
            <div
              className="pointer-events-none absolute top-0 z-10 w-max max-w-56 rounded border border-slate-200 bg-white px-3 py-2 text-xs shadow-md"
              style={{
                left: `${((hover + 0.5) / data.length) * 100}%`,
                transform: `translateX(${hover < data.length / 3 ? '8px' : hover > (data.length * 2) / 3 ? 'calc(-100% - 8px)' : '-50%'})`,
              }}
            >
              <p className="mb-1 font-medium text-slate-800">{data[hover].label}</p>
              <p className="text-slate-600">
                <span className="mr-1.5 inline-block size-2 rounded-full" style={{ background: SERIE }} />
                {format(data[hover].value)}
              </p>
              {data[hover].details?.map(([nom, valeur]) => (
                <p key={nom} className="text-slate-500">
                  {nom} : <span className="text-slate-700">{valeur}</span>
                </p>
              ))}
            </div>
          )}
        </div>

        <div className="mt-1 flex text-[11px] text-slate-500">
          {data.map((d, i) => (
            <span key={d.label} className="flex-1 truncate text-center">
              {i % pas === 0 ? d.short ?? d.label : ''}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Ranked horizontal bars, value at the tip.
 * items = [{ key, label, value, sub }] — already sorted
 */
export function BarList({ items, format, vide = 'Aucune donnée sur la période.' }) {
  if (items.length === 0) return <p className="py-6 text-center text-sm text-slate-500">{vide}</p>
  const max = Math.max(...items.map((i) => i.value)) || 1
  return (
    <ul className="space-y-2.5">
      {items.map((i) => (
        <li key={i.key} title={`${i.label} — ${format(i.value)}${i.sub ? ` · ${i.sub}` : ''}`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-slate-700">{i.label}</span>
            <span className="shrink-0 text-slate-800">
              {format(i.value)}
              {i.sub && <span className="ml-1.5 text-xs text-slate-500">{i.sub}</span>}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div className="h-2 rounded-full" style={{ width: `${(i.value / max) * 100}%`, background: SERIE }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

/**
 * One horizontal bar split into segments, with a legend under it.
 * segments = [{ key, label, value, color }]
 */
export function StackedBar({ segments, format }) {
  const total = segments.reduce((s, x) => s + x.value, 0)
  return (
    <div>
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full bg-slate-100">
        {total > 0 &&
          segments
            .filter((s) => s.value > 0)
            .map((s) => (
              <div key={s.key} title={`${s.label} : ${format(s.value)}`} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
            ))}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
        {segments.map((s) => (
          <li key={s.key} className="flex items-center gap-2">
            <span className="size-2.5 shrink-0 rounded-full" style={{ background: s.color }} />
            <span className="flex-1 text-slate-600">{s.label}</span>
            <span className="text-slate-800">{format(s.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
