import type { ComprasFilters, ComprasTab } from '@/types/compras'
import type { Filters, ImportacionesTab } from '@/types/importaciones'

export const IMPORTACIONES_FILTER_KEYS = [
  'fecha_desde',
  'fecha_hasta',
  'aduana',
  'pais_origen',
  'partida',
  'importador',
  'exportador',
] as const

export const COMPRAS_FILTER_KEYS = [
  'fecha_desde',
  'fecha_hasta',
  'categoria',
  'proveedor',
  'descripcion',
  'ambito',
  'fraccion',
  'q',
] as const

const IMPORTACIONES_TABS: readonly ImportacionesTab[] = [
  'resumen',
  'importadores',
  'proveedores',
  'productos',
  'comparativo',
  'matriz',
  'operaciones',
  'preguntas',
]

const COMPRAS_TABS: readonly ComprasTab[] = [
  'graficas',
  'precios',
  'comparativo',
  'tabla',
]

function read(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key)?.trim()
  return value || undefined
}

function isImportacionesTab(value: string | undefined): value is ImportacionesTab {
  return value !== undefined && IMPORTACIONES_TABS.includes(value as ImportacionesTab)
}

function isComprasTab(value: string | undefined): value is ComprasTab {
  return value !== undefined && COMPRAS_TABS.includes(value as ComprasTab)
}

function buildSearchParams(filters: object, tab: string): URLSearchParams {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (typeof value === 'string' && value) params.set(key, value)
  }
  params.set('tab', tab)
  return params
}

export function parseImportacionesRoute(searchParams: URLSearchParams): {
  filters: Filters
  tab: ImportacionesTab
} {
  const filters: Filters = {
    fecha_desde: read(searchParams, 'fecha_desde'),
    fecha_hasta: read(searchParams, 'fecha_hasta'),
    aduana: read(searchParams, 'aduana'),
    pais_origen: read(searchParams, 'pais_origen'),
    partida: read(searchParams, 'partida'),
    importador: read(searchParams, 'importador'),
    exportador: read(searchParams, 'exportador'),
  }
  for (const key of IMPORTACIONES_FILTER_KEYS) {
    if (!filters[key]) delete filters[key]
  }
  const tab = read(searchParams, 'tab')
  return {
    filters,
    tab: isImportacionesTab(tab) ? tab : 'resumen',
  }
}

export function parseComprasRoute(searchParams: URLSearchParams): {
  filters: ComprasFilters
  tab: ComprasTab
} {
  const ambito = read(searchParams, 'ambito')
  const filters: ComprasFilters = {
    fecha_desde: read(searchParams, 'fecha_desde'),
    fecha_hasta: read(searchParams, 'fecha_hasta'),
    categoria: read(searchParams, 'categoria'),
    proveedor: read(searchParams, 'proveedor'),
    descripcion: read(searchParams, 'descripcion'),
    ambito:
      ambito === 'nacional' || ambito === 'internacional' ? ambito : undefined,
    fraccion: read(searchParams, 'fraccion'),
    q: read(searchParams, 'q'),
  }
  for (const key of COMPRAS_FILTER_KEYS) {
    if (!filters[key]) delete filters[key]
  }
  const tab = read(searchParams, 'tab')
  return {
    filters,
    tab: isComprasTab(tab) ? tab : 'graficas',
  }
}

export function importacionesSearchParams(
  filters: Filters,
  tab: ImportacionesTab,
): URLSearchParams {
  return buildSearchParams(filters, tab)
}

export function comprasSearchParams(
  filters: ComprasFilters,
  tab: ComprasTab,
): URLSearchParams {
  return buildSearchParams(filters, tab)
}

export function buildImportacionesUrl(
  filters: Filters,
  tab: ImportacionesTab = 'resumen',
): string {
  const query = importacionesSearchParams(filters, tab).toString()
  return query ? `/?${query}` : '/'
}

export function buildComprasUrl(
  filters: ComprasFilters,
  tab: ComprasTab = 'graficas',
): string {
  const query = comprasSearchParams(filters, tab).toString()
  return query ? `/compras?${query}` : '/compras'
}
