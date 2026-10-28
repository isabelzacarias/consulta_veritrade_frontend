import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react'
import type {
  CompraArticulo,
  ComprasFilters,
  ComprasOrder,
} from '@/types/compras'
import type { Page, QuerySlice } from '@/types/common'
import { api } from '@/services/api'
import {
  formatDate,
  formatDecimal,
  formatMxn,
  formatMxnDetailed,
  formatNumber,
} from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

interface ComprasTableProps {
  query: QuerySlice<Page<CompraArticulo>>
  filters: ComprasFilters
  page: number
  pageSize: number
  orderBy: ComprasOrder
  desc: boolean
  isFetching: boolean
  onOrderChange: (orderBy: ComprasOrder, desc: boolean) => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}

const ORDER_OPTIONS: Array<{
  value: string
  label: string
  orderBy: ComprasOrder
  desc: boolean
}> = [
  { value: 'fecha-desc', label: 'Fecha más reciente', orderBy: 'fecha', desc: true },
  {
    value: 'importe-desc',
    label: 'Importe mayor',
    orderBy: 'importe_mxn',
    desc: true,
  },
  {
    value: 'precio-desc',
    label: 'Precio unitario mayor',
    orderBy: 'precio_unitario_mxn',
    desc: true,
  },
  {
    value: 'cantidad-desc',
    label: 'Cantidad mayor',
    orderBy: 'cantidad',
    desc: true,
  },
  {
    value: 'proveedor-asc',
    label: 'Proveedor (A–Z)',
    orderBy: 'proveedor',
    desc: false,
  },
]

export function ComprasTable({
  query,
  filters,
  page,
  pageSize,
  orderBy,
  desc,
  isFetching,
  onOrderChange,
  onPageChange,
  onPageSizeChange,
}: ComprasTableProps) {
  const data = query.data
  const items = data?.items ?? []
  const pages = data?.pages ?? 0
  const ordenActual = `${orderBy}-${desc ? 'desc' : 'asc'}`

  return (
    <SectionCard
      title="Detalle de compras por artículo"
      subtitle="La cantidad se muestra tal como viene en el CSV; puede mezclar kilogramos y piezas."
      bodyClassName=""
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {isFetching && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <Loader2 className="size-3.5 animate-spin" />
              Actualizando
            </span>
          )}
          <label htmlFor="compras-orden" className="sr-only">
            Ordenar compras
          </label>
          <select
            id="compras-orden"
            value={ordenActual}
            onChange={(event) => {
              const opcion = ORDER_OPTIONS.find(
                (item) => item.value === event.target.value,
              )
              if (opcion) onOrderChange(opcion.orderBy, opcion.desc)
            }}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-brand-500"
          >
            {ORDER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <a
            href={api.comprasExportUrl('xlsx', filters, orderBy, desc)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="size-3.5" />
            XLSX
          </a>
          <a
            href={api.comprasExportUrl('csv', filters, orderBy, desc)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="size-3.5" />
            CSV
          </a>
        </div>
      }
    >
      <div className="flex flex-col gap-2 border-b border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-slate-500">
          {formatNumber(data?.total)} compras con los filtros actuales
        </p>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <label htmlFor="compras-page-size">Filas por página</label>
          <select
            id="compras-page-size"
            value={pageSize}
            onChange={(event) => onPageSizeChange(Number(event.target.value))}
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-brand-500"
          >
            {[10, 25, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Error desconocido'}
          onRetry={query.refetch}
        />
      ) : items.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No se encontraron compras"
          description="Ajusta los filtros o importa un CSV de compras desde el botón «Importar compras»."
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1220px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-brand-100 bg-brand-50/70 text-[10px] font-semibold uppercase tracking-wide text-brand-700/80">
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5">Artículo</th>
                  <th className="px-4 py-2.5">Proveedor</th>
                  <th className="px-4 py-2.5">Fracción</th>
                  <th className="px-4 py-2.5 text-right">Cantidad</th>
                  <th className="px-4 py-2.5 text-right">Precio unitario</th>
                  <th className="px-4 py-2.5 text-right">Importe MXN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    className="transition even:bg-slate-50/50 hover:bg-brand-50/60"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-600">
                      {formatDate(item.fecha)}
                    </td>
                    <td className="max-w-[320px] px-4 py-2.5">
                      <p
                        className="truncate font-medium text-slate-800"
                        title={item.descripcion}
                      >
                        {item.descripcion}
                      </p>
                      <span className="mt-1 inline-flex rounded-full border border-brand-100 bg-brand-50 px-1.5 py-0.5 text-[10px] font-medium text-brand-700">
                        {item.categoria ?? 'Sin categoría'}
                      </span>
                    </td>
                    <td className="max-w-[230px] px-4 py-2.5">
                      <p
                        className="truncate font-medium text-slate-700"
                        title={item.proveedor}
                      >
                        {item.proveedor}
                      </p>
                      <span
                        className={`mt-1 inline-flex rounded-full border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide ${
                          item.ambito === 'internacional'
                            ? 'border-aqua-200 bg-aqua-50 text-aqua-700'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                        }`}
                      >
                        {item.ambito === 'internacional'
                          ? 'Internacional'
                          : 'Nacional'}
                      </span>
                    </td>
                    <td
                      className={`whitespace-nowrap px-4 py-2.5 font-mono text-[11px] ${
                        item.fraccion_valida
                          ? 'text-slate-600'
                          : 'text-slate-400'
                      }`}
                      title={
                        item.fraccion_arancelaria && !item.fraccion_valida
                          ? `Valor en CSV sin validar: ${item.fraccion_arancelaria}`
                          : undefined
                      }
                    >
                      {item.fraccion_valida
                        ? item.fraccion_arancelaria
                        : '—'}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-600 tabular-nums">
                      {formatDecimal(item.cantidad)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-600 tabular-nums">
                      {formatMxnDetailed(item.precio_unitario_mxn)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-slate-800 tabular-nums">
                      {formatMxn(item.importe_mxn)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-500">
              Mostrando{' '}
              <span className="font-medium text-slate-700">
                {formatNumber((page - 1) * pageSize + 1)}–
                {formatNumber(Math.min(page * pageSize, data?.total ?? 0))}
              </span>{' '}
              de{' '}
              <span className="font-medium text-slate-700">
                {formatNumber(data?.total)}
              </span>{' '}
              compras
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1 || isFetching}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página anterior"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="text-xs text-slate-600">
                Página <span className="font-medium text-slate-900">{page}</span> de{' '}
                <span className="font-medium text-slate-900">
                  {Math.max(pages, 1)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= pages || isFetching}
                className="inline-flex size-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Página siguiente"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </SectionCard>
  )
}
