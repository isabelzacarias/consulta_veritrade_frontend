export type AmbitoCompra = 'nacional' | 'internacional'
export type ComprasOrder =
  | 'fecha'
  | 'importe_mxn'
  | 'precio_unitario_mxn'
  | 'cantidad'
  | 'proveedor'
export type ComprasComparativoDimension =
  | 'descripcion'
  | 'categoria'
  | 'proveedor'
export type ComprasComparativoMetric =
  | 'importe_mxn'
  | 'cantidad'
  | 'precio_promedio_mxn'
export type ComprasComparativoOrder =
  | 'delta_abs'
  | 'delta_pp'
  | 'valor_actual'
export type ComprasComparativoEstado =
  | 'sube'
  | 'baja'
  | 'nuevo'
  | 'desaparece'
  | 'sin_cambio'

export interface ComprasFilters {
  fecha_desde?: string
  fecha_hasta?: string
  categoria?: string
  proveedor?: string
  descripcion?: string
  ambito?: AmbitoCompra
  fraccion?: string
  q?: string
}

export interface ComprasKpis {
  importe_total_mxn: number | null
  registros: number
  proveedores: number
  categorias: number
  meses: number
  importe_nacional_mxn: number | null
  importe_internacional_mxn: number | null
  pct_internacional: number | null
  fracciones_validas: number
  fracciones_invalidas: number
  sin_fraccion: number
  fecha_min: string | null
  fecha_max: string | null
}

export interface CompraMensual {
  mes: string
  importe_mxn: number | null
  importe_nacional_mxn: number | null
  importe_internacional_mxn: number | null
  registros: number
  pct_internacional: number | null
  completo: boolean
}

export interface CompraCategoria {
  categoria: string
  importe_mxn: number | null
  registros: number
  proveedores: number
  pct_importe: number | null
  pct_internacional: number | null
}

export interface CompraProveedor {
  proveedor: string
  ambito: AmbitoCompra
  importe_mxn: number | null
  registros: number
  categorias: number
  pct_importe: number | null
}

export interface CompraPrecioProducto {
  descripcion: string
  categoria: string | null
  anio: number
  importe_mxn: number
  cantidad: number
  precio_promedio_mxn: number | null
  registros: number
  proveedores: number
  meses: number
}

export interface CompraPrecioMensual {
  mes: string
  importe_mxn: number
  cantidad: number
  precio_promedio_mxn: number | null
  registros: number
}

export interface CompraPeriodo {
  mes: string
  desde: string
  hasta: string
  completo: boolean
  registros: number
}

export interface CompraComparativoItem {
  clave: string
  etiqueta: string
  detalle: string | null
  valor_actual: number | null
  valor_previo: number | null
  delta_abs: number | null
  variacion_pct: number | null
  share_actual: number | null
  share_previo: number | null
  delta_pp: number | null
  registros_actual: number
  registros_previo: number
  estado: ComprasComparativoEstado
  muestra_suficiente: boolean
}

export interface CompraComparativoResult {
  periodo: CompraPeriodo
  periodo_anterior: CompraPeriodo
  periodos: CompraPeriodo[]
  dimension: ComprasComparativoDimension
  metrica: ComprasComparativoMetric
  order_by: ComprasComparativoOrder
  min_registros: number
  total_actual: number | null
  total_previo: number | null
  items: CompraComparativoItem[]
  total_items: number
}

export interface CompraArticulo {
  id: number
  fecha: string
  categoria: string | null
  fraccion_arancelaria: string | null
  fraccion_valida: boolean
  descripcion: string
  cantidad: number | null
  importe_mxn: number
  precio_unitario_mxn: number | null
  moneda: string
  proveedor: string
  ambito: AmbitoCompra
  anio: number
  mes: string
  archivo_origen: string | null
  fila_origen: number | null
  creado_en: string | null
}

export interface ComprasMeta {
  categorias: string[]
  proveedores: string[]
  descripciones: string[]
  fracciones: string[]
  anios: number[]
  ambitos: string[]
  fecha_min: string | null
  fecha_max: string | null
  total_registros: number
}

export interface CompraAmbitoResumen {
  registros: number
  importe_mxn: number
}

export interface ComprasImportResult {
  archivo: string
  archivo_origen: string | null
  modo: 'reemplazar' | 'agregar'
  filas_leidas: number
  filas_insertadas: number
  filas_totales_en_bd: number
  total_importe_mxn: number
  total_csv_mxn: number
  descuadre_mxn: number
  nacional: CompraAmbitoResumen
  internacional: CompraAmbitoResumen
  duplicados_exactos: number
  filas_cero: number
  fracciones_validas: number
  fracciones_invalidas: number
  sin_fraccion: number
  fecha_min: string | null
  fecha_max: string | null
  copia: string | null
  copia_error?: string | null
}
