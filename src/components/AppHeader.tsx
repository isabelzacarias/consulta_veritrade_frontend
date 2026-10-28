import { NavLink } from 'react-router-dom'
import { RefreshCw, Ship, ShoppingCart, Upload } from 'lucide-react'
import logoHeader from '../assets/logo-header-hr.png'

interface AppHeaderProps {
  title: string
  subtitle: string
  isRefreshing?: boolean
  onRefresh?: () => void
  onImport?: () => void
  importLabel?: string
  updatedAt?: string | null
}

const navClass = ({ isActive }: { isActive: boolean }) =>
  `inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
    isActive
      ? 'bg-linear-to-r from-brand-700 to-brand-500 text-white shadow-sm shadow-brand-900/20'
      : 'text-slate-600 hover:bg-brand-50 hover:text-brand-700'
  }`

export function AppHeader({
  title,
  subtitle,
  isRefreshing = false,
  onRefresh,
  onImport,
  importLabel = 'Importar datos',
  updatedAt,
}: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-brand-100/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <span className="rounded-xl bg-linear-to-br from-deep-950 via-brand-900 to-deep-900 px-3 py-1 shadow-md shadow-brand-950/20 ring-1 ring-white/15">
            <img
              src={logoHeader}
              alt="HORBIS Group"
              className="h-9 w-auto brightness-150 saturate-125 drop-shadow-[0_1px_1px_rgba(255,255,255,0.22)]"
            />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-slate-900">
              {title}
            </p>
            <p className="truncate text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <nav
            aria-label="Áreas del sistema"
            className="flex items-center gap-0.5 rounded-xl border border-brand-200/70 bg-brand-50/60 p-0.5"
          >
            <NavLink to="/" end className={navClass}>
              <Ship className="size-3.5" />
              Importaciones
            </NavLink>
            <NavLink to="/compras" className={navClass}>
              <ShoppingCart className="size-3.5" />
              Compras
            </NavLink>
          </nav>

          {updatedAt && (
            <span className="hidden text-[11px] text-slate-400 lg:inline">
              Actualizado {updatedAt}
            </span>
          )}

          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-60"
            >
              <RefreshCw
                className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              Actualizar
            </button>
          )}

          {onImport && (
            <button
              type="button"
              onClick={onImport}
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-700 px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-brand-800"
            >
              <Upload className="size-3.5" />
              {importLabel}
            </button>
          )}
        </div>
      </div>
    </header>
  )
}
