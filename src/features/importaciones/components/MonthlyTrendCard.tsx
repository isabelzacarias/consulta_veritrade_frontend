import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { BarChart3 } from 'lucide-react'
import { useId, useState } from 'react'
import type { MensualRow } from '@/types/importaciones'
import type { Page, QuerySlice } from '@/types/common'
import {
  formatKg,
  formatKgCompact,
  formatMonthLong,
  formatMonthShort,
  formatUsd,
  formatUsdCompact,
} from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

interface MonthlyTrendCardProps {
  query: QuerySlice<Page<MensualRow>>
  title?: string
  subtitle?: string
  className?: string
}

export function MonthlyTrendCard({
  query,
  title = 'Evolución mensual',
  subtitle = 'Valor importado y volumen por mes',
  className = 'xl:col-span-3',
}: MonthlyTrendCardProps) {
  const [metric, setMetric] = useState<'valor_usd' | 'volumen_kg'>('valor_usd')
  const fillId = `monthly-fill-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`
  const data = (query.data?.items ?? []).filter(
    (row): row is MensualRow & { mes: string } => Boolean(row.mes),
  )

  return (
    <SectionCard
      title={title}
      subtitle={subtitle}
      className={className}
      actions={
        <div className="flex rounded-lg border border-slate-200 bg-slate-50 p-0.5">
          {[
            { key: 'valor_usd', label: 'Valor USD' },
            { key: 'volumen_kg', label: 'Volumen kg' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() =>
                setMetric(option.key as 'valor_usd' | 'volumen_kg')
              }
              className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition ${
                metric === option.key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      }
      bodyClassName="p-4 pt-5"
    >
      {query.isLoading ? (
        <Skeleton className="h-[272px] w-full" />
      ) : query.isError ? (
        <ErrorState
          message={query.error?.message ?? 'Error desconocido'}
          onRetry={query.refetch}
        />
      ) : data.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Sin serie mensual"
          description="No hay operaciones para los filtros seleccionados."
          className="py-20"
        />
      ) : (
        <div className="h-[272px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#5b2480" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#5b2480" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="mes"
                tickFormatter={(value) => formatMonthShort(String(value))}
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                minTickGap={18}
              />
              <YAxis
                tickFormatter={(value) =>
                  metric === 'valor_usd'
                    ? formatUsdCompact(Number(value))
                    : formatKgCompact(Number(value))
                }
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={64}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
                  fontSize: 12,
                }}
                labelFormatter={(label) => formatMonthLong(String(label))}
                formatter={(value) => [
                  metric === 'valor_usd'
                    ? formatUsd(Number(value))
                    : formatKg(Number(value)),
                  metric === 'valor_usd' ? 'Valor USD' : 'Volumen',
                ]}
              />
              <Area
                type="monotone"
                dataKey={metric}
                stroke="#5b2480"
                strokeWidth={2.25}
                fill={`url(#${fillId})`}
                activeDot={{ r: 4, strokeWidth: 2, stroke: '#fff' }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </SectionCard>
  )
}
