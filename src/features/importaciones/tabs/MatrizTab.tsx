import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Info, PackageSearch } from 'lucide-react'
import { useState } from 'react'
import type {
  AnalisisMetric,
  Filters,
  MatrizColumnaKey,
} from '@/types/importaciones'
import { api } from '@/services/api'
import {
  formatKg,
  formatKgCompact,
  formatNumber,
  formatPercent,
  formatUsd,
  formatUsdCompact,
} from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { Combobox2 } from '@/components/ui/Combobox2'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

const selectClass =
  'h-9 w-full rounded-lg border border-brand-200/80 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15'

const labelClass =
  'mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-brand-700/70'

export function MatrizTab({ filters }: { filters: Filters }) {
  const [columna, setColumna] = useState<MatrizColumnaKey>('pais_origen')
  const [metrica, setMetrica] = useState<AnalisisMetric>('valor_usd')
  const [topFilas, setTopFilas] = useState(20)
  const [topColumnas, setTopColumnas] = useState(10)
  const [minRegistros, setMinRegistros] = useState(3)

  const query = useQuery({
    queryKey: [
      'matriz',
      filters,
      columna,
      metrica,
      topFilas,
      topColumnas,
      minRegistros,
    ],
    queryFn: ({ signal }) =>
      api.matriz(
        filters,
        { columna, metrica, topFilas, topColumnas, minRegistros },
        signal,
      ),
    placeholderData: keepPreviousData,
  })

  const data = query.data
  const filas = data?.filas ?? []
  const columnas = data?.columnas ?? []
  const total = data?.total ?? 0
  const celdas = new Map(
    (data?.celdas ?? []).map((celda) => [
      `${celda.fila}|${celda.columna}`,
      celda,
    ]),
  )

  const formatoMetrica = (value: number | null | undefined) =>
    metrica === 'valor_usd' ? formatUsd(value) : formatKg(value)
  const formatoCompacto = (value: number | null | undefined) =>
    metrica === 'valor_usd' ? formatUsdCompact(value) : formatKgCompact(value)

  const sinProveedor = data?.omitidos.sin_exportador ?? 0
  const nombraColumnas = columna === 'pais_origen' ? 'País de origen' : 'Proveedor'

  return (
    <div className="space-y-4">
      <SectionCard
        title={
          columna === 'pais_origen'
            ? 'Matriz producto × origen'
            : 'Matriz producto × proveedor'
        }
        subtitle={`Partidas en filas y ${nombraColumnas.toLowerCase()} en columnas. La intensidad representa la participación dentro de cada producto.`}
        bodyClassName="p-4 pt-4"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div>
            <span className={labelClass}>Columnas</span>
            <Segmented
              ariaLabel="Dimensión de las columnas de la matriz"
              options={[
                { value: 'pais_origen', label: 'País de origen' },
                { value: 'exportador', label: 'Proveedor' },
              ]}
              value={columna}
              onChange={setColumna}
              className="h-9"
            />
          </div>

          <div>
            <span className={labelClass}>Métrica</span>
            <Segmented
              ariaLabel="Métrica de la matriz"
              options={[
                { value: 'valor_usd', label: 'Valor USD' },
                { value: 'volumen_kg', label: 'Volumen kg' },
              ]}
              value={metrica}
              onChange={setMetrica}
              className="h-9"
            />
          </div>

          <div>
            <label htmlFor="matriz-top-filas" className={labelClass}>
              Productos
            </label>
            <Combobox2
              id="matriz-top-filas"
              className={selectClass}
              value={String(topFilas)}
              onChange={(value) => setTopFilas(Number(value))}
              options={[10, 20, 30, 50].map((value) => ({
                value: String(value),
                label: `Top ${value}`,
              }))}
            />
          </div>

          <div>
            <label htmlFor="matriz-top-columnas" className={labelClass}>
              {nombraColumnas}
            </label>
            <Combobox2
              id="matriz-top-columnas"
              className={selectClass}
              value={String(topColumnas)}
              onChange={(value) => setTopColumnas(Number(value))}
              options={[6, 10, 15, 20].map((value) => ({
                value: String(value),
                label: `Top ${value}`,
              }))}
            />
          </div>

          <div>
            <label htmlFor="matriz-min-registros" className={labelClass}>
              Umbral de muestra
            </label>
            <Combobox2
              id="matriz-min-registros"
              className={selectClass}
              value={String(minRegistros)}
              onChange={(value) => setMinRegistros(Number(value))}
              options={[0, 3, 5, 10].map((value) => ({
                value: String(value),
                label: value === 0 ? 'Sin mínimo' : `${value}+ operaciones`,
              }))}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[10px] text-slate-500">
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-600" />
            Mayor participación
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-brand-100" />
            Menor participación
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="size-2 rounded-sm border border-dashed border-amber-400" />
            {minRegistros > 0
              ? `Menos de ${minRegistros} operaciones`
              : 'Sin umbral de muestra'}
          </span>
          <span>{formatNumber(data?.total_registros)} operaciones en la matriz</span>
        </div>

        {columna === 'exportador' && sinProveedor > 0 && (
          <p className="mt-3 flex items-start gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 text-[11px] leading-relaxed text-sky-800">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            Se excluyen {formatNumber(sinProveedor)} operaciones sin proveedor
            identificado, igual que en los rankings de proveedores.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Mapa de calor"
        subtitle={
          metrica === 'valor_usd'
            ? 'Valor USD y porcentaje del total de cada producto'
            : 'Kilogramos y porcentaje del total de cada producto'
        }
        bodyClassName=""
      >
        {query.isLoading && !data ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : query.isError ? (
          <ErrorState
            message={query.error?.message ?? 'Error desconocido'}
            onRetry={query.refetch}
          />
        ) : filas.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Sin datos para la matriz"
            description="No hay operaciones para los filtros seleccionados."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-separate border-spacing-0 text-xs">
              <thead>
                <tr>
                  <th className="sticky left-0 z-20 min-w-[260px] border-b border-brand-100 bg-brand-50/95 px-4 py-2.5 text-left text-[10px] font-semibold uppercase tracking-wide text-brand-700/80 backdrop-blur">
                    Producto
                  </th>
                  {columnas.map((columnaItem) => {
                    const share =
                      total > 0
                        ? ((columnaItem.total ?? 0) * 100) / total
                        : null
                    return (
                      <th
                        key={columnaItem.clave}
                        className={`min-w-[108px] border-b border-l border-brand-100 px-2.5 py-2.5 text-right align-bottom text-[10px] font-semibold uppercase tracking-wide ${
                          columnaItem.es_otros
                            ? 'bg-slate-100/90 text-slate-500'
                            : 'bg-brand-50/90 text-brand-700/80'
                        }`}
                      >
                        <span
                          className="block max-w-[120px] truncate"
                          title={columnaItem.etiqueta}
                        >
                          {columnaItem.etiqueta}
                        </span>
                        <span className="mt-0.5 block text-[9px] font-normal normal-case tracking-normal text-slate-400">
                          {formatPercent(share)} del total
                        </span>
                      </th>
                    )
                  })}
                  <th className="sticky right-0 z-20 min-w-[120px] border-b border-l border-brand-100 bg-brand-50 px-3 py-2.5 text-right text-[10px] font-semibold uppercase tracking-wide text-brand-700/80 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)]">
                    Total producto
                  </th>
                </tr>
              </thead>
              <tbody>
                {filas.map((fila) => (
                  <tr key={fila.clave} className="group">
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 border-b border-slate-100 px-4 py-2.5 text-left align-top ${
                        fila.es_otros
                          ? 'bg-slate-50'
                          : 'bg-white group-hover:bg-brand-50/50'
                      }`}
                    >
                      <p
                        className="max-w-[240px] truncate text-[11px] font-semibold text-slate-800"
                        title={fila.etiqueta}
                      >
                        {fila.etiqueta}
                      </p>
                      {fila.detalle && (
                        <p
                          className="mt-0.5 max-w-[240px] truncate text-[10px] font-normal text-slate-400"
                          title={fila.detalle}
                        >
                          {fila.detalle}
                        </p>
                      )}
                      <p className="mt-0.5 text-[10px] font-normal text-slate-400 tabular-nums">
                        {formatoCompacto(fila.total)} ·{' '}
                        {formatNumber(fila.registros)} ops
                      </p>
                    </th>

                    {columnas.map((columnaItem) => {
                      const celda = celdas.get(
                        `${fila.clave}|${columnaItem.clave}`,
                      )
                      const esOtros = fila.es_otros || columnaItem.es_otros
                      const share = celda?.share_fila ?? 0
                      const registros = celda?.registros ?? 0
                      const tieneDatos = registros > 0
                      const alpha = tieneDatos
                        ? Math.min(0.62, 0.06 + (share / 100) * 0.62)
                        : 0
                      const color = esOtros ? '100, 116, 139' : '91, 36, 128'
                      const textoClaro = tieneDatos && share >= 42
                      const bajoMuestra =
                        celda != null &&
                        !celda.muestra_suficiente &&
                        registros > 0

                      return (
                        <td
                          key={`${fila.clave}-${columnaItem.clave}`}
                          className={`border-b border-l border-slate-100 px-2 py-2 text-right align-middle ${
                            bajoMuestra
                              ? 'ring-1 ring-inset ring-amber-400/70'
                              : ''
                          }`}
                          style={{
                            backgroundColor: tieneDatos
                              ? `rgba(${color}, ${alpha})`
                              : '#f8fafc',
                            color: textoClaro ? '#ffffff' : '#1e293b',
                          }}
                          title={
                            celda && tieneDatos
                              ? `${fila.etiqueta} · ${columnaItem.etiqueta}\n${formatoMetrica(celda.valor)}\n${formatNumber(registros)} operaciones · ${formatPercent(celda.share_fila)} del producto`
                              : `${fila.etiqueta} · ${columnaItem.etiqueta}\nSin operaciones`
                          }
                        >
                          {celda && tieneDatos ? (
                            <>
                              <span className="block text-[11px] font-semibold tabular-nums">
                                {formatPercent(celda.share_fila)}
                              </span>
                              <span
                                className={`mt-0.5 block text-[9px] tabular-nums ${
                                  textoClaro ? 'text-white/75' : 'text-slate-500'
                                }`}
                              >
                                {formatoCompacto(celda.valor)}
                              </span>
                              {bajoMuestra && (
                                <span
                                  className={`mt-0.5 block text-[8px] font-medium ${
                                    textoClaro
                                      ? 'text-amber-100'
                                      : 'text-amber-700'
                                  }`}
                                >
                                  muestra baja
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-[10px] text-slate-300">—</span>
                          )}
                        </td>
                      )
                    })}

                    <td className="sticky right-0 z-10 border-b border-l border-slate-100 bg-slate-100 px-3 py-2 text-right align-middle text-[11px] font-semibold text-slate-700 shadow-[-8px_0_12px_-12px_rgba(15,23,42,0.35)] tabular-nums">
                      {formatoCompacto(fila.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {data && filas.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-4 py-3 text-[10px] text-slate-400">
            <span>
              {filas.length} productos × {columnas.length} {nombraColumnas.toLowerCase()}.
              Las celdas muestran el % del total de la fila.
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-24 rounded-full bg-linear-to-r from-brand-100 to-brand-600" />
              0% → 100%
            </span>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
