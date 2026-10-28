import type {
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
  PaisOrigenRow,
  PartidaMeta,
  PartidaRow,
  Pregunta,
  ProveedorPaisRow,
  ProveedorRow,
  TipoImportacionRow,
} from '@/types/importaciones'
import type { AgenteResult, ChatHistoryMessage } from '@/types/chatbot'
import type { Page } from '@/types/common'
import {
  API_BASE,
  ApiError,
  buildQuery,
  request,
  type QueryParams,
} from './client'

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

export const importacionesApi = {
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
    payload: { pregunta: string; historial?: ChatHistoryMessage[] },
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
