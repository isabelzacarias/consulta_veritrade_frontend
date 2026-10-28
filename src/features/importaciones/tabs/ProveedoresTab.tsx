import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Scale, Ship } from 'lucide-react'
import { useState } from 'react'
import type { Filters, RankingMetric } from '@/types/importaciones'
import { api } from '@/services/api'
import { formatDecimal, formatKg, formatNumber } from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { Segmented } from '@/components/ui/Segmented'
import { RankingTable } from '@/components/ui/RankingTable'
import { BarList } from '@/components/ui/BarList'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { ConcentrationCard } from '@/features/importaciones/components/ConcentrationCard'

export function ProveedoresTab({ filters }: { filters: Filters }) {
  const [metrica, setMetrica] = useState<RankingMetric>('valor_usd')

  const ranking = useQuery({
    queryKey: ['proveedores-ranking', filters, metrica],
    queryFn: ({ signal }) => api.proveedores(filters, 20, metrica, signal),
    placeholderData: keepPreviousData,
  })

  const porPais = useQuery({
    queryKey: ['proveedores-por-pais', filters, metrica],
    queryFn: ({ signal }) =>
      api.proveedoresPorPais(filters, 15, metrica, signal),
    placeholderData: keepPreviousData,
  })

  const rows = ranking.data?.items ?? []

  const costoItems = [...rows]
    .filter((row) => row.costo_unit_ponderado != null)
    .sort(
      (a, b) =>
        (b.costo_unit_ponderado ?? 0) - (a.costo_unit_ponderado ?? 0),
    )
    .slice(0, 10)
    .map((row) => ({
      key: row.exportador ?? 'sin-proveedor',
      label: row.exportador ?? 'Sin proveedor',
      value: row.costo_unit_ponderado,
      valueLabel: `$${formatDecimal(row.costo_unit_ponderado)} / kg`,
    }))

  const volumenItems = rows
    .filter((row) => row.exportador)
    .map((row) => ({
      key: row.exportador ?? 'sin-proveedor',
      label: row.exportador ?? 'Sin proveedor',
      value: row.volumen_kg,
      valueLabel: formatKg(row.volumen_kg),
      pct: row.porcentaje,
    }))

  return (
    <div className="space-y-4">
      <SectionCard
        title="Ranking de proveedores"
        subtitle="Exportadores ordenados por la métrica seleccionada, con su % del total"
        actions={
          <Segmented
            ariaLabel="Métrica del ranking de proveedores"
            options={[
              { value: 'valor_usd', label: 'Valor USD' },
              { value: 'volumen_kg', label: 'Volumen kg' },
            ]}
            value={metrica}
            onChange={setMetrica}
          />
        }
        bodyClassName=""
      >
        {ranking.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 10 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : ranking.isError ? (
          <ErrorState
            message={ranking.error?.message ?? 'Error desconocido'}
            onRetry={ranking.refetch}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Ship}
            title="Sin proveedores"
            description="No hay operaciones para los filtros seleccionados."
          />
        ) : (
          <>
            <RankingTable rows={rows} dimensionKey="exportador" metrica={metrica} />
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              Mostrando <span className="font-medium text-slate-700">{rows.length}</span>{' '}
              de {formatNumber(ranking.data?.total)} proveedores.
            </p>
          </>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {metrica === 'valor_usd' ? (
          <ConcentrationCard
            rows={rows}
            dimensionKey="exportador"
            isLoading={ranking.isLoading}
            isError={ranking.isError}
            error={ranking.error}
            onRetry={ranking.refetch}
          />
        ) : (
          <SectionCard
            title="Participación de volumen"
            subtitle="Porcentaje de kilogramos sobre el total filtrado"
            bodyClassName="p-4 pt-2"
          >
            {ranking.isLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : volumenItems.length === 0 ? (
              <EmptyState title="Sin datos de volumen" />
            ) : (
              <BarList items={volumenItems} tone="sky" widthMode="percent" />
            )}
          </SectionCard>
        )}

        <SectionCard
          title="Costo unitario por proveedor"
          subtitle="USD por kg dentro del top mostrado"
          bodyClassName="p-4 pt-2"
        >
          {ranking.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : costoItems.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Sin costos calculables"
              description="Algunos proveedores no tienen volumen registrado."
            />
          ) : (
            <BarList items={costoItems} tone="amber" widthMode="relative" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Proveedores por país de origen"
        subtitle="Detalle exportador × país con valor, volumen y participación"
        bodyClassName=""
      >
        {porPais.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-9 w-full" />
            ))}
          </div>
        ) : porPais.isError ? (
          <ErrorState
            message={porPais.error?.message ?? 'Error desconocido'}
            onRetry={porPais.refetch}
          />
        ) : (porPais.data?.items.length ?? 0) === 0 ? (
          <EmptyState
            title="Sin relación proveedor–país"
            description="No hay datos para los filtros seleccionados."
          />
        ) : (
          <>
            <RankingTable
              rows={porPais.data?.items ?? []}
              dimensionKey="exportador"
              secondaryKey="pais_origen"
              metrica={metrica}
            />
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              Un mismo exportador puede aparecer en varias filas si opera desde más de
              un país de origen.
            </p>
          </>
        )}
      </SectionCard>
    </div>
  )
}
