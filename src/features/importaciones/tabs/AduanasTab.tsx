import { keepPreviousData, useQuery } from '@tanstack/react-query'
import {
  Building2,
  Globe2,
  Landmark,
  MapPin,
  PackageSearch,
  Scale,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { useState } from 'react'
import type { AduanaRow, Filters, RankingMetric } from '@/types/importaciones'
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
import {
  BarList,
  type BarListItem,
  type BarTone,
} from '@/components/ui/BarList'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import { ConcentrationCard } from '@/features/importaciones/components/ConcentrationCard'
import { MonthlyTrendCard } from '@/features/importaciones/components/MonthlyTrendCard'

const kpiStyles = {
  brand: {
    card: 'border-brand-200/70 bg-linear-to-br from-brand-100/80 via-brand-50/50 to-white',
    icon: 'bg-brand-600 text-white shadow-md shadow-brand-600/30',
    label: 'text-brand-700',
    hint: 'text-brand-600/70',
  },
  aqua: {
    card: 'border-aqua-200/70 bg-linear-to-br from-aqua-100/80 via-aqua-50/50 to-white',
    icon: 'bg-aqua-500 text-white shadow-md shadow-aqua-500/30',
    label: 'text-aqua-700',
    hint: 'text-aqua-600/70',
  },
  deep: {
    card: 'border-deep-200/70 bg-linear-to-br from-deep-100/80 via-deep-50/50 to-white',
    icon: 'bg-deep-700 text-white shadow-md shadow-deep-700/30',
    label: 'text-deep-700',
    hint: 'text-deep-500/70',
  },
  amber: {
    card: 'border-amber-200/70 bg-linear-to-br from-amber-100/80 via-amber-50/50 to-white',
    icon: 'bg-amber-500 text-white shadow-md shadow-amber-500/30',
    label: 'text-amber-700',
    hint: 'text-amber-600/70',
  },
} as const

type KpiTone = keyof typeof kpiStyles

function AduanaKpi({
  label,
  value,
  hint,
  icon: Icon,
  tone,
  valueClassName = 'text-2xl',
}: {
  label: string
  value: string
  hint: string
  icon: LucideIcon
  tone: KpiTone
  valueClassName?: string
}) {
  const style = kpiStyles[tone]

  return (
    <article
      className={`rounded-2xl border p-5 shadow-sm shadow-slate-900/5 ${style.card}`}
    >
      <div className="flex items-start justify-between gap-3">
        <p className={`text-xs font-semibold ${style.label}`}>{label}</p>
        <span
          className={`grid size-10 shrink-0 place-items-center rounded-xl ${style.icon}`}
        >
          <Icon className="size-5" />
        </span>
      </div>
      <p
        className={`mt-3 font-semibold tracking-tight text-slate-900 tabular-nums ${valueClassName}`}
        title={value}
      >
        {value}
      </p>
      <p className={`mt-1 truncate text-[11px] ${style.hint}`} title={hint}>
        {hint}
      </p>
    </article>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/70 px-3 py-2.5">
      <dt className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </dt>
      <dd className="mt-1 text-sm font-semibold text-slate-800 tabular-nums">
        {value}
      </dd>
    </div>
  )
}

function DetailListCard({
  title,
  subtitle,
  items,
  isLoading,
  isError,
  error,
  onRetry,
  icon,
  emptyTitle,
  tone,
}: {
  title: string
  subtitle: string
  items: BarListItem[]
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
  icon: LucideIcon
  emptyTitle: string
  tone: BarTone
}) {
  return (
    <SectionCard title={title} subtitle={subtitle} bodyClassName="p-4 pt-2">
      {isLoading ? (
        <div className="space-y-3 py-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-9 w-full" />
          ))}
        </div>
      ) : isError ? (
        <ErrorState
          message={error?.message ?? 'Error desconocido'}
          onRetry={onRetry}
        />
      ) : items.length === 0 ? (
        <EmptyState icon={icon} title={emptyTitle} className="py-16" />
      ) : (
        <BarList items={items} tone={tone} widthMode="percent" />
      )}
    </SectionCard>
  )
}

