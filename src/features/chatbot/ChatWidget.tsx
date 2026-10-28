import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Bot,
  Check,
  Maximize2,
  MessageCircle,
  Minimize2,
  MoveDiagonal2,
  RefreshCw,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import { api } from '@/services/api'
import { buildViewUrl } from '@/lib/viewRoutes'
import type {
  AgenteResult,
  ChatHistoryMessage,
  ChatMessage,
  FiltrosSugeridos,
} from '@/types/chatbot'
import { MarkdownRenderer } from '@/components/ui/MarkdownRenderer'
import { useChatHistory } from './useChatHistory'

const TOOL_LABELS: Record<string, string> = {
  importaciones_kpis: 'KPIs',
  importaciones_ranking: 'Ranking',
  importaciones_mensual: 'Serie mensual',
  importaciones_comparativo: 'Comparativo',
  importaciones_buscar: 'Búsqueda',
  importaciones_catalogo: 'Catálogo',
  compras_kpis: 'KPIs de compras',
  compras_ranking: 'Ranking de compras',
  compras_mensual: 'Serie de compras',
  compras_precio_producto: 'Precios',
  compras_comparativo: 'Comparativo de compras',
  compras_buscar: 'Búsqueda de compras',
  compras_catalogo: 'Catálogo de compras',
  pedir_aclaracion: 'Aclaración',
  capacidades: 'Capacidades',
  resumen_kpis: 'KPIs',
  ranking: 'Ranking',
  serie_mensual: 'Serie mensual',
  buscar_operaciones: 'Búsqueda',
  catalogo: 'Catálogo',
}

const timeFormatter = new Intl.DateTimeFormat('es-MX', {
  hour: '2-digit',
  minute: '2-digit',
})

function formatTime(date: Date) {
  return timeFormatter.format(date)
}

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function hasChoiceList(content: string): boolean {
  const hasList = /(?:^|\n)\s*(?:[-*+]|\d+\.)\s+\S/.test(content)
  if (!hasList) return false

  const hasQuestion = /¿[^?\n]*\?/.test(content)
  const mentionsChoice =
    /\b(?:opci[oó]n|opciones|elige|selecciona|escoge|cu[aá]l)\b/i.test(
      content,
    )
  return hasQuestion || mentionsChoice
}

function extractSuggestions(data: AgenteResult): string[] {
  const suggestions = new Set<string>()

  const addOptions = (value: unknown) => {
    if (!Array.isArray(value)) return
    for (const option of value) {
      if (typeof option !== 'string') continue
      const text = option.trim()
      if (text) suggestions.add(text)
    }
  }

  addOptions(data.sugerencias)

  for (const entry of data.datos_usados) {
    if (!entry || typeof entry !== 'object') continue
    const result = (entry as { resultado?: unknown }).resultado
    if (!result || typeof result !== 'object') continue
    addOptions((result as { opciones?: unknown }).opciones)
  }

  for (const call of data.tool_calls) {
    if (call.name !== 'pedir_aclaracion') continue
    addOptions(call.args.opciones)
  }

  return [...suggestions].slice(0, 10)
}

interface WidgetSize {
  width: number
  height: number
}

interface ResizeStart extends WidgetSize {
  x: number
  y: number
}

const MIN_WIDGET_WIDTH = 320
const MIN_WIDGET_HEIGHT = 360

