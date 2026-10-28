import {
  Building2,
  CircleDollarSign,
  Globe2,
  PackageSearch,
  ReceiptText,
  Tags,
  type LucideIcon,
} from 'lucide-react'
import type { ComprasKpis } from '@/types/compras'
import {
  formatDate,
  formatMxn,
  formatMxnCompact,
  formatNumber,
  formatPercent,
} from '@/lib/format'
import { ErrorState, Skeleton } from '@/components/ui/States'

interface ComprasKpisProps {
  kpis: ComprasKpis | undefined
  isLoading: boolean
  error?: Error | null
  onRetry?: () => void
}

const cardStyles = {
  brand: {
    card: 'border-brand-200/70 bg-linear-to-br from-brand-100/80 via-brand-50/50 to-white',
    icon: 'bg-brand-600 text-white shadow-md shadow-brand-600/30',
    label: 'text-brand-700',
    hint: 'text-brand-600/70',
  },
  aqua: {
    card: 'border-aqua-200/70 bg-linear-to-br from-aqua-100/80 via-aqua-50/50 to-white',
    icon: 'bg-aqua-500 text-white shadow-md shadow-aqua-500/30',
    label: 'text-aqua-700',
    hint: 'text-aqua-600/70',
  },
  deep: {
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

export function ComprasKpis({
  kpis,
  isLoading,
  error,
  onRetry,
}: ComprasKpisProps) {
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

  const periodo =
    kpis?.fecha_min && kpis.fecha_max
      ? `${formatDate(kpis.fecha_min)} — ${formatDate(kpis.fecha_max)}`
      : 'Sin período'

  const cards: MainKpi[] = [
    {
      label: 'Importe total de compras',
      value: formatMxn(kpis?.importe_total_mxn),
      hint: periodo,
      icon: CircleDollarSign,
      tone: 'brand',
    },
    {
      label: 'Compras registradas',
      value: formatNumber(kpis?.registros),
      hint: `${formatNumber(kpis?.meses)} meses con actividad`,
      icon: ReceiptText,
      tone: 'aqua',
    },
    {
      label: 'Proveedores',
      value: formatNumber(kpis?.proveedores),
      hint: `${formatNumber(kpis?.categorias)} categorías de artículo`,
      icon: Building2,
      tone: 'deep',
    },
    {
      label: 'Participación internacional',
      value: formatPercent(kpis?.pct_internacional),
      hint: `${formatMxnCompact(kpis?.importe_internacional_mxn)} de ${formatMxnCompact(kpis?.importe_total_mxn)}`,
      icon: Globe2,
      tone: 'amber',
    },
  ]

  const secundarios = [
    {
      label: 'Compras nacionales',
      value: formatMxnCompact(kpis?.importe_nacional_mxn),
      hint: 'Proveedores nacionales',
      icon: Tags,
      iconClass: 'bg-brand-100 text-brand-700',
    },
    {
      label: 'Compras internacionales',
      value: formatMxnCompact(kpis?.importe_internacional_mxn),
      hint: 'Importaciones directas',
      icon: Globe2,
      iconClass: 'bg-aqua-100 text-aqua-700',
    },
    {
      label: 'Categorías',
      value: formatNumber(kpis?.categorias),
      hint: 'Incluye “Sin categoría”',
      icon: PackageSearch,
      iconClass: 'bg-deep-100 text-deep-700',
    },
    {
      label: 'Fracciones válidas',
      value: formatNumber(kpis?.fracciones_validas),
      hint: `${formatNumber(kpis?.fracciones_invalidas)} inválidas · ${formatNumber(kpis?.sin_fraccion)} sin capturar`,
      icon: ReceiptText,
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
              className={`rounded-2xl border p-5 shadow-sm shadow-slate-900/5 transition hover:-translate-y-0.5 hover:shadow-lg ${style.card}`}
            >
              <div className="flex items-start justify-between gap-3">
                <p className={`text-xs font-semibold ${style.label}`}>
                  {card.label}
                </p>
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
        {secundarios.map((item) => {
          const Icon = item.icon
          return (
            <div
              key={item.label}
              className="flex items-center gap-3 bg-white px-4 py-3.5"
            >
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-lg ${item.iconClass}`}
              >
                <Icon className="size-4" />
              </span>
              <div className="min-w-0">
                <p className="text-[11px] text-slate-500">{item.label}</p>
                <p className="text-sm font-semibold text-slate-900 tabular-nums">
                  {item.value}
                </p>
                <p className="truncate text-[10px] text-slate-400" title={item.hint}>
                  {item.hint}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
