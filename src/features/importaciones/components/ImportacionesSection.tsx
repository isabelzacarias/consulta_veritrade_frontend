import {
  ChevronLeft,
  ChevronRight,
  Download,
  Eye,
  FileSpreadsheet,
  Loader2,
  Search,
} from 'lucide-react'
import type { FormEvent } from 'react'
import type { Filters, Importacion } from '@/types/importaciones'
import type { Page, QuerySlice } from '@/types/common'
import { api } from '@/services/api'
import { formatDate, formatKg, formatNumber, formatUsd } from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { Combobox2 } from '@/components/ui/Combobox2'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

interface ImportacionesSectionProps {
  query: QuerySlice<Page<Importacion>>
  filters: Filters
  page: number
  pageSize: number
  searchDraft: string
  appliedSearch: string
  isFetching: boolean
  onSearchDraftChange: (value: string) => void
  onSearch: () => void
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
  onSelect: (importacion: Importacion) => void
}

export function ImportacionesSection({
  query,
  filters,
  page,
  pageSize,
  searchDraft,
  appliedSearch,
  isFetching,
  onSearchDraftChange,
  onSearch,
  onPageChange,
  onPageSizeChange,
  onSelect,
}: ImportacionesSectionProps) {
  const data = query.data
  const items = data?.items ?? []
  const pages = data?.pages ?? 0

  const exportFilters = { ...filters, q: appliedSearch || undefined }

  const submitSearch = (event: FormEvent) => {
    event.preventDefault()
    onSearch()
  }

  return (
    <SectionCard
      title="Operaciones de importación"
      subtitle="Detalle paginado de los registros que cumplen los filtros."
      bodyClassName=""
      actions={
        <div className="flex flex-wrap items-center gap-2">
          {isFetching && (
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-400">
              <Loader2 className="size-3.5 animate-spin" />
              Actualizando
            </span>
          )}
          <a
            href={api.exportUrl('importaciones', 'xlsx', exportFilters)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="size-3.5" />
            XLSX
          </a>
          <a
            href={api.exportUrl('importaciones', 'csv', exportFilters)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            <Download className="size-3.5" />
            CSV
          </a>
        </div>
      }
    >
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={submitSearch} className="flex w-full items-center gap-2 sm:max-w-md">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchDraft}
              onChange={(event) => onSearchDraftChange(event.target.value)}
              placeholder="Buscar en la descripción comercial…"
              className="h-9 w-full rounded-lg border border-slate-200 bg-white pr-3 pl-9 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
            />
          </div>
          <button
            type="submit"
            className="h-9 shrink-0 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Buscar
          </button>
        </form>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <label htmlFor="page-size">Filas por página</label>
          <Combobox2
            id="page-size"
            value={String(pageSize)}
            onChange={(value) => onPageSizeChange(Number(value))}
            options={[10, 25, 50, 100].map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            wrapperClassName="inline-block w-auto"
            className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-xs text-slate-700 outline-none focus:border-brand-500"
            ariaLabel="Filas por página"
          />
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-2 p-5">
          {Array.from({ length: 8 }).map((_, index) => (
            <Skeleton key={index} className="h-10 w-full" />
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
          title="No se encontraron operaciones"
          description={
            appliedSearch
              ? `No hay resultados para “${appliedSearch}”. Prueba con otro término o limpia la búsqueda.`
              : 'Ajusta los filtros o carga un archivo Excel desde el botón «Importar datos».'
          }
        />
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-brand-100 bg-brand-50/70 text-[10px] font-semibold uppercase tracking-wide text-brand-700/80">
                  <th className="px-4 py-2.5">Fecha</th>
                  <th className="px-4 py-2.5">Partida / descripción</th>
                  <th className="px-4 py-2.5">Importador</th>
                  <th className="px-4 py-2.5">Proveedor</th>
                  <th className="px-4 py-2.5">Origen</th>
                  <th className="px-4 py-2.5">Aduana</th>
                  <th className="px-4 py-2.5 text-right">Volumen</th>
                  <th className="px-4 py-2.5 text-right">Valor USD</th>
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelect(item)}
                    className="group cursor-pointer transition even:bg-slate-50/50 hover:bg-brand-50/60"
                  >
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                      {formatDate(item.fecha)}
                    </td>
                    <td className="max-w-[260px] px-4 py-2.5">
                      <p className="font-mono text-[11px] font-medium text-slate-700">
                        {item.partida_arancelaria}
                      </p>
                      <p
                        className="truncate text-[11px] text-slate-400"
                        title={item.descripcion_partida ?? ''}
                      >
                        {item.descripcion_partida ?? 'Sin descripción'}
                      </p>
                    </td>
                    <td className="max-w-[200px] px-4 py-2.5">
                      <p
                        className="truncate font-medium text-slate-700"
                        title={item.importador ?? ''}
                      >
                        {item.importador ?? '—'}
                      </p>
                      <p className="truncate text-[11px] text-slate-400">
                        {item.estado_importador ?? ''}
                      </p>
                    </td>
                    <td
                      className="max-w-[190px] truncate px-4 py-2.5 text-slate-600"
                      title={item.exportador ?? ''}
                    >
                      {item.exportador ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-slate-600">
                      {item.pais_origen ?? '—'}
                    </td>
                    <td className="max-w-[150px] truncate px-4 py-2.5 text-slate-600">
                      {item.aduana ?? '—'}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right text-slate-600 tabular-nums">
                      {formatKg(item.qty1)}
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap text-right font-semibold text-slate-800 tabular-nums">
                      {formatUsd(item.valor_total_usd)}
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex size-7 items-center justify-center rounded-md text-slate-400 transition group-hover:text-brand-700 hover:bg-brand-100/60 hover:text-brand-700">
                        <Eye className="size-3.5" />
                        <span className="sr-only">Ver detalle</span>
                      </span>
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
              de <span className="font-medium text-slate-700">{formatNumber(data?.total)}</span>{' '}
              operaciones
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
                <span className="font-medium text-slate-900">{Math.max(pages, 1)}</span>
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