export function ChatWidget() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [size, setSize] = useState<WidgetSize | null>(null)
  const [resizing, setResizing] = useState(false)
  const [messages, setMessages] = useChatHistory()
  const [input, setInput] = useState('')

  const widgetRef = useRef<HTMLElement>(null)
  const messagesRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const resizeStartRef = useRef<ResizeStart | null>(null)

  const greeting = useQuery({
    queryKey: ['agente', 'saludo', 'consulta'],
    queryFn: ({ signal }) =>
      api.agenteConsulta({ pregunta: 'hola' }, signal),
    enabled: open,
    staleTime: 0,
    retry: 2,
    refetchOnWindowFocus: false,
  })

  const preguntas = useQuery({
    queryKey: ['chat', 'preguntas'],
    queryFn: ({ signal }) => api.preguntas(undefined, signal),
    enabled: open,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  })

  const mutation = useMutation({
    mutationFn: (payload: {
      pregunta: string
      historial: ChatHistoryMessage[]
    }) => api.agenteConsulta(payload),
  })

  const pending = mutation.isPending
  const suggestions = (preguntas.data ?? []).slice(0, 4)

  const greetingTime = greeting.dataUpdatedAt
    ? formatTime(new Date(greeting.dataUpdatedAt))
    : ''

  const greetingMessage: ChatMessage | null = greeting.data
    ? {
        id: 'greeting',
        role: 'assistant',
        content: greeting.data.respuesta,
        time: greetingTime,
      }
    : null

  const greetingError = greeting.isError
    ? {
        id: 'greeting-error',
        role: 'assistant' as const,
        content: `No se pudo cargar el saludo del asistente. ${
          greeting.error instanceof Error ? greeting.error.message : ''
        }`,
        time: formatTime(new Date()),
      }
    : null

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setExpanded(false)
        setOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const container = messagesRef.current
    if (container) container.scrollTop = container.scrollHeight
  }, [messages, pending, open])

  const sendMessage = (text: string) => {
    const value = text.trim()
    if (!value || pending) return

    const historial: ChatHistoryMessage[] = messages
      .slice(-10)
      .map(({ role, content }) => ({ role, content }))

    setMessages((current) => [
      ...current,
      {
        id: createId(),
        role: 'user',
        content: value,
        time: formatTime(new Date()),
      },
    ])
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'

    mutation.mutate({ pregunta: value, historial }, {
      onSuccess: (data) => {
        const filtrosSugeridos = data.filtros_sugeridos ?? undefined
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: 'assistant',
            content:
              data.respuesta?.trim() ||
              'No obtuve una respuesta del asistente. Intenta reformular tu consulta.',
            time: formatTime(new Date()),
            tools: data.tool_calls,
            suggestions: extractSuggestions(data),
            filtrosSugeridos,
            filtrosEstado: filtrosSugeridos ? 'pendiente' : undefined,
          },
        ])
      },
      onError: (error) => {
        const detail =
          error instanceof Error
            ? error.message
            : 'No se pudo consultar el asistente.'
        setMessages((current) => [
          ...current,
          {
            id: createId(),
            role: 'assistant',
            content: `No pude completar la consulta. ${detail}`,
            time: formatTime(new Date()),
          },
        ])
      },
    })
  }

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault()
    sendMessage(input)
  }

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(input)
    }
  }

  const handleInput = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setInput(event.target.value)
    event.currentTarget.style.height = 'auto'
    event.currentTarget.style.height = `${Math.min(
      event.currentTarget.scrollHeight,
      96,
    )}px`
  }

  const clearChat = () => {
    if (pending) return
    setInput('')
    if (inputRef.current) inputRef.current.style.height = 'auto'
    setMessages([])
  }

  const applySuggestedFilters = (
    messageId: string,
    sugeridos: FiltrosSugeridos,
  ) => {
    const url = buildViewUrl(
      sugeridos.modulo,
      sugeridos.filtros,
      sugeridos.tab,
    )
    if (!url) return

    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, filtrosEstado: 'aplicado' }
          : message,
      ),
    )
    navigate(url)
  }

  const discardSuggestedFilters = (messageId: string) => {
    setMessages((current) =>
      current.map((message) =>
        message.id === messageId
          ? { ...message, filtrosEstado: 'descartado' }
          : message,
      ),
    )
  }

  const startResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (expanded) return
    const rect = widgetRef.current?.getBoundingClientRect()
    if (!rect) return

    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: rect.width,
      height: rect.height,
    }
    setResizing(true)
  }

  const resizeWidget = (event: ReactPointerEvent<HTMLButtonElement>) => {
    const start = resizeStartRef.current
    if (!start) return

    const maxWidth = Math.max(
      MIN_WIDGET_WIDTH,
      Math.min(window.innerWidth - 24, 960),
    )
    const maxHeight = Math.max(MIN_WIDGET_HEIGHT, window.innerHeight - 24)
    const width = Math.min(
      Math.max(start.width - (event.clientX - start.x), MIN_WIDGET_WIDTH),
      maxWidth,
    )
    const height = Math.min(
      Math.max(start.height - (event.clientY - start.y), MIN_WIDGET_HEIGHT),
      maxHeight,
    )

    setSize({ width, height })
  }

  const stopResize = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    resizeStartRef.current = null
    setResizing(false)
  }

  const closeChat = () => {
    setExpanded(false)
    setResizing(false)
    resizeStartRef.current = null
    setOpen(false)
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir asistente de consultas"
          title="Abrir asistente de consultas"
          className="group fixed right-5 bottom-5 z-40 grid size-14 place-items-center rounded-full bg-linear-to-br from-brand-700 to-aqua-500 text-white shadow-xl shadow-brand-900/30 transition hover:scale-105 hover:shadow-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 sm:right-6 sm:bottom-6"
        >
          <MessageCircle className="size-6" />
          <span className="absolute top-0 right-0 size-3 rounded-full border-2 border-white bg-aqua-400" />
          <span className="sr-only">Abrir chat</span>
        </button>
      )}

      {open && (
        <section
          ref={widgetRef}
          role="dialog"
          aria-label="Asistente de consultas Veritrade"
          aria-busy={pending}
          style={
            !expanded && size
              ? { width: size.width, height: size.height }
              : undefined
          }
          className={`${
            expanded
              ? 'fixed inset-y-0 right-0 z-50 flex h-full w-full flex-col overflow-hidden rounded-l-2xl border border-brand-200 bg-white shadow-2xl sm:w-[520px]'
              : 'fixed right-3 bottom-3 z-40 flex h-[72dvh] max-h-[calc(100dvh-1.5rem)] w-[90vw] max-w-[calc(100vw-1.5rem)] flex-col overflow-hidden rounded-2xl border border-brand-200 bg-white shadow-2xl shadow-brand-900/25 sm:right-6 sm:bottom-6 sm:h-[650px] sm:max-h-[80vh] sm:w-[460px]'
          } ${resizing ? 'transition-none' : 'transition-all duration-300'}`}
        >
          {!expanded && (
            <button
              type="button"
              onPointerDown={startResize}
              onPointerMove={resizeWidget}
              onPointerUp={stopResize}
              onPointerCancel={stopResize}
              aria-label="Redimensionar chat"
              title="Redimensionar chat"
              className="absolute top-0 left-0 z-20 grid size-8 cursor-nwse-resize touch-none place-items-center rounded-tl-2xl text-white/60 transition hover:bg-white/10 hover:text-white"
            >
              <MoveDiagonal2 className="size-3.5" />
            </button>
          )}

          <header
            className={`flex items-center gap-3 bg-linear-to-r from-brand-800 via-brand-700 to-brand-600 py-3 text-white ${
              expanded ? 'px-4' : 'pr-4 pl-10'
            }`}
          >
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-white/15 ring-1 ring-white/20">
              <Bot className="size-4.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">Asistente Horbis</p>
              <p className="text-[10px] text-white/65">Consultas sobre tus datos</p>
            </div>
            <button
              type="button"
              onClick={clearChat}
              disabled={pending}
              aria-label="Limpiar conversación"
              title="Limpiar conversación"
              className="grid size-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Trash2 className="size-4" />
            </button>
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              aria-label={expanded ? 'Restaurar chat' : 'Maximizar chat'}
              aria-expanded={expanded}
              title={expanded ? 'Restaurar' : 'Maximizar'}
              className="grid size-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              {expanded ? (
                <Minimize2 className="size-4" />
              ) : (
                <Maximize2 className="size-4" />
              )}
            </button>
            <button
              type="button"
              onClick={closeChat}
              aria-label="Cerrar asistente"
              className="grid size-8 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            >
              <X className="size-4" />
            </button>
          </header>

          <div
            ref={messagesRef}
            aria-live="polite"
            className="flex-1 space-y-3 overflow-y-auto bg-brand-50/40 px-3 py-4"
          >
            {greeting.isLoading && (
              <TypingBubble label="Conectando con el asistente…" />
            )}
            {greetingError && (
              <div className="space-y-1.5">
                <MessageBubble message={greetingError} />
                <button
                  type="button"
                  onClick={() => void greeting.refetch()}
                  disabled={greeting.isFetching}
                  className="ml-9 inline-flex items-center gap-1.5 rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-[10px] font-medium text-brand-700 transition hover:bg-brand-50 disabled:opacity-40"
                >
                  <RefreshCw
                    className={`size-3 ${greeting.isFetching ? 'animate-spin' : ''}`}
                  />
                  Reintentar saludo
                </button>
              </div>
            )}
            {greetingMessage && (
              <MessageBubble
                message={greetingMessage}
                onSuggestionClick={sendMessage}
                suggestionsDisabled={pending}
              />
            )}

            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                message={message}
                onSuggestionClick={sendMessage}
                suggestionsDisabled={pending}
                onApplyFilters={applySuggestedFilters}
                onDiscardFilters={discardSuggestedFilters}
              />
            ))}

            {messages.length === 0 && suggestions.length > 0 && (
              <div className="ml-9 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-brand-500">
                  Prueba preguntando
                </p>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.id}
                      type="button"
                      onClick={() => sendMessage(suggestion.pregunta)}
                      className="rounded-xl border border-brand-100 bg-white px-3 py-2 text-left text-xs text-slate-600 transition hover:border-brand-300 hover:bg-brand-50 hover:text-brand-800"
                    >
                      {suggestion.pregunta}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pending && <TypingBubble />}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-brand-100 bg-white p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                maxLength={2000}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                placeholder="Escribe tu consulta…"
                aria-label="Escribe tu consulta"
                className="max-h-24 min-h-10 flex-1 resize-none rounded-xl border border-brand-200 bg-brand-50/40 px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
              />
              <button
                type="submit"
                disabled={!input.trim() || pending}
                aria-label="Enviar consulta"
                className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-700 text-white shadow-sm transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <Send className="size-4" />
              </button>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
              Las respuestas usan los datos de Veritrade y pueden tardar unos
              segundos.
            </p>
          </form>
        </section>
      )}
    </>
  )
}

