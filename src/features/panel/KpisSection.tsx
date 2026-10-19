import {
  Building2,
  CircleDollarSign,
  FileSpreadsheet,
  Globe2,
  PackageSearch,
  Scale,
  Ship,
  Weight,
  type LucideIcon,
} from 'lucide-react'
import type { Kpis } from '../../types/api'
import {
  formatDecimal,
  formatKg,
  formatNumber,
  formatUsd,
} from '../../lib/format'
import { Skeleton, ErrorState } from '../../components/ui/States'

interface KpisSectionProps {
  kpis: Kpis | undefined
  isLoading: boolean
  error?: Error | null
  onRetry?: () => void
}

const cardStyles = {
  teal: {
    card: 'border-brand-200/70 bg-linear-to-br from-brand-100/80 via-brand-50/50 to-white',
    icon: 'bg-brand-600 text-white shadow-md shadow-brand-600/30',
    label: 'text-brand-700',
    hint: 'text-brand-600/70',
  },
  sky: {
    card: 'border-aqua-200/70 bg-linear-to-br from-aqua-100/80 via-aqua-50/50 to-white',
    icon: 'bg-aqua-500 text-white shadow-md shadow-aqua-500/30',
    label: 'text-aqua-700',
    hint: 'text-aqua-600/70',
  },
  indigo: {
    card: 'border-deep-200/70 bg-linear-to-br from-deep-100/80 via-deep-50/50 to-white',
    icon: 'bg-deep-700 text-white shadow-md shadow-deep-700/30',
    label: 'text-deep-700',
    hint: 'text-deep-500/70',
  },
  amber: {
    card: 'border-amber-200/70 bg-linear-to-br from-amber-100/80 via-amber-50/50 to-white',
    icon: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
    label: 'text-amber-700',
    hint: 'text-amber-600/70',
  },
} as const

type Tone = keyof typeof cardStyles

interface MainKpi {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: Tone
}

export function KpisSection({
  kpis,
  isLoading,
  error,
  onRetry,
}: KpisSectionProps) {
  if (error && !kpis) {
    return (
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm">
        <ErrorState message={error.message} onRetry={onRetry} />
      </div>
    )
  }

  if (isLoading && !kpis) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="size-9 rounded-xl" />
            </div>
            <Skeleton className="mt-4 h-7 w-36" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
        ))}
      </div>
    )
  }

  const cards: MainKpi[] = [
    {
      label: 'Valor total importado',
      value: formatUsd(kpis?.valor_total_usd),
      hint: 'Valor CIF declarado en USD',
      icon: CircleDollarSign,
      tone: 'teal',
    },
    {
      label: 'Volumen total',
      value: formatKg(kpis?.volumen_total_kg),
      hint: 'Suma de la cantidad 1 (kg)',
      icon: Weight,
      tone: 'sky',
    },
    {
      label: 'Operaciones',
      value: formatNumber(kpis?.registros),
      hint: 'Registros de importación',
      icon: FileSpreadsheet,
      tone: 'indigo',
    },
    {
      label: 'Costo unitario ponderado',
      value:
        kpis?.costo_unit_ponderado == null
          ? '—'
          : `$${formatDecimal(kpis.costo_unit_ponderado)} / kg`,
      hint: 'Valor USD ÷ volumen kg',
      icon: Scale,
      tone: 'amber',
    },
  ]

  const secondary = [
    {
      label: 'Importadores',
      value: formatNumber(kpis?.importadores),
      icon: Building2,
      iconClass: 'bg-brand-100 text-brand-700',
    },
    {
      label: 'Exportadores',
      value: formatNumber(kpis?.exportadores),
      icon: Ship,
      iconClass: 'bg-aqua-100 text-aqua-700',
    },
    {
      label: 'Partidas',
      value: formatNumber(kpis?.partidas),
      icon: PackageSearch,
      iconClass: 'bg-deep-100 text-deep-700',
    },
    {
      label: 'Países de origen',
      value: formatNumber(kpis?.paises_origen),
      icon: Globe2,
      iconClass: 'bg-emerald-100 text-emerald-700',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon
          const style = cardStyles[card.tone]
          return (
            <article
              key={card.label}
              className={`group rounded-2xl border p-5 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg ${style.card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={`text-xs font-semibold ${style.label}`}>{card.label}</p>
                <span
                  className={`grid size-10 shrink-0 place-items-center rounded-xl ${style.icon}`}
                >
                  <Icon className="size-5" />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">
                {card.value}
              </p>
              <p className={`mt-1 text-[11px] ${style.hint}`}>{card.hint}</p>
            </article>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-brand-200/60 bg-brand-100/60 shadow-sm sm:grid-cols-4">
        {secondary.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 bg-white px-4 py-3.5"
            >
              <span className={`grid size-8 place-items-center rounded-lg ${item.iconClass}`}>
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">{item.label}</p>
                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                  {item.value}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
