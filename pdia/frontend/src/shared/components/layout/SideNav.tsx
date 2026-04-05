import { NavLink } from 'react-router-dom'

import { cn } from '../../utils/classNames'
import { navItems } from './navConfig'

function navLinkClass(isActive: boolean): string {
  return cn(
    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold transition-colors',
    isActive
      ? 'bg-primary-fixed text-on-primary-fixed'
      : 'text-on-surface-variant hover:bg-surface-container-high',
  )
}

export default function SideNav() {
  return (
    <aside className="surface-panel fixed inset-y-0 left-0 z-40 hidden w-72 p-4 lg:flex lg:flex-col">
      <div className="mb-8 mt-20 px-2">
        <h2 className="font-headline text-lg font-bold text-primary">The Agronomist</h2>
        <p className="text-label-md mt-1 text-on-surface-variant">Precision Yield Management</p>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        {navItems.map((item) => (
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
