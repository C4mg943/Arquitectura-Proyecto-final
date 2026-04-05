import { useOffline } from '../../hooks/useOffline'

export default function OfflineBanner() {
  const isOffline = useOffline()

  if (!isOffline) {
    return null
  }

  return (
    <div className="fixed inset-x-0 top-16 z-[55] flex items-center justify-center gap-2 bg-error-container px-4 py-2 text-on-error-container">
      <span className="material-symbols-outlined">cloud_off</span>
      <p className="text-xs font-semibold sm:text-sm">
        Modo offline activo: tus cambios se sincronizarán al recuperar conexión.
      </p>
    </div>
  )
}
