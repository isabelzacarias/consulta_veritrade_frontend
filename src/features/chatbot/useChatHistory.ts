import { useEffect, useState } from 'react'
import type { ChatMessage, FiltrosSugeridos } from '@/types/chatbot'

const STORAGE_KEY = 'veritrade:chat-history:v1'
const MAX_STORED_MESSAGES = 50

function isFiltrosSugeridos(value: unknown): value is FiltrosSugeridos {
  if (!value || typeof value !== 'object') return false
  const filtros = value as Record<string, unknown>
  return (
    (filtros.modulo === 'importaciones' || filtros.modulo === 'compras') &&
    (filtros.tab === null || typeof filtros.tab === 'string') &&
    Boolean(filtros.filtros) &&
    typeof filtros.filtros === 'object' &&
    Object.values(filtros.filtros as Record<string, unknown>).every(
      (item) => typeof item === 'string',
    )
  )
}

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>
  return (
    typeof message.id === 'string' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    typeof message.time === 'string' &&
    (message.tools === undefined || Array.isArray(message.tools)) &&
    (message.suggestions === undefined ||
      (Array.isArray(message.suggestions) &&
        message.suggestions.every((item) => typeof item === 'string'))) &&
    (message.filtrosSugeridos === undefined ||
      isFiltrosSugeridos(message.filtrosSugeridos)) &&
    (message.filtrosEstado === undefined ||
      message.filtrosEstado === 'pendiente' ||
      message.filtrosEstado === 'aplicado' ||
      message.filtrosEstado === 'descartado')
  )
}

function readStoredMessages(): ChatMessage[] {
  if (typeof window === 'undefined') return []

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []

    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []

    return parsed
      .filter(isChatMessage)
      .slice(-MAX_STORED_MESSAGES)
  } catch {
    return []
  }
}

export function useChatHistory() {
  const [messages, setMessages] = useState<ChatMessage[]>(readStoredMessages)

  useEffect(() => {
    try {
      if (messages.length === 0) {
        window.localStorage.removeItem(STORAGE_KEY)
        return
      }

      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)),
      )
    } catch {
      // El almacenamiento puede estar lleno o deshabilitado.
    }
  }, [messages])

  return [messages, setMessages] as const
}
