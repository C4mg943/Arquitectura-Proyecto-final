import { NavLink } from 'react-router-dom'

import { cn } from '../../utils/classNames'
import { navItems } from './navConfig'

function navLinkClass(isActive: boolean): string {
  return cn(
    'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all duration-200',
    isActive
      ? 'bg-primary-fixed text-on-primary-fixed shadow-[0_8px_18px_rgb(35_80_30_/_20%)]'
      : 'text-on-surface-variant hover:-translate-y-0.5 hover:bg-surface-container-high',
  )
}

export default function SideNav() {
  return (
    <aside className="surface-panel fixed inset-y-0 left-0 z-40 hidden w-72 border-r border-outline-variant/45 p-4 lg:flex lg:flex-col">
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
