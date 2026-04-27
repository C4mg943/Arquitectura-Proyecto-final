import { NavLink } from 'react-router-dom'

import { cn } from '../../utils/classNames'
import { navItems } from './navConfig'
import { useAuthStore } from '../../../store/authStore'

function navLinkClass(isActive: boolean): string {
  return cn(
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200',
    isActive
      ? 'bg-primary-fixed text-on-primary-fixed shadow-[0_8px_18px_rgb(35_80_30_/_20%)]'
      : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-surface-container-high',
  )
}

export default function SideNav() {
  const role = useAuthStore((state) => state.user?.rol)

  const visibleItems = navItems.filter((item) => {
    if (!item.roles || item.roles.length === 0) {
      return true
    }

    if (!role) {
      return false
    }

    return item.roles.includes(role)
  })

  return (
    <aside className="surface-panel fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-outline-variant/45 p-4 lg:flex lg:flex-col">
      <div className="mb-8 mt-20 px-2"></div>

      <nav className="flex flex-1 flex-col gap-1">
        {visibleItems.map((item) => (
          <NavLink
            key={item.label}
            className={({ isActive }) => navLinkClass(isActive)}
            end={item.end}
            to={item.to}
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}
