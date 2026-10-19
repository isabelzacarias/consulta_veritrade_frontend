import type { ReactNode } from 'react'

export type BarTone = 'teal' | 'sky' | 'amber' | 'indigo'

export interface BarListItem {
  key: string
  label: string
  value: number | null
  valueLabel: string
  pct?: number | null
  meta?: ReactNode
}

interface BarListProps {
  items: BarListItem[]
  tone?: BarTone
  widthMode?: 'percent' | 'relative'
  className?: string
}

const toneClasses: Record<BarTone, string> = {
  teal: 'from-brand-600 to-brand-400',
  sky: 'from-aqua-600 to-aqua-300',
  amber: 'from-amber-500 to-orange-400',
  indigo: 'from-deep-600 to-deep-300',
}

const pctToneClasses: Record<BarTone, string> = {
  teal: 'text-brand-700',
  sky: 'text-aqua-700',
  amber: 'text-amber-700',
  indigo: 'text-deep-700',
}

export function BarList({
  items,
  tone = 'teal',
  widthMode = 'percent',
  className = '',
}: BarListProps) {
  const max = Math.max(...items.map((item) => item.value ?? 0), 1)

  return (
    <ol className={`divide-y divide-slate-100 ${className}`}>
      {items.map((item) => {
        const width =
          widthMode === 'percent' && item.pct != null
            ? item.pct
            : ((item.value ?? 0) / max) * 100

        return (
          <li key={item.key} className="py-2.5">
            <div className="flex items-baseline justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-xs font-medium text-slate-700" title={item.label}>
                  {item.label}
                </p>
                {item.meta && <div className="mt-0.5 text-[10px] text-slate-400">{item.meta}</div>}
              </div>
              <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                {item.valueLabel}
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div
                  className={`h-full rounded-full bg-linear-to-r ${toneClasses[tone]}`}
                  style={{ width: `${Math.max(2, Math.min(100, width))}%` }}
                />
              </div>
              {item.pct != null && (
                <span
                  className={`shrink-0 text-[10px] font-semibold tabular-nums ${pctToneClasses[tone]}`}
                >
                  {item.pct.toFixed(1)}%
                </span>
              )}
            </div>
          </li>
        )
      })}
    </ol>
  )
}
