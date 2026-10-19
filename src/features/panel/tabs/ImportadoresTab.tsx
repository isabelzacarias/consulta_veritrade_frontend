import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { Info, PackageSearch, Scale, Users } from 'lucide-react'
import { useState } from 'react'
import type { Filters, RankingMetric } from '../../../types/api'
import { api } from '../../../services/api'
import { formatDecimal, formatKg, formatNumber } from '../../../lib/format'
import { SectionCard } from '../../../components/ui/SectionCard'
import { Segmented } from '../../../components/ui/Segmented'
import { RankingTable } from '../../../components/ui/RankingTable'
import { BarList } from '../../../components/ui/BarList'
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui/States'
import { ConcentrationCard } from '../ConcentrationCard'

type Scope = 'mexico' | 'cancun'

export function ImportadoresTab({ filters }: { filters: Filters }) {
  const [scope, setScope] = useState<Scope>('mexico')
  const [metrica, setMetrica] = useState<RankingMetric>('valor_usd')

  const ranking = useQuery({
    queryKey: ['importadores-ranking', filters, scope, metrica],
    queryFn: ({ signal }) =>
      scope === 'cancun'
        ? api.importadoresCancun(filters, 20, metrica, signal)
        : api.importadores(filters, 20, metrica, signal),
    placeholderData: keepPreviousData,
  })

  const pesoProducto = useQuery({
    queryKey: ['peso-producto', filters],
    queryFn: ({ signal }) =>
      api.importadores(filters, 10, 'volumen_kg', signal),
    enabled: Boolean(filters.partida),
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
      key: row.importador ?? 'sin-importador',
      label: row.importador ?? 'Sin importador',
      value: row.costo_unit_ponderado,
      valueLabel: `$${formatDecimal(row.costo_unit_ponderado)} / kg`,
    }))

  const volumenItems = rows
    .filter((row) => row.importador)
    .map((row) => ({
      key: row.importador ?? 'sin-importador',
      label: row.importador ?? 'Sin importador',
      value: row.volumen_kg,
      valueLabel: formatKg(row.volumen_kg),
      pct: row.porcentaje,
    }))

  const pesoItems = (pesoProducto.data?.items ?? [])
    .filter((row) => row.importador)
    .map((row) => ({
      key: row.importador ?? 'sin-importador',
      label: row.importador ?? 'Sin importador',
      value: row.volumen_kg,
      valueLabel: formatKg(row.volumen_kg),
      pct: row.porcentaje,
    }))

  return (
    <div className="space-y-4">
      {scope === 'cancun' && (
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white text-amber-700 shadow-sm ring-1 ring-amber-100">
            <Info className="size-4" />
          </span>
          <p className="text-xs leading-relaxed text-amber-800">
            El alcance <strong>Cancún</strong> aplica únicamente al ranking de
            importadores. Los KPIs y las demás pestañas siguen mostrando el panorama
            nacional porque el backend solo expone el filtro Cancún en{' '}
            <code className="rounded bg-amber-100 px-1 py-0.5 font-mono">
              /reportes/importadores-cancun
            </code>
            .
          </p>
        </div>
      )}

      <SectionCard
        title="Ranking de importadores"
        subtitle={
          scope === 'cancun'
            ? 'Importadores con operaciones en Cancún o Quintana Roo'
            : 'Importadores ordenados por la métrica seleccionada'
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Segmented
              ariaLabel="Alcance geográfico"
              options={[
                { value: 'mexico', label: 'México' },
                { value: 'cancun', label: 'Cancún' },
              ]}
              value={scope}
              onChange={setScope}
            />
            <Segmented
              ariaLabel="Métrica del ranking"
              options={[
                { value: 'valor_usd', label: 'Valor USD' },
                { value: 'volumen_kg', label: 'Volumen kg' },
              ]}
              value={metrica}
              onChange={setMetrica}
            />
          </div>
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
            icon={Users}
            title="Sin importadores"
            description="No hay operaciones para los filtros seleccionados."
          />
        ) : (
          <>
            <RankingTable
              rows={rows}
              dimensionKey="importador"
              metrica={metrica}
            />
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              Mostrando <span className="font-medium text-slate-700">{rows.length}</span>{' '}
              de {formatNumber(ranking.data?.total)} importadores. El porcentaje se
              calcula sobre el total del conjunto filtrado.
            </p>
          </>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {metrica === 'valor_usd' ? (
          <ConcentrationCard
            rows={rows}
            dimensionKey="importador"
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
          title="Costo unitario por importador"
          subtitle="USD por kg, ordenado de mayor a menor dentro del top mostrado"
          bodyClassName="p-4 pt-2"
        >
          {ranking.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : costoItems.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Sin costos calculables"
              description="Algunos importadores no tienen volumen registrado."
            />
          ) : (
            <BarList items={costoItems} tone="amber" widthMode="relative" />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Peso por producto"
        subtitle={
          filters.partida
            ? `Participación de kg por importador en la partida ${filters.partida}`
            : 'Selecciona una partida para analizar su distribución de peso'
        }
        bodyClassName="p-4 pt-2"
      >
        {!filters.partida ? (
          <EmptyState
            icon={PackageSearch}
            title="Falta seleccionar una partida"
            description="Usa el filtro «Partida arancelaria» para ver qué importadores concentran el peso de ese producto. El porcentaje se calcula sobre el total de la partida."
          />
        ) : pesoProducto.isLoading ? (
          <Skeleton className="h-64 w-full" />
        ) : pesoProducto.isError ? (
          <ErrorState
            message={pesoProducto.error?.message ?? 'Error desconocido'}
            onRetry={pesoProducto.refetch}
          />
        ) : pesoItems.length === 0 ? (
          <EmptyState title="Sin operaciones para esa partida" />
        ) : (
          <>
            <BarList items={pesoItems} tone="teal" widthMode="percent" />
            <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
              Valor mostrado: kilogramos importados. Porcentaje:{' '}
              <code className="font-mono">porcentaje</code> sobre el total de la
              partida filtrada.
            </p>
          </>
        )}
      </SectionCard>
    </div>
  )
}
