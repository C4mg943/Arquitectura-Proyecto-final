import { useState } from 'react'

import { Link } from 'react-router-dom'

import { useAuthStore } from '../../../store/authStore'
import { cn } from '../../utils/classNames'

interface TopBarProps {
  title?: string
  className?: string
}

export default function TopBar({ title = 'PDIA PROYECTO', className }: TopBarProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const clear = useAuthStore((state) => state.clear)
  const user = useAuthStore((state) => state.user)

  const handleLogout = () => {
    clear()
    window.location.replace('/login')
  }

  return (
    <header className={cn('glass-surface fixed inset-x-0 top-0 z-50 px-3 py-2 md:px-4', className)}>
      <div className="mx-auto flex w-full items-center justify-between">
        <Link className="font-headline text-xl font-extrabold tracking-tight text-primary drop-shadow-[0_1px_1px_rgb(21_66_18_/_12%)]" to="/">
          {title}
        </Link>

        <div className="flex items-center gap-3">
          {user && (
            <span className="hidden text-sm font-semibold text-on-surface-variant md:block">
              Hola, {user.nombre}
            </span>
          )}
          <div className="relative">
            <button
              aria-label="Menú"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-outline-variant/45 bg-surface-container-low text-on-surface-variant shadow-[0_6px_16px_rgb(25_28_26_/_8%)] transition-all duration-200 hover:bg-surface-container-high"
              onClick={() => setMenuOpen(!menuOpen)}
              type="button"
            >
              <span className="material-symbols-outlined">account_circle</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-12 w-48 rounded-2xl bg-surface p-2 shadow-lg ring-1 ring-outline-variant">
                <Link
                  className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-high"
                  onClick={() => setMenuOpen(false)}
                  to="/profile"
                >
                  <span className="material-symbols-outlined text-lg">edit</span>
                  Modificar perfil
                </Link>
                <button
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-on-surface hover:bg-surface-container-high"
                  onClick={() => {
                    setMenuOpen(false)
                    handleLogout()
                  }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-lg">logout</span>
                  Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
