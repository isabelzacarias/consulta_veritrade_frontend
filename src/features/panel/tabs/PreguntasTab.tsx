import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import {
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react'
import type { ConsultaResult, Filters } from '../../../types/api'
import { api } from '../../../services/api'
import {
  formatDate,
  formatDecimal,
  formatKg,
  formatMonthLong,
  formatNumber,
  formatPercent,
  formatUsd,
  formatUsdDetailed,
} from '../../../lib/format'
import { SectionCard } from '../../../components/ui/SectionCard'
import { MarkdownRenderer } from '../../../components/ui/MarkdownRenderer'
import { EmptyState, ErrorState, Skeleton } from '../../../components/ui/States'

type UnknownRecord = Record<string, unknown>

const isRecord = (value: unknown): value is UnknownRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const PREFERRED_COLUMNS = [
  'fecha',
  'partida_arancelaria',
  'descripcion_partida',
  'importador',
  'exportador',
  'pais_origen',
  'tipo_importacion',
  'mes',
  'valor_total_usd',
  'qty1',
  'valor_usd',
  'volumen_kg',
  'registros',
  'costo_unit_ponderado',
  'pct_total',
  'porcentaje',
  'aduana',
]

const COLUMN_LABELS: Record<string, string> = {
  fecha: 'Fecha',
  partida_arancelaria: 'Partida',
  descripcion_partida: 'Descripción',
  importador: 'Importador',
  exportador: 'Proveedor',
  pais_origen: 'Origen',
  tipo_importacion: 'Tipo',
  mes: 'Mes',
  valor_total_usd: 'Valor USD',
  qty1: 'Volumen',
  valor_usd: 'Valor USD',
  volumen_kg: 'Volumen',
  registros: 'Registros',
  costo_unit_ponderado: 'Costo USD/kg',
  pct_total: '% valor',
  porcentaje: '% peso',
  aduana: 'Aduana',
  importadores: 'Importadores',
  exportadores: 'Exportadores',
  partidas: 'Partidas',
  paises_origen: 'Países',
}

const KPI_LABELS: Record<string, string> = {
  valor_total_usd: 'Valor total USD',
  volumen_total_kg: 'Volumen total kg',
  registros: 'Operaciones',
  costo_unit_ponderado: 'Costo USD/kg',
  importadores: 'Importadores',
  exportadores: 'Exportadores',
  partidas: 'Partidas',
  paises_origen: 'Países de origen',
}

export function PreguntasTab({ filters }: { filters: Filters }) {
  const [categoria, setCategoria] = useState('Todas')
  const resultRef = useRef<HTMLDivElement>(null)

  const preguntas = useQuery({
    queryKey: ['preguntas'],
    queryFn: ({ signal }) => api.preguntas(undefined, signal),
    staleTime: 5 * 60_000,
  })

  const mutation = useMutation({
    mutationFn: (texto: string) => {
      const params = Object.fromEntries(
        Object.entries({ ...filters, top: 10 }).filter(
          ([, value]) => value !== undefined && value !== '',
        ),
      )
      return api.consulta({ pregunta: texto, params })
    },
  })

  useEffect(() => {
    if (mutation.isSuccess && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [mutation.isSuccess, mutation.data])

  // La pregunta de búsqueda libre requiere un parámetro `q`; el buscador ya
  // está disponible en la pestaña Operaciones.
  const preguntasDisponibles = useMemo(
    () =>
      (preguntas.data ?? []).filter(
        (item) => item.endpoint !== '/importaciones/buscar',
      ),
    [preguntas.data],
  )

  const categorias = useMemo(() => {
    const values = new Set(preguntasDisponibles.map((item) => item.categoria))
    return ['Todas', ...values]
  }, [preguntasDisponibles])

  const visibles = preguntasDisponibles.filter(
    (item) => categoria === 'Todas' || item.categoria === categoria,
  )

  return (
    <div className="space-y-4">
      <SectionCard
        title="Preguntas frecuentes"
        subtitle="Selecciona una pregunta precargada; la respuesta se calcula con los filtros activos"
        bodyClassName="p-5"
        actions={
          preguntas.isLoading ? (
            <Loader2 className="size-4 animate-spin text-brand-600" />
          ) : (
            <span className="text-[11px] text-slate-500">
              {visibles.length} pregunta{visibles.length === 1 ? '' : 's'}
            </span>
          )
        }
      >
        {preguntas.isLoading ? (
          <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-16 w-full" />
            ))}
          </div>
        ) : preguntas.isError ? (
          <ErrorState
            message={preguntas.error?.message ?? 'Error desconocido'}
            onRetry={preguntas.refetch}
          />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {categorias.map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => setCategoria(item)}
                  className={`rounded-full px-3 py-1 text-[11px] font-medium transition ${
                    categoria === item
                      ? 'bg-brand-700 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {visibles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => mutation.mutate(item.pregunta)}
                  className="group rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                >
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-brand-700">
                    {item.categoria}
                  </span>
                  <span className="mt-1 block text-xs font-medium leading-relaxed text-slate-700 group-hover:text-slate-900">
                    {item.pregunta}
                  </span>
                  {item.descripcion && (
                    <span className="mt-1 block text-[10px] leading-relaxed text-slate-400">
                      {item.descripcion}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
              Las respuestas se limitan a 10 resultados. La pregunta de peso por
              producto requiere seleccionar una partida en los filtros. Para buscar
              texto libre usa la pestaña Operaciones.
            </p>
          </>
        )}
      </SectionCard>

      {mutation.isPending && (
        <SectionCard title="Respuesta" bodyClassName="p-5">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Loader2 className="size-5 animate-spin text-brand-600" />
            Consultando la API…
          </div>
        </SectionCard>
      )}

      {mutation.isError && (
        <SectionCard title="Respuesta" bodyClassName="">
          <ErrorState
            message={
              mutation.error instanceof Error
                ? mutation.error.message
                : 'No se pudo ejecutar la consulta.'
            }
            onRetry={() => mutation.mutate(mutation.variables ?? '')}
          />
        </SectionCard>
      )}

      {mutation.data && !mutation.isPending && (
        <div ref={resultRef} className="scroll-mt-24">
          <ConsultaResultView result={mutation.data} />
        </div>
      )}

      {!mutation.data && !mutation.isPending && !mutation.isError && (
        <EmptyState
          icon={Sparkles}
          title="Selecciona una pregunta"
          description="La respuesta incluye un resumen determinista y los datos del endpoint correspondiente."
        />
      )}
    </div>
  )
}

function ConsultaResultView({ result }: { result: ConsultaResult }) {
  if (!result.encontrada) {
    return (
      <SectionCard title="Respuesta" bodyClassName="p-5">
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <MarkdownRenderer content={result.resumen} className="flex-1 text-xs" />
        </div>
        {result.sugerencias && result.sugerencias.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Prueba con una de estas preguntas
            </p>
            <ul className="list-disc space-y-1 pl-5 text-[11px] text-slate-500">
              {result.sugerencias.slice(0, 10).map((sugerencia) => (
                <li key={sugerencia}>{sugerencia}</li>
              ))}
            </ul>
          </div>
        )}
      </SectionCard>
    )
  }

  return (
    <SectionCard
      title="Respuesta"
      subtitle={result.pregunta ?? undefined}
      actions={
        result.categoria ? (
          <span className="rounded-full bg-brand-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-brand-700">
            {result.categoria}
          </span>
        ) : undefined
      }
      bodyClassName="p-5"
    >
      <MarkdownRenderer
        content={result.resumen}
        className="rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3 text-sm leading-relaxed"
      />

      <div className="mt-4">
        <DatosView datos={result.datos} />
      </div>

      {result.endpoint && (
        <p className="mt-4 border-t border-slate-100 pt-3 text-[10px] text-slate-400">
          Fuente: <code className="font-mono">{result.endpoint}</code>
          {result.params && Object.keys(result.params).length > 0 && (
            <>
              {' · '}
              <code className="font-mono">{JSON.stringify(result.params)}</code>
            </>
          )}
        </p>
      )}
    </SectionCard>
  )
}

function DatosView({ datos }: { datos: unknown }) {
  if (datos == null) {
    return <p className="text-xs text-slate-400">La consulta no devolvió datos.</p>
  }

  if (Array.isArray(datos)) {
    return datos.every((item) => typeof item === 'string') ? (
      <StringChips items={datos as string[]} />
    ) : (
      <DynamicTable items={datos.filter(isRecord)} />
    )
  }

  if (isRecord(datos)) {
    if (Array.isArray(datos.items)) {
      const items = datos.items
      if (items.every((item) => typeof item === 'string')) {
        return <StringChips items={items as string[]} />
      }
      return <DynamicTable items={items.filter(isRecord)} />
    }

    return <KeyValueGrid data={datos} />
  }

  return (
    <pre className="overflow-x-auto rounded-lg bg-slate-50 p-3 text-xs text-slate-600">
      {String(datos)}
    </pre>
  )
}

function StringChips({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] text-slate-600"
        >
          {item}
        </span>
      ))}
    </div>
  )
}

function KeyValueGrid({ data }: { data: UnknownRecord }) {
  return (
    <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="rounded-xl border border-slate-200/80 bg-white p-3">
          <dt className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            {KPI_LABELS[key] ?? key}
          </dt>
          <dd className="mt-1 text-sm font-semibold text-slate-900 tabular-nums">
            {formatCell(key, value)}
          </dd>
        </div>
      ))}
    </dl>
  )
}

function DynamicTable({ items }: { items: UnknownRecord[] }) {
  if (items.length === 0) {
    return <p className="text-xs text-slate-400">Sin resultados para mostrar.</p>
  }

  const available = new Set(items.flatMap((item) => Object.keys(item)))
  const preferred = PREFERRED_COLUMNS.filter((key) => available.has(key))
  const columns =
    preferred.length > 0 ? preferred.slice(0, 8) : Object.keys(items[0]).slice(0, 8)

  return (
    <div className="max-h-[420px] overflow-auto rounded-xl border border-slate-200">
      <table className="w-full min-w-[760px] border-collapse text-left text-xs">
        <thead className="sticky top-0 z-10 bg-slate-50">
          <tr className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            {columns.map((column) => (
              <th key={column} className="whitespace-nowrap px-3 py-2">
                {COLUMN_LABELS[column] ?? column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {items.map((item, index) => (
            <tr key={index} className="hover:bg-slate-50/70">
              {columns.map((column) => (
                <td
                  key={column}
                  className="max-w-[260px] truncate px-3 py-2 text-slate-600"
                  title={String(item[column] ?? '')}
                >
                  {formatCell(column, item[column])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function formatCell(key: string, value: unknown) {
  if (value == null || value === '') return '—'

  if (typeof value === 'number') {
    if (key.includes('usd') && key.includes('unit')) return formatUsdDetailed(value)
    if (key.includes('usd')) return formatUsd(value)
    if (key.includes('costo')) return `$${formatDecimal(value)}`
    if (key.includes('kg') || key === 'qty1' || key === 'qty2') return formatKg(value)
    if (key.includes('pct') || key === 'porcentaje') return formatPercent(value)
    return formatNumber(value)
  }

  if (typeof value === 'string') {
    if (key === 'fecha') return formatDate(value)
    if (key === 'mes') return formatMonthLong(value)
    return value
  }

  return String(value)
}
