import {
  Area,
  AreaChart,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BaseRankingRow } from '@/types/importaciones'
import { formatPercent } from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'

interface ConcentrationCardProps<T extends BaseRankingRow> {
  rows: T[]
  dimensionKey: string
  isLoading: boolean
  isError: boolean
  error: Error | null
  onRetry: () => void
}

export function ConcentrationCard<T extends BaseRankingRow>({
  rows,
  dimensionKey,
  isLoading,
  isError,
  error,
  onRetry,
}: ConcentrationCardProps<T>) {
  const data = rows
    .filter((row) => row.pct_acumulado != null)
    .map((row, index) => ({
      rank: index + 1,
      name: String(
        (row as unknown as Record<string, unknown>)[dimensionKey] ?? '—',
      ),
      acumulado: row.pct_acumulado ?? 0,
    }))

  const last = data[data.length - 1]

  return (
    <SectionCard
      title="Concentración acumulada"
      subtitle={
        last
          ? `El top ${data.length} concentra ${formatPercent(last.acumulado)} del valor`
          : 'Participación acumulada del ranking'
      }
      bodyClassName="p-4 pt-4"
    >
      {isLoading ? (
        <Skeleton className="h-[220px] w-full" />
      ) : isError ? (
        <ErrorState message={error?.message ?? 'Error desconocido'} onRetry={onRetry} />
      ) : data.length === 0 ? (
        <EmptyState
          title="Sin datos de concentración"
          description="El backend no devolvió porcentajes acumulados para estos filtros."
          className="py-16"
        />
      ) : (
        <>
          <div className="h-[220px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="concentrationFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5b2480" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#5b2480" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey="rank"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `#${value}`}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={40}
                  tickFormatter={(value) => `${value}%`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
                    fontSize: 12,
                  }}
                  labelFormatter={(label) => `Top ${label}`}
                  formatter={(value) => [
                    formatPercent(Number(value)),
                    'Acumulado',
                  ]}
                />
                <ReferenceLine
                  y={80}
                  stroke="#f59e0b"
                  strokeDasharray="4 4"
                  label={{
                    value: '80%',
                    fill: '#b45309',
                    fontSize: 10,
                    position: 'insideTopRight',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="acumulado"
                  stroke="#5b2480"
                  strokeWidth={2.25}
                  fill="url(#concentrationFill)"
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-2 text-[10px] text-slate-400">
            Ordenado por valor USD. La línea muestra el porcentaje acumulado del top
            mostrado; el backend calcula <code className="font-mono">pct_acumulado</code>{' '}
            sobre el total filtrado.
          </p>
        </>
      )}
    </SectionCard>
  )
}
