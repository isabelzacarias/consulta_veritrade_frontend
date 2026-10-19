import {
  AlertTriangle,
  Inbox,
  Loader2,
  RotateCcw,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'

export function LoadingState({
  label = 'Consultando la API…',
  className = '',
}: {
  label?: string
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 py-14 text-slate-500 ${className}`}
    >
      <Loader2 className="size-6 animate-spin text-brand-600" />
      <p className="text-sm">{label}</p>
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-slate-100 ${className}`}
      aria-hidden="true"
    />
  )
}

export function ErrorState({
  message,
  onRetry,
  className = '',
}: {
  message: string
  onRetry?: () => void
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}
    >
      <span className="grid size-11 place-items-center rounded-full bg-rose-50 text-rose-600">
        <AlertTriangle className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-800">
          No se pudo obtener la información
        </p>
        <p className="mx-auto mt-1 max-w-md text-xs text-slate-500">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <RotateCcw className="size-3.5" />
          Reintentar
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  icon: Icon = Inbox,
  action,
  className = '',
}: {
  title: string
  description?: string
  icon?: LucideIcon
  action?: ReactNode
  className?: string
}) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-3 px-6 py-12 text-center ${className}`}
    >
      <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Icon className="size-5" />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-700">{title}</p>
        {description && (
          <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-slate-500">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
