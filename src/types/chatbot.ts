export interface AgenteToolCall {
  name: string
  args: Record<string, unknown>
}

export interface FiltrosSugeridos {
  modulo: 'importaciones' | 'compras'
  filtros: Record<string, string>
  tab: string | null
}

export interface AgenteResult {
  respuesta: string
  tool_calls: AgenteToolCall[]
  datos_usados: unknown[]
  sugerencias?: string[]
  filtros_sugeridos?: FiltrosSugeridos | null
}

export type ChatRole = 'assistant' | 'user'
export type FiltrosEstado = 'pendiente' | 'aplicado' | 'descartado'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  time: string
  tools?: AgenteToolCall[]
  suggestions?: string[]
  filtrosSugeridos?: FiltrosSugeridos
  filtrosEstado?: FiltrosEstado
}

export interface ChatHistoryMessage {
  role: ChatRole
  content: string
}
