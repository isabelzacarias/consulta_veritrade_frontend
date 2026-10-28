import { useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  keepPreviousData,
  useIsFetching,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  BarChart3,
  ChartLine,
  Database,
  GitCompareArrows,
  Table2,
  Upload,
  type LucideIcon,
} from 'lucide-react'
import type { ComprasFilters, ComprasOrder, ComprasTab } from '@/types/compras'
import { api } from '@/services/api'
import { formatNumber } from '@/lib/format'
import { comprasSearchParams, parseComprasRoute } from '@/lib/viewRoutes'
import { AppHeader } from '@/components/layout/AppHeader'
import { ComprasFilters as ComprasFilterBar } from '@/features/compras/components/ComprasFilters'
import { ComprasKpis } from '@/features/compras/components/ComprasKpis'
import { ComprasCharts } from '@/features/compras/components/ComprasCharts'
import { ComprasTable } from '@/features/compras/components/ComprasTable'
import { ComparativoTab } from '@/features/compras/tabs/ComparativoTab'
import { PreciosTab } from '@/features/compras/tabs/PreciosTab'
import { ImportComprasDialog } from '@/features/compras/dialogs/ImportComprasDialog'

const TABS: Array<{ id: ComprasTab; label: string; icon: LucideIcon }> = [
  { id: 'graficas', label: 'Gráficas', icon: BarChart3 },
  { id: 'precios', label: 'Precios', icon: ChartLine },
  { id: 'comparativo', label: 'Comparativo', icon: GitCompareArrows },
  { id: 'tabla', label: 'Tabla', icon: Table2 },
]

