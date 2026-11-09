import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react'
import { SectionCard } from '@/components/ui/SectionCard'

export interface UnifiedFilterOption {
  value: string
  label: string
  description?: string
}

export interface UnifiedFilterField {
  key: string
  label: string
  type: 'date' | 'text' | 'multiselect'
  value: string | string[]
  onChange: (value: string | string[]) => void
  placeholder?: string
  options?: UnifiedFilterOption[]
  disabled?: boolean
  title?: string
  min?: string
  max?: string
}

export interface UnifiedFilterChip {
  id: string
  field: string
  label: string
  value: string
  optionValue?: string
}

interface UnifiedFilterPanelProps {
  title: string
  subtitle?: string
  fields: UnifiedFilterField[]
  chips: UnifiedFilterChip[]
  activeCount: number
  onApply: () => void
  onClear: () => void
  onRemoveFilter: (field: string, value?: string) => void
  loading?: boolean
  dirty?: boolean
}

const EMPTY_OPTIONS: UnifiedFilterOption[] = []
const MAX_VISIBLE_CHIPS = 8
const POPOVER_WIDTH = 760
const POPOVER_GAP = 8
const POPOVER_MIN_HEIGHT = 260

const inputClass =
  'h-9 w-full rounded-lg border border-brand-200/80 bg-white px-3 text-sm text-slate-800 shadow-xs outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400'

const labelClass =
  'mb-1.5 block truncate text-[11px] font-semibold uppercase tracking-wide text-brand-700/70'

function normalize(value: string | string[]): string[] {
  if (Array.isArray(value)) return value
  return value ? [value] : []
}

