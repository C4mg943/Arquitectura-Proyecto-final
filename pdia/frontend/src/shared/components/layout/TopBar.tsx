import { Link } from 'react-router-dom'

import { useAuthStore } from '../../../store/authStore'
import { cn } from '../../utils/classNames'
import { Button } from '../common'

interface TopBarProps {
  title?: string
  className?: string
}

export default function TopBar({ title = 'AgroPrecision', className }: TopBarProps) {
  const user = useAuthStore((state) => state.user)
  const clear = useAuthStore((state) => state.clear)

  const onLogout = () => {
    clear()
    window.location.replace('/login')
  }

  return (
    <header className={cn('glass-surface fixed inset-x-0 top-0 z-50 px-4 py-3 md:px-6', className)}>
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between lg:pl-72">
        <Link className="font-headline text-xl font-extrabold tracking-tight text-primary drop-shadow-[0_1px_1px_rgb(21_66_18_/_12%)]" to="/">
          {title}
        </Link>

        <div className="flex items-center gap-3">
          <p className="hidden text-sm font-semibold text-on-surface-variant md:block">{user?.nombre ?? 'Usuario'}</p>

          <button
            aria-label="Notificaciones"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/55 bg-surface-container-lowest text-on-surface-variant shadow-[0_6px_16px_rgb(25_28_26_/_8%)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-container-high"
            type="button"
          >
            <span className="material-symbols-outlined">notifications</span>
          </button>

          <Link
            aria-label="Perfil"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/45 bg-surface-container-low text-on-surface-variant shadow-[0_6px_16px_rgb(25_28_26_/_8%)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-surface-container-high"
            to="/profile"
          >
            <span className="material-symbols-outlined">account_circle</span>
          </Link>

          <Button className="min-h-10 px-3 py-2 text-xs" onClick={onLogout} variant="tertiary">
            Salir
          </Button>
        </div>
      </div>
    </header>
  )
}
