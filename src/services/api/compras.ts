import type {
  CompraArticulo,
  CompraCategoria,
  ComprasComparativoOrder,
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
} from '@/types/compras'
import type { Page } from '@/types/common'
import { API_BASE, buildQuery, request } from './client'

export const comprasApi = {
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
      orderBy?: ComprasComparativoOrder
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
}