function MultiSelectField({
  field,
  showLabel = true,
}: {
  field: UnifiedFilterField
  showLabel?: boolean
}) {
  const [query, setQuery] = useState('')
  const [dirty, setDirty] = useState(false)
  const selected = useMemo(() => normalize(field.value), [field.value])
  const options = field.options ?? EMPTY_OPTIONS

  const withSelected = useMemo(() => {
    const known = new Set(options.map((option) => option.value))
    const extras: UnifiedFilterOption[] = selected
      .filter((value) => !known.has(value))
      .map((value) => ({ value, label: value }))
    return [...extras, ...options]
  }, [options, selected])

  const normalizedQuery = query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  const filtered = useMemo(() => {
    if (!normalizedQuery) return withSelected
    return withSelected.filter((option) =>
      `${option.label} ${option.value} ${option.description ?? ''}`
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [normalizedQuery, withSelected])

  const toggle = (value: string) => {
    const next = selected.includes(value)
      ? selected.filter((item) => item !== value)
      : [...selected, value]
    field.onChange(next)
  }

  const toggleFiltered = (select: boolean) => {
    const filteredValues = new Set(filtered.map((option) => option.value))
    const next = select
      ? [...new Set([...selected, ...filteredValues])]
      : selected.filter((value) => !filteredValues.has(value))
    field.onChange(next)
  }

  const allFilteredSelected =
    filtered.length > 0 &&
    filtered.every((option) => selected.includes(option.value))
  const noFilteredSelected =
    filtered.length === 0 ||
    filtered.every((option) => !selected.includes(option.value))
  const showBulkActions = withSelected.length > 1 && filtered.length > 0
  const bulkActionScope = normalizedQuery ? 'resultados' : 'todo'

  return (
    <section className="min-w-0">
      {showLabel && (
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <label className={labelClass}>{field.label}</label>
          {selected.length > 0 && (
            <span className="shrink-0 rounded-full bg-brand-100 px-1.5 py-0.5 text-[10px] font-semibold text-brand-700">
              {selected.length}
            </span>
          )}
        </div>
      )}

      {withSelected.length > 8 && (
        <div className="relative mb-1.5">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setDirty(true)
              setQuery(event.target.value)
            }}
            placeholder={`Buscar en ${field.label.toLowerCase()}…`}
            className="h-8 w-full rounded-lg border border-brand-200/80 bg-white pl-8 pr-2.5 text-xs text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/15"
          />
          {dirty && query && (
            <button
              type="button"
              aria-label={`Limpiar búsqueda de ${field.label}`}
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            >
              <X className="size-3" />
            </button>
          )}
        </div>
      )}

      {showBulkActions && (
        <div className="mb-1.5 flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
          <button
            type="button"
            onClick={() => toggleFiltered(true)}
            disabled={field.disabled || allFilteredSelected}
            className="text-[11px] font-medium text-brand-700 transition hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Seleccionar {bulkActionScope}
          </button>
          <button
            type="button"
            onClick={() => toggleFiltered(false)}
            disabled={field.disabled || noFilteredSelected}
            className="text-[11px] font-medium text-brand-700 transition hover:text-brand-900 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Desmarcar {bulkActionScope}
          </button>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto rounded-lg border border-brand-100 bg-white p-1">
        {filtered.length === 0 ? (
          <p className="px-2 py-3 text-xs text-slate-500">
            {field.disabled
              ? (field.title ?? 'Sin opciones disponibles')
              : 'Sin resultados'}
          </p>
        ) : (
          filtered.map((option) => {
            const checked = selected.includes(option.value)
            return (
              <label
                key={option.value}
                className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-1.5 transition hover:bg-brand-50/70"
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={field.disabled}
                  onChange={() => toggle(option.value)}
                  className="mt-0.5 size-4 shrink-0 rounded border-brand-300 accent-brand-700 disabled:cursor-not-allowed"
                />
                <span className="min-w-0 flex-1">
                  <span
                    className="block truncate text-xs text-slate-700"
                    title={option.label}
                  >
                    {option.label}
                  </span>
                  {option.description && (
                    <span className="block truncate text-[10px] text-slate-400">
                      {option.description}
                    </span>
                  )}
                </span>
                {checked && (
                  <Check className="mt-0.5 size-3.5 shrink-0 text-brand-600" />
                )}
              </label>
            )
          })
        )}
      </div>
    </section>
  )
}

function FilterField({
  field,
  id,
  showLabel = true,
}: {
  field: UnifiedFilterField
  id: string
  showLabel?: boolean
}) {
  if (field.type === 'date') {
    return (
      <div>
        {showLabel && (
          <label htmlFor={id} className={labelClass}>
            {field.label}
          </label>
        )}
        <input
          id={id}
          type="date"
          className={inputClass}
          value={Array.isArray(field.value) ? (field.value[0] ?? '') : field.value}
          min={field.min}
          max={field.max}
          onChange={(event) => field.onChange(event.target.value)}
        />
      </div>
    )
  }

  if (field.type === 'text') {
    return (
      <div>
        {showLabel && (
          <label htmlFor={id} className={labelClass}>
            {field.label}
          </label>
        )}
        <input
          id={id}
          type="search"
          className={inputClass}
          value={Array.isArray(field.value) ? (field.value[0] ?? '') : field.value}
          placeholder={field.placeholder}
          onChange={(event) => field.onChange(event.target.value)}
        />
      </div>
    )
  }

  return <MultiSelectField field={field} showLabel={showLabel} />
}

export function UnifiedFilterPanel({
  title,
  subtitle,
  fields,
  chips,
  activeCount,
  onApply,
  onClear,
  onRemoveFilter,
  loading = false,
  dirty = false,
}: UnifiedFilterPanelProps) {
  const [open, setOpen] = useState(false)
  const [showAllChips, setShowAllChips] = useState(false)
  const [activeKey, setActiveKey] = useState(fields[0]?.key ?? '')
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)
  const idPrefix = useId()
  const popoverTitleId = `${idPrefix}-popover-title`
  const popoverId = `${idPrefix}-popover`
  const activeField =
    fields.find((field) => field.key === activeKey) ?? fields[0]

  const updatePosition = useCallback(() => {
    setTriggerRect(triggerRef.current?.getBoundingClientRect() ?? null)
  }, [])

  const toggle = () => {
    if (open) {
      setOpen(false)
    } else {
      updatePosition()
      setOpen(true)
    }
  }

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (
        triggerRef.current?.contains(target) ||
        popoverRef.current?.contains(target)
      ) {
        return
      }
      setOpen(false)
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !event.defaultPrevented) {
        setOpen(false)
      }
    }

    const handleViewport = () => updatePosition()

    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    window.addEventListener('resize', handleViewport)
    window.addEventListener('scroll', handleViewport, true)
    window.requestAnimationFrame(() => popoverRef.current?.focus())

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('resize', handleViewport)
      window.removeEventListener('scroll', handleViewport, true)
    }
  }, [open, updatePosition])

  let popoverStyle: CSSProperties | null = null
  if (triggerRect) {
    const width = Math.min(POPOVER_WIDTH, window.innerWidth - 24)
    const left = Math.max(
      12,
      Math.min(triggerRect.left, window.innerWidth - width - 12),
    )
    const spaceBelow = window.innerHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const openUpwards = spaceBelow < 340 && spaceAbove > spaceBelow
    const availableHeight = openUpwards ? spaceAbove : spaceBelow
    const maxHeight = Math.max(availableHeight - POPOVER_GAP - 12, POPOVER_MIN_HEIGHT)

    popoverStyle = {
      position: 'fixed',
      left,
      width,
      maxHeight,
      zIndex: 70,
      ...(openUpwards
        ? { bottom: window.innerHeight - triggerRect.top + POPOVER_GAP }
        : { top: triggerRect.bottom + POPOVER_GAP }),
    }
  }

  const applyAndClose = () => {
    onApply()
    setOpen(false)
  }

  const clearAndClose = () => {
    onClear()
    setOpen(false)
  }

  return (
    <>
      <SectionCard
        title={title}
        subtitle={subtitle}
        actions={
          <span className="inline-flex items-center gap-1.5 rounded-full border border-brand-100 bg-brand-50 px-2.5 py-1 text-[11px] font-medium text-brand-700">
            <SlidersHorizontal className="size-3" />
            {activeCount === 0
              ? 'Sin filtros activos'
              : `${activeCount} filtro${activeCount === 1 ? '' : 's'} activo${activeCount === 1 ? '' : 's'}`}
          </span>
        }
        bodyClassName="p-4"
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            ref={triggerRef}
            type="button"
            onClick={toggle}
            aria-haspopup="dialog"
            aria-expanded={open}
            aria-controls={open ? popoverId : undefined}
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-brand-200 bg-white px-3.5 text-sm font-medium text-brand-700 shadow-xs transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
          >
            <SlidersHorizontal className="size-4" />
            Filtros
            {activeCount > 0 && (
              <span className="grid min-w-5 place-items-center rounded-full bg-brand-100 px-1.5 text-[10px] font-semibold text-brand-700">
                {activeCount}
              </span>
            )}
            <ChevronDown
              className={`size-3.5 text-brand-500 transition-transform ${open ? 'rotate-180' : ''}`}
            />
          </button>

          {chips.length > 0 ? (
            <div
              id={`${idPrefix}-chips`}
              className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5"
            >
              {(showAllChips ? chips : chips.slice(0, MAX_VISIBLE_CHIPS)).map((chip) => (
                <span
                  key={chip.id}
                  className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-full border border-brand-100 bg-brand-50/70 py-1 pl-2.5 pr-1 text-[11px] text-brand-800"
                >
                  <span className="shrink-0 font-medium text-brand-700/70">
                    {chip.label}:
                  </span>
                  <span className="max-w-[220px] truncate">{chip.value}</span>
                  <button
                    type="button"
                    onClick={() =>
                      onRemoveFilter(chip.field, chip.optionValue ?? chip.value)
                    }
                    aria-label={`Quitar filtro ${chip.label} ${chip.value}`}
                    className="grid size-4 shrink-0 place-items-center rounded-full text-brand-500 transition hover:bg-brand-100 hover:text-brand-800"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              ))}
              {chips.length > MAX_VISIBLE_CHIPS && (
                <button
                  type="button"
                  aria-expanded={showAllChips}
                  aria-controls={`${idPrefix}-chips`}
                  onClick={() => setShowAllChips((current) => !current)}
                  className="inline-flex h-7 shrink-0 items-center rounded-full border border-brand-200 bg-white px-2.5 text-[11px] font-medium text-brand-700 transition hover:bg-brand-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-1"
                >
                  {showAllChips
                    ? 'Ver menos'
                    : `Ver más (${chips.length - MAX_VISIBLE_CHIPS})`}
                </button>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-slate-400">
              Sin filtros aplicados. Usa Filtros para acotar la consulta.
            </p>
          )}

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onApply}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-brand-700 to-brand-500 px-4 text-sm font-medium text-white shadow-md shadow-brand-900/20 transition hover:from-brand-800 hover:to-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Search className="size-4" />
              {loading
                ? 'Consultando…'
                : dirty
                  ? 'Aplicar cambios'
                  : 'Aplicar filtros'}
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={activeCount === 0 && !dirty}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <X className="size-4" />
              Limpiar
            </button>
          </div>
        </div>
      </SectionCard>

      {open &&
        triggerRect &&
        popoverStyle &&
        createPortal(
          <div
            ref={popoverRef}
            id={popoverId}
            role="dialog"
            aria-modal="false"
            aria-labelledby={popoverTitleId}
            tabIndex={-1}
            style={popoverStyle}
            className="flex flex-col overflow-hidden rounded-2xl border border-brand-200/80 bg-white shadow-2xl shadow-brand-900/20 outline-none"
          >
            <header className="flex items-start justify-between gap-3 border-b border-brand-100/80 bg-linear-to-r from-brand-50/80 via-white to-aqua-50/60 px-4 py-3">
              <div className="min-w-0">
                <h2
                  id={popoverTitleId}
                  className="text-sm font-semibold tracking-tight text-slate-900"
                >
                  Filtros
                </h2>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Selecciona uno o varios valores. Se aplican al pulsar Aplicar filtros.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar filtros"
                className="grid size-8 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-brand-50 hover:text-brand-700"
              >
                <X className="size-4" />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
              <div
                role="tablist"
                aria-label="Secciones de filtros"
                className="flex shrink-0 gap-1 overflow-x-auto border-b border-brand-100/80 p-2 sm:w-52 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r"
              >
                {fields.map((field) => {
                  const count = normalize(field.value).length
                  const active = activeField?.key === field.key
                  return (
                    <button
                      key={field.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      aria-controls={`${idPrefix}-panel`}
                      id={`${idPrefix}-${field.key}-tab`}
                      onClick={() => setActiveKey(field.key)}
                      className={`flex shrink-0 items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-xs font-medium transition sm:w-full ${
                        active
                          ? 'bg-brand-50 text-brand-800'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="truncate">{field.label}</span>
                      {count > 0 && (
                        <span className="grid min-w-5 shrink-0 place-items-center rounded-full bg-brand-100 px-1.5 text-[10px] font-semibold text-brand-700">
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>

              <div
                id={`${idPrefix}-panel`}
                role="tabpanel"
                aria-labelledby={
                  activeField
                    ? `${idPrefix}-${activeField.key}-tab`
                    : undefined
                }
                className="min-h-0 flex-1 overflow-y-auto p-4"
              >
                {activeField && (
                  <>
                    <div className="mb-3">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-brand-700/70">
                        {activeField.label}
                      </h3>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {activeField.type === 'multiselect'
                          ? 'Selecciona uno o varios valores.'
                          : activeField.type === 'date'
                            ? 'Elige una fecha.'
                            : (activeField.placeholder ?? 'Escribe un valor.')}
                      </p>
                    </div>
                    <FilterField
                      field={activeField}
                      id={`${idPrefix}-${activeField.key}`}
                      showLabel={false}
                    />
                  </>
                )}
              </div>
            </div>

            <footer className="flex items-center gap-2 border-t border-brand-100/80 p-3">
              <button
                type="button"
                onClick={clearAndClose}
                disabled={activeCount === 0 && !dirty}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-brand-200 bg-white px-3 text-sm font-medium text-brand-700 transition hover:bg-brand-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <X className="size-4" />
                Limpiar
              </button>
              <button
                type="button"
                onClick={applyAndClose}
                disabled={loading}
                className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-linear-to-r from-brand-700 to-brand-500 px-4 text-sm font-medium text-white shadow-md shadow-brand-900/20 transition hover:from-brand-800 hover:to-brand-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Search className="size-4" />
                {loading ? 'Consultando…' : 'Aplicar filtros'}
              </button>
            </footer>
          </div>,
          document.body,
        )}
    </>
  )
}
