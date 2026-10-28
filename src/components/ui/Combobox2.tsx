import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FocusEvent,
  type KeyboardEvent,
} from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown, X } from 'lucide-react'

export interface Combobox2Option {
  value: string
  label: string
  description?: string
  disabled?: boolean
}

export interface Combobox2Props {
  id?: string
  value: string
  onChange: (value: string) => void
  options: Combobox2Option[]
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  clearable?: boolean
  className?: string
  wrapperClassName?: string
  ariaLabel?: string
  title?: string
}

const DROPDOWN_MAX_HEIGHT = 320
const DROPDOWN_GAP = 4

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

export function Combobox2({
  id,
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  emptyMessage = 'Sin resultados',
  disabled = false,
  clearable = false,
  className = '',
  wrapperClassName = 'w-full',
  ariaLabel,
  title,
}: Combobox2Props) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [dirty, setDirty] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null)

  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const skipOpenOnFocusRef = useRef(false)
  const listId = useId()

  const selected = options.find((option) => option.value === value)
  const normalizedQuery = normalizeText(query.trim())

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) return options
    return options.filter((option) =>
      [option.label, option.value, option.description ?? ''].some((text) =>
        normalizeText(text).includes(normalizedQuery),
      ),
    )
  }, [normalizedQuery, options])

  const updateTriggerRect = useCallback(() => {
    if (!inputRef.current) return
    setTriggerRect(inputRef.current.getBoundingClientRect())
  }, [])

  const closeDropdown = useCallback(() => {
    setOpen(false)
    setQuery('')
    setDirty(false)
  }, [])

  const openDropdown = () => {
    if (disabled) return
    updateTriggerRect()
    setQuery('')
    setDirty(false)
    const selectedIndex = options.findIndex((option) => option.value === value)
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
    window.requestAnimationFrame(() => inputRef.current?.select())
  }

  const selectOption = (option: Combobox2Option) => {
    if (option.disabled) return
    onChange(option.value)
    closeDropdown()
    inputRef.current?.focus()
  }

  const safeActiveIndex =
    filteredOptions.length === 0
      ? 0
      : Math.min(activeIndex, filteredOptions.length - 1)

  useEffect(() => {
    if (!open) return
    const activeOption = listRef.current?.querySelector<HTMLElement>(
      `[data-index="${safeActiveIndex}"]`,
    )
    activeOption?.scrollIntoView({ block: 'nearest' })
  }, [open, safeActiveIndex])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return
      }
      closeDropdown()
    }

    const handleViewportChange = () => updateTriggerRect()

    document.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('resize', handleViewportChange)
    window.addEventListener('scroll', handleViewportChange, true)

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('resize', handleViewportChange)
      window.removeEventListener('scroll', handleViewportChange, true)
    }
  }, [closeDropdown, open, updateTriggerRect])

  const activeOption = filteredOptions[safeActiveIndex]
  const activeOptionId = activeOption
    ? `${listId}-option-${safeActiveIndex}`
    : undefined

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    setDirty(true)
    setQuery(event.target.value)
    setActiveIndex(0)
    if (!open) {
      updateTriggerRect()
      setOpen(true)
    }
  }

  const handleInputFocus = () => {
    if (skipOpenOnFocusRef.current) {
      skipOpenOnFocusRef.current = false
      return
    }
    if (!open) {
      openDropdown()
      return
    }
    window.requestAnimationFrame(() => inputRef.current?.select())
  }

  const handleInputBlur = (event: FocusEvent<HTMLInputElement>) => {
    const nextTarget = event.relatedTarget as Node | null
    if (
      nextTarget &&
      (rootRef.current?.contains(nextTarget) ||
        panelRef.current?.contains(nextTarget))
    ) {
      return
    }
    closeDropdown()
  }

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      if (!open) {
        openDropdown()
        return
      }
      setActiveIndex(
        Math.min(safeActiveIndex + 1, Math.max(filteredOptions.length - 1, 0)),
      )
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) {
        openDropdown()
        return
      }
      setActiveIndex(Math.max(safeActiveIndex - 1, 0))
    } else if (event.key === 'Home' && open) {
      event.preventDefault()
      setActiveIndex(0)
    } else if (event.key === 'End' && open) {
      event.preventDefault()
      setActiveIndex(Math.max(filteredOptions.length - 1, 0))
    } else if (event.key === 'Enter' && open) {
      event.preventDefault()
      if (activeOption) selectOption(activeOption)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeDropdown()
      window.requestAnimationFrame(() => inputRef.current?.select())
    } else if (event.key === 'Tab') {
      closeDropdown()
    }
  }

  let dropdownStyle: CSSProperties | null = null
  let listMaxHeight = DROPDOWN_MAX_HEIGHT
  if (triggerRect) {
    const spaceBelow = window.innerHeight - triggerRect.bottom
    const spaceAbove = triggerRect.top
    const openUpwards =
      spaceBelow < Math.min(DROPDOWN_MAX_HEIGHT, 220) && spaceAbove > spaceBelow
    const availableHeight = openUpwards ? spaceAbove : spaceBelow
    const maxHeight = Math.max(
      Math.min(DROPDOWN_MAX_HEIGHT, availableHeight - DROPDOWN_GAP - 8),
      120,
    )
    listMaxHeight = Math.max(maxHeight - 8, 72)

    dropdownStyle = {
      position: 'fixed',
      left: triggerRect.left,
      width: triggerRect.width,
      minWidth: Math.min(triggerRect.width, 220),
      maxHeight,
      zIndex: 80,
      ...(openUpwards
        ? { bottom: window.innerHeight - triggerRect.top + DROPDOWN_GAP }
        : { top: triggerRect.bottom + DROPDOWN_GAP }),
    }
  }

  const displayValue = dirty ? query : (selected?.label ?? '')

  return (
    <div ref={rootRef} className={`relative ${wrapperClassName}`}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        disabled={disabled}
        title={title}
        aria-label={ariaLabel}
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={open ? activeOptionId : undefined}
        value={displayValue}
        placeholder={placeholder}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onBlur={handleInputBlur}
        onKeyDown={handleInputKeyDown}
        onClick={() => {
          if (!open) openDropdown()
        }}
        className={`w-full text-left outline-none placeholder:text-slate-400 ${className}`}
        style={{ paddingRight: clearable && value ? 52 : 32 }}
      />

      <ChevronDown
        className={`pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-400 transition-transform ${
          open ? 'rotate-180' : ''
        }`}
      />

      {clearable && value && !disabled && (
        <button
          type="button"
          aria-label="Limpiar selección"
          onClick={() => {
            skipOpenOnFocusRef.current = true
            onChange('')
            closeDropdown()
            inputRef.current?.focus()
          }}
          className="absolute right-8 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="size-3.5" />
        </button>
      )}

      {open &&
        triggerRect &&
        dropdownStyle &&
        createPortal(
          <div
            ref={panelRef}
            style={dropdownStyle}
            className="overflow-hidden rounded-xl border border-brand-200/80 bg-white shadow-xl shadow-brand-900/15"
          >
            <div
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              className="overflow-y-auto p-1"
              style={{ maxHeight: listMaxHeight }}
            >
              {filteredOptions.length === 0 ? (
                <p className="px-2.5 py-3 text-xs text-slate-500">{emptyMessage}</p>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = option.value === value
                  const isActive = index === safeActiveIndex
                  return (
                    <button
                      key={`${option.value}-${index}`}
                      id={`${listId}-option-${index}`}
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      disabled={option.disabled}
                      data-index={index}
                      onMouseEnter={() => setActiveIndex(index)}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => selectOption(option)}
                      className={`flex w-full items-start gap-2 rounded-lg px-2.5 py-2 text-left transition disabled:cursor-not-allowed disabled:opacity-40 ${
                        isActive ? 'bg-brand-50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm text-slate-800">
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            {option.description}
                          </span>
                        )}
                      </span>
                      {isSelected && (
                        <Check className="mt-0.5 size-4 shrink-0 text-brand-600" />
                      )}
                    </button>
                  )
                })
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  )
}
