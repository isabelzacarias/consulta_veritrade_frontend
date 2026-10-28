import { useEffect, useState } from 'react'
import type { ChatMessage } from '@/types/chatbot'

const STORAGE_KEY = 'veritrade:chat-history:v1'
const MAX_STORED_MESSAGES = 50

function isChatMessage(value: unknown): value is ChatMessage {
  if (!value || typeof value !== 'object') return false
  const message = value as Record<string, unknown>
  return (
    typeof message.id === 'string' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string' &&
    typeof message.time === 'string' &&
    (message.tools === undefined || Array.isArray(message.tools))
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
