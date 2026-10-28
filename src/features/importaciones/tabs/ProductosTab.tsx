import { keepPreviousData, useQuery } from '@tanstack/react-query'
import { PackageSearch, Scale } from 'lucide-react'
import { useState } from 'react'
import type { Filters, RankingMetric } from '@/types/importaciones'
import { api } from '@/services/api'
import {
  formatDecimal,
  formatKg,
  formatNumber,
  formatPercent,
  formatUsd,
} from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { Segmented } from '@/components/ui/Segmented'
import { RankingTable } from '@/components/ui/RankingTable'
import { BarList } from '@/components/ui/BarList'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

export function ProductosTab({ filters }: { filters: Filters }) {
  const [metrica, setMetrica] = useState<RankingMetric>('valor_usd')
  const [manualPartida, setManualPartida] = useState<string | null>(null)

  const partidas = useQuery({
    queryKey: ['partidas-ranking', filters, metrica],
    queryFn: ({ signal }) => api.rankingPartidas(filters, 20, metrica, signal),
    placeholderData: keepPreviousData,
  })

  const partidasRows = partidas.data?.items ?? []
  const selectedPartida =
    manualPartida ??
    filters.partida ??
    partidasRows[0]?.partida_arancelaria ??
    null

  const activePartida =
    partidasRows.find(
      (row) => row.partida_arancelaria === selectedPartida,
    ) ?? null

  const peso = useQuery({
    queryKey: ['peso-partida', filters, selectedPartida],
    queryFn: ({ signal }) =>
      api.importadores(
        { ...filters, partida: selectedPartida ?? undefined },
        10,
        'volumen_kg',
        signal,
      ),
    enabled: Boolean(selectedPartida),
    placeholderData: keepPreviousData,
  })

  const costoItems = [...partidasRows]
    .filter((row) => row.costo_unit_ponderado != null)
    .sort(
      (a, b) =>
        (b.costo_unit_ponderado ?? 0) - (a.costo_unit_ponderado ?? 0),
    )
    .slice(0, 10)
    .map((row) => ({
      key: row.partida_arancelaria ?? 'sin-partida',
      label: row.partida_arancelaria ?? 'Sin partida',
      value: row.costo_unit_ponderado,
      valueLabel: `$${formatDecimal(row.costo_unit_ponderado)} / kg`,
      meta: row.descripcion_partida ?? undefined,
    }))

  const pesoItems = (peso.data?.items ?? [])
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
      <SectionCard
        title="Fracciones arancelarias"
        subtitle="Selecciona una partida para analizar su costo y la distribución de peso entre importadores"
        actions={
          <Segmented
            ariaLabel="Métrica del ranking de partidas"
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
        {partidas.isLoading ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 8 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : partidas.isError ? (
          <ErrorState
            message={partidas.error?.message ?? 'Error desconocido'}
            onRetry={partidas.refetch}
          />
        ) : partidasRows.length === 0 ? (
          <EmptyState
            icon={PackageSearch}
            title="Sin partidas"
            description="No hay datos para los filtros seleccionados."
          />
        ) : (
          <>
            <RankingTable
              rows={partidasRows}
              dimensionKey="partida_arancelaria"
              secondaryKey="descripcion_partida"
              metrica={metrica}
              selectedKey={selectedPartida}
              onRowClick={(row) => setManualPartida(row.partida_arancelaria)}
            />
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              {formatNumber(partidas.data?.total)} partidas en el conjunto filtrado.
              Haz clic en una fila para analizarla.
            </p>
          </>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <SectionCard
          title="Costo unitario por partida"
          subtitle="USD por kg; referencia dentro del top mostrado"
          bodyClassName="p-4 pt-2"
        >
          {partidas.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : costoItems.length === 0 ? (
            <EmptyState
              icon={Scale}
              title="Sin costos calculables"
              description="Las partidas no tienen volumen suficiente para calcular USD/kg."
            />
          ) : (
            <>
              <BarList items={costoItems} tone="amber" widthMode="relative" />
              <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                El costo USD/kg no es directamente comparable entre productos
                distintos; úsalo como referencia dentro de una misma partida.
              </p>
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Peso por producto"
          subtitle={
            activePartida
              ? `${activePartida.partida_arancelaria} · ${activePartida.descripcion_partida ?? 'Sin descripción'}`
              : 'Selecciona una partida para ver su distribución'
          }
          bodyClassName="p-4 pt-2"
        >
          {!selectedPartida ? (
            <EmptyState
              icon={PackageSearch}
              title="Selecciona una partida"
              description="Elige una fila del ranking o usa el filtro de partida arancelaria."
            />
          ) : peso.isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : peso.isError ? (
            <ErrorState
              message={peso.error?.message ?? 'Error desconocido'}
              onRetry={peso.refetch}
            />
          ) : pesoItems.length === 0 ? (
            <EmptyState title="Sin importadores para esta partida" />
          ) : (
            <>
              <div className="mb-2 rounded-lg bg-slate-50 px-3 py-2 text-[11px] text-slate-600">
                Valor de la partida:{' '}
                <span className="font-semibold text-slate-900">
                  {formatUsd(activePartida?.valor_usd)}
                </span>{' '}
                · Peso:{' '}
                <span className="font-semibold text-slate-900">
                  {formatKg(activePartida?.volumen_kg)}
                </span>{' '}
                · % del total:{' '}
                <span className="font-semibold text-slate-900">
                  {formatPercent(activePartida?.pct_total)}
                </span>
              </div>
              <BarList items={pesoItems} tone="teal" widthMode="percent" />
              <p className="mt-2 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                El porcentaje de peso se calcula sobre el total de la partida
                seleccionada.
              </p>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
