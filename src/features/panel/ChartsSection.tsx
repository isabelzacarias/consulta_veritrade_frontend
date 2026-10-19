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
  PieChart as PieChartIcon,
} from 'lucide-react'
import { useState } from 'react'
import type {
  ImportadorRow,
  MensualRow,
  Page,
  PaisOrigenRow,
  TipoImportacionRow,
} from '../../types/api'
import type { QuerySlice } from '../../types/ui'
import {
  formatKg,
  formatKgCompact,
  formatMonthLong,
  formatMonthShort,
  formatPercent,
  formatUsd,
  formatUsdCompact,
} from '../../lib/format'
import { SectionCard } from '../../components/ui/SectionCard'
import { Segmented } from '../../components/ui/Segmented'
import {
  EmptyState,
  ErrorState,
  Skeleton,
} from '../../components/ui/States'

const CHART_COLORS = [
  '#5b2480',
  '#06b6d4',
  '#10b981',
  '#f59e0b',
  '#dc3d30',
  '#7b40a3',
  '#3b82f6',
  '#64748b',
]

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
  fontSize: 12,
}

const axisTick = { fill: '#94a3b8', fontSize: 11 }

interface ChartsSectionProps {
  mensual: QuerySlice<Page<MensualRow>>
  paises: QuerySlice<Page<PaisOrigenRow>>
  tipos: QuerySlice<Page<TipoImportacionRow>>
  importadores: QuerySlice<Page<ImportadorRow>>
  soloPrincipales: boolean
  onSoloPrincipalesChange: (value: boolean) => void
}

export function ChartsSection({
  mensual,
  paises,
  tipos,
  importadores,
  soloPrincipales,
  onSoloPrincipalesChange,
}: ChartsSectionProps) {
  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
      <MonthlyCard query={mensual} />
      <TipoCard
        query={tipos}
        soloPrincipales={soloPrincipales}
        onSoloPrincipalesChange={onSoloPrincipalesChange}
      />
      <PaisesCard query={paises} />
      <ImportadoresCard query={importadores} />
    </div>
  )
}

