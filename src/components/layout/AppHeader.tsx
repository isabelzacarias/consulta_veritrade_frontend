import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import logoHeader from '@/assets/logo-header-hr.png'
import { useAuth } from '@/features/auth/AuthContext'

interface AppHeaderProps {
  title: string
  subtitle: string
}

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  const auth = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)
  const home = '/'
  const company = auth.context?.empresa?.nombre
  const roles = auth.context?.roles ?? []
  const roleLabel =
    roles.length > 0
      ? roles.join(' / ')
      : auth.context?.legacy_role || 'Usuario'

  const closeMenu = () => setMenuOpen(false)

  return (
    <header className="sticky top-0 z-30 bg-[#201033] text-white shadow-md shadow-[#201033]/20 min-[1101px]:ml-[calc(var(--app-sidebar-width)*-1)] min-[1101px]:w-[calc(100%+var(--app-sidebar-width))]">
      <div className="relative mx-auto flex min-h-16 max-w-[1600px] items-center justify-between gap-3 px-4 py-2 sm:px-6">
        <Link
          to={home}
          onClick={closeMenu}
          title="Inicio"
          className="flex min-w-0 shrink-0 items-center gap-3 transition hover:opacity-90"
        >
          <img
            src={logoHeader}
            alt="HORBIS Group"
            className="block h-[42px] w-auto max-w-[150px] object-contain sm:max-w-[180px]"
          />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-sm font-semibold tracking-tight text-white">
              {title}
            </p>
            <p className="truncate text-[11px] text-white/60">{subtitle}</p>
          </div>
        </Link>

        <button
          type="button"
          onClick={() => setMenuOpen((open) => !open)}
          aria-expanded={menuOpen}
          aria-controls="mainMenu"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          className="flex size-11 shrink-0 items-center justify-center rounded-lg text-white md:hidden"
        >
          {menuOpen ? <X className="size-6" /> : <Menu className="size-6" />}
        </button>

        <nav
          id="mainMenu"
          aria-label="Acciones del sistema"
          className={`${
            menuOpen ? 'flex' : 'hidden'
          } absolute top-full right-0 z-50 w-[min(82vw,340px)] flex-col items-start gap-4 rounded-bl-[18px] bg-[#201033] px-6 py-5 shadow-[-12px_12px_24px_rgba(0,0,0,0.22)] md:static md:flex md:w-auto md:flex-row md:items-center md:gap-6 md:rounded-none md:bg-transparent md:p-0 md:shadow-none`}
        >
          <span className="flex w-full flex-col items-start border-b border-white/15 pb-3 text-left md:hidden">
            {company && (
              <span className="text-sm font-semibold text-white">{company}</span>
            )}
            <span className="text-[10px] font-normal uppercase tracking-wide text-white/65">
              {roleLabel}
            </span>
          </span>

          {company && (
            <span className="hidden flex-col items-end leading-tight xl:flex">
              <span className="text-sm font-semibold text-white">{company}</span>
              <span className="text-[10px] font-normal uppercase tracking-wide text-white/60">
                {roleLabel}
              </span>
            </span>
          )}


        </nav>
      </div>
    </header>
  )
}
