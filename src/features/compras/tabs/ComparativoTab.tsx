import { useMemo, useState } from 'react'
import { keepPreviousData, useQueries } from '@tanstack/react-query'
import {
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  GitCompareArrows,
  Info,
  Minus,
} from 'lucide-react'
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
  ComprasComparativoDimension,
  ComprasComparativoEstado,
  ComprasComparativoMetric,
  ComprasComparativoOrder,
  CompraComparativoItem,
  CompraComparativoResult,
  ComprasFilters,
} from '@/types/compras'
import { api } from '@/services/api'
import {
  formatDecimal,
  formatMonthLong,
  formatMxn,
  formatMxnCompact,
  formatMxnDetailed,
  formatNumber,
  formatPercent,
  formatSignedPercent,
  formatSignedPp,
} from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { ChartDownloadButton } from '@/components/ui/ChartDownloadButton'
import { Combobox2 } from '@/components/ui/Combobox2'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

const DIMENSION_OPTIONS: Array<{
  value: ComprasComparativoDimension
  label: string
}> = [
  { value: 'descripcion', label: 'Producto' },
  { value: 'categoria', label: 'Categoría' },
  { value: 'proveedor', label: 'Proveedor' },
]

const METRIC_OPTIONS: Array<{
  value: ComprasComparativoMetric
  label: string
}> = [
  { value: 'importe_mxn', label: 'Importe MXN' },
  { value: 'cantidad', label: 'Cantidad' },
  { value: 'precio_promedio_mxn', label: 'Precio prom.' },
]

const ORDER_OPTIONS: Array<{
  value: ComprasComparativoOrder
  label: string
}> = [
  { value: 'delta_abs', label: 'Mayor cambio' },
  { value: 'delta_pp', label: 'Mayor cambio de participación' },
  { value: 'valor_actual', label: 'Mayor valor actual' },
]

const selectClass =
  'h-9 w-full rounded-lg border border-brand-200/80 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15'

const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brand-700/70'

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
  fontSize: 12,
}

const axisTick = { fill: '#94a3b8', fontSize: 11 }

const estadoStyles: Record<ComprasComparativoEstado, string> = {
  sube: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  baja: 'border-rose-200 bg-rose-50 text-rose-700',
  nuevo: 'border-aqua-200 bg-aqua-50 text-aqua-700',
  desaparece: 'border-amber-200 bg-amber-50 text-amber-700',
  sin_cambio: 'border-slate-200 bg-slate-50 text-slate-600',
}

const estadoLabels: Record<ComprasComparativoEstado, string> = {
  sube: 'Sube',
  baja: 'Baja',
  nuevo: 'Nuevo',
  desaparece: 'Desaparece',
  sin_cambio: 'Sin cambio',
}

function formatMetric(
  value: number | null | undefined,
  metrica: ComprasComparativoMetric,
) {
  if (metrica === 'importe_mxn') return formatMxn(value)
  if (metrica === 'precio_promedio_mxn') return formatMxnDetailed(value)
  return formatDecimal(value)
}

function formatSignedMetric(
  value: number | null | undefined,
  metrica: ComprasComparativoMetric,
) {
  if (value == null) return '—'
  const formatted = formatMetric(value, metrica)
  return value > 0 ? `+${formatted}` : formatted
}

function formatAxisMetric(
  value: number,
  metrica: ComprasComparativoMetric,
) {
  if (metrica === 'importe_mxn') return formatMxnCompact(value)
  if (metrica === 'precio_promedio_mxn') return formatMxn(value)
  return formatDecimal(value)
}

