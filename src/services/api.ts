import type {
  AgenteResult,
  AnalisisMetric,
  ComparativoDimension,
  ComparativoOrder,
  ComparativoResult,
  ConsultaResult,
  Filters,
  Health,
  Importacion,
  ImportacionesQuery,
  ImportadorRow,
  Job,
  Kpis,
  MatrizColumnaKey,
  MatrizResult,
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
import type {
  CompraArticulo,
  CompraCategoria,
  CompraComparativoOrder,
  CompraComparativoResult,
  CompraMensual,
  CompraPrecioMensual,
  CompraPrecioProducto,
  CompraProveedor,
  ComprasComparativoDimension,
  ComprasComparativoMetric,
  ComprasFilters,
  ComprasImportResult,
  ComprasKpis,
  ComprasMeta,
  ComprasOrder,
} from '../types/compras'

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

  comparativo: (
    filters: Filters,
    opciones: {
      dimension?: ComparativoDimension
      mes?: string
      comparar?: string
      metrica?: AnalisisMetric
      orderBy?: ComparativoOrder
      top?: number
      minRegistros?: number
    } = {},
    signal?: AbortSignal,
  ) =>
    request<ComparativoResult>(
      '/reportes/comparativo',
      {
        ...filters,
        dimension: opciones.dimension ?? 'partida',
        mes: opciones.mes,
        comparar: opciones.comparar,
        metrica: opciones.metrica ?? 'valor_usd',
        order_by: opciones.orderBy ?? 'delta_abs',
        top: opciones.top ?? 20,
        min_registros: opciones.minRegistros ?? 5,
      },
      { signal },
    ),

  matriz: (
    filters: Filters,
    opciones: {
      columna?: MatrizColumnaKey
      metrica?: AnalisisMetric
      topFilas?: number
      topColumnas?: number
      minRegistros?: number
    } = {},
    signal?: AbortSignal,
  ) =>
    request<MatrizResult>(
      '/reportes/matriz',
      {
        ...filters,
        columna: opciones.columna ?? 'pais_origen',
        metrica: opciones.metrica ?? 'valor_usd',
        top_filas: opciones.topFilas ?? 20,
        top_columnas: opciones.topColumnas ?? 10,
        min_registros: opciones.minRegistros ?? 3,
      },
      { signal },
    ),

  comprasKpis: (filters: ComprasFilters, signal?: AbortSignal) =>
    request<ComprasKpis>('/compras/kpis', filters, { signal }),

  comprasMensual: (filters: ComprasFilters, signal?: AbortSignal) =>
    request<CompraMensual[]>('/compras/mensual', filters, { signal }),

  comprasCategorias: (
    filters: ComprasFilters,
    top = 8,
    signal?: AbortSignal,
  ) =>
    request<CompraCategoria[]>('/compras/categorias', { ...filters, top }, {
      signal,
    }),

  comprasProveedores: (
    filters: ComprasFilters,
    top = 8,
    signal?: AbortSignal,
  ) =>
    request<CompraProveedor[]>('/compras/proveedores', { ...filters, top }, {
      signal,
    }),

  comprasPrecios: (
    filters: ComprasFilters,
    opciones: { anio?: number; top?: number } = {},
    signal?: AbortSignal,
  ) =>
    request<CompraPrecioProducto[]>(
      '/compras/precios',
      {
        ...filters,
        anio: opciones.anio,
        top: opciones.top ?? 100,
      },
      { signal },
    ),

  comprasPrecioMensual: (
    filters: ComprasFilters,
    opciones: { descripcion: string; anio?: number },
    signal?: AbortSignal,
  ) =>
    request<CompraPrecioMensual[]>(
      '/compras/precios/mensual',
      {
        ...filters,
        descripcion: opciones.descripcion,
        anio: opciones.anio,
      },
      { signal },
    ),

  comprasComparativo: (
    filters: ComprasFilters,
    opciones: {
      dimension?: ComprasComparativoDimension
      mes?: string
      comparar?: string
      metrica?: ComprasComparativoMetric
      orderBy?: CompraComparativoOrder
      top?: number
      minRegistros?: number
    } = {},
    signal?: AbortSignal,
  ) =>
    request<CompraComparativoResult>(
      '/compras/comparativo',
      {
        ...filters,
        dimension: opciones.dimension ?? 'descripcion',
        mes: opciones.mes,
        comparar: opciones.comparar,
        metrica: opciones.metrica ?? 'importe_mxn',
        order_by: opciones.orderBy ?? 'delta_abs',
        top: opciones.top ?? 20,
        min_registros: opciones.minRegistros ?? 3,
      },
      { signal },
    ),

  comprasMeta: (signal?: AbortSignal) =>
    request<ComprasMeta>('/compras/meta', undefined, { signal }),

  comprasArticulos: (
    filters: ComprasFilters,
    opciones: {
      page?: number
      pageSize?: number
      orderBy?: ComprasOrder
      desc?: boolean
    } = {},
    signal?: AbortSignal,
  ) =>
    request<Page<CompraArticulo>>(
      '/compras/articulos',
      {
        ...filters,
        page: opciones.page ?? 1,
        page_size: opciones.pageSize ?? 25,
        order_by: opciones.orderBy ?? 'fecha',
        desc: opciones.desc ?? true,
      },
      { signal },
    ),

  comprasExportUrl: (
    formato: 'xlsx' | 'csv',
    filters: ComprasFilters = {},
    orderBy: ComprasOrder = 'fecha',
    desc = true,
  ) =>
    `${API_BASE}/compras/exportar${buildQuery({
      ...filters,
      formato,
      order_by: orderBy,
      desc,
    })}`,

  async importarCompras(
    archivo: File,
    modo: 'reemplazar' | 'agregar',
    signal?: AbortSignal,
  ): Promise<ComprasImportResult> {
    const form = new FormData()
    form.append('archivo', archivo)
    return request<ComprasImportResult>('/compras/importar', { modo }, {
      method: 'POST',
      body: form,
      signal,
    })
  },

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

  agenteConsulta: (
    payload: { pregunta: string },
    signal?: AbortSignal,
  ) =>
    request<AgenteResult>('/agente/consulta', undefined, {
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

  async subirExcels(
    archivos: File[],
    opciones: { hoja: string; filaHeader: number },
  ): Promise<Job> {
    const form = new FormData()
    for (const archivo of archivos) {
      form.append('archivos', archivo)
    }

    const response = await fetch(
      `${API_BASE}/procesamiento/upload-lote${buildQuery({
        hoja: opciones.hoja,
        fila_header: opciones.filaHeader,
      })}`,
      { method: 'POST', body: form, headers: { Accept: 'application/json' } },
    )

    if (!response.ok) {
      throw new ApiError(
        `No se pudieron procesar los archivos (HTTP ${response.status})`,
        response.status,
      )
    }
    return (await response.json()) as Job
  },

  cargarEnMysql: (modo: 'agregar' | 'reemplazar', signal?: AbortSignal) =>
    request<Job>(
      '/procesamiento/cargar',
      { hoja: 'Datos_Limpios', modo },
      { method: 'POST', signal },
    ),
}
