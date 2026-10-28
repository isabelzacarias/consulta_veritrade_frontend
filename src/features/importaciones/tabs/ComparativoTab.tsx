import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  GitCompareArrows,
  Info,
  Minus,
} from 'lucide-react'
import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type {
  AnalisisMetric,
  ComparativoDimension,
  ComparativoEstado,
  ComparativoOrder,
  Filters,
} from '@/types/importaciones'
import { api } from '@/services/api'
import {
  formatKg,
  formatMonthLong,
  formatNumber,
  formatPercent,
  formatSignedPercent,
  formatSignedPp,
  formatUsd,
} from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

const DIMENSION_OPTIONS: Array<{
  value: ComparativoDimension
  label: string
}> = [
  { value: 'partida', label: 'Partida arancelaria' },
  { value: 'pais_origen', label: 'País de origen' },
  { value: 'importador', label: 'Importador' },
  { value: 'exportador', label: 'Proveedor' },
]

const ORDER_OPTIONS: Array<{ value: ComparativoOrder; label: string }> = [
  { value: 'delta_abs', label: 'Mayor cambio' },
  { value: 'delta_pp', label: 'Mayor cambio de participación' },
  { value: 'valor_actual', label: 'Mayor valor actual' },
]

const selectClass =
  'h-9 w-full rounded-lg border border-brand-200/80 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15'

const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brand-700/70'

const chartTooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
  fontSize: 12,
}

const axisTick = { fill: '#94a3b8', fontSize: 11 }

interface ChartDatum {
  label: string
  detalle: string | null
  variacion: number | null
  delta: number | null
  actual: number | null
  previo: number | null
  estado: ComparativoEstado
}

const estadoStyles: Record<ComparativoEstado, string> = {
  sube: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  baja: 'border-rose-200 bg-rose-50 text-rose-700',
  nuevo: 'border-aqua-200 bg-aqua-50 text-aqua-700',
  desaparece: 'border-amber-200 bg-amber-50 text-amber-700',
  sin_cambio: 'border-slate-200 bg-slate-50 text-slate-600',
}

const estadoLabels: Record<ComparativoEstado, string> = {
  sube: 'Sube',
  baja: 'Baja',
  nuevo: 'Nuevo',
  desaparece: 'Desaparece',
  sin_cambio: 'Sin cambio',
}

