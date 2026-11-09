import {
  useMemo,
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type MouseEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  Cell,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import {
  Building2,
  CalendarDays,
  ChartLine,
  ChevronDown,
  Tags,
  Trophy,
  X,
} from 'lucide-react'
import type { ComprasFilters } from '@/types/compras'
import { api } from '@/services/api'
import {
  formatMonthLong,
  formatMonthShort,
  formatMxn,
  formatMxnCompact,
  formatNumber,
  formatPercent,
} from '@/lib/format'
import { SectionCard } from '@/components/ui/SectionCard'
import { BarList } from '@/components/ui/BarList'
import { EmptyState, ErrorState, Skeleton } from '@/components/ui/States'
import {
  getRecurringDateMarkers,
  getMexicanHolidayMarkers,
  type HolidayMarkerGroup,
} from '../lib/mexicanHolidayMarkers'

interface ProveedoresTabProps {
  filters: ComprasFilters
  onShowPurchases: () => void
}

const tooltipStyle = {
  borderRadius: 12,
  border: '1px solid #e2e8f0',
  boxShadow: '0 10px 30px -12px rgba(15, 23, 42, 0.25)',
  fontSize: 12,
}

const axisTick = { fill: '#94a3b8', fontSize: 11 }
const MAX_COMPARISON_PROVIDERS = 10
const MONTH_NAMES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const YEAR_COLORS = ['#5b2480', '#0891b2', '#ea580c', '#65a30d', '#db2777']
const HOLIDAY_COLORS: Record<HolidayMarkerGroup, string> = {
  official: '#d97706',
  easter: '#e11d48',
  custom: '#2563eb',
}
const DAY_MONTH_FORMATTER = new Intl.DateTimeFormat('es-MX', {
  day: 'numeric',
  month: 'short',
  timeZone: 'UTC',
})
const PREDEFINED_HOLIDAY_NAMES = [
  ...new Set(
    getMexicanHolidayMarkers([2024, 2026, 2030]).map((marker) => marker.name),
  ),
]

interface CustomAnnualDate {
  id: string
  month: number
  day: number
  name: string
}

interface ProviderComparison {
  proveedor: string
  importe_mxn: number
  pct_importe: number
  registros: number
}

export function ProveedoresTab({
  filters,
  onShowPurchases,
}: ProveedoresTabProps) {
  const [dateFilterOpen, setDateFilterOpen] = useState(false)
  const dateFilterButtonRef = useRef<HTMLButtonElement>(null)
  const dateFilterPanelRef = useRef<HTMLDivElement>(null)
  const [dateFilterPosition, setDateFilterPosition] = useState({
    top: 0,
    right: 8,
  })
  const [selectedHolidayNames, setSelectedHolidayNames] = useState(
    () => new Set(PREDEFINED_HOLIDAY_NAMES),
  )
  const [customDates, setCustomDates] = useState<CustomAnnualDate[]>([])
  const [customDateInput, setCustomDateInput] = useState('')

  useEffect(() => {
    if (!dateFilterOpen) return

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) return
      if (
        dateFilterButtonRef.current?.contains(event.target) ||
        dateFilterPanelRef.current?.contains(event.target)
      ) {
        return
      }
      setDateFilterOpen(false)
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDateFilterOpen(false)
    }

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [dateFilterOpen])
  const selectedProviderSet = useMemo(
    () => new Set(filters.proveedor ?? []),
    [filters.proveedor],
  )
  const selectedProviderCount = filters.proveedor?.length ?? 0
  const { fecha_desde: fechaDesde, fecha_hasta: fechaHasta } = filters
  const providerFilterDescription = selectedProviderCount
    ? `${formatNumber(selectedProviderCount)} proveedor${selectedProviderCount === 1 ? '' : 'es'} seleccionado${selectedProviderCount === 1 ? '' : 's'}`
    : 'todos los proveedores que coinciden con los filtros generales'
  const comparisonFilters = { ...filters, proveedor: undefined }

  const kpis = useQuery({
    queryKey: ['compras', 'proveedor-kpis', filters],
    queryFn: ({ signal }) => api.comprasKpis(filters, signal),
  })

  const mensual = useQuery({
    queryKey: ['compras', 'proveedor-mensual', filters],
    queryFn: ({ signal }) => api.comprasMensual(filters, signal),
  })

  const categorias = useQuery({
    queryKey: ['compras', 'proveedor-categorias', filters],
    queryFn: ({ signal }) => api.comprasCategorias(filters, 10, signal),
  })

  const productos = useQuery({
    queryKey: ['compras', 'proveedor-productos', filters, 100],
    queryFn: ({ signal }) => api.comprasPrecios(filters, { top: 100 }, signal),
  })

  const comparison = useQuery({
    queryKey: ['compras', 'proveedor-comparison', comparisonFilters],
    queryFn: ({ signal }) =>
      api.comprasProveedores(comparisonFilters, 500, signal),
  })

  const comparisonData = useMemo(() => {
    const grouped = new Map<string, ProviderComparison>()
    for (const row of comparison.data ?? []) {
      const current = grouped.get(row.proveedor)
      if (current) {
        current.importe_mxn += row.importe_mxn ?? 0
        current.pct_importe += row.pct_importe ?? 0
        current.registros += row.registros
      } else {
        grouped.set(row.proveedor, {
          proveedor: row.proveedor,
          importe_mxn: row.importe_mxn ?? 0,
          pct_importe: row.pct_importe ?? 0,
          registros: row.registros,
        })
      }
    }

    const ranked = [...grouped.values()].sort(
      (a, b) => b.importe_mxn - a.importe_mxn,
    )
    const top = ranked.slice(0, MAX_COMPARISON_PROVIDERS)
    for (const selected of ranked.filter((row) =>
      selectedProviderSet.has(row.proveedor),
    )) {
      if (!top.some((row) => row.proveedor === selected.proveedor)) {
        top.push(selected)
      }
    }
    return top.sort((a, b) => b.importe_mxn - a.importe_mxn)
  }, [comparison.data, selectedProviderSet])

  const mensualRows = useMemo(() => mensual.data ?? [], [mensual.data])
  const annualComparison = useMemo(() => {
    const amounts = new Map<string, number>()
    const months = new Set<number>()
    const years = new Set<number>()

    for (const row of mensualRows) {
      const [yearText, monthText] = row.mes.split('-')
      const year = Number(yearText)
      const month = Number(monthText)
      if (!Number.isInteger(year) || !Number.isInteger(month)) continue
      years.add(year)
      months.add(month)
      amounts.set(`${year}-${month}`, row.importe_mxn ?? 0)
    }

    const availableYears = [...years].sort((a, b) => a - b)
    const chartMonths = [...months].sort((a, b) => a - b)
    const data = chartMonths.map((month) => {
      const point: Record<string, number | string | null> = {
        x: month - 0.5,
        month,
      }

      for (const year of availableYears) {
        const monthKey = `${year}-${String(month).padStart(2, '0')}`
        const monthIsInRange =
          (!fechaDesde || monthKey >= fechaDesde.slice(0, 7)) &&
          (!fechaHasta || monthKey <= fechaHasta.slice(0, 7))
        point[String(year)] = monthIsInRange
          ? (amounts.get(`${year}-${month}`) ?? 0)
          : null
      }

      return point
    })

    const predefinedMarkers = getMexicanHolidayMarkers(availableYears).filter(
      (marker) => selectedHolidayNames.has(marker.name),
    )
    const customMarkers = customDates.flatMap((item) =>
      getRecurringDateMarkers(
        availableYears,
        item.month,
        item.day,
        item.name,
      ),
    )
    const markers = [...predefinedMarkers, ...customMarkers].filter((marker) => {
      const date = `${marker.year}-${String(marker.month).padStart(2, '0')}-${String(marker.day).padStart(2, '0')}`
      return (
        (!fechaDesde || date >= fechaDesde) &&
        (!fechaHasta || date <= fechaHasta)
      )
    })

    return { years: availableYears, months: chartMonths, data, markers }
  }, [
    mensualRows,
    fechaDesde,
    fechaHasta,
    selectedHolidayNames,
    customDates,
  ])
  const markerLegend = useMemo(() => {
    const grouped = new Map<
      string,
      { group: HolidayMarkerGroup; dates: string[] }
    >()

    for (const marker of annualComparison.markers) {
      const date = new Date(Date.UTC(marker.year, marker.month - 1, marker.day))
      const entry = grouped.get(marker.name) ?? {
        group: marker.group,
        dates: [],
      }
      entry.dates.push(
        `${marker.year}: ${DAY_MONTH_FORMATTER.format(date)}`,
      )
      grouped.set(marker.name, entry)
    }

    return [...grouped.entries()].map(([name, entry]) => ({
      name,
      group: entry.group,
      dates: entry.dates.join(' · '),
    }))
  }, [annualComparison.markers])
  const selectedDateCount = selectedHolidayNames.size + customDates.length
  const toggleDateFilter = (event: MouseEvent<HTMLButtonElement>) => {
    if (dateFilterOpen) {
      setDateFilterOpen(false)
      return
    }

    const bounds = event.currentTarget.getBoundingClientRect()
    setDateFilterPosition({
      top: bounds.bottom + window.scrollY + 8,
      right: Math.max(8, window.innerWidth - bounds.right),
    })
    setDateFilterOpen(true)
  }
  const handleAddCustomDate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!customDateInput) return

    const [yearText, monthText, dayText] = customDateInput.split('-')
    const year = Number(yearText)
    const month = Number(monthText)
    const day = Number(dayText)
    const parsedDate = new Date(Date.UTC(year, month - 1, day))
    if (
      parsedDate.getUTCFullYear() !== year ||
      parsedDate.getUTCMonth() !== month - 1 ||
      parsedDate.getUTCDate() !== day
    ) {
      return
    }

    const id = `${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    setCustomDates((current) =>
      current.some((item) => item.id === id)
        ? current
        : [
            ...current,
            {
              id,
              month,
              day,
              name: `Fecha personalizada · ${DAY_MONTH_FORMATTER.format(parsedDate)}`,
            },
          ],
    )
    setCustomDateInput('')
  }
  const importeNacional = mensualRows.reduce(
    (total, row) => total + (row.importe_nacional_mxn ?? 0),
    0,
  )
  const importeInternacional = mensualRows.reduce(
    (total, row) => total + (row.importe_internacional_mxn ?? 0),
    0,
  )
  const concentration = useMemo(() => {
    const amountsByDescription = new Map<string, number>()
    for (const row of productos.data ?? []) {
      const description = row.descripcion.trim()
      if (!description) continue
      amountsByDescription.set(
        description,
        (amountsByDescription.get(description) ?? 0) + row.importe_mxn,
      )
    }

    const topArticles = [...amountsByDescription.entries()]
      .map(([name, value]) => ({ name, value }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 10)
    const topAmount = topArticles.reduce((total, row) => total + row.value, 0)
    const total = Math.max(kpis.data?.importe_total_mxn ?? 0, topAmount)
    const otherAmount = Math.max(0, total - topAmount)
    const colors = [
      '#5b2480',
      '#0e7490',
      '#67c8dc',
      '#f59e0b',
      '#84cc16',
      '#db2777',
      '#7c3aed',
      '#0891b2',
      '#ea580c',
      '#65a30d',
    ]
    const data = topArticles.map((row, index) => ({
      ...row,
      color: colors[index],
    }))

    if (otherAmount > 0) {
      data.push({ name: 'Otros', value: otherAmount, color: '#cbd5e1' })
    }

    return {
      data,
      total,
      topPct: total > 0 ? (topAmount / total) * 100 : 0,
      cumulativeShares: [3, 5, 10].map((count) => ({
        count,
        pct:
          total > 0
            ? (topArticles
                .slice(0, count)
                .reduce((sum, row) => sum + row.value, 0) /
                total) *
              100
            : 0,
      })),
    }
  }, [productos.data, kpis.data?.importe_total_mxn])

  return (
    <div className="space-y-4">
      <SectionCard
        title="Análisis de compras por proveedor"
        subtitle={`Información calculada con los filtros generales aplicados: ${providerFilterDescription}.`}
        bodyClassName="p-4"
      >
        {kpis.isError && !kpis.data ? (
          <ErrorState message={kpis.error.message} onRetry={kpis.refetch} />
        ) : kpis.isLoading && !kpis.data ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4">
              <SummaryItem
                label="Importe total"
                value={formatMxnCompact(kpis.data?.importe_total_mxn)}
              />
              <SummaryItem
                label="Compras"
                value={formatNumber(kpis.data?.registros)}
              />
              <SummaryItem
                label="Proveedores"
                value={formatNumber(kpis.data?.proveedores)}
              />
              <SummaryItem
                label="Participación internacional"
                value={formatPercent(kpis.data?.pct_internacional)}
              />
            </div>
            <button
              ref={dateFilterButtonRef}
              type="button"
              onClick={onShowPurchases}
              className="inline-flex h-9 shrink-0 items-center rounded-lg border border-brand-200 bg-white px-3 text-xs font-medium text-brand-700 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              Ver compras individuales
            </button>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Comparación entre proveedores"
        subtitle={`Importe por proveedor, respetando los demás filtros generales. Se muestran los 10 principales${selectedProviderCount ? ' y los proveedores seleccionados' : ''}.`}
        actions={
          <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
            <Trophy className="size-3.5" />
            {formatNumber(comparisonData.length)} proveedores
          </span>
        }
        bodyClassName="p-4 pt-5"
      >
        {comparison.isLoading && !comparison.data ? (
          <Skeleton className="h-[360px] w-full" />
        ) : comparison.isError && !comparison.data ? (
          <ErrorState
            message={comparison.error.message}
            onRetry={comparison.refetch}
          />
        ) : comparisonData.length === 0 ? (
          <EmptyState
            icon={Building2}
            title="Sin proveedores para comparar"
            description="No hay compras que coincidan con los filtros generales."
            className="py-12"
          />
        ) : (
          <div
            className="w-full"
            style={{ height: Math.max(300, comparisonData.length * 38) }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={comparisonData}
                layout="vertical"
                margin={{ top: 4, right: 24, left: 8, bottom: 4 }}
              >
                <CartesianGrid
                  stroke="#e2e8f0"
                  strokeDasharray="3 3"
                  horizontal={false}
                />
                <XAxis
                  type="number"
                  tickFormatter={(value) => formatMxnCompact(Number(value))}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="proveedor"
                  width={220}
                  tick={axisTick}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(value, _name, item) => {
                    const row = item.payload as ProviderComparison
                    return [
                      `${formatMxn(Number(value))} · ${formatPercent(row.pct_importe)} · ${formatNumber(row.registros)} compras`,
                      row.proveedor,
                    ]
                  }}
                />
                <Bar
                  dataKey="importe_mxn"
                  name="Importe MXN"
                  radius={[0, 5, 5, 0]}
                  isAnimationActive={false}
                >
                  {comparisonData.map((row) => (
                    <Cell
                      key={row.proveedor}
                      fill={
                        selectedProviderSet.has(row.proveedor)
                          ? '#5b2480'
                          : '#67c8dc'
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Comparación anual de compras"
        subtitle="Importe mensual por año, con los filtros generales aplicados. Las líneas verticales señalan la fecha exacta de cada año."
        actions={
          <>
            <button
              type="button"
              aria-expanded={dateFilterOpen}
              aria-haspopup="dialog"
              onClick={toggleDateFilter}
              className="inline-flex items-center gap-2 rounded-lg border border-brand-200 bg-white px-3 py-2 text-xs font-medium text-brand-800 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
            >
              <CalendarDays className="size-3.5" />
              Fechas señaladas
              <span className="rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] tabular-nums">
                {formatNumber(selectedDateCount)}
              </span>
              <ChevronDown
                className={`size-3.5 transition-transform ${dateFilterOpen ? 'rotate-180' : ''}`}
              />
            </button>
            {dateFilterOpen &&
              createPortal(
                <div
                ref={dateFilterPanelRef}
                role="dialog"
                aria-label="Seleccionar fechas señaladas"
                className="z-[100] max-h-[min(70vh,560px)] w-[min(22rem,calc(100vw-2rem))] overflow-y-auto rounded-xl border border-slate-200 bg-white p-3 shadow-xl"
                style={{
                  position: 'absolute',
                  top: dateFilterPosition.top,
                  right: dateFilterPosition.right,
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <p className="text-xs font-semibold text-slate-800">
                    Fechas predefinidas
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedHolidayNames((current) =>
                        current.size === PREDEFINED_HOLIDAY_NAMES.length
                          ? new Set()
                          : new Set(PREDEFINED_HOLIDAY_NAMES),
                      )
                    }
                    className="text-[11px] font-medium text-brand-700 hover:text-brand-900"
                  >
                    {selectedHolidayNames.size === PREDEFINED_HOLIDAY_NAMES.length
                      ? 'Desmarcar todas'
                      : 'Seleccionar todas'}
                  </button>
                </div>
                <div className="space-y-1">
                  {PREDEFINED_HOLIDAY_NAMES.map((name) => {
                    const checked = selectedHolidayNames.has(name)
                    return (
                      <label
                        key={name}
                        className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            setSelectedHolidayNames((current) => {
                              const next = new Set(current)
                              if (next.has(name)) next.delete(name)
                              else next.add(name)
                              return next
                            })
                          }
                          className="size-3.5 accent-brand-700"
                        />
                        {name}
                      </label>
                    )
                  })}
                </div>

                <form
                  onSubmit={handleAddCustomDate}
                  className="mt-3 border-t border-slate-100 pt-3"
                >
                  <label
                    htmlFor="custom-comparison-date"
                    className="mb-2 block text-xs font-semibold text-slate-800"
                  >
                    Agregar fecha personalizada
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="custom-comparison-date"
                      type="date"
                      required
                      value={customDateInput}
                      onChange={(event) =>
                        setCustomDateInput(event.currentTarget.value)
                      }
                      className="min-w-0 flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-700 focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-100"
                    />
                    <button
                      type="submit"
                      className="shrink-0 rounded-lg bg-brand-700 px-3 py-2 text-xs font-medium text-white transition hover:bg-brand-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                    >
                      Agregar
                    </button>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-500">
                    Se marcará el mismo día y mes en cada año comparado.
                  </p>
                </form>

                {customDates.length > 0 && (
                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <p className="mb-1.5 text-xs font-semibold text-slate-800">
                      Fechas personalizadas
                    </p>
                    <ul className="space-y-1">
                      {customDates.map((item) => (
                        <li
                          key={item.id}
                          className="flex items-center justify-between gap-2 rounded-lg bg-blue-50 px-2 py-1.5 text-xs text-blue-800"
                        >
                          <span>{item.name}</span>
                          <button
                            type="button"
                            aria-label={`Quitar ${item.name}`}
                            onClick={() =>
                              setCustomDates((current) =>
                                current.filter((date) => date.id !== item.id),
                              )
                            }
                            className="rounded p-1 text-blue-700 hover:bg-blue-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                          >
                            <X className="size-3.5" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                </div>,
                document.body,
              )}
          </>
        }
        bodyClassName="p-4 pt-5"
      >
        {mensual.isLoading && !mensual.data ? (
          <Skeleton className="h-[340px] w-full" />
        ) : mensual.isError && !mensual.data ? (
          <ErrorState message={mensual.error.message} onRetry={mensual.refetch} />
        ) : !annualComparison.data.length ? (
          <EmptyState
            icon={CalendarDays}
            title="Sin datos para comparar años"
            description="No hay compras que coincidan con los filtros generales."
            className="py-16"
          />
        ) : (
          <>
            <div className="h-[340px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={annualComparison.data}
                  margin={{ top: 12, right: 18, left: 4, bottom: 4 }}
                >
                  <CartesianGrid
                    stroke="#e2e8f0"
                    strokeDasharray="3 3"
                    vertical={false}
                  />
                  <XAxis
                    type="number"
                    dataKey="x"
                    domain={[0, 12]}
                    ticks={annualComparison.data.map((point) => Number(point.x))}
                    tickFormatter={(value) =>
                      MONTH_NAMES[Math.floor(Number(value))] ?? ''
                    }
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tickFormatter={(value) => formatMxnCompact(Number(value))}
                    tick={axisTick}
                    axisLine={false}
                    tickLine={false}
                    width={72}
                  />
                  <Tooltip
                    contentStyle={tooltipStyle}
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const point = payload[0].payload as Record<
                        string,
                        number | string | null
                      >
                      const month = Number(point.month)
                      if (!Number.isInteger(month) || month < 1 || month > 12) {
                        return null
                      }

                      return (
                        <div
                          className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg"
                          style={{ fontSize: 12 }}
                        >
                          <p className="mb-1 font-medium text-slate-600">
                            {MONTH_NAMES[month - 1]}
                          </p>
                          {annualComparison.years.map((year, index) => {
                            const value = point[String(year)]
                            return (
                              <p
                                key={year}
                                className="tabular-nums"
                                style={{
                                  color:
                                    YEAR_COLORS[index % YEAR_COLORS.length],
                                }}
                              >
                                {year}:{' '}
                                {formatMxn(
                                  typeof value === 'number' ? value : null,
                                )}
                              </p>
                            )
                          })}
                        </div>
                      )
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    height={30}
                    iconType="plainline"
                    wrapperStyle={{ fontSize: 11 }}
                  />
                  {annualComparison.markers.map((marker) => (
                    <ReferenceLine
                      key={`${marker.name}-${marker.year}`}
                      x={marker.x}
                      stroke={HOLIDAY_COLORS[marker.group]}
                      strokeDasharray="4 4"
                      strokeOpacity={0.55}
                    />
                  ))}
                  {annualComparison.years.map((year, index) => (
                    <Line
                      key={year}
                      type="monotone"
                      dataKey={String(year)}
                      name={String(year)}
                      stroke={YEAR_COLORS[index % YEAR_COLORS.length]}
                      strokeWidth={2.25}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                      connectNulls={false}
                      isAnimationActive={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
            {markerLegend.length > 0 && (
              <div className="mt-3 border-t border-slate-100 pt-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Fechas señaladas
                </p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                  {markerLegend.map((marker) => (
                    <span
                      key={marker.name}
                      title={marker.dates}
                      className="inline-flex items-center gap-1.5 text-[11px] text-slate-600"
                    >
                      <span
                        className="h-0.5 w-3 shrink-0"
                        style={{
                          backgroundColor: HOLIDAY_COLORS[marker.group],
                        }}
                      />
                      {marker.name}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-slate-400">
                  Pasa el cursor por cada fecha señalada para ver los días por año.
                </p>
              </div>
            )}
          </>
        )}
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <SectionCard
          title="Evolución mensual"
          subtitle="Importe mensual separado por ámbito, con los filtros generales aplicados"
          className="xl:col-span-2"
          bodyClassName="p-4 pt-5"
        >
          {mensual.isLoading && !mensual.data ? (
            <Skeleton className="h-[292px] w-full" />
          ) : mensual.isError && !mensual.data ? (
            <ErrorState
              message={mensual.error.message}
              onRetry={mensual.refetch}
            />
          ) : !mensual.data?.length ? (
            <EmptyState
              icon={CalendarDays}
              title="Sin compras mensuales"
              description="No hay compras que coincidan con los filtros generales."
              className="py-16"
            />
          ) : (
            <>
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500">Totales del período</span>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span className="inline-flex items-center gap-1.5 font-medium text-brand-800">
                    <span className="size-2 rounded-full bg-brand-700" />
                    Nacional {formatMxnCompact(importeNacional)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 font-medium text-aqua-800">
                    <span className="size-2 rounded-full bg-aqua-500" />
                    Internacional {formatMxnCompact(importeInternacional)}
                  </span>
                </div>
              </div>
              <div className="h-[292px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={mensualRows}
                    margin={{ top: 8, right: 12, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="proveedorNacionalFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#5b2480" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#5b2480" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="proveedorInternacionalFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="#e2e8f0"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="mes"
                      tickFormatter={(value) => formatMonthShort(String(value))}
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                      minTickGap={18}
                    />
                    <YAxis
                      tickFormatter={(value) => formatMxnCompact(Number(value))}
                      tick={axisTick}
                      axisLine={false}
                      tickLine={false}
                      width={72}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      labelFormatter={(label) => formatMonthLong(String(label))}
                      content={({ active, label }) => {
                        if (!active) return null
                        const row = mensualRows.find(
                          (item) => item.mes === String(label),
                        )
                        if (!row) return null

                        const nacional = row.importe_nacional_mxn ?? 0
                        const internacional =
                          row.importe_internacional_mxn ?? 0

                        return (
                          <div
                            className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-lg"
                            style={{ fontSize: 12 }}
                          >
                            <p className="mb-1 font-medium text-slate-600">
                              {formatMonthLong(row.mes)}
                            </p>
                            <p className="font-semibold text-slate-900">
                              Total del mes: {formatMxn(nacional + internacional)}
                            </p>
                            <p className="mt-1 text-brand-800">
                              Nacional: {formatMxn(nacional)}
                            </p>
                            <p className="text-aqua-800">
                              Internacional: {formatMxn(internacional)}
                            </p>
                          </div>
                        )
                      }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={28}
                      iconType="circle"
                      wrapperStyle={{ fontSize: 11 }}
                    />
                    <Area
                      type="monotone"
                      dataKey="importe_nacional_mxn"
                      name="Nacional"
                      stroke="#5b2480"
                      strokeWidth={2}
                      fill="url(#proveedorNacionalFill)"
                      dot={mensualRows.length === 1}
                      isAnimationActive={false}
                    />
                    <Area
                      type="monotone"
                      dataKey="importe_internacional_mxn"
                      name="Internacional"
                      stroke="#06b6d4"
                      strokeWidth={2}
                      fill="url(#proveedorInternacionalFill)"
                      dot={mensualRows.length === 1}
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </SectionCard>

        <SectionCard
          title="Compras por categoría"
          subtitle="Categorías con mayor importe dentro de los filtros aplicados"
          bodyClassName="p-4 pt-2"
        >
          {categorias.isLoading && !categorias.data ? (
            <div className="space-y-3 py-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : categorias.isError && !categorias.data ? (
            <ErrorState
              message={categorias.error.message}
              onRetry={categorias.refetch}
            />
          ) : !categorias.data?.length ? (
            <EmptyState
              icon={Tags}
              title="Sin categorías"
              description="No hay compras por categoría para los filtros seleccionados."
              className="py-16"
            />
          ) : (
            <BarList
              items={categorias.data.map((row) => ({
                key: row.categoria,
                label: row.categoria,
                value: row.importe_mxn,
                valueLabel: formatMxnCompact(row.importe_mxn),
                pct: row.pct_importe,
                meta: `${formatNumber(row.registros)} compras`,
              }))}
              tone="teal"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Principales artículos"
          subtitle="Importe comprado por descripción y año dentro de los filtros aplicados"
          className="xl:col-span-2"
          bodyClassName="p-4 pt-2"
          actions={
            <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-500">
              <ChartLine className="size-3.5" />
              Top 10
            </span>
          }
        >
          {productos.isLoading && !productos.data ? (
            <div className="space-y-3 py-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <Skeleton key={index} className="h-11 w-full" />
              ))}
            </div>
          ) : productos.isError && !productos.data ? (
            <ErrorState
              message={productos.error.message}
              onRetry={productos.refetch}
            />
          ) : !productos.data?.length ? (
            <EmptyState
              icon={ChartLine}
              title="Sin artículos con cantidad"
              description="No hay artículos con cantidad válida para los filtros seleccionados."
              className="py-16"
            />
          ) : (
            <BarList
              items={productos.data.slice(0, 10).map((row) => ({
                key: `${row.descripcion}-${row.anio}`,
                label: row.descripcion,
                value: row.importe_mxn,
                valueLabel: formatMxnCompact(row.importe_mxn),
                meta: `${row.anio} · ${formatNumber(row.registros)} compras · ${formatMxnCompact(row.precio_promedio_mxn)} promedio`,
              }))}
              tone="sky"
            />
          )}
        </SectionCard>

        <SectionCard
          title="Concentración por artículo"
          subtitle="Participación de los 10 artículos principales en el gasto total"
          bodyClassName="p-4 pt-2"
        >
          {productos.isLoading && !productos.data ? (
            <Skeleton className="h-[340px] w-full" />
          ) : productos.isError && !productos.data ? (
            <ErrorState
              message={productos.error.message}
              onRetry={productos.refetch}
            />
          ) : !concentration.data.length || concentration.total <= 0 ? (
            <EmptyState
              icon={ChartLine}
              title="Sin datos para calcular concentración"
              description="No hay importes de artículos para los filtros seleccionados."
              className="py-16"
            />
          ) : (
            <>
              <div className="relative h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={concentration.data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={62}
                      outerRadius={96}
                      paddingAngle={2}
                      stroke="none"
                      isAnimationActive={false}
                    >
                      {concentration.data.map((row) => (
                        <Cell key={row.name} fill={row.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={tooltipStyle}
                      formatter={(value, _name, item) => [
                        `${formatMxn(Number(value))} · ${formatPercent((Number(value) / concentration.total) * 100)}`,
                        item.payload.name,
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    Top 10
                  </span>
                  <span className="text-lg font-semibold text-slate-900">
                    {formatPercent(concentration.topPct)}
                  </span>
                  <span className="text-[10px] text-slate-400">del gasto</span>
                </div>
              </div>
              <ul className="mt-3 space-y-2">
                {concentration.data.map((row) => (
                  <li
                    key={row.name}
                    className="flex items-center gap-2 text-xs"
                    title={row.name}
                  >
                    <span
                      className="size-2 shrink-0 rounded-full"
                      style={{ backgroundColor: row.color }}
                    />
                    <span className="min-w-0 flex-1 truncate text-slate-600">
                      {row.name}
                    </span>
                    <span className="shrink-0 text-[11px] text-slate-500 tabular-nums">
                      {formatMxnCompact(row.value)}
                    </span>
                    <span className="w-11 shrink-0 text-right font-semibold text-slate-700 tabular-nums">
                      {formatPercent((row.value / concentration.total) * 100)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 border-t border-slate-100 pt-3">
                <p className="mb-2 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Participación acumulada
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {concentration.cumulativeShares.map(({ count, pct }) => (
                    <div
                      key={count}
                      className="rounded-lg bg-slate-50 px-2 py-2 text-center"
                    >
                      <p className="text-[10px] text-slate-500">Top {count}</p>
                      <p className="text-xs font-semibold text-slate-800 tabular-nums">
                        {formatPercent(pct)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </SectionCard>
      </div>
    </div>
  )
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-brand-100 bg-brand-50/50 px-3 py-2">
      <p className="text-[10px] text-slate-500">{label}</p>
      <p
        className="truncate text-sm font-semibold text-slate-900 tabular-nums"
        title={value}
      >
        {value}
      </p>
    </div>
  )
}
