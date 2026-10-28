export interface AgenteToolCall {
  name: string
  args: Record<string, unknown>
}

export interface AgenteResult {
  respuesta: string
  tool_calls: AgenteToolCall[]
  datos_usados: unknown[]
}

export type ChatRole = 'assistant' | 'user'

export interface ChatMessage {
  id: string
  role: ChatRole
  content: string
  time: string
  tools?: AgenteToolCall[]
}

export interface ChatHistoryMessage {
  role: ChatRole
  content: string
}
