import { NavLink } from 'react-router-dom'

import { cn } from '../../utils/classNames'
import { mobileNavItems } from './navConfig'

function navLinkClass(isActive: boolean): string {
  return cn(
    'flex flex-col items-center justify-center rounded-xl p-2 text-[10px] font-semibold',
    isActive
      ? 'bg-primary text-on-primary'
      : 'text-on-surface-variant hover:bg-surface-container-high',
  )
}

export default function BottomNav() {
  return (
    <nav className="glass-surface fixed inset-x-0 bottom-0 z-50 border-t-0 px-4 pb-6 pt-2 lg:hidden">
      <ul className="mx-auto flex max-w-3xl items-center justify-around gap-1">
        {mobileNavItems.map((item) => (
          <li key={item.label}>
            <NavLink className={({ isActive }) => navLinkClass(isActive)} end={item.end} to={item.to}>
              <span className="material-symbols-outlined text-lg">{item.icon}</span>
              <span className="mt-1">{item.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
