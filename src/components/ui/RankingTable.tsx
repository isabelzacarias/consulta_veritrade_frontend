import type { BaseRankingRow, RankingMetric } from '@/types/importaciones'
import {
  formatDecimal,
  formatKg,
  formatNumber,
  formatPercent,
  formatUsd,
} from '@/lib/format'

interface RankingTableProps<T extends BaseRankingRow> {
  rows: T[]
  dimensionKey: string
  secondaryKey?: string
  metrica: RankingMetric
  onRowClick?: (row: T) => void
  selectedKey?: string | null
  keyOf?: (row: T) => string
}

export function RankingTable<T extends BaseRankingRow>({
  rows,
  dimensionKey,
  secondaryKey,
  metrica,
  onRowClick,
  selectedKey,
  keyOf,
}: RankingTableProps<T>) {
  const max = Math.max(...rows.map((row) => row[metrica] ?? 0), 1)

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[820px] border-collapse text-left text-xs">
        <thead>
          <tr className="border-b border-brand-100 bg-brand-50/70 text-[10px] font-semibold uppercase tracking-wide text-brand-700/80">
            <th className="w-10 px-4 py-2.5">#</th>
            <th className="px-4 py-2.5">Nombre</th>
            <th className="px-4 py-2.5 text-right">Valor USD</th>
            <th className="px-4 py-2.5 text-right">% valor</th>
            <th className="px-4 py-2.5 text-right">Volumen</th>
            <th className="px-4 py-2.5 text-right">% peso</th>
            <th className="px-4 py-2.5 text-right">Costo USD/kg</th>
            <th className="px-4 py-2.5 text-right">Registros</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {rows.map((row, index) => {
            const record = row as unknown as Record<string, unknown>
            const dimension = String(record[dimensionKey] ?? '—')
            const secondary = secondaryKey ? String(record[secondaryKey] ?? '') : ''
            const rowKey = keyOf ? keyOf(row) : dimension
            const selected = selectedKey != null && selectedKey === rowKey
            const metricValue = row[metrica] ?? 0

            return (
              <tr
                key={`${rowKey}-${index}`}
                onClick={() => onRowClick?.(row)}
                className={`transition even:bg-slate-50/50 ${
                  onRowClick ? 'cursor-pointer hover:bg-brand-50/60' : ''
                } ${selected ? 'bg-brand-50/60' : ''}`}
              >
                <td className="px-4 py-2.5 text-slate-400 tabular-nums">{index + 1}</td>
                <td className="max-w-[320px] px-4 py-2.5">
                  <p className="truncate font-medium text-slate-800" title={dimension}>
                    {dimension}
                  </p>
                  {secondary && (
                    <p className="truncate text-[11px] text-slate-400" title={secondary}>
                      {secondary}
                    </p>
                  )}
                  <div className="mt-1.5 flex h-1 w-full max-w-56 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full bg-linear-to-r from-brand-600 to-brand-400"
                      style={{ width: `${Math.max(2, (metricValue / max) * 100)}%` }}
                    />
                  </div>
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-700 tabular-nums">
                  {formatUsd(row.valor_usd)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500 tabular-nums">
                  {formatPercent(row.pct_total)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-600 tabular-nums">
                  {formatKg(row.volumen_kg)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500 tabular-nums">
                  {formatPercent(row.porcentaje)}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-600 tabular-nums">
                  {row.costo_unit_ponderado == null
                    ? '—'
                    : `$${formatDecimal(row.costo_unit_ponderado)}`}
                </td>
                <td className="px-4 py-2.5 text-right whitespace-nowrap text-slate-500 tabular-nums">
                  {formatNumber(row.registros)}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
