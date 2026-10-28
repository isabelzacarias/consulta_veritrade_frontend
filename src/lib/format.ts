const usdFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
})

const usdCompactFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const usdDetailedFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'USD',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const mxnFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  currencyDisplay: 'narrowSymbol',
  maximumFractionDigits: 0,
})

const mxnCompactFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  currencyDisplay: 'narrowSymbol',
  notation: 'compact',
  maximumFractionDigits: 1,
})

const mxnDetailedFormatter = new Intl.NumberFormat('es-MX', {
  style: 'currency',
  currency: 'MXN',
  currencyDisplay: 'narrowSymbol',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
})

const numberFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 0,
})

const decimalFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 2,
})

const percentFormatter = new Intl.NumberFormat('es-MX', {
  maximumFractionDigits: 1,
  minimumFractionDigits: 0,
})

const dateFormatter = new Intl.DateTimeFormat('es-MX', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

const shortMonthFormatter = new Intl.DateTimeFormat('es-MX', {
  month: 'short',
  year: '2-digit',
  timeZone: 'UTC',
})

const longMonthFormatter = new Intl.DateTimeFormat('es-MX', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatUsd(value: number | null | undefined): string {
  return value == null ? '—' : usdFormatter.format(value)
}

export function formatUsdCompact(value: number | null | undefined): string {
  return value == null ? '—' : usdCompactFormatter.format(value)
}

export function formatUsdDetailed(value: number | null | undefined): string {
  return value == null ? '—' : usdDetailedFormatter.format(value)
}

export function formatMxn(value: number | null | undefined): string {
  return value == null ? '—' : mxnFormatter.format(value)
}

export function formatMxnCompact(value: number | null | undefined): string {
  return value == null ? '—' : mxnCompactFormatter.format(value)
}

export function formatMxnDetailed(value: number | null | undefined): string {
  return value == null ? '—' : mxnDetailedFormatter.format(value)
}

export function formatNumber(value: number | null | undefined): string {
  return value == null ? '—' : numberFormatter.format(value)
}

export function formatDecimal(value: number | null | undefined): string {
  return value == null ? '—' : decimalFormatter.format(value)
}

export function formatKg(value: number | null | undefined): string {
  return value == null ? '—' : `${numberFormatter.format(value)} kg`
}

export function formatKgCompact(value: number | null | undefined): string {
  if (value == null) return '—'
  return `${new Intl.NumberFormat('es-MX', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)} kg`
}

export function formatPercent(value: number | null | undefined): string {
  return value == null ? '—' : `${percentFormatter.format(value)}%`
}

/** Convierte `YYYY-MM-DD` en una fecha local sin desfase de zona horaria. */
function parseDateOnly(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return null
  return new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])))
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—'
  const date = parseDateOnly(value)
  return date ? dateFormatter.format(date) : value
}

/** `2026-01` → `ene 26` */
export function formatMonthShort(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})/.exec(value)
  if (!match) return value
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1))
  return shortMonthFormatter.format(date)
}

/** `2026-01` → `enero de 2026` */
export function formatMonthLong(value: string | null | undefined): string {
  if (!value) return '—'
  const match = /^(\d{4})-(\d{2})/.exec(value)
  if (!match) return value
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, 1))
  return longMonthFormatter.format(date)
}

export function formatSignedPercent(value: number | null | undefined): string {
  if (value == null) return '—'
  const formatted = percentFormatter.format(value)
  return value > 0 ? `+${formatted}%` : `${formatted}%`
}

export function formatSignedPp(value: number | null | undefined): string {
  if (value == null) return '—'
  const formatted = percentFormatter.format(value)
  return value > 0 ? `+${formatted} pp` : `${formatted} pp`
}
