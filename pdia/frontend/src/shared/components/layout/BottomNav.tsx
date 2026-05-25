import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'

import { cn } from '../../utils/classNames'
import { navItems } from './navConfig'
import { useAuthStore } from '../../../store/authStore'
import type { NavItem } from './navConfig'

// Ítems que siempre aparecen en la barra inferior (los más usados en campo)
const PINNED_BY_ROLE: Record<string, string[]> = {
  PRODUCTOR: ['/dashboard', '/actividades', '/cultivos', '/clima'],
  OPERARIO:  ['/dashboard', '/actividades', '/cultivos', '/clima'],
  TECNICO:   ['/tecnico', '/tecnico/cultivos', '/tecnico/actividades', '/clima'],
  ADMINISTRADOR: ['/dashboard', '/usuarios', '/gestion-fincas'],
}

function navLinkClass(isActive: boolean): string {
  return cn(
    'flex flex-col items-center justify-center rounded-2xl p-2 text-[10px] font-semibold transition-all duration-200',
    isActive
      ? 'bg-primary text-on-primary shadow-[0_8px_18px_rgb(21_66_18_/_28%)]'
      : 'text-on-surface-variant hover:bg-surface-container-high',
  )
}

export default function BottomNav() {
  const role = useAuthStore((state) => state.user?.rol)
  const navigate = useNavigate()
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Todos los ítems del rol actual
  const allItems = navItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) return true
    if (!role) return false
    return item.roles.includes(role)
  })

  // Ítems fijados en la barra (los 4 más importantes del rol)
  const pinnedPaths = role ? (PINNED_BY_ROLE[role] ?? []) : []
  const pinnedItems: NavItem[] = pinnedPaths
    .map((path) => allItems.find((item) => item.to === path))
    .filter((item): item is NavItem => item !== undefined)

  // Ítems que van al drawer "Más" (todos los que no están fijados)
  const drawerItems = allItems.filter(
    (item) => !pinnedPaths.includes(item.to as string),
  )

  return (
    <>
      {/* Barra inferior */}
      <nav className="glass-surface fixed inset-x-0 bottom-0 z-50 border-t border-outline-variant/40 px-2 pb-safe pt-2 lg:hidden"
           style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        <ul className="mx-auto flex max-w-md items-center justify-around gap-1">
          {pinnedItems.map((item) => (
            <li key={`${item.to}-${item.label}`} className="flex-1">
              <NavLink
                className={({ isActive }) => navLinkClass(isActive)}
                end={item.end}
                to={item.to}
              >
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
                <span className="mt-0.5 leading-tight">{item.label}</span>
              </NavLink>
            </li>
          ))}

          {/* Botón "Más" — solo si hay ítems extra */}
          {drawerItems.length > 0 && (
            <li className="flex-1">
              <button
                className={cn(
                  'flex w-full flex-col items-center justify-center rounded-2xl p-2 text-[10px] font-semibold transition-all duration-200',
                  drawerOpen
                    ? 'bg-primary text-on-primary shadow-[0_8px_18px_rgb(21_66_18_/_28%)]'
                    : 'text-on-surface-variant hover:bg-surface-container-high',
                )}
                onClick={() => setDrawerOpen(true)}
                type="button"
              >
                <span className="material-symbols-outlined text-xl">grid_view</span>
                <span className="mt-0.5 leading-tight">Más</span>
              </button>
            </li>
          )}
        </ul>
      </nav>

      {/* Drawer "Más" */}
      {drawerOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-[60] bg-black/40 lg:hidden"
            onClick={() => setDrawerOpen(false)}
          />

          {/* Panel deslizante desde abajo */}
          <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-3xl bg-surface px-4 pb-10 pt-4 shadow-[0_-8px_40px_rgb(0_0_0_/_20%)] lg:hidden">
            {/* Handle */}
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-outline-variant" />

            <h2 className="mb-4 text-sm font-bold text-on-surface-variant uppercase tracking-wide px-1">
              Todas las secciones
            </h2>

            <div className="grid grid-cols-3 gap-3">
              {/* Primero los fijados para referencia rápida */}
              {[...pinnedItems, ...drawerItems].map((item) => (
                <button
                  key={`drawer-${item.to}-${item.label}`}
                  className="flex flex-col items-center gap-2 rounded-2xl bg-surface-container-low p-4 text-center transition-colors active:bg-surface-container-high"
                  onClick={() => {
                    setDrawerOpen(false)
                    navigate(item.to as string)
                  }}
                  type="button"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-on-primary">
                    <span className="material-symbols-outlined text-2xl">{item.icon}</span>
                  </div>
                  <span className="text-xs font-semibold leading-tight text-on-surface">
                    {item.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  )
}
