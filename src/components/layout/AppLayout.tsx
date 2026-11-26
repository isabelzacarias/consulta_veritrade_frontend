import { useState, type CSSProperties } from 'react'
import { Outlet } from 'react-router-dom'
import { EMBEDDED } from '@/lib/suite'
import { AppSidebar } from './AppSidebar'

const STORAGE_KEY = 'comprasSidebarCompact'

export function AppLayout() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return window.localStorage.getItem(STORAGE_KEY) === '1'
    } catch {
      // El menú sigue funcionando aunque el almacenamiento esté desactivado.
      return false
    }
  })

  const toggleSidebar = () => {
    setCollapsed((current) => {
      const next = !current
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0')
      } catch {
        // El menú sigue funcionando aunque el almacenamiento esté desactivado.
      }
      return next
    })
  }

  if (EMBEDDED) return <Outlet />

  return (
    <div className="min-h-screen">
      <AppSidebar collapsed={collapsed} onToggle={toggleSidebar} />
      <div
        style={
          {
            '--app-sidebar-width': collapsed ? '76px' : '252px',
          } as CSSProperties
        }
        className={`min-h-screen transition-[padding] duration-200 ${
          collapsed ? 'min-[1101px]:pl-[76px]' : 'min-[1101px]:pl-[252px]'
        }`}
      >
        <Outlet />
      </div>
    </div>
  )
}
