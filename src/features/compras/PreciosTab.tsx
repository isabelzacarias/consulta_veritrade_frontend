import { useEffect, useState } from 'react'
import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { ChartLine, Info } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { ComprasFilters } from '../../types/compras'
import { api } from '../../services/api'
import {
  formatDecimal,
  formatMonthLong,
  formatMonthShort,
  formatMxn,
  formatMxnDetailed,
  formatNumber,
} from '../../lib/format'
import { SectionCard } from '../../components/ui/SectionCard'
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/States'

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

export function PreciosTab({ filters, anios }: PreciosTabProps) {
  const [anio, setAnio] = useState<number | undefined>(anios[0])
  const [descripcion, setDescripcion] = useState<string | undefined>()

  const precios = useQuery({
    queryKey: ['compras', 'precios', filters, anio],
    queryFn: ({ signal }) =>
      api.comprasPrecios(filters, { anio, top: 100 }, signal),
    placeholderData: keepPreviousData,
  })

  const mensual = useQuery({
    queryKey: ['compras', 'precios-mensual', filters, descripcion, anio],
    queryFn: ({ signal }) =>
      api.comprasPrecioMensual(
        filters,
        { descripcion: descripcion ?? '', anio },
        signal,
      ),
    enabled: Boolean(descripcion),
    placeholderData: keepPreviousData,
  })

  const productos = precios.data ?? []
  const producto = productos.find((item) => item.descripcion === descripcion)

  useEffect(() => {
    if (anios.length > 0 && (anio === undefined || !anios.includes(anio))) {
      setAnio(anios[0])
    }
  }, [anios, anio])

  useEffect(() => {
    if (productos.length === 0) {
      if (descripcion) setDescripcion(undefined)
      return
    }
    if (!descripcion || !productos.some((item) => item.descripcion === descripcion)) {
      setDescripcion(productos[0].descripcion)
    }
  }, [productos, descripcion])

  const serie = mensual.data ?? []
  const precioAnual = producto?.precio_promedio_mxn ?? null

  return (
    <div className="space-y-4">
      <SectionCard
        title="Precio promedio anual por producto"
        subtitle="Precio ponderado por cantidad: importe MXN ÷ cantidad. Las filas sin cantidad se excluyen."
        bodyClassName=""
        actions={
          anios.length > 0 ? (
            <label className="inline-flex items-center gap-2 text-[11px] text-slate-500">
              Año
              <select
                className={selectClass}
                value={anio ?? ''}
                onChange={(event) => setAnio(Number(event.target.value))}
              >
                {anios.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          ) : null
        }
      >
        {precios.isError && !precios.data ? (
          <ErrorState
            message={precios.error?.message ?? 'Error desconocido'}
            onRetry={precios.refetch}
          />
        ) : precios.isLoading && !precios.data ? (
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
                    const activo = item.descripcion === descripcion
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
        title="Evolución mensual del precio promedio"
        subtitle={
          producto
            ? `${producto.descripcion} · ${producto.anio}`
            : 'Selecciona un producto de la tabla'
        }
        bodyClassName="p-4 pt-5"
        actions={
          producto ? (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
              <ChartLine className="size-3" />
              {formatNumber(producto.meses)} meses con compras
            </span>
          ) : null
        }
      >
        {!producto ? (
          <EmptyState
            icon={ChartLine}
            title="Selecciona un producto"
            description="Elige un producto de la tabla para ver cómo cambió su precio promedio mes a mes."
            className="py-20"
          />
        ) : mensual.isError && !mensual.data ? (
          <ErrorState
            message={mensual.error?.message ?? 'Error desconocido'}
            onRetry={mensual.refetch}
          />
        ) : mensual.isLoading && !mensual.data ? (
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
            <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Dato
                label="Precio promedio anual"
                value={formatMxnDetailed(precioAnual)}
              />
              <Dato label="Importe del año" value={formatMxn(producto.importe_mxn)} />
              <Dato
                label="Cantidad del año"
                value={formatDecimal(producto.cantidad)}
              />
              <Dato
                label="Compras registradas"
                value={formatNumber(producto.registros)}
              />
            </div>
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
                  <Tooltip
                    contentStyle={tooltipStyle}
                    labelFormatter={(label) => formatMonthLong(String(label))}
                    formatter={(value) => [
                      formatMxnDetailed(Number(value)),
                      'Precio promedio',
                    ]}
                  />
                  {precioAnual != null && (
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
                  <Line
                    type="monotone"
                    dataKey="precio_promedio_mxn"
                    name="Precio promedio"
                    stroke="#5b2480"
                    strokeWidth={2.25}
                    dot={{ r: 3, strokeWidth: 1, fill: '#fff' }}
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-800">
              <Info className="mt-0.5 size-3.5 shrink-0" />
              Cada punto es el precio ponderado del mes (importe ÷ cantidad). La
              línea punteada marca el promedio ponderado del año completo.
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