interface MessageBubbleProps {
  message: ChatMessage
  onSuggestionClick?: (suggestion: string) => void
  suggestionsDisabled?: boolean
  onApplyFilters?: (messageId: string, sugeridos: FiltrosSugeridos) => void
  onDiscardFilters?: (messageId: string) => void
}

function MessageBubble({
  message,
  onSuggestionClick,
  suggestionsDisabled = false,
  onApplyFilters,
  onDiscardFilters,
}: MessageBubbleProps) {
  const isUser = message.role === 'user'
  const visibleTools = message.tools?.filter(
    (tool) => tool.name !== 'pedir_aclaracion',
  )
  const listOptionsClickable =
    !isUser && Boolean(onSuggestionClick) && hasChoiceList(message.content)

  return (
    <div className={`flex items-end gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
          <Bot className="size-3.5" />
        </span>
      )}
      <div
        className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed shadow-sm ${
          isUser
            ? 'rounded-br-md bg-brand-700 text-white'
            : 'rounded-bl-md border border-brand-100 bg-white text-slate-700'
        }`}
      >
        {isUser ? (
          <p className="whitespace-pre-line">{message.content}</p>
        ) : (
          <MarkdownRenderer
            content={message.content}
            onListItemClick={
              listOptionsClickable ? onSuggestionClick : undefined
            }
            listItemsDisabled={suggestionsDisabled}
          />
        )}

        {!isUser && visibleTools && visibleTools.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {visibleTools.map((tool, index) => (
              <span
                key={`${tool.name}-${index}`}
                className="rounded-full bg-brand-50 px-1.5 py-0.5 text-[8px] font-medium text-brand-600"
                title={JSON.stringify(tool.args)}
              >
                {TOOL_LABELS[tool.name] ?? tool.name}
              </span>
            ))}
          </div>
        )}

        {!isUser &&
          message.suggestions &&
          message.suggestions.length > 0 && (
            <div className="mt-2.5">
              <p className="text-[9px] font-semibold uppercase tracking-wide text-brand-500">
                Sugerencias
              </p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {message.suggestions.map((suggestion, index) => (
                  <button
                    key={`${suggestion}-${index}`}
                    type="button"
                    onClick={() => onSuggestionClick?.(suggestion)}
                    disabled={suggestionsDisabled}
                    title="Buscar sobre esta opción"
                    className="group flex w-full items-start gap-2 rounded-lg border border-brand-100 bg-white px-2.5 py-1.5 text-left text-[11px] leading-snug text-brand-700 transition hover:border-brand-300 hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <span className="mt-px grid size-4 shrink-0 place-items-center rounded-full bg-brand-50 text-[9px] font-semibold text-brand-600 group-hover:bg-brand-100">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">{suggestion}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

        {!isUser &&
          message.filtrosSugeridos &&
          onApplyFilters &&
          onDiscardFilters && (
            <FilterSuggestionCard
              messageId={message.id}
              sugeridos={message.filtrosSugeridos}
              estado={message.filtrosEstado ?? 'pendiente'}
              disabled={suggestionsDisabled}
              onApply={onApplyFilters}
              onDiscard={onDiscardFilters}
            />
          )}

        <p
          className={`mt-1 text-[9px] ${
            isUser ? 'text-white/60' : 'text-slate-400'
          }`}
        >
          {message.time}
        </p>
      </div>
    </div>
  )
}

const VIEW_LABELS: Record<string, string> = {
  resumen: 'Resumen',
  importadores: 'Importadores',
  proveedores: 'Proveedores',
  productos: 'Productos y costos',
  comparativo: 'Comparativo',
  matriz: 'Matriz',
  operaciones: 'Operaciones',
  preguntas: 'Preguntas',
  graficas: 'Gráficas',
  precios: 'Precios',
  tabla: 'Tabla',
}

function filterPrompt(sugeridos: FiltrosSugeridos): string {
  if (sugeridos.tab === 'graficas') {
    return '¿Quieres ver estos datos reflejados en las gráficas?'
  }
  if (sugeridos.tab === 'precios') {
    return '¿Quieres ver este precio en la vista de Precios?'
  }
  if (sugeridos.tab === 'tabla') {
    return '¿Quieres ver estas operaciones en la tabla?'
  }
  if (sugeridos.tab === 'comparativo') {
    return '¿Quieres abrir el Comparativo con estos datos?'
  }
  const label =
    (sugeridos.tab ? VIEW_LABELS[sugeridos.tab] : undefined) ??
    (sugeridos.modulo === 'compras' ? 'Compras' : 'Importaciones')
  return `¿Quieres ver estos datos en la vista de ${label}?`
}

interface FilterSuggestionCardProps {
  messageId: string
  sugeridos: FiltrosSugeridos
  estado: 'pendiente' | 'aplicado' | 'descartado'
  disabled: boolean
  onApply: (messageId: string, sugeridos: FiltrosSugeridos) => void
  onDiscard: (messageId: string) => void
}

function FilterSuggestionCard({
  messageId,
  sugeridos,
  estado,
  disabled,
  onApply,
  onDiscard,
}: FilterSuggestionCardProps) {
  if (estado === 'aplicado') {
    return (
      <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
        <Check className="size-3.5" />
        Filtros aplicados.
      </p>
    )
  }

  if (estado === 'descartado') {
    return (
      <p className="mt-2 text-[11px] text-slate-400">
        Sugerencia descartada.
      </p>
    )
  }

  return (
    <div className="mt-2 rounded-xl border border-brand-200 bg-brand-50/60 p-2.5">
      <p className="text-[11px] leading-relaxed text-slate-600">
        {filterPrompt(sugeridos)}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onApply(messageId, sugeridos)}
          className="rounded-lg bg-brand-700 px-2.5 py-1 text-[10px] font-medium text-white transition hover:bg-brand-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Sí, aplicar
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => onDiscard(messageId)}
          className="rounded-lg border border-brand-200 bg-white px-2.5 py-1 text-[10px] font-medium text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          No, gracias
        </button>
      </div>
    </div>
  )
}

function TypingBubble({ label = 'Consultando datos…' }: { label?: string }) {
  return (
    <div className="flex items-end gap-2">
      <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand-100 text-brand-700">
        <Bot className="size-3.5" />
      </span>
      <div className="rounded-2xl rounded-bl-md border border-brand-100 bg-white px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                className="size-1.5 animate-bounce rounded-full bg-brand-400"
                style={{ animationDelay: `${index * 120}ms` }}
              />
            ))}
          </div>
          <span className="text-[10px] text-slate-400">{label}</span>
        </div>
      </div>
    </div>
  )
}
