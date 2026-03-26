import { useEffect, useState } from 'react'

export function useOffline() {
  const [estaOffline, setEstaOffline] = useState(!navigator.onLine)

  useEffect(() => {
    const manejarOffline = () => setEstaOffline(true)
    const manejarOnline = () => setEstaOffline(false)

    window.addEventListener('offline', manejarOffline)
    window.addEventListener('online', manejarOnline)

    return () => {
      window.removeEventListener('offline', manejarOffline)
      window.removeEventListener('online', manejarOnline)
    }
  }, [])

  return estaOffline
}
