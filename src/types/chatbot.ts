export interface AgenteToolCall {
  name: string
  args: Record<string, unknown>
}

export interface AgenteResult {
  respuesta: string
  tool_calls: AgenteToolCall[]
  datos_usados: unknown[]
}