function MonthlyCard({ query }: { query: QuerySlice<Page<MensualRow>> }) {
  const [metric, setMetric] = useState<'valor_usd' | 'volumen_kg'>('valor_usd')
  const data = (query.data?.items ?? []).filter(
    (row): row is MensualRow & { mes: string } => Boolean(row.mes),
  )

  return (
    <SectionCard
      title="Evolución mensual"
      subtitle="Valor importado y volumen por mes"
      className="xl:col-span-3"
      actions={
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {[
            { key: 'valor_usd', label: 'Valor USD' },
            { key: 'volumen_kg', label: 'Volumen kg' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                setMetric(option.key as 'valor_usd' | 'volumen_kg')
              }
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                metric === option.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
      bodyClassName="p-4 pt-5"
    >
      {query.isLoading ? (
        <Skeleton className="h-[272px] w-full" />
      ) : query.isError ? (
        <ErrorState message={query.error?.message ?? 'Error desconocido'} onRetry={query.refetch} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sin serie mensual"
          description="No hay operaciones para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <div className="h-[272px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="monthlyFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b2480" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#5b2480" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="mes"
                tickFormatter={(value) => formatMonthShort(String(value))}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                minTickGap={18}
              />
              <YAxis
                tickFormatter={(value) =>
                  metric === 'valor_usd'
                    ? formatUsdCompact(Number(value))
                    : formatKgCompact(Number(value))
                }
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelFormatter={(label) => formatMonthLong(String(label))}
                formatter={(value) => [
                  metric === 'valor_usd'
                    ? formatUsd(Number(value))
                    : formatKg(Number(value)),
                  metric === 'valor_usd' ? 'Valor USD' : 'Volumen',
                ]}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#5b2480"
                strokeWidth={2.25}
                fill="url(#monthlyFill)"
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  )
}

function TipoCard({
  query,
  soloPrincipales,
  onSoloPrincipalesChange,
}: {
  query: QuerySlice<Page<TipoImportacionRow>>
  soloPrincipales: boolean
  onSoloPrincipalesChange: (value: boolean) => void
}) {
  const data = (query.data?.items ?? []).filter(
    (row) => row.valor_usd != null && row.valor_usd > 0,
  )
  const total = data.reduce((sum, row) => sum + (row.valor_usd ?? 0), 0)

  return (
    <SectionCard
      title="Tipo de importación"
      subtitle={
        soloPrincipales
          ? 'Agrupado: depósito fiscal vs importación definitiva'
          : 'Todos los regímenes registrados'
      }
      bodyClassName="p-4 pt-5"
      actions={
        <Segmented
          ariaLabel="Nivel de detalle del tipo de importación"
          options={[
            { value: 'principales', label: 'Agrupado' },
            { value: 'todos', label: 'Todos' },
          ]}
          value={soloPrincipales ? 'principales' : 'todos'}
          onChange={(value) => onSoloPrincipalesChange(value === 'principales')}
        />
      }
    >
      {query.isLoading ? (
        <Skeleton className="h-[272px] w-full" />
      ) : query.isError ? (
        <ErrorState message={query.error?.message ?? 'Error desconocido'} onRetry={query.refetch} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={PieChartIcon}
          title="Sin regímenes"
          description="No hay datos para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <div className="flex h-full flex-col">
          <div className="relative h-[190px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="valor_usd"
                  nameKey="tipo_importacion"
                  innerRadius={56}
                  outerRadius={84}
                  paddingAngle={2}
                  stroke="none"
                  isAnimationActive={false}
                >
                  {data.map((row, index) => (
                    <Cell
                      key={row.tipo_importacion ?? index}
                      fill={CHART_COLORS[index % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value) => [formatUsd(Number(value)), 'Valor USD']}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] uppercase tracking-wide text-slate-400">
                Total
              </span>
              <span className="text-sm font-semibold text-slate-900">
                {formatUsdCompact(total)}
              </span>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {data.map((row, index) => (
              <li
                key={row.tipo_importacion ?? index}
                className="flex items-center gap-2 text-xs"
              >
                <span
                  className="size-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                  }}
                />
                <span className="min-w-0 flex-1 truncate text-slate-600">
                  {row.tipo_importacion ?? 'Sin clasificar'}
                </span>
                <span className="shrink-0 font-medium text-slate-700 tabular-nums">
                  {formatPercent(row.pct_total)}
                </span>
              </li>
            ))}
          </ul>
          {soloPrincipales && (
            <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
              Solo se incluyen depósito fiscal e importación definitiva; el total
              agrupado puede ser menor al KPI global. Usa «Todos» para ver los demás
              regímenes.
            </p>
          )}
        </div>
      )}
    </SectionCard>
  )
}

function PaisesCard({ query }: { query: QuerySlice<Page<PaisOrigenRow>> }) {
  const data = (query.data?.items ?? []).filter(
    (row) => row.pais_origen && row.valor_usd != null,
  )

  return (
    <SectionCard
      title="Principales países de origen"
      subtitle="Participación por valor importado"
      bodyClassName="p-4 pt-2"
    >
      {query.isLoading ? (
        <div className="space-y-3 py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState message={query.error?.message ?? 'Error desconocido'} onRetry={query.refetch} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Globe2}
          title="Sin países de origen"
          description="No hay datos para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <ol className="divide-y divide-slate-100">
          {data.map((row) => (
            <li key={row.pais_origen} className="py-2.5">
              <div className="flex items-baseline justify-between gap-2">
                <p
                  className="truncate text-xs font-medium text-slate-700"
                  title={row.pais_origen ?? ''}
                >
                  {row.pais_origen}
                </p>
                <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                  {formatUsdCompact(row.valor_usd)}
                </span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-linear-to-r from-aqua-600 to-cyan-400"
                    style={{
                      width: `${Math.max(2, row.pct_total ?? 0)}%`,
                    }}
                  />
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-aqua-700 tabular-nums">
                  {formatPercent(row.pct_total)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  )
}

function ImportadoresCard({
  query,
}: {
  query: QuerySlice<Page<ImportadorRow>>
}) {
  const data = (query.data?.items ?? []).filter(
    (row) => row.importador && row.valor_usd != null,
  )
  const max = Math.max(...data.map((row) => row.valor_usd ?? 0), 1)

  return (
    <SectionCard
      title="Top importadores"
      subtitle="Participación sobre el valor total"
      bodyClassName="p-4 pt-2"
    >
      {query.isLoading ? (
        <div className="space-y-3 py-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState message={query.error?.message ?? 'Error desconocido'} onRetry={query.refetch} />
      ) : data.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Sin importadores"
          description="No hay datos para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <ol className="divide-y divide-slate-100">
          {data.map((row, index) => (
            <li key={row.importador} className="py-2.5">
              <div className="flex items-center gap-2.5">
                <span className="grid size-6 shrink-0 place-items-center rounded-md bg-slate-50 text-[11px] font-semibold text-slate-500">
                  {index + 1}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className="truncate text-xs font-medium text-slate-700"
                      title={row.importador ?? ''}
                    >
                      {row.importador}
                    </p>
                    <span className="shrink-0 text-[11px] font-semibold text-brand-700 tabular-nums">
                      {formatPercent(row.pct_total)}
                    </span>
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-linear-to-r from-brand-600 to-brand-400"
                        style={{ width: `${Math.max(3, ((row.valor_usd ?? 0) / max) * 100)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[10px] text-slate-400 tabular-nums">
                      {formatUsdCompact(row.valor_usd)}
                    </span>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}
    </SectionCard>
  )
}
