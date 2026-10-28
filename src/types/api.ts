export interface Page<T> {
  items: T[]
  total: number
  page: number
  page_size: number
  pages: number
}

export interface Health {
  status: string
  db: string
}

/** Query params accepted by the reportes/importaciones endpoints. */
export interface Filters {
  fecha_desde?: string
  fecha_hasta?: string
  aduana?: string
  pais_origen?: string
  partida?: string
  importador?: string
  exportador?: string
}

export type OrderBy = 'valor_usd' | 'volumen_kg' | 'mes'

export interface Kpis {
  valor_total_usd: number | null
  volumen_total_kg: number | null
  registros: number
  costo_unit_ponderado: number | null
  importadores: number
  exportadores: number
  partidas: number
  paises_origen: number
}

export interface BaseRankingRow {
  valor_usd: number | null
  volumen_kg: number | null
  registros: number
  costo_unit_ponderado: number | null
  pct_total: number | null
  pct_acumulado: number | null
  porcentaje: number | null
}

export interface ImportadorRow extends BaseRankingRow {
  importador: string | null
}

export interface ProveedorRow extends BaseRankingRow {
  exportador: string | null
}

export interface ProveedorPaisRow extends ProveedorRow {
  pais_origen: string | null
}

export interface PaisOrigenRow extends BaseRankingRow {
  pais_origen: string | null
}

export interface TipoImportacionRow extends BaseRankingRow {
  tipo_importacion: string | null
}

export interface PartidaRow extends BaseRankingRow {
  partida_arancelaria: string | null
  descripcion_partida: string | null
}

export interface MensualRow {
  mes: string | null
  valor_usd: number | null
  volumen_kg: number | null
  registros: number
  costo_unit_ponderado: number | null
}

export interface PartidaMeta {
  partida_arancelaria: string
  descripcion_partida: string | null
}

export interface Importacion {
  id: number
  partida_arancelaria: string
  descripcion_partida: string | null
  aduana: string | null
  dua: string | null
  numero_serie: string | null
  fecha: string | null
  codigo_tributario: string | null
  importador: string | null
  ciudad_importador: string | null
  direccion_importador: string | null
  estado_importador: string | null
  exportador: string | null
  ciudad_exportador: string | null
  direccion_exportador: string | null
  qty1: number | null
  und1: string | null
  qty2: number | null
  und2: string | null
  valor_total_usd: number | null
  valor_unit1_usd: number | null
  valor_unit2_usd: number | null
  pais_origen: string | null
  pais_compra: string | null
  via: string | null
  descripcion_comercial: string | null
  regimen: string | null
  tipo_importacion: string | null
  es_cancun: number | null
  costo_unitario_kg: number | null
  anio: number | null
  mes: string | null
  creado_en: string | null
}

export interface Job {
  id: number
  tipo: string
  estado: 'en_proceso' | 'completado' | 'error'
  mensaje: string | null
  detalle: Record<string, unknown> | null
  creado_en: string
  terminado_en: string | null
}

export interface ImportacionesQuery extends Filters {
  page?: number
  page_size?: number
  q?: string
}

export interface Pregunta {
  id: string
  categoria: string
  pregunta: string
  endpoint: string
  params: Record<string, unknown>
  descripcion: string | null
}

export interface ConsultaResult {
  encontrada: boolean
  pregunta: string | null
  id: string | null
  categoria: string | null
  endpoint: string | null
  params: Record<string, unknown> | null
  resumen: string
  datos: unknown
  sugerencias: string[] | null
}

export interface AgenteToolCall {
  name: string
  args: Record<string, unknown>
}

export interface AgenteResult {
  respuesta: string
  tool_calls: AgenteToolCall[]
  datos_usados: unknown[]
}

export type RankingMetric = 'valor_usd' | 'volumen_kg'
export type AnalisisMetric = 'valor_usd' | 'volumen_kg'
export type ComparativoDimension =
  | 'partida'
  | 'pais_origen'
  | 'importador'
  | 'exportador'
export type ComparativoOrder = 'delta_abs' | 'delta_pp' | 'valor_actual'
export type MatrizColumnaKey = 'pais_origen' | 'exportador'

export interface PeriodoInfo {
  mes: string
  desde: string
  hasta: string
  completo: boolean
  registros: number
}

export type ComparativoEstado =
  | 'sube'
  | 'baja'
  | 'nuevo'
  | 'desaparece'
  | 'sin_cambio'

export interface ComparativoItem {
  clave: string
  etiqueta: string
  detalle: string | null
  valor_actual: number | null
  valor_previo: number | null
  variacion_pct: number | null
  share_actual: number | null
  share_previo: number | null
  delta_pp: number | null
  registros_actual: number
  registros_previo: number
  estado: ComparativoEstado
  muestra_suficiente: boolean
}

export interface ComparativoResult {
  periodo: PeriodoInfo
  periodo_anterior: PeriodoInfo
  periodos: PeriodoInfo[]
  dimension: ComparativoDimension
  metrica: AnalisisMetric
  order_by: ComparativoOrder
  min_registros: number
  total_actual: number | null
  total_previo: number | null
  items: ComparativoItem[]
  total_items: number
}

export interface MatrizFila {
  clave: string
  etiqueta: string
  detalle: string | null
  total: number | null
  registros: number
  es_otros: boolean
}

export interface MatrizColumna {
  clave: string
  etiqueta: string
  detalle: string | null
  total: number | null
  registros: number
  es_otros: boolean
}

export interface MatrizCelda {
  fila: string
  columna: string
  valor: number | null
  valor_usd: number | null
  volumen_kg: number | null
  registros: number
  share_fila: number | null
  muestra_suficiente: boolean
}

export interface MatrizResult {
  columna: MatrizColumna
  metrica: AnalisisMetric
  filas: MatrizFila[]
  columnas: MatrizColumna[]
  celdas: MatrizCelda[]
  total: number | null
  total_registros: number
  omitidos: Record<string, number>
}

export type PanelTab =
  | 'resumen'
  | 'importadores'
  | 'proveedores'
  | 'productos'
  | 'comparativo'
  | 'matriz'
  | 'operaciones'
  | 'preguntas'
