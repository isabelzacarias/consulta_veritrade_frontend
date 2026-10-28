import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  BarChart3,
  Building2,
  Globe2,
  Info,
  PieChart as PieChartIcon,
  Tags,
} from 'lucide-react'
import type {
  CompraCategoria,
  CompraMensual,
  CompraProveedor,
  ComprasKpis,
} from '../../types/compras'
import type { QuerySlice } from '../../types/ui'
import {
  formatMonthLong,
  formatMonthShort,
  formatMxn,
  formatMxnCompact,
  formatNumber,
  formatPercent,
} from '../../lib/format'
import { SectionCard } from '../../components/ui/SectionCard'
import { BarList } from '../../components/ui/BarList'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
  fontSize: 12,
}

const axisTick = { fill: '#94a3b8', fontSize: 11 }

interface ComprasChartsProps {
  mensual: QuerySlice<CompraMensual[]>
  categorias: QuerySlice<CompraCategoria[]>
  proveedores: QuerySlice<CompraProveedor[]>
  kpis: ComprasKpis | undefined
}

export function ComprasCharts({
  mensual,
  categorias,
  proveedores,
  kpis,
}: ComprasChartsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <MonthlyCard query={mensual} />
      <AmbitoCard kpis={kpis} />
      <CategoriasCard query={categorias} />
      <ProveedoresCard query={proveedores} />
    </div>
  )
}

