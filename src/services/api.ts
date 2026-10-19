import type {
  ConsultaResult,
  Filters,
  Health,
  Importacion,
  ImportacionesQuery,
  ImportadorRow,
  Job,
  Kpis,
  MensualRow,
  OrderBy,
  Page,
  PaisOrigenRow,
  PartidaMeta,
  PartidaRow,
  Pregunta,
  ProveedorPaisRow,
  ProveedorRow,
  TipoImportacionRow,
} from '../types/api'

/**
 * En desarrollo el proxy de Vite reenvía `/api` a http://localhost:8000.
 * En despliegue puedes definir VITE_API_URL con la URL absoluta del backend.
 */
export const API_BASE = (import.meta.env.VITE_API_URL?.trim() || '/api').replace(
  /\/+$/,
  '',
)

type QueryValue = string | number | boolean | null | undefined
export type QueryParams = Record<string, QueryValue>

export function buildQuery(params?: object): string {
  if (!params) return ''

  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      continue
    }
    if (value === '') continue
    search.set(key, String(value))
  }

  const query = search.toString()
  return query ? `?${query}` : ''
}

export class ApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(
  path: string,
  params?: object,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${API_BASE}${path}${buildQuery(params)}`, {
    headers: { Accept: 'application/json', ...init?.headers },
    ...init,
  })

  if (!response.ok) {
    const body = await response.text()
    let detail = body
    try {
      const parsed = JSON.parse(body) as { detail?: unknown }
      if (typeof parsed.detail === 'string') {
        detail = parsed.detail
      } else if (parsed.detail) {
        detail = JSON.stringify(parsed.detail)
      }
    } catch {
      // La respuesta no era JSON: conservamos el texto plano.
    }
    throw new ApiError(
      (detail || `Error ${response.status} al consultar la API`).slice(0, 300),
      response.status,
    )
  }

  return (await response.json()) as T
}

const rankingParams = (
  filters: Filters,
  top: number,
  orderBy: OrderBy = 'valor_usd',
): QueryParams => ({
  ...filters,
  top,
  order_by: orderBy,
  desc: true,
})

export const api = {
  health: (signal?: AbortSignal) => request<Health>('/health', undefined, { signal }),

  aduanas: (signal?: AbortSignal) =>
    request<string[]>('/meta/aduanas', undefined, { signal }),

  paises: (signal?: AbortSignal) =>
    request<string[]>('/meta/paises', undefined, { signal }),

  partidas: (signal?: AbortSignal) =>
    request<PartidaMeta[]>('/meta/partidas', undefined, { signal }),

  kpis: (filters: Filters, signal?: AbortSignal) =>
    request<Kpis>('/reportes/kpis', filters, { signal }),

  mensual: (filters: Filters, signal?: AbortSignal) =>
    request<Page<MensualRow>>('/reportes/mensual', { ...filters, page_size: 120 }, {
      signal,
    }),

  paisesOrigen: (filters: Filters, top = 8, signal?: AbortSignal) =>
    request<Page<PaisOrigenRow>>(
      '/reportes/paises-origen',
      rankingParams(filters, top),
      { signal },
    ),

  tiposImportacion: (
    filters: Filters,
    opciones: { top?: number; soloPrincipales?: boolean } = {},
    signal?: AbortSignal,
  ) =>
    request<Page<TipoImportacionRow>>(
      '/reportes/tipo-importacion',
      {
        ...rankingParams(filters, opciones.top ?? 8),
        solo_principales: opciones.soloPrincipales ?? true,
      },
      { signal },
    ),

  importadores: (
    filters: Filters,
    top = 10,
    orderBy: OrderBy = 'valor_usd',
    signal?: AbortSignal,
  ) =>
    request<Page<ImportadorRow>>(
      '/reportes/importadores',
      rankingParams(filters, top, orderBy),
      { signal },
    ),

  importadoresCancun: (
    filters: Filters,
    top = 10,
    orderBy: OrderBy = 'valor_usd',
    signal?: AbortSignal,
  ) =>
    request<Page<ImportadorRow>>(
      '/reportes/importadores-cancun',
      rankingParams(filters, top, orderBy),
      { signal },
    ),

  proveedores: (
    filters: Filters,
    top = 10,
    orderBy: OrderBy = 'valor_usd',
    signal?: AbortSignal,
  ) =>
    request<Page<ProveedorRow>>(
      '/reportes/proveedores',
      rankingParams(filters, top, orderBy),
      { signal },
    ),

  proveedoresPorPais: (
    filters: Filters,
    top = 15,
    orderBy: OrderBy = 'valor_usd',
    signal?: AbortSignal,
  ) =>
    request<Page<ProveedorPaisRow>>(
      '/reportes/proveedores-por-pais',
      rankingParams(filters, top, orderBy),
      { signal },
    ),

  rankingPartidas: (
    filters: Filters,
    top = 10,
    orderBy: OrderBy = 'valor_usd',
    signal?: AbortSignal,
  ) =>
    request<Page<PartidaRow>>(
      '/reportes/partidas',
      rankingParams(filters, top, orderBy),
      { signal },
    ),

  importaciones: (query: ImportacionesQuery, signal?: AbortSignal) => {
    const { q, ...params } = query
    const path = q?.trim() ? '/importaciones/buscar' : '/importaciones'
    return request<Page<Importacion>>(
      path,
      { ...params, q: q?.trim() || undefined },
      { signal },
    )
  },

  preguntas: (categoria?: string, signal?: AbortSignal) =>
    request<Pregunta[]>('/preguntas', { categoria }, { signal }),

  consulta: (
    payload: { pregunta: string; params?: Record<string, unknown> },
    signal?: AbortSignal,
  ) =>
    request<ConsultaResult>('/consulta', undefined, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal,
    }),

  exportUrl: (
    recurso: 'importaciones' | 'importadores' | 'proveedores',
    formato: 'xlsx' | 'csv',
    filters: Filters & { q?: string } = {},
  ) => `${API_BASE}/exportar/${recurso}${buildQuery({ ...filters, formato })}`,

  async subirExcel(
    archivo: File,
    opciones: { hoja: string; filaHeader: number },
  ): Promise<Job> {
    const form = new FormData()
    form.append('archivo', archivo)

    const response = await fetch(
      `${API_BASE}/procesamiento/upload${buildQuery({
        hoja: opciones.hoja,
        fila_header: opciones.filaHeader,
      })}`,
      { method: 'POST', body: form, headers: { Accept: 'application/json' } },
    )

    if (!response.ok) {
      throw new ApiError(
        `No se pudo procesar el archivo (HTTP ${response.status})`,
        response.status,
      )
    }
    return (await response.json()) as Job
  },

  cargarEnMysql: (signal?: AbortSignal) =>
    request<Job>(
      '/procesamiento/cargar',
      { hoja: 'Datos_Limpios' },
      { method: 'POST', signal },
    ),
}
