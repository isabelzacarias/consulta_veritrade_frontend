import { NavLink } from 'react-router-dom'
import {
  ChevronLeft,
  LayoutDashboard,
  Ship,
  ShoppingCart,
  type LucideIcon,
} from 'lucide-react'
import { useAuth } from '@/features/auth/AuthContext'

interface AppSidebarProps {
  collapsed: boolean
  onToggle: () => void
}

interface NavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

const itemBase =
  'flex min-h-12 items-center gap-[13px] rounded-[10px] text-[14px] leading-[1.25] font-[650] transition'

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const auth = useAuth()
  const canViewImportaciones = auth.hasPermission('compras.ver')

  const items: NavItem[] = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
    ...(canViewImportaciones
      ? [{ to: '/importaciones', label: 'Importaciones', icon: Ship }]
      : []),
    { to: '/compras', label: 'Compras', icon: ShoppingCart },
  ]

  return (
    <aside
      aria-label="Navegación principal"
      className={`fixed top-16 bottom-0 left-0 z-40 hidden flex-col bg-[#201033] text-white shadow-[8px_0_24px_rgba(25,10,44,0.08)] transition-[width] duration-200 min-[1101px]:flex ${
        collapsed ? 'w-[76px]' : 'w-[252px]'
      }`}
    >
      <div
        className={`flex min-h-[82px] items-center gap-[11px] border-b border-white/10 ${
          collapsed ? 'flex-col justify-center px-2 py-3' : 'px-[17px] py-3.5'
        }`}
      >
        <span
          aria-hidden="true"
          className="grid size-[42px] shrink-0 place-items-center rounded-xl bg-[#4b1d95] text-[23px] font-black"
        >
          H
        </span>

        {!collapsed && (
          <span className="flex min-w-0 flex-1 flex-col text-[17px] leading-none font-black tracking-[0.04em] text-white">
            HORBIS
            <small className="mt-1 text-[9px] font-semibold tracking-[0.15em] text-[#b8a9ca]">
              GROUP
            </small>
          </span>
        )}

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={!collapsed}
          aria-label={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          title={collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'}
          className="grid size-8 shrink-0 place-items-center rounded-lg border border-white/15 bg-white/5 text-white transition hover:bg-white/15"
        >
          <ChevronLeft
            className={`size-[18px] transition-transform duration-200 ${
              collapsed ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <nav className="grid content-start gap-1.5 overflow-y-auto p-2.5">
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              aria-label={item.label}
              className={({ isActive }) =>
                `${itemBase} ${
                  collapsed ? 'justify-center px-0' : 'px-3'
                } ${
                  isActive
                    ? 'bg-[#45205f] text-white'
                    : 'text-[#bdb3c8] hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <Icon className="size-[21px] shrink-0" strokeWidth={1.8} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}
