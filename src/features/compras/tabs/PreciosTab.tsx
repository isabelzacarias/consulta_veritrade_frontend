import { useState } from 'react'
import { keepPreviousData, useQueries } from '@tanstack/react-query'
import { ChartLine, Info } from 'lucide-react'
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ComprasFilters } from '@/types/compras'
import { api } from '@/services/api'
import {
  formatDecimal,
  formatMonthLong,
  formatMonthShort,
  formatMxn,
  formatMxnDetailed,
  formatNumber,
} from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { ChartDownloadButton } from '@/components/ui/ChartDownloadButton'
import { Combobox2 } from '@/components/ui/Combobox2'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

interface PreciosTabProps {
  filters: ComprasFilters
  anios: number[]
}

const selectClass =
  'h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-brand-500'

const axisTick = { fill: '#94a3b8', fontSize: 11 }

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
  fontSize: 12,
}

const lineColors = [
  '#5b2480',
  '#0e7490',
  '#c2410c',
  '#2563eb',
  '#15803d',
  '#be123c',
  '#7c3aed',
  '#a16207',
]

export function PreciosTab({ filters, anios }: PreciosTabProps) {
  const [anio, setAnio] = useState<number | undefined>()
  const [descripcion, setDescripcion] = useState<string | undefined>()

  const anioEfectivo =
    anio !== undefined && anios.includes(anio) ? anio : anios[0]

  const descripcionesFiltro = [...new Set(filters.descripcion ?? [])]
  const filtrosDePrecios =
    descripcionesFiltro.length > 0 ? descripcionesFiltro : [undefined]
  const consultasPrecios = useQueries({
    queries: filtrosDePrecios.map((descripcionFiltro) => ({
      queryKey: [
        'compras',
        'precios',
        filters,
        anioEfectivo,
        descripcionFiltro,
      ],
      queryFn: ({ signal }) =>
        api.comprasPrecios(
          descripcionFiltro
            ? { ...filters, descripcion: [descripcionFiltro] }
            : filters,
          { anio: anioEfectivo, top: 100 },
          signal,
        ),
      placeholderData: keepPreviousData,
    })),
  })

  const productos = consultasPrecios.flatMap((consulta) => consulta.data ?? [])
  const errorPrecios = consultasPrecios.find(
    (consulta) => consulta.isError && !consulta.data,
  )
  const cargandoPrecios = consultasPrecios.some(
    (consulta) => consulta.isLoading && !consulta.data,
  )
  const comparandoProductos = descripcionesFiltro.length > 1
  const descripcionEfectiva =
    descripcion && productos.some((item) => item.descripcion === descripcion)
      ? descripcion
      : productos[0]?.descripcion
  const producto = productos.find(
    (item) => item.descripcion === descripcionEfectiva,
  )

  const productosGrafica = comparandoProductos
    ? productos.filter((item) => descripcionesFiltro.includes(item.descripcion))
    : producto
      ? [producto]
      : []
  const consultasMensuales = useQueries({
    queries: productosGrafica.map((item) => ({
      queryKey: [
        'compras',
        'precios-mensual',
        filters,
        item.descripcion,
        anioEfectivo,
      ],
      queryFn: ({ signal }) =>
        api.comprasPrecioMensual(
          filters,
          { descripcion: item.descripcion, anio: anioEfectivo },
          signal,
        ),
      enabled: Boolean(anioEfectivo),
      placeholderData: keepPreviousData,
    })),
  })

  const series = productosGrafica.map((item, index) => ({
    producto: item,
    dataKey: `precio_${index}`,
    color: lineColors[index % lineColors.length],
  }))
  const puntosPorMes = new Map<string, Record<string, string | number>>()
  consultasMensuales.forEach((consulta, index) => {
    for (const punto of consulta.data ?? []) {
      const datosMes = puntosPorMes.get(punto.mes) ?? { mes: punto.mes }
      datosMes[`precio_${index}`] = punto.precio_promedio_mxn ?? 0
      puntosPorMes.set(punto.mes, datosMes)
    }
  })
  const serie = [...puntosPorMes.values()].sort((a, b) =>
    String(a.mes).localeCompare(String(b.mes)),
  )
  const errorMensual = consultasMensuales.find(
    (consulta) => consulta.isError && !consulta.data,
  )
  const cargandoMensual = consultasMensuales.some(
    (consulta) => consulta.isLoading && !consulta.data,
  )
  const precioAnual = producto?.precio_promedio_mxn ?? null

  return (
    <div className="space-y-4">
      <SectionCard
        title="Precio promedio anual por producto"
        subtitle="Precio ponderado por cantidad: importe MXN ÷ cantidad. Las filas sin cantidad se excluyen."
        bodyClassName=""
        actions={
          anios.length > 0 ? (
            <div className="inline-flex items-center gap-2 text-[11px] text-slate-500">
              <label htmlFor="precios-anio">Año</label>
              <Combobox2
                id="precios-anio"
                className={selectClass}
                value={String(anioEfectivo ?? '')}
                onChange={(value) => setAnio(Number(value))}
                options={anios.map((item) => ({
                  value: String(item),
                  label: String(item),
                }))}
                wrapperClassName="inline-block w-auto"
                ariaLabel="Año"
              />
            </div>
          ) : null
        }
      >
        {errorPrecios ? (
          <ErrorState
            message={errorPrecios.error?.message ?? 'Error desconocido'}
            onRetry={() => {
              void Promise.all(
                consultasPrecios.map((consulta) => consulta.refetch()),
              )
            }}
          />
        ) : cargandoPrecios ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-11 w-full" />
            ))}
          </div>
        ) : productos.length === 0 ? (
          <EmptyState
            icon={ChartLine}
            title="Sin productos con cantidad"
            description="No hay compras con cantidad válida para el año y los filtros seleccionados."
          />
        ) : (
          <>
            <div className="max-h-[540px] overflow-auto">
              <table className="w-full min-w-[980px] border-collapse text-left text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-brand-100 bg-brand-50/95 text-[10px] font-semibold uppercase tracking-wide text-brand-700/80 backdrop-blur">
                    <th className="px-4 py-2.5">Producto</th>
                    <th className="px-4 py-2.5">Categoría</th>
                    <th className="px-4 py-2.5 text-right">Importe MXN</th>
                    <th className="px-4 py-2.5 text-right">Cantidad</th>
                    <th className="px-4 py-2.5 text-right">Precio promedio</th>
                    <th className="px-4 py-2.5 text-right">Compras</th>
                    <th className="px-4 py-2.5 text-right">Proveedores</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {productos.map((item) => {
                    const activo = productosGrafica.some(
                      (productoGrafica) =>
                        productoGrafica.descripcion === item.descripcion,
                    )
                    return (
                      <tr
                        key={item.descripcion}
                        className={
                          activo
                            ? 'bg-brand-50/80'
                            : 'transition even:bg-slate-50/50 hover:bg-brand-50/50'
                        }
                      >
                        <td className="max-w-[340px] px-4 py-2.5">
                          {comparandoProductos ? (
                            <span
                              className={`block max-w-full truncate font-medium ${
                                activo ? 'text-brand-700' : 'text-slate-800'
                              }`}
                              title={item.descripcion}
                            >
                              {item.descripcion}
                            </span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setDescripcion(item.descripcion)}
                              className={`block max-w-full truncate text-left font-medium transition ${
                                activo
                                  ? 'text-brand-700'
                                  : 'text-slate-800 hover:text-brand-700'
                              }`}
                              title={item.descripcion}
                            >
                              {item.descripcion}
                            </button>
                          )}
                        </td>
                        <td className="max-w-[190px] px-4 py-2.5">
                          <span className="truncate text-slate-500">
                            {item.categoria ?? 'Sin categoría'}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-700 tabular-nums">
                          {formatMxn(item.importe_mxn)}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-600 tabular-nums">
                          {formatDecimal(item.cantidad)}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap font-semibold text-slate-800 tabular-nums">
                          {formatMxnDetailed(item.precio_promedio_mxn)}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500 tabular-nums">
                          {formatNumber(item.registros)}
                        </td>
                        <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500 tabular-nums">
                          {formatNumber(item.proveedores)}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              Mostrando {productos.length} productos con cantidad válida. La cantidad
              puede mezclar kilogramos y piezas según el CSV; el precio se calcula
              sobre la unidad capturada.
            </p>
          </>
        )}
      </SectionCard>

      <SectionCard
        title="Evolución mensual del precio promedio por producto"
        subtitle={
          comparandoProductos
            ? `${productosGrafica.length} productos comparados · ${anioEfectivo ?? ''}`
            : producto
              ? `${producto.descripcion} · ${producto.anio}`
            : 'Selecciona un producto de la tabla'
        }
        bodyClassName="p-4 pt-5"
        actions={
          productosGrafica.length > 0 && serie.length > 0 ? (
            <>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
                <ChartLine className="size-3" />
                {formatNumber(serie.length)} meses con compras
              </span>
              <ChartDownloadButton fileName="evolucion-mensual-precio" />
            </>
          ) : null
        }
      >
        {productosGrafica.length === 0 ? (
          <EmptyState
            icon={ChartLine}
            title="Selecciona un producto"
            description="Elige un producto de la tabla para ver cómo cambió su precio promedio mes a mes."
            className="py-20"
          />
        ) : errorMensual ? (
          <ErrorState
            message={errorMensual.error?.message ?? 'Error desconocido'}
            onRetry={() => {
              void Promise.all(
                consultasMensuales.map((consulta) => consulta.refetch()),
              )
            }}
          />
        ) : cargandoMensual ? (
          <Skeleton className="h-[300px] w-full" />
        ) : serie.length === 0 ? (
          <EmptyState
            icon={ChartLine}
            title="Sin serie mensual"
            description="No hay compras con cantidad para este producto en el año seleccionado."
            className="py-20"
          />
        ) : (
          <>
            {!comparandoProductos && producto && (
              <div
                data-chart-export-footer
                className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4"
              >
                <Dato
                  label="Precio promedio anual"
                  value={formatMxnDetailed(precioAnual)}
                />
                <Dato
                  label="Importe del año"
                  value={formatMxn(producto.importe_mxn)}
                />
                <Dato
                  label="Cantidad del año"
                  value={formatDecimal(producto.cantidad)}
                />
                <Dato
                  label="Compras registradas"
                  value={formatNumber(producto.registros)}
                />
              </div>
            )}
            <div className="h-[310px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={serie}
                  margin={{ top: 8, right: 18, left: 0, bottom: 0 }}
                >
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
                    minTickGap={10}
                  />
                  <YAxis
                    tickFormatter={(value) => formatMxn(Number(value))}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={82}
                    domain={['auto', 'auto']}
                  />
                  {series.length > 1 && (
                    <Legend
                      wrapperStyle={{ fontSize: 12, paddingTop: 12 }}
                    />
                  )}
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(label) => formatMonthLong(String(label))}
                    formatter={(value, name) => [
                      formatMxnDetailed(Number(value)),
                      String(name),
                    ]}
                  />
                  {!comparandoProductos && precioAnual != null && (
                    <ReferenceLine
                      y={precioAnual}
                      stroke="#94a3b8"
                      strokeDasharray="4 4"
                      label={{
                        value: 'Promedio anual',
                        position: 'insideTopRight',
                        fill: '#94a3b8',
                        fontSize: 10,
                      }}
                    />
                  )}
                  {series.map(({ producto: item, dataKey, color }) => (
                    <Line
                      key={item.descripcion}
                      type="monotone"
                      dataKey={dataKey}
                      name={item.descripcion}
                      stroke={color}
                      strokeWidth={2.25}
                      dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                      isAnimationActive={false}
                      connectNulls
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-800">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Cada línea representa el precio ponderado mensual de un producto
              (importe ÷ cantidad).
              {!comparandoProductos &&
                ' La línea punteada marca el promedio ponderado del año completo.'}
            </p>
          </>
        )}
      </SectionCard>
    </div>
  )
}

function Dato({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 px-3.5 py-3">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <p className="mt-1 text-base font-semibold tracking-tight text-slate-900 tabular-nums">
        {value}
      </p>
    </div>
  )
}
