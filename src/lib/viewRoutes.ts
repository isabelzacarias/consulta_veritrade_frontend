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
  'aduanas',
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
  'proveedores',
  'precios',
  'comparativo',
  'tabla',
]

function read(searchParams: URLSearchParams, key: string): string | undefined {
  const value = searchParams.get(key)?.trim()
  return value || undefined
}

function readAll(
  searchParams: URLSearchParams,
  key: string,
): string[] | undefined {
  const values = searchParams
    .getAll(key)
    .map((value) => value.trim())
    .filter(Boolean)
  return values.length > 0 ? values : undefined
}

function asString(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0]
  return value
}

function asArray(value: string | string[] | undefined): string[] | undefined {
  if (Array.isArray(value)) {
    const values = value.filter(Boolean)
    return values.length > 0 ? values : undefined
  }
  return value ? [value] : undefined
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
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item) params.append(key, item)
      }
    } else if (typeof value === 'string' && value) {
      params.set(key, value)
    }
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
    aduana: readAll(searchParams, 'aduana'),
    pais_origen: readAll(searchParams, 'pais_origen'),
    partida: readAll(searchParams, 'partida'),
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
  const ambitos = readAll(searchParams, 'ambito')?.filter(
    (ambito): ambito is 'nacional' | 'internacional' =>
      ambito === 'nacional' || ambito === 'internacional',
  )
  const filters: ComprasFilters = {
    fecha_desde: read(searchParams, 'fecha_desde'),
    fecha_hasta: read(searchParams, 'fecha_hasta'),
    categoria: readAll(searchParams, 'categoria'),
    proveedor: readAll(searchParams, 'proveedor'),
    descripcion: readAll(searchParams, 'descripcion'),
    ambito: ambitos && ambitos.length > 0 ? ambitos : undefined,
    fraccion: readAll(searchParams, 'fraccion'),
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
  return query ? `/importaciones?${query}` : '/importaciones'
}

export function buildComprasUrl(
  filters: ComprasFilters,
  tab: ComprasTab = 'graficas',
): string {
  const query = comprasSearchParams(filters, tab).toString()
  return query ? `/compras?${query}` : '/compras'
}

export function buildViewUrl(
  modulo: 'importaciones' | 'compras',
  filtros: Record<string, string | string[] | undefined>,
  tab?: string | null,
): string | null {
  if (modulo === 'importaciones') {
    const filters: Filters = {
      fecha_desde: asString(filtros.fecha_desde),
      fecha_hasta: asString(filtros.fecha_hasta),
      aduana: asArray(filtros.aduana),
      pais_origen: asArray(filtros.pais_origen),
      partida: asArray(filtros.partida),
      importador: asString(filtros.importador),
      exportador: asString(filtros.exportador),
    }
    const candidate = tab ?? undefined
    const nextTab = isImportacionesTab(candidate) ? candidate : 'resumen'
    return buildImportacionesUrl(filters, nextTab)
  }

  if (modulo === 'compras') {
    const ambitos = asArray(filtros.ambito)?.filter(
      (ambito): ambito is 'nacional' | 'internacional' =>
        ambito === 'nacional' || ambito === 'internacional',
    )
    const filters: ComprasFilters = {
      fecha_desde: asString(filtros.fecha_desde),
      fecha_hasta: asString(filtros.fecha_hasta),
      categoria: asArray(filtros.categoria),
      proveedor: asArray(filtros.proveedor),
      descripcion: asArray(filtros.descripcion),
      ambito: ambitos && ambitos.length > 0 ? ambitos : undefined,
      fraccion: asArray(filtros.fraccion),
      q: asString(filtros.q),
    }
    const candidate = tab ?? undefined
    const nextTab = isComprasTab(candidate) ? candidate : 'graficas'
    return buildComprasUrl(filters, nextTab)
  }

  return null
}
