import { useState } from 'react'
import {
  keepPreviousData,
  useIsFetching,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import {
  Database,
  GitCompareArrows,
  Grid3X3,
  LayoutDashboard,
  MessageCircleQuestion,
  PackageSearch,
  Ship,
  Table2,
  Upload,
  Users,
  type LucideIcon,
} from 'lucide-react'
import type { Filters, PanelTab } from '../../types/api'
import { api } from '../../services/api'
import { formatNumber } from '../../lib/format'
import { FilterBar } from './FilterBar'
import { KpisSection } from './KpisSection'
import { UploadDialog } from './UploadDialog'
import { ResumenTab } from './tabs/ResumenTab'
import { ImportadoresTab } from './tabs/ImportadoresTab'
import { ProveedoresTab } from './tabs/ProveedoresTab'
import { ProductosTab } from './tabs/ProductosTab'
import { OperacionesTab } from './tabs/OperacionesTab'
import { PreguntasTab } from './tabs/PreguntasTab'
import { ComparativoTab } from './tabs/ComparativoTab'
import { MatrizTab } from './tabs/MatrizTab'
import { ChatWidget } from '../chatbot/ChatWidget'
import { AppHeader } from '../../components/AppHeader'

const TABS: Array<{ id: PanelTab; label: string; icon: LucideIcon }> = [
  { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
  { id: 'importadores', label: 'Importadores', icon: Users },
  { id: 'proveedores', label: 'Proveedores', icon: Ship },
  { id: 'productos', label: 'Productos y costos', icon: PackageSearch },
  { id: 'comparativo', label: 'Comparativo', icon: GitCompareArrows },
  { id: 'matriz', label: 'Matriz', icon: Grid3X3 },
  { id: 'operaciones', label: 'Operaciones', icon: Table2 },
  { id: 'preguntas', label: 'Preguntas', icon: MessageCircleQuestion },
]

export function PanelPage() {
  const queryClient = useQueryClient()

  const [draft, setDraft] = useState<Filters>({})
  const [filters, setFilters] = useState<Filters>({})
  const [activeTab, setActiveTab] = useState<PanelTab>('resumen')
  const [uploadOpen, setUploadOpen] = useState(false)

  const aduanas = useQuery({
    queryKey: ['meta', 'aduanas'],
    queryFn: ({ signal }) => api.aduanas(signal),
    staleTime: 5 * 60_000,
  })

  const paises = useQuery({
    queryKey: ['meta', 'paises'],
    queryFn: ({ signal }) => api.paises(signal),
    staleTime: 5 * 60_000,
  })

  const partidas = useQuery({
    queryKey: ['meta', 'partidas'],
    queryFn: ({ signal }) => api.partidas(signal),
    staleTime: 5 * 60_000,
  })

  const kpis = useQuery({
    queryKey: ['kpis', filters],
    queryFn: ({ signal }) => api.kpis(filters, signal),
    placeholderData: keepPreviousData,
  })

  const activeCount = Object.values(filters).filter(Boolean).length

  const isRefreshing =
    useIsFetching({
      predicate: (query) => query.queryKey[0] !== 'health',
    }) > 0

  const applyFilters = () => {
    setFilters({ ...draft })
  }

  const clearFilters = () => {
    setDraft({})
    setFilters({})
  }

  const refresh = () => {
    void queryClient.invalidateQueries()
  }

  const reloadAfterUpload = () => {
    void queryClient.invalidateQueries()
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
        title="Veritrade Analytics"
        subtitle="Observatorio de importaciones · México"
        isRefreshing={isRefreshing}
        onRefresh={refresh}
        onImport={() => setUploadOpen(true)}
        importLabel="Importar datos"
        updatedAt={lastUpdated}
      />

      <main className="mx-auto max-w-[1600px] space-y-4 px-4 py-6 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-slate-900">
              Panel de importaciones
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Importadores, proveedores, costos y productos conectados directamente a
              la API de Veritrade.
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
                  La base de datos aún no tiene registros
                </p>
                <p className="mt-0.5 text-xs text-aqua-700">
                  Importa un Excel de Veritrade para procesarlo y cargarlo a MySQL sin
                  salir del panel.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setUploadOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-aqua-600 px-3.5 py-2 text-xs font-medium text-white transition hover:bg-aqua-700"
            >
              <Upload className="size-3.5" />
              Cargar Excel
            </button>
          </div>
        )}

        <FilterBar
          draft={draft}
          onChange={setDraft}
          onApply={applyFilters}
          onClear={clearFilters}
          aduanas={aduanas.data ?? []}
          paises={paises.data ?? []}
          partidas={partidas.data ?? []}
          activeCount={activeCount}
          loading={isRefreshing}
        />

        <KpisSection
          kpis={kpis.data}
          isLoading={kpis.isLoading}
          error={kpis.error}
          onRetry={kpis.refetch}
        />

        <nav
          role="tablist"
          aria-label="Secciones del panel"
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

        {activeTab === 'resumen' && <ResumenTab filters={filters} />}
        {activeTab === 'importadores' && <ImportadoresTab filters={filters} />}
        {activeTab === 'proveedores' && <ProveedoresTab filters={filters} />}
        {activeTab === 'productos' && (
          <ProductosTab
            key={`productos-${JSON.stringify(filters)}`}
            filters={filters}
          />
        )}
        {activeTab === 'comparativo' && (
          <ComparativoTab
            key={`comparativo-${JSON.stringify(filters)}`}
            filters={filters}
          />
        )}
        {activeTab === 'matriz' && <MatrizTab filters={filters} />}
        {activeTab === 'operaciones' && (
          <OperacionesTab
            key={`operaciones-${JSON.stringify(filters)}`}
            filters={filters}
          />
        )}
        {activeTab === 'preguntas' && <PreguntasTab filters={filters} />}

        <footer className="flex flex-wrap items-center justify-between gap-2 pb-4 text-[11px] text-slate-400">
          <p>
            Consumiendo{' '}
            <code className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-slate-500">
              /reportes
            </code>
            ,{' '}
            <code className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-slate-500">
              /importaciones
            </code>{' '}
            y{' '}
            <code className="rounded bg-slate-200/70 px-1.5 py-0.5 font-mono text-slate-500">
              /consulta
            </code>{' '}
            del backend FastAPI.
          </p>
          <p>{formatNumber(kpis.data?.registros)} operaciones en el conjunto actual</p>
        </footer>
      </main>

      <UploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onLoaded={reloadAfterUpload}
      />

      <ChatWidget />
    </div>
  )
}