export function ComparativoTab({ filters }: { filters: Filters }) {
  const [dimension, setDimension] = useState<ComparativoDimension>('partida')
  const [metrica, setMetrica] = useState<AnalisisMetric>('valor_usd')
  const [orderBy, setOrderBy] = useState<ComparativoOrder>('delta_abs')
  const [mes, setMes] = useState<string | undefined>()
  const [comparar, setComparar] = useState<string | undefined>()

  const query = useQuery({
    queryKey: [
      'comparativo',
      filters,
      dimension,
      metrica,
      orderBy,
      mes,
      comparar,
    ],
    queryFn: ({ signal }) =>
      api.comparativo(
        filters,
        { dimension, metrica, orderBy, mes, comparar },
        signal,
      ),
    placeholderData: keepPreviousData,
  })

  const data = query.data
  const items = data?.items ?? []
  const periodos = data?.periodos ?? []

  const compararOptions = [...periodos]
  if (
    data &&
    !compararOptions.some((periodo) => periodo.mes === data.periodo_anterior.mes)
  ) {
    compararOptions.unshift(data.periodo_anterior)
  }

  const mesValue = mes ?? data?.periodo.mes ?? ''
  const compararValue = comparar ?? data?.periodo_anterior.mes ?? ''

  const totalActual = data?.total_actual ?? 0
  const totalPrevio = data?.total_previo ?? 0
  const variacionTotal =
    totalPrevio > 0 ? ((totalActual - totalPrevio) * 100) / totalPrevio : null

  const chartData: ChartDatum[] = items.map((item) => ({
    label: item.etiqueta,
    detalle: item.detalle,
    variacion: item.variacion_pct,
    delta: item.delta_pp,
    actual: item.valor_actual,
    previo: item.valor_previo,
    estado: item.estado,
  }))

  const formatoMetrica = (value: number | null | undefined) =>
    metrica === 'valor_usd' ? formatUsd(value) : formatKg(value)
  return (
    <div className="space-y-4">
      <SectionCard
        title="Comparativo mensual"
        subtitle="Variación de valor y cambio de participación entre dos meses calendario"
        bodyClassName="p-4 pt-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="comparativo-dimension" className={labelClass}>
              Dimensión
            </label>
            <select
              id="comparativo-dimension"
              className={selectClass}
              value={dimension}
              onChange={(event) =>
                setDimension(event.target.value as ComparativoDimension)
              }
            >
              {DIMENSION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="comparativo-mes" className={labelClass}>
              Mes analizado
            </label>
            <select
              id="comparativo-mes"
              className={selectClass}
              value={mesValue}
              onChange={(event) => setMes(event.target.value)}
              disabled={periodos.length === 0}
            >
              {periodos.map((periodo) => (
                <option key={periodo.mes} value={periodo.mes}>
                  {formatMonthLong(periodo.mes)}
                  {periodo.completo ? '' : ' · incompleto'}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="comparativo-comparar" className={labelClass}>
              Comparar contra
            </label>
            <select
              id="comparativo-comparar"
              className={selectClass}
              value={compararValue}
              onChange={(event) => setComparar(event.target.value)}
              disabled={compararOptions.length === 0}
            >
              {compararOptions.map((periodo) => (
                <option key={periodo.mes} value={periodo.mes}>
                  {formatMonthLong(periodo.mes)}
                  {periodo.registros === 0 ? ' · sin datos' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <span className={labelClass}>Métrica</span>
            <Segmented
              ariaLabel="Métrica del comparativo"
              options={[
                { value: 'valor_usd', label: 'Valor USD' },
                { value: 'volumen_kg', label: 'Volumen kg' },
              ]}
              value={metrica}
              onChange={setMetrica}
              className="h-9"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="w-full sm:w-auto sm:min-w-64">
            <label htmlFor="comparativo-orden" className={labelClass}>
              Orden del top
            </label>
            <select
              id="comparativo-orden"
              className={selectClass}
              value={orderBy}
              onChange={(event) =>
                setOrderBy(event.target.value as ComparativoOrder)
              }
            >
              {ORDER_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="max-w-2xl space-y-1.5 text-[11px] leading-relaxed text-slate-500">
            <p>
              La participación se calcula dentro de cada mes. Los filtros de fecha
              global no aplican aquí; el mes se elige con los selectores.
            </p>
            {dimension === 'exportador' && (
              <p className="flex items-start gap-1.5 text-sky-700">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Se excluyen las operaciones sin proveedor identificado; el total
                corresponde a los proveedores comparables.
              </p>
            )}
          </div>
        </div>

        {query.isError && !data ? (
          <ErrorState
            message={query.error?.message ?? 'Error desconocido'}
            onRetry={query.refetch}
            className="py-10"
          />
        ) : query.isLoading && !data ? (
          <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-20 w-full" />
            ))}
          </div>
        ) : (
          <>
            <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Stat
                label="Total del mes"
                value={formatoMetrica(totalActual)}
                hint={data ? formatMonthLong(data.periodo.mes) : '—'}
              />
              <Stat
                label="Mes anterior"
                value={formatoMetrica(totalPrevio)}
                hint={data ? formatMonthLong(data.periodo_anterior.mes) : '—'}
              />
              <Stat
                label="Variación total"
                value={formatSignedPercent(variacionTotal)}
                hint="Contra el mes anterior"
                tone={
                  variacionTotal == null
                    ? 'neutral'
                    : variacionTotal >= 0
                      ? 'up'
                      : 'down'
                }
              />
              <Stat
                label="Registros del mes"
                value={formatNumber(data?.periodo.registros)}
                hint={`${formatNumber(data?.total_items)} actores comparados`}
              />
            </div>

            {(filters.fecha_desde || filters.fecha_hasta) && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-800">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                El rango de fechas del panel no se usa en este comparativo. Los
                demás filtros sí se aplican.
              </p>
            )}
            {data && !data.periodo.completo && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {formatMonthLong(data.periodo.mes)} está incompleto en el conjunto
                de datos. Interpreta la variación con cautela.
              </p>
            )}
            {data &&
              data.periodo_anterior.registros === 0 && (
                <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                  <Info className="mt-0.5 size-3.5 shrink-0" />
                  El mes de comparación no tiene datos para estos filtros; los
                  actores aparecen como nuevos.
                </p>
              )}
          </>
        )}
      </SectionCard>

      {data && items.length > 0 && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <BarsCard
              title="Variación de valor"
              subtitle={
                metrica === 'valor_usd'
                  ? 'Cambio porcentual en USD contra el mes anterior'
                  : 'Cambio porcentual en kg contra el mes anterior'
              }
              dataKey="variacion"
              data={chartData.filter((item) => item.variacion != null)}
              formatter={(value) => formatSignedPercent(value)}
            />
            <BarsCard
              title="Cambio de participación"
              subtitle="Diferencia en puntos porcentuales dentro del total de cada mes"
              dataKey="delta"
              data={chartData.filter((item) => item.delta != null)}
              formatter={(value) => formatSignedPp(value)}
            />
          </div>

          <SectionCard
            title="Detalle del comparativo"
            subtitle="El top se ordena por el criterio seleccionado; la tabla conserva el signo de cada cambio"
            bodyClassName=""
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1120px] border-collapse text-left text-xs">
                <thead>
                  <tr className="border-b border-brand-100 bg-brand-50/70 text-[10px] font-semibold uppercase tracking-wide text-brand-700/80">
                    <th className="w-10 px-4 py-2.5">#</th>
                    <th className="px-4 py-2.5">Dimensión</th>
                    <th className="px-4 py-2.5 text-right">
                      {metrica === 'valor_usd' ? 'Valor actual' : 'Volumen actual'}
                    </th>
                    <th className="px-4 py-2.5 text-right">
                      {metrica === 'valor_usd' ? 'Valor previo' : 'Volumen previo'}
                    </th>
                    <th className="px-4 py-2.5 text-right">Variación</th>
                    <th className="px-4 py-2.5 text-right">Share actual</th>
                    <th className="px-4 py-2.5 text-right">Δ participación</th>
                    <th className="px-4 py-2.5 text-right">Registros</th>
                    <th className="px-4 py-2.5">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, index) => (
                    <tr
                      key={item.clave}
                      className="transition even:bg-slate-50/50 hover:bg-brand-50/50"
                    >
                      <td className="px-4 py-2.5 text-slate-400 tabular-nums">
                        {index + 1}
                      </td>
                      <td className="max-w-[320px] px-4 py-2.5">
                        <p
                          className="truncate font-medium text-slate-800"
                          title={item.etiqueta}
                        >
                          {item.etiqueta}
                        </p>
                        {item.detalle && (
                          <p
                            className="truncate text-[11px] text-slate-400"
                            title={item.detalle}
                          >
                            {item.detalle}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-700 tabular-nums">
                        {formatoMetrica(item.valor_actual)}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500 tabular-nums">
                        {formatoMetrica(item.valor_previo)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right whitespace-nowrap font-medium tabular-nums ${
                          item.variacion_pct == null
                            ? 'text-slate-400'
                            : item.variacion_pct > 0
                              ? 'text-emerald-600'
                              : item.variacion_pct < 0
                                ? 'text-rose-600'
                                : 'text-slate-500'
                        }`}
                      >
                        {item.variacion_pct == null
                          ? 'Nuevo'
                          : formatSignedPercent(item.variacion_pct)}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-600 tabular-nums">
                        {formatPercent(item.share_actual)}
                      </td>
                      <td
                        className={`px-4 py-2.5 text-right whitespace-nowrap font-medium tabular-nums ${
                          item.delta_pp == null
                            ? 'text-slate-400'
                            : item.delta_pp > 0
                              ? 'text-emerald-600'
                              : item.delta_pp < 0
                                ? 'text-rose-600'
                                : 'text-slate-500'
                        }`}
                      >
                        {formatSignedPp(item.delta_pp)}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500 tabular-nums">
                        <span className="block">
                          {formatNumber(item.registros_actual)} /{' '}
                          {formatNumber(item.registros_previo)}
                        </span>
                        {!item.muestra_suficiente && (
                          <span className="mt-0.5 inline-flex rounded border border-amber-200 bg-amber-50 px-1 py-0.5 text-[9px] font-medium text-amber-700">
                            Muestra baja
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${estadoStyles[item.estado]}`}
                        >
                          <EstadoIcon estado={item.estado} />
                          {estadoLabels[item.estado]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              Mostrando {items.length} de {formatNumber(data.total_items)} actores.
              La columna de variación usa porcentaje; la de participación usa
              puntos porcentuales.
            </p>
          </SectionCard>
        </>
      )}

      {data && items.length === 0 && (
        <SectionCard title="Sin movimientos" bodyClassName="p-0">
          <EmptyState
            icon={GitCompareArrows}
            title="No hay actores para comparar"
            description="Prueba con otro mes, otra dimensión o menos filtros."
          />
        </SectionCard>
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  hint,
  tone = 'neutral',
}: {
  label: string
  value: string
  hint: string
  tone?: 'neutral' | 'up' | 'down'
}) {
  const valueClass =
    tone === 'up'
      ? 'text-emerald-600'
      : tone === 'down'
        ? 'text-rose-600'
        : 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className={`mt-1 text-lg font-semibold tracking-tight tabular-nums ${valueClass}`}>
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>
    </div>
  )
}

function EstadoIcon({ estado }: { estado: ComparativoEstado }) {
  if (estado === 'sube' || estado === 'nuevo') {
    return <ArrowUpRight className="size-3" />
  }
  if (estado === 'baja' || estado === 'desaparece') {
    return <ArrowDownRight className="size-3" />
  }
  return <Minus className="size-3" />
}

function BarsCard({
  title,
  subtitle,
  dataKey,
  data,
  formatter,
}: {
  title: string
  subtitle: string
  dataKey: 'variacion' | 'delta'
  data: ChartDatum[]
  formatter: (value: number) => string
}) {
  const height = Math.max(280, Math.min(460, data.length * 28 + 70))

  return (
    <SectionCard title={title} subtitle={subtitle} bodyClassName="p-4 pt-4">
      {data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sin datos para graficar"
          description="Los actores nuevos o sin base previa aparecen en la tabla."
          className="py-14"
        />
      ) : (
        <div style={{ height }} className="w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 20, left: 4, bottom: 4 }}
            >
              <CartesianGrid
                stroke="#e2e8f0"
                strokeDasharray="3 3"
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(value) =>
                  dataKey === 'delta'
                    ? formatSignedPp(Number(value))
                    : formatSignedPercent(Number(value))
                }
                tick={axisTick}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={150}
                tick={axisTick}
                axisLine={false}
                tickLine={false}
                tickFormatter={(value) =>
                  String(value).length > 24
                    ? `${String(value).slice(0, 23)}…`
                    : String(value)
                }
              />
              <Tooltip
                contentStyle={chartTooltipStyle}
                formatter={(value) => [
                  formatter(Number(value)),
                  dataKey === 'delta' ? 'Cambio de participación' : 'Variación',
                ]}
                labelFormatter={(label, payload) => {
                  const detalle = payload?.[0]?.payload?.detalle as
                    | string
                    | null
                    | undefined
                  return detalle ? `${label} · ${detalle}` : String(label)
                }}
              />
              <ReferenceLine x={0} stroke="#94a3b8" />
              <Bar dataKey={dataKey} radius={[0, 4, 4, 0]} isAnimationActive={false}>
                {data.map((item) => (
                  <Cell
                    key={`${item.label}-${item.estado}`}
                    fill={
                      (item[dataKey] ?? 0) >= 0
                        ? dataKey === 'delta'
                          ? '#06b6d4'
                          : '#5b2480'
                        : '#dc3d30'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="mt-1 text-[10px] text-slate-400">
            {data.length} actores con base comparable. Los actores nuevos,
            desaparecidos o con muestra baja se detallan en la tabla.
          </p>
        </div>
      )}
    </SectionCard>
  )
}