export function AduanasTab({ filters }: { filters: Filters }) {
  const [metrica, setMetrica] = useState<RankingMetric>('valor_usd')
  const [manualAduana, setManualAduana] = useState<string | null>(null)

  const ranking = useQuery({
    queryKey: ['aduanas-ranking', filters, metrica],
    queryFn: ({ signal }) => api.rankingAduanas(filters, 20, metrica, signal),
    placeholderData: keepPreviousData,
  })

  const topValor = useQuery({
    queryKey: ['aduanas-top-valor', filters],
    queryFn: ({ signal }) =>
      api.rankingAduanas(filters, 5, 'valor_usd', signal),
    placeholderData: keepPreviousData,
  })

  const kpis = useQuery({
    queryKey: ['kpis', filters],
    queryFn: ({ signal }) => api.kpis(filters, signal),
    placeholderData: keepPreviousData,
  })

  const rows = ranking.data?.items ?? []
  const topRows = topValor.data?.items ?? []
  const lider = topRows[0]

  const filterAduana = filters.aduana?.[0]
  const selectedAduana =
    manualAduana && rows.some((row) => row.aduana === manualAduana)
      ? manualAduana
      : filterAduana ?? rows[0]?.aduana ?? null

  const activeAduana: AduanaRow | null =
    rows.find((row) => row.aduana === selectedAduana) ?? rows[0] ?? null

  const detalleFilters: Filters = {
    ...filters,
    aduana: selectedAduana ? [selectedAduana] : undefined,
  }

  const mensual = useQuery({
    queryKey: ['aduanas-mensual', filters, selectedAduana],
    queryFn: ({ signal }) => api.mensual(detalleFilters, signal),
    enabled: Boolean(selectedAduana),
    placeholderData: keepPreviousData,
  })

  const paises = useQuery({
    queryKey: ['aduanas-paises', filters, selectedAduana],
    queryFn: ({ signal }) => api.paisesOrigen(detalleFilters, 6, signal),
    enabled: Boolean(selectedAduana),
    placeholderData: keepPreviousData,
  })

  const importadores = useQuery({
    queryKey: ['aduanas-importadores', filters, selectedAduana],
    queryFn: ({ signal }) =>
      api.importadores(detalleFilters, 8, 'valor_usd', signal),
    enabled: Boolean(selectedAduana),
    placeholderData: keepPreviousData,
  })

  const partidas = useQuery({
    queryKey: ['aduanas-partidas', filters, selectedAduana],
    queryFn: ({ signal }) =>
      api.rankingPartidas(detalleFilters, 6, 'valor_usd', signal),
    enabled: Boolean(selectedAduana),
    placeholderData: keepPreviousData,
  })

  const top5Share = topRows.length
    ? topRows.reduce((sum, row) => sum + (row.pct_total ?? 0), 0)
    : null

  const volumenItems: BarListItem[] = rows.map((row) => ({
    key: row.aduana ?? 'sin-aduana',
    label: row.aduana ?? 'Sin aduana',
    value: row.volumen_kg,
    valueLabel: formatKg(row.volumen_kg),
    pct: row.porcentaje,
  }))

  const paisItems: BarListItem[] = (paises.data?.items ?? [])
    .filter((row) => row.pais_origen)
    .map((row) => ({
      key: row.pais_origen ?? 'sin-pais',
      label: row.pais_origen ?? 'Sin país',
      value: row.valor_usd,
      valueLabel: formatUsd(row.valor_usd),
      pct: row.pct_total,
    }))

  const importadorItems: BarListItem[] = (importadores.data?.items ?? [])
    .filter((row) => row.importador)
    .map((row) => ({
      key: row.importador ?? 'sin-importador',
      label: row.importador ?? 'Sin importador',
      value: row.valor_usd,
      valueLabel: formatUsd(row.valor_usd),
      pct: row.pct_total,
    }))

  const partidaItems: BarListItem[] = (partidas.data?.items ?? [])
    .filter((row) => row.partida_arancelaria)
    .map((row) => ({
      key: row.partida_arancelaria ?? 'sin-partida',
      label: row.partida_arancelaria ?? 'Sin partida',
      value: row.valor_usd,
      valueLabel: formatUsd(row.valor_usd),
      pct: row.pct_total,
      meta: row.descripcion_partida ?? undefined,
    }))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AduanaKpi
          label="Aduanas activas"
          value={formatNumber(ranking.data?.total)}
          hint="Con operaciones en el conjunto filtrado"
          icon={Landmark}
          tone="brand"
        />
        <AduanaKpi
          label="Aduana líder"
          value={lider?.aduana ?? '—'}
          hint={
            lider
              ? `${formatUsd(lider.valor_usd)} · ${formatPercent(lider.pct_total)} del valor`
              : 'Sin datos para los filtros'
          }
          icon={MapPin}
          tone="aqua"
          valueClassName="text-lg leading-snug"
        />
        <AduanaKpi
          label="Top 5 por valor"
          value={top5Share == null ? '—' : formatPercent(top5Share)}
          hint="Concentración del valor filtrado"
          icon={TrendingUp}
          tone="deep"
        />
        <AduanaKpi
          label="Costo unitario"
          value={
            kpis.data?.costo_unit_ponderado == null
              ? '—'
              : `$${formatDecimal(kpis.data.costo_unit_ponderado)} / kg`
          }
          hint="Valor USD ÷ volumen kg"
          icon={Scale}
          tone="amber"
        />
      </div>

      <SectionCard
        title="Ranking de aduanas"
        subtitle="Ordenadas por la métrica seleccionada; haz clic en una fila para ver su ficha"
        actions={
          <Segmented
            ariaLabel="Métrica del ranking de aduanas"
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
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : ranking.isError ? (
          <ErrorState
            message={ranking.error?.message ?? 'Error desconocido'}
            onRetry={ranking.refetch}
          />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={Landmark}
            title="Sin aduanas"
            description="No hay datos para los filtros seleccionados."
          />
        ) : (
          <>
            <RankingTable
              rows={rows}
              dimensionKey="aduana"
              metrica={metrica}
              selectedKey={selectedAduana}
              onRowClick={(row) => setManualAduana(row.aduana)}
            />
            <p className="border-t border-slate-100 px-5 py-3 text-[11px] text-slate-500">
              Mostrando{' '}
              <span className="font-medium text-slate-700">{rows.length}</span>{' '}
              de {formatNumber(ranking.data?.total)} aduanas. El porcentaje se
              calcula sobre el total del conjunto filtrado.
            </p>
          </>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        {metrica === 'valor_usd' ? (
          <ConcentrationCard
            rows={rows}
            dimensionKey="aduana"
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
          title="Ficha de la aduana"
          subtitle={activeAduana?.aduana ?? 'Selecciona una aduana del ranking'}
          actions={
            manualAduana ? (
              <button
                type="button"
                onClick={() => setManualAduana(null)}
                className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-medium text-slate-600 transition hover:bg-slate-50"
              >
                Quitar selección
              </button>
            ) : undefined
          }
          bodyClassName="p-4 pt-3"
        >
          {!activeAduana ? (
            <EmptyState
              icon={Landmark}
              title="Selecciona una aduana"
              description="Haz clic en una fila del ranking para consultar su detalle."
              className="py-16"
            />
          ) : (
            <>
              <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                <SummaryMetric
                  label="Valor"
                  value={formatUsd(activeAduana.valor_usd)}
                />
                <SummaryMetric
                  label="Volumen"
                  value={formatKg(activeAduana.volumen_kg)}
                />
                <SummaryMetric
                  label="Operaciones"
                  value={formatNumber(activeAduana.registros)}
                />
                <SummaryMetric
                  label="% del valor"
                  value={formatPercent(activeAduana.pct_total)}
                />
                <SummaryMetric
                  label="Costo USD/kg"
                  value={
                    activeAduana.costo_unit_ponderado == null
                      ? '—'
                      : `$${formatDecimal(activeAduana.costo_unit_ponderado)}`
                  }
                />
              </dl>
              <p className="mt-3 border-t border-slate-100 pt-2 text-[10px] text-slate-400">
                La ficha y las gráficas respetan los filtros globales y se
                recalculan sobre la aduana seleccionada.
              </p>
            </>
          )}
        </SectionCard>
      </div>

      <MonthlyTrendCard
        query={mensual}
        title={
          selectedAduana
            ? `Evolución mensual · ${selectedAduana}`
            : 'Evolución mensual'
        }
        subtitle="Valor importado y volumen de la aduana seleccionada"
        className=""
      />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <DetailListCard
          title="Países de origen"
          subtitle="Participación por valor de la aduana seleccionada"
          items={paisItems}
          isLoading={paises.isLoading}
          isError={paises.isError}
          error={paises.error}
          onRetry={paises.refetch}
          icon={Globe2}
          emptyTitle="Sin países para esta aduana"
          tone="sky"
        />
        <DetailListCard
          title="Importadores principales"
          subtitle="Ordenados por valor importado"
          items={importadorItems}
          isLoading={importadores.isLoading}
          isError={importadores.isError}
          error={importadores.error}
          onRetry={importadores.refetch}
          icon={Building2}
          emptyTitle="Sin importadores para esta aduana"
          tone="teal"
        />
        <DetailListCard
          title="Principales partidas"
          subtitle="Fracciones con mayor valor importado"
          items={partidaItems}
          isLoading={partidas.isLoading}
          isError={partidas.isError}
          error={partidas.error}
          onRetry={partidas.refetch}
          icon={PackageSearch}
          emptyTitle="Sin partidas para esta aduana"
          tone="amber"
        />
      </div>
    </div>
  )
}
