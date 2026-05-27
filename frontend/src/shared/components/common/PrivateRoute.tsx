import { Navigate, Outlet, useLocation } from 'react-router-dom'

import { useAuthStore } from '../../../store/authStore'

export default function PrivateRoute() {
  const location = useLocation()
  const isHydrated = useAuthStore((state) => state.isHydrated)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  if (!isHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface text-on-surface">
        <div className="inline-flex items-center gap-2 text-sm font-semibold">
          <span className="material-symbols-outlined animate-spin">progress_activity</span>
          Verificando sesión...
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location }} to="/login" />
  }

  return <Outlet />
}
