import { useQuery } from '@tanstack/react-query'
import { AppHeader } from '@/components/layout/AppHeader'
import { ComprasKpis } from '@/features/compras/components/ComprasKpis'
import { KpisSection } from '@/features/importaciones/components/KpisSection'
import { api } from '@/services/api'

export function DashboardPage() {
  const importacionesKpis = useQuery({
    queryKey: ['kpis', {}],
    queryFn: ({ signal }) => api.kpis({}, signal),
  })

  const comprasKpis = useQuery({
    queryKey: ['compras', 'kpis', {}],
    queryFn: ({ signal }) => api.comprasKpis({}, signal),
  })

  return (
    <div className="horbis-canvas min-h-screen text-slate-900">
      <AppHeader
        title="Veritrade Analytics"
        subtitle="Observatorio de comercio exterior · HORBIS"
      />

      <main className="mx-auto max-w-[1600px] space-y-6 px-4 py-6 sm:px-6">
        <h1 className="text-xl font-semibold tracking-tight text-slate-900">
          Dashboard
        </h1>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Importaciones
          </h2>
          <KpisSection
            kpis={importacionesKpis.data}
            isLoading={importacionesKpis.isLoading}
            error={importacionesKpis.error}
            onRetry={importacionesKpis.refetch}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold tracking-wide text-slate-500 uppercase">
            Compras
          </h2>
          <ComprasKpis
            kpis={comprasKpis.data}
            isLoading={comprasKpis.isLoading}
            error={comprasKpis.error}
            onRetry={comprasKpis.refetch}
          />
        </section>
      </main>
    </div>
  )
}