function MonthlyCard({ query }: { query: QuerySlice<CompraMensual[]> }) {
  const data = query.data ?? []
  const hayParciales = data.some((row) => !row.completo)

  return (
    <SectionCard
      title="Evolución mensual de compras"
      subtitle="Importe bruto registrado por mes, expresado en MXN"
      className="xl:col-span-2"
      bodyClassName="p-4 pt-5"
      actions={
        <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
          <BarChart3 className="size-3" />
          {formatNumber(data.length)} meses
        </span>
      }
    >
      {query.isLoading ? (
        <Skeleton className="h-[292px] w-full" />
      ) : query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Error desconocido'}
          onRetry={query.refetch}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sin serie mensual"
          description="No hay compras para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <>
          <div className="h-[292px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={data}
                margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="comprasMonthlyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b2480" stopOpacity={0.32} />
                    <stop offset="100%" stopColor="#5b2480" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  vertical={false}
                />
                <XAxis
                  dataKey="mes"
                  tickFormatter={(value) => formatMonthShort(String(value))}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  minTickGap={18}
                />
                <YAxis
                  tickFormatter={(value) => formatMxnCompact(Number(value))}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                  width={72}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  labelFormatter={(label) => formatMonthLong(String(label))}
                  formatter={(value, name, item) => {
                    const row = item?.payload as CompraMensual | undefined
                    if (name === 'importe_mxn' && row) {
                      return [
                        `${formatMxn(Number(value))} · Nacional ${formatMxnCompact(row.importe_nacional_mxn)} · Internacional ${formatMxnCompact(row.importe_internacional_mxn)}`,
                        row.completo ? 'Importe MXN' : 'Importe MXN (mes parcial)',
                      ]
                    }
                    return [formatMxn(Number(value)), 'Importe MXN']
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="importe_mxn"
                  stroke="#5b2480"
                  strokeWidth={2.25}
                  fill="url(#comprasMonthlyFill)"
                  activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {hayParciales && (
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              El primer o último mes no cubre el mes calendario completo. La serie
              refleja únicamente los días capturados en el CSV.
            </p>
          )}
        </>
      )}
    </SectionCard>
  )
}

function AmbitoCard({ kpis }: { kpis: ComprasKpis | undefined }) {
  const nacional = kpis?.importe_nacional_mxn ?? 0
  const internacional = kpis?.importe_internacional_mxn ?? 0
  const total = nacional + internacional
  const data = [
    {
      name: 'Nacional',
      value: nacional,
      color: '#5b2480',
      registros: kpis?.registros ?? 0,
    },
    {
      name: 'Internacional',
      value: internacional,
      color: '#06b6d4',
      registros: 0,
    },
  ]

  return (
    <SectionCard
      title="Nacional vs internacional"
      subtitle="Origen de las compras por proveedor"
      bodyClassName="p-4 pt-5"
    >
      {!kpis ? (
        <Skeleton className="h-[292px] w-full" />
      ) : total === 0 ? (
        <EmptyState
          icon={Globe2}
          title="Sin compras"
          description="No hay importes para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <div className="flex h-full flex-col">
          <div className="relative h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={58}
                  outerRadius={86}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((row) => (
                    <Cell key={row.name} fill={row.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatMxn(Number(value)), 'Importe MXN']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                Total
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {formatMxnCompact(total)}
              </span>
              <span className="text-[10px] text-slate-400">MXN</span>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {data.map((row) => {
              const pct = total > 0 ? (row.value * 100) / total : null
              return (
                <li key={row.name} className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2 shrink-0 rounded-full"
                    style={{ backgroundColor: row.color }}
                  />
                  <span className="min-w-0 flex-1 truncate text-slate-600">
                    {row.name}
                  </span>
                  <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                    {formatMxnCompact(row.value)}
                  </span>
                  <span className="w-11 shrink-0 text-right font-semibold text-slate-700 tabular-nums">
                    {formatPercent(pct)}
                  </span>
                </li>
              )
            })}
          </ul>
          <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
            Clasificación por proveedor: {formatNumber(kpis.proveedores)} proveedores
            en total.
          </p>
        </div>
      )}
    </SectionCard>
  )
}

function CategoriasCard({ query }: { query: QuerySlice<CompraCategoria[]> }) {
  const data = query.data ?? []

  return (
    <SectionCard
      title="Top categorías"
      subtitle="Participación del importe comprado"
      bodyClassName="p-4 pt-2"
      actions={
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <Tags className="size-3.5" />
          {formatNumber(data.length)}
        </span>
      }
    >
      {query.isLoading ? (
        <div className="space-y-3 py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Error desconocido'}
          onRetry={query.refetch}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title="Sin categorías"
          description="No hay compras para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <BarList
          items={data.map((row) => ({
            key: row.categoria,
            label: row.categoria,
            value: row.importe_mxn,
            valueLabel: formatMxnCompact(row.importe_mxn),
            pct: row.pct_importe,
            meta: `${formatNumber(row.registros)} compras · ${formatNumber(row.proveedores)} proveedores`,
          }))}
          tone="teal"
        />
      )}
    </SectionCard>
  )
}

function ProveedoresCard({ query }: { query: QuerySlice<CompraProveedor[]> }) {
  const data = query.data ?? []

  return (
    <SectionCard
      title="Top proveedores"
      subtitle="Mayor importe comprado en el período filtrado"
      className="xl:col-span-2"
      bodyClassName="p-4 pt-2"
      actions={
        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
          <Building2 className="size-3.5" />
          {formatNumber(data.length)}
        </span>
      }
    >
      {query.isLoading ? (
        <div className="space-y-3 py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Error desconocido'}
          onRetry={query.refetch}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin proveedores"
          description="No hay compras para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <BarList
          items={data.map((row) => ({
            key: `${row.proveedor}-${row.ambito}`,
            label: row.proveedor,
            value: row.importe_mxn,
            valueLabel: formatMxnCompact(row.importe_mxn),
            pct: row.pct_importe,
            meta: (
              <span className="inline-flex items-center gap-1.5">
                <span
                  className={`inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                    row.ambito === 'internacional'
                      ? 'border-aqua-200 bg-aqua-50 text-aqua-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  {row.ambito === 'internacional' ? 'Internacional' : 'Nacional'}
                </span>
                {formatNumber(row.registros)} compras
              </span>
            ),
          }))}
          tone="sky"
        />
      )}
    </SectionCard>
  )
}
