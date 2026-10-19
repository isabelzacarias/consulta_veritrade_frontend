import type { ReactNode } from 'react'

interface SectionCardProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  children: ReactNode
  className?: string
  bodyClassName?: string
}

export function SectionCard({
  title,
  subtitle,
  actions,
  children,
  className = '',
  bodyClassName = '',
}: SectionCardProps) {
  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-brand-200/60 bg-white shadow-md shadow-brand-900/5 ${className}`}
    >
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-brand-100/80 bg-linear-to-r from-brand-50/80 via-white to-aqua-50/60 px-5 py-4">
        <div className="flex min-w-0 items-start gap-2.5">
          <span className="mt-0.5 h-4 w-1 shrink-0 rounded-full bg-linear-to-b from-brand-600 to-aqua-400" />
          <div className="min-w-0">
            <h2 className="text-sm font-semibold tracking-tight text-slate-900">
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
            )}
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </header>
      <div className={bodyClassName}>{children}</div>
    </section>
  )
}
