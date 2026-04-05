import { Link } from 'react-router-dom'

import { cn } from '../../utils/classNames'

interface TopBarProps {
  title?: string
  className?: string
}

export default function TopBar({ title = 'AgroPrecision', className }: TopBarProps) {
  return (
    <header className={cn('glass-surface fixed inset-x-0 top-0 z-50 px-4 py-3 md:px-6', className)}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between lg:pl-72">
        <Link className="font-headline text-xl font-extrabold tracking-tight text-primary" to="/">
          {title}
        </Link>

        <div className="flex items-center gap-3">
          <button
            aria-label="Notificaciones"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-low text-on-surface-variant transition hover:bg-surface-container-high"
            type="button"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>

          <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-surface-container-high text-on-surface-variant">
            <span className="material-symbols-outlined">account_circle</span>
          </div>
        </div>
      </div>
    </header>
  )
}
