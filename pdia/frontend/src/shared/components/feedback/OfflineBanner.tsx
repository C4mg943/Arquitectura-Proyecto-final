import { useEffect, useState } from 'react'

import { useOffline } from '../../hooks/useOffline'
import { countPendingActivities } from '../../services/offlineDb'
import { subscribeToPendingChanges, subscribeToSyncResults } from '../../services/syncService'
import { useAuthStore } from '../../../store/authStore'

export default function OfflineBanner() {
  const isOffline = useOffline()
  const userId = useAuthStore((state) => state.user?.id)
  const [pending, setPending] = useState(0)

  useEffect(() => {
    let cancelled = false

    const refresh = () => {
      countPendingActivities(userId)
        .then((count) => {
          if (!cancelled) setPending(count)
        })
        .catch(() => {
          if (!cancelled) setPending(0)
        })
    }

    refresh()
    const unsubPending = subscribeToPendingChanges(refresh)
    const unsubSync = subscribeToSyncResults(refresh)

    return () => {
      cancelled = true
      unsubPending()
      unsubSync()
    }
  }, [userId])

  if (!isOffline && pending === 0) {
    return null
  }

  if (isOffline) {
    return (
      <div className="fixed inset-x-0 top-16 z-[55] flex items-center justify-center gap-2 bg-error-container px-4 py-2 text-on-error-container">
        <span className="material-symbols-outlined">cloud_off</span>
        <p className="text-xs font-semibold sm:text-sm">
          Modo offline activo
          {pending > 0 ? ` · ${pending} actividad${pending === 1 ? '' : 'es'} pendiente${pending === 1 ? '' : 's'}` : ''}
          . Tus cambios se sincronizarán al recuperar conexión.
        </p>
      </div>
    )
  }

  // Online con pendientes (por ejemplo tras volver de un corte)
  return (
    <div className="fixed inset-x-0 top-16 z-[55] flex items-center justify-center gap-2 bg-secondary-container px-4 py-2 text-on-secondary-container">
      <span className="material-symbols-outlined">cloud_sync</span>
      <p className="text-xs font-semibold sm:text-sm">
        Sincronizando {pending} actividad{pending === 1 ? '' : 'es'} pendiente{pending === 1 ? '' : 's'}…
      </p>
    </div>
  )
}