export function ComprasPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const { filters, tab: activeTab } = useMemo(
    () => parseComprasRoute(searchParams),
    [searchParams],
  )
  const [draft, setDraft] = useState<ComprasFilters>(filters)
  const filtersKey = JSON.stringify(filters)
  const lastFiltersKey = useRef(filtersKey)
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)
  const [orderBy, setOrderBy] = useState<ComprasOrder>('fecha')
  const [desc, setDesc] = useState(true)
  const [importOpen, setImportOpen] = useState(false)

  useEffect(() => {
    if (lastFiltersKey.current !== filtersKey) {
      lastFiltersKey.current = filtersKey
      setDraft(filters)
      setPage(1)
    }
  }, [filters, filtersKey])

  const meta = useQuery({
    queryKey: ['compras', 'meta'],
    queryFn: ({ signal }) => api.comprasMeta(signal),
    staleTime: 5 * 60_000,
  })

  const kpis = useQuery({
    queryKey: ['compras', 'kpis', filters],
    queryFn: ({ signal }) => api.comprasKpis(filters, signal),
    placeholderData: keepPreviousData,
  })

  const mensual = useQuery({
    queryKey: ['compras', 'mensual', filters],
    queryFn: ({ signal }) => api.comprasMensual(filters, signal),
    placeholderData: keepPreviousData,
  })

  const categorias = useQuery({
    queryKey: ['compras', 'categorias', filters],
    queryFn: ({ signal }) => api.comprasCategorias(filters, 8, signal),
    placeholderData: keepPreviousData,
  })

  const proveedores = useQuery({
    queryKey: ['compras', 'proveedores', filters],
    queryFn: ({ signal }) => api.comprasProveedores(filters, 8, signal),
    placeholderData: keepPreviousData,
  })

  const articulos = useQuery({
    queryKey: ['compras', 'articulos', filters, page, pageSize, orderBy, desc],
    queryFn: ({ signal }) =>
      api.comprasArticulos(
        filters,
        { page, pageSize, orderBy, desc },
        signal,
      ),
    placeholderData: keepPreviousData,
  })

  const activeCount = Object.values(filters).filter(Boolean).length
  const isRefreshing =
    useIsFetching({ predicate: (query) => query.queryKey[0] === 'compras' }) > 0

  const applyFilters = () => {
    setSearchParams(comprasSearchParams(draft, activeTab))
    setPage(1)
  }

  const clearFilters = () => {
    setDraft({})
    setSearchParams(comprasSearchParams({}, activeTab))
    setPage(1)
  }

  const setActiveTab = (tab: ComprasTab) => {
    setSearchParams(comprasSearchParams(filters, tab))
  }

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['compras'] })
  }

  const reloadAfterImport = () => {
    void queryClient.invalidateQueries({ queryKey: ['compras'] })
  }

  const lastUpdated = kpis.dataUpdatedAt
    ? new Intl.DateTimeFormat('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(kpis.dataUpdatedAt))
    : null

  const showEmptyDatabase =
    kpis.data != null && kpis.data.registros === 0 && activeCount === 0

  return (
    <div className="horbis-canvas min-h-screen text-slate-900">
      <AppHeader
        title="Compras HORBIS"
        subtitle="Compras por artículo · HORBIS INNOTRADE"
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        onImport={() => setImportOpen(true)}
        importLabel="Importar compras"
        updatedAt={lastUpdated}
      />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Panel de compras
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Compras por artículo de HORBIS INNOTRADE, con clasificación nacional
              e internacional y todos los importes en MXN.
            </p>
          </div>
          {lastUpdated && (
            <p className="text-[11px] text-slate-400">
              Datos actualizados a las {lastUpdated}
            </p>
          )}
        </div>

        {showEmptyDatabase && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-aqua-200 bg-linear-to-r from-aqua-50 to-white px-5 py-4">
            <div className="flex items-start gap-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-aqua-700 shadow-sm ring-1 ring-aqua-100">
                <Database className="size-4" />
              </span>
              <div>
                <p className="text-sm font-medium text-aqua-900">
                  Aún no hay compras cargadas
                </p>
                <p className="mt-0.5 text-xs text-aqua-700">
                  Importa el CSV de compras por artículo para construir el panel y
                  habilitar los filtros.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-aqua-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-aqua-700"
            >
              <Upload className="size-3.5" />
              Cargar CSV
            </button>
          </div>
        )}

        <ComprasFilterBar
          draft={draft}
          onChange={setDraft}
          onApply={applyFilters}
          onClear={clearFilters}
          meta={meta.data}
          activeCount={activeCount}
          loading={isRefreshing}
        />

        <ComprasKpis
          kpis={kpis.data}
          isLoading={kpis.isLoading}
          error={kpis.error}
          onRetry={kpis.refetch}
        />

        <nav
          role="tablist"
          aria-label="Secciones de compras"
          className="flex gap-1 overflow-x-auto rounded-xl border border-brand-200/60 bg-white/90 p-1 shadow-sm shadow-brand-900/5"
        >
          {TABS.map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-medium transition ${
                  active
                    ? 'bg-linear-to-r from-brand-700 to-brand-500 text-white shadow-md shadow-brand-900/20'
                    : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
                }`}
              >
                <Icon className="size-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {activeTab === 'graficas' && (
          <ComprasCharts
            mensual={mensual}
            categorias={categorias}
            proveedores={proveedores}
            kpis={kpis.data}
          />
        )}

        {activeTab === 'precios' && (
          <PreciosTab
            key={`precios-${filtersKey}`}
            filters={filters}
            anios={meta.data?.anios ?? []}
          />
        )}

        {activeTab === 'comparativo' && (
          <ComparativoTab
            key={`comparativo-${filtersKey}`}
            filters={filters}
          />
        )}

        {activeTab === 'tabla' && (
          <ComprasTable
            query={articulos}
            filters={filters}
            page={page}
            pageSize={pageSize}
            orderBy={orderBy}
            desc={desc}
            isFetching={articulos.isFetching}
            onOrderChange={(nextOrder, nextDesc) => {
              setOrderBy(nextOrder)
              setDesc(nextDesc)
              setPage(1)
            }}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size)
              setPage(1)
            }}
          />
        )}

        <footer className="flex flex-wrap items-center justify-between gap-2 pb-4 text-[11px] text-slate-400">
          <p>
            Consumiendo{' '}
            <code className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-slate-500">
              /compras
            </code>{' '}
            del backend FastAPI. Importes en pesos mexicanos (MXN).
          </p>
          <p>
            {formatNumber(kpis.data?.registros)} compras en el conjunto actual
          </p>
        </footer>
      </main>

      <ImportComprasDialog
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={reloadAfterImport}
      />
    </div>
  )
}