export function ComparativoTab({
  filters,
}: {
  filters: ComprasFilters
}) {
  const [dimension, setDimension] =
    useState<ComprasComparativoDimension>('descripcion')
  const [metrica, setMetrica] =
    useState<ComprasComparativoMetric>('importe_mxn')
  const [orderBy, setOrderBy] =
    useState<ComprasComparativoOrder>('delta_abs')
  const [mes, setMes] = useState<string | undefined>()
  const [comparar, setComparar] = useState<string | undefined>()

  const esPrecio = metrica === 'precio_promedio_mxn'
  const orderByEfectivo: ComprasComparativoOrder =
    esPrecio && orderBy === 'delta_pp' ? 'delta_abs' : orderBy

  const selectedDescriptions = [...new Set(filters.descripcion ?? [])]
  const descriptionsToQuery =
    selectedDescriptions.length > 0 ? selectedDescriptions : [undefined]
  const queries = useQueries({
    queries: descriptionsToQuery.map((description) => ({
      queryKey: [
        'compras',
        'comparativo',
        filters,
        description,
        dimension,
        metrica,
        orderByEfectivo,
        mes,
        comparar,
      ],
      queryFn: ({ signal }) =>
        api.comprasComparativo(
          description ? { ...filters, descripcion: [description] } : filters,
          {
            dimension,
            metrica,
            orderBy: orderByEfectivo,
            mes,
            comparar,
            top: 200,
          },
          signal,
        ),
      placeholderData: keepPreviousData,
    })),
  })

  const successfulResults = queries
    .map((query) => query.data)
    .filter((result): result is CompraComparativoResult => result != null)
  const queryError = queries.find((query) => query.isError && !query.data)
  const queryLoading = queries.some(
    (query) => query.isLoading && !query.data,
  )
  const data = useMemo<CompraComparativoResult | undefined>(() => {
    const first = successfulResults[0]
    if (!first) return undefined

    const grouped = new Map<string, CompraComparativoItem>()
    for (const result of successfulResults) {
      for (const item of result.items) {
        const current = grouped.get(item.clave)
        if (current) {
          current.valor_actual =
            metrica === 'precio_promedio_mxn'
              ? null
              : (current.valor_actual ?? 0) + (item.valor_actual ?? 0)
          current.valor_previo =
            metrica === 'precio_promedio_mxn'
              ? null
              : (current.valor_previo ?? 0) + (item.valor_previo ?? 0)
          current.registros_actual += item.registros_actual
          current.registros_previo += item.registros_previo
          current.importe_actual =
            current.importe_actual != null && item.importe_actual != null
              ? current.importe_actual + item.importe_actual
              : null
          current.importe_previo =
            current.importe_previo != null && item.importe_previo != null
              ? current.importe_previo + item.importe_previo
              : null
          current.cantidad_actual =
            current.cantidad_actual != null && item.cantidad_actual != null
              ? current.cantidad_actual + item.cantidad_actual
              : null
          current.cantidad_previo =
            current.cantidad_previo != null && item.cantidad_previo != null
              ? current.cantidad_previo + item.cantidad_previo
              : null
          current.detalle ??= item.detalle
        } else {
          grouped.set(item.clave, { ...item })
        }
      }
    }

    let items = [...grouped.values()].map((item) => {
      const valorActual =
        metrica === 'precio_promedio_mxn'
          ? item.cantidad_actual != null && item.cantidad_actual > 0
            ? (item.importe_actual ?? 0) / item.cantidad_actual
            : item.valor_actual
          : item.valor_actual ?? 0
      const valorPrevio =
        metrica === 'precio_promedio_mxn'
          ? item.cantidad_previo != null && item.cantidad_previo > 0
            ? (item.importe_previo ?? 0) / item.cantidad_previo
            : item.valor_previo
          : item.valor_previo ?? 0
      const delta = valorActual != null && valorPrevio != null
        ? valorActual - valorPrevio
        : null
      const variacion =
        valorActual == null || valorPrevio == null
          ? null
          : valorPrevio > 0
            ? ((valorActual - valorPrevio) * 100) / valorPrevio
            : valorActual > 0
              ? null
              : 0
      const shareActual =
        metrica !== 'precio_promedio_mxn' &&
        valorActual != null &&
        (first.total_actual ?? 0) > 0
          ? (valorActual * 100) / (first.total_actual ?? 0)
          : null
      const sharePrevio =
        metrica !== 'precio_promedio_mxn' &&
        valorPrevio != null &&
        (first.total_previo ?? 0) > 0
          ? (valorPrevio * 100) / (first.total_previo ?? 0)
          : null
      const estado: ComprasComparativoEstado =
        valorActual == null || valorPrevio == null
          ? 'sin_cambio'
          : valorPrevio <= 0
            ? valorActual > 0
              ? 'nuevo'
              : 'sin_cambio'
            : valorActual <= 0
              ? 'desaparece'
              : Math.abs(((valorActual - valorPrevio) * 100) / valorPrevio) <
                  1e-9
                ? 'sin_cambio'
                : valorActual > valorPrevio
                  ? 'sube'
                  : 'baja'
      return {
        ...item,
        valor_actual: valorActual,
        valor_previo: valorPrevio,
        delta_abs: delta,
        variacion_pct: variacion,
        share_actual: shareActual,
        share_previo: sharePrevio,
        delta_pp:
          shareActual != null && sharePrevio != null
            ? shareActual - sharePrevio
            : null,
        estado,
        muestra_suficiente:
          item.registros_actual >= first.min_registros &&
          item.registros_previo >= first.min_registros,
      }
    })

    const weightedPriceAvailable = successfulResults.every(
      (result) =>
        result.importe_total_actual != null &&
        result.importe_total_previo != null &&
        result.cantidad_total_actual != null &&
        result.cantidad_total_previo != null,
    )
    const actualAmount = successfulResults.reduce(
      (sum, result) => sum + (result.importe_total_actual ?? 0),
      0,
    )
    const previousAmount = successfulResults.reduce(
      (sum, result) => sum + (result.importe_total_previo ?? 0),
      0,
    )
    const actualQuantity = successfulResults.reduce(
      (sum, result) => sum + (result.cantidad_total_actual ?? 0),
      0,
    )
    const previousQuantity = successfulResults.reduce(
      (sum, result) => sum + (result.cantidad_total_previo ?? 0),
      0,
    )
    const totalActual =
      metrica === 'precio_promedio_mxn'
        ? weightedPriceAvailable && actualQuantity > 0
          ? actualAmount / actualQuantity
          : successfulResults.length === 1
            ? first.total_actual
            : null
        : successfulResults.reduce(
            (sum, result) => sum + (result.total_actual ?? 0),
            0,
          )
    const totalPrevio =
      metrica === 'precio_promedio_mxn'
        ? weightedPriceAvailable && previousQuantity > 0
          ? previousAmount / previousQuantity
          : successfulResults.length === 1
            ? first.total_previo
            : null
        : successfulResults.reduce(
            (sum, result) => sum + (result.total_previo ?? 0),
            0,
          )
    for (const item of items) {
      if (metrica === 'precio_promedio_mxn') continue
      item.share_actual =
        totalActual && item.valor_actual != null
          ? (item.valor_actual * 100) / totalActual
          : null
      item.share_previo =
        totalPrevio && item.valor_previo != null
          ? (item.valor_previo * 100) / totalPrevio
          : null
      item.delta_pp =
        item.share_actual != null && item.share_previo != null
          ? item.share_actual - item.share_previo
          : null
    }

    const order = (item: CompraComparativoItem) =>
      orderByEfectivo === 'delta_pp'
        ? Math.abs(item.delta_pp ?? 0)
        : orderByEfectivo === 'valor_actual'
          ? item.valor_actual ?? 0
          : Math.abs(item.delta_abs ?? 0)
    items = items.sort((a, b) => order(b) - order(a))
    const periodosPorMes = new Map<
      string,
      CompraComparativoResult['periodo']
    >()
    for (const result of successfulResults) {
      for (const periodo of result.periodos) {
        const current = periodosPorMes.get(periodo.mes)
        if (current) {
          current.registros += periodo.registros
          current.completo = current.completo && periodo.completo
        } else {
          periodosPorMes.set(periodo.mes, { ...periodo })
        }
      }
    }
    const periodos = [...periodosPorMes.values()].sort((a, b) =>
      a.mes.localeCompare(b.mes),
    )

    const aggregatePeriod = (
      key: 'periodo' | 'periodo_anterior',
    ): CompraComparativoResult['periodo'] => ({
      ...first[key],
      registros: successfulResults.reduce(
        (sum, result) => sum + result[key].registros,
        0,
      ),
      completo: successfulResults.every((result) => result[key].completo),
    })

    return {
      ...first,
      periodo: aggregatePeriod('periodo'),
      periodo_anterior: aggregatePeriod('periodo_anterior'),
      periodos,
      total_actual: totalActual,
      total_previo: totalPrevio,
      items: items.slice(0, 25),
      total_items: items.length,
    }
  }, [successfulResults, metrica, orderByEfectivo])
  const query = {
    isError: Boolean(queryError),
    isLoading: queryLoading,
    error: queryError?.error,
    refetch: () => Promise.all(queries.map((item) => item.refetch())),
  }
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

  const totalActual = data?.total_actual ?? null
  const totalPrevio = data?.total_previo ?? null
  const variacionTotal =
    totalPrevio != null && totalActual != null && totalPrevio > 0
      ? ((totalActual - totalPrevio) * 100) / totalPrevio
      : null
  const faltaPonderacionPrecio =
    esPrecio &&
    selectedDescriptions.length > 1 &&
    successfulResults.some(
      (result) =>
        result.importe_total_actual == null ||
        result.importe_total_previo == null ||
        result.cantidad_total_actual == null ||
        result.cantidad_total_previo == null,
    )

  const chartData = items
    .filter((item) => item.delta_abs != null)
    .slice(0, 12)
    .map((item) => ({
      label: item.etiqueta,
      detalle: item.detalle,
      delta: item.delta_abs,
      estado: item.estado,
    }))

  const orders = esPrecio
    ? ORDER_OPTIONS.filter((option) => option.value !== 'delta_pp')
    : ORDER_OPTIONS

  return (
    <div className="space-y-4">
      <SectionCard
        title="Comparativo mensual de compras"
        subtitle="Variación de importe, cantidad o precio promedio entre dos meses calendario"
        bodyClassName="p-4 pt-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <label htmlFor="compras-comparativo-dimension" className={labelClass}>
              Dimensión
            </label>
            <Combobox2
              id="compras-comparativo-dimension"
              className={selectClass}
              value={dimension}
              onChange={(value) =>
                setDimension(value as ComprasComparativoDimension)
              }
              options={DIMENSION_OPTIONS.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          <div>
            <label htmlFor="compras-comparativo-mes" className={labelClass}>
              Mes analizado
            </label>
            <Combobox2
              id="compras-comparativo-mes"
              className={selectClass}
              value={mesValue}
              onChange={setMes}
              disabled={periodos.length === 0}
              options={periodos.map((periodo) => ({
                value: periodo.mes,
                label: `${formatMonthLong(periodo.mes)}${
                  periodo.completo ? '' : ' · incompleto'
                }`,
              }))}
            />
          </div>

          <div>
            <label htmlFor="compras-comparativo-comparar" className={labelClass}>
              Comparar contra
            </label>
            <Combobox2
              id="compras-comparativo-comparar"
              className={selectClass}
              value={compararValue}
              onChange={setComparar}
              disabled={compararOptions.length === 0}
              options={compararOptions.map((periodo) => ({
                value: periodo.mes,
                label: `${formatMonthLong(periodo.mes)}${
                  periodo.registros === 0 ? ' · sin datos' : ''
                }`,
              }))}
            />
          </div>

          <div>
            <span className={labelClass}>Métrica</span>
            <Segmented
              ariaLabel="Métrica del comparativo de compras"
              options={METRIC_OPTIONS}
              value={metrica}
              onChange={setMetrica}
              className="h-9"
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div className="w-full sm:w-auto sm:min-w-64">
            <label htmlFor="compras-comparativo-orden" className={labelClass}>
              Orden del top
            </label>
            <Combobox2
              id="compras-comparativo-orden"
              className={selectClass}
              value={orderByEfectivo}
              onChange={(value) =>
                setOrderBy(value as ComprasComparativoOrder)
              }
              options={orders.map((option) => ({
                value: option.value,
                label: option.label,
              }))}
            />
          </div>

          <div className="max-w-2xl space-y-1.5 text-[11px] leading-relaxed text-slate-500">
            <p>
              La participación se calcula dentro de cada mes. Los filtros de fecha
              global no aplican aquí; el mes se elige con los selectores.
            </p>
            {esPrecio && (
              <p className="flex items-start gap-1.5 text-sky-700">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                El precio se pondera por cantidad. Compara productos con la misma
                unidad de compra para que la variación sea interpretable.
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
                label={esPrecio ? 'Precio del mes' : 'Total del mes'}
                value={formatMetric(totalActual, metrica)}
                hint={data ? formatMonthLong(data.periodo.mes) : '—'}
              />
              <Stat
                label="Mes anterior"
                value={formatMetric(totalPrevio, metrica)}
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
            {faltaPonderacionPrecio && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                Para combinar precios promedio de varios productos, actualiza el
                backend y vuelve a cargarlo. Los importes y cantidades sí se
                comparan de forma agregada.
              </p>
            )}
            {data && !data.periodo.completo && (
              <p className="mt-3 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] leading-relaxed text-amber-800">
                <Info className="mt-0.5 size-3.5 shrink-0" />
                {formatMonthLong(data.periodo.mes)} está incompleto en el conjunto
                de datos. Interpreta la variación con cautela.
              </p>
            )}
            {data && data.periodo_anterior.registros === 0 && (
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
          <SectionCard
            title="Diferencia absoluta"
            subtitle={
              esPrecio
                ? 'Cambio de precio promedio contra el mes anterior'
                : metrica === 'importe_mxn'
                  ? 'Cambio de importe MXN contra el mes anterior'
                  : 'Cambio de cantidad contra el mes anterior'
            }
            bodyClassName="p-4 pt-4"
            actions={
              chartData.length > 0 ? (
                <ChartDownloadButton fileName="diferencia-absoluta-compras" />
              ) : null
            }
          >
            {chartData.length === 0 ? (
              <EmptyState
                icon={BarChart3}
                title="Sin cambios para graficar"
                description="Los actores nuevos o sin base previa aparecen en la tabla."
                className="py-14"
              />
            ) : (
              <div
                className="w-full"
                style={{
                  height: Math.max(280, Math.min(460, chartData.length * 28 + 70)),
                }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartData}
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
                        formatAxisMetric(Number(value), metrica)
                      }
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      type="category"
                      dataKey="label"
                      width={170}
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                      tickFormatter={(value) =>
                        String(value).length > 25
                          ? `${String(value).slice(0, 24)}…`
                          : String(value)
                      }
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value) => [
                        formatSignedMetric(Number(value), metrica),
                        'Diferencia',
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
                    <Bar dataKey="delta" radius={[0, 4, 4, 0]} isAnimationActive={false}>
                      {chartData.map((item) => (
                        <Cell
                          key={`${item.label}-${item.estado}`}
                          fill={(item.delta ?? 0) >= 0 ? '#5b2480' : '#dc3d30'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </SectionCard>

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
                    <th className="px-4 py-2.5 text-right">Actual</th>
                    <th className="px-4 py-2.5 text-right">Previo</th>
                    <th className="px-4 py-2.5 text-right">Variación</th>
                    {esPrecio ? (
                      <th className="px-4 py-2.5 text-right">Δ precio</th>
                    ) : (
                      <>
                        <th className="px-4 py-2.5 text-right">Share actual</th>
                        <th className="px-4 py-2.5 text-right">Δ participación</th>
                      </>
                    )}
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
                        {formatMetric(item.valor_actual, metrica)}
                      </td>
                      <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500 tabular-nums">
                        {formatMetric(item.valor_previo, metrica)}
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
                      {esPrecio ? (
                        <td
                          className={`px-4 py-2.5 text-right whitespace-nowrap font-medium tabular-nums ${
                            (item.delta_abs ?? 0) > 0
                              ? 'text-emerald-600'
                              : (item.delta_abs ?? 0) < 0
                                ? 'text-rose-600'
                                : 'text-slate-500'
                          }`}
                        >
                          {formatSignedMetric(item.delta_abs, metrica)}
                        </td>
                      ) : (
                        <>
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
                        </>
                      )}
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
      <p
        className={`mt-1 text-lg font-semibold tracking-tight tabular-nums ${valueClass}`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-[10px] text-slate-400">{hint}</p>
    </div>
  )
}

function EstadoIcon({ estado }: { estado: ComprasComparativoEstado }) {
  if (estado === 'sube' || estado === 'nuevo') {
    return <ArrowUpRight className="size-3" />
  }
  if (estado === 'baja' || estado === 'desaparece') {
    return <ArrowDownRight className="size-3" />
  }
  return <Minus className="size-3" />
}
