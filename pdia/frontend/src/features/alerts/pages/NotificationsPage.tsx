import { useCallback, useEffect, useState } from 'react'
import { Card, Button } from '../../../shared/components/common'
import { apiClient, type NotificationDto } from '../../../shared/services/apiClient'

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.notifications.list()
      setNotifications(data)
    } finally {
      setIsLoading(false)
    }
  }, [])

  const markAsRead = async (id: number) => {
    await apiClient.notifications.markRead(id)
    await loadNotifications()
  }

  useEffect(() => { void loadNotifications() }, [loadNotifications])

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Notificaciones</h1>
      </header>
      
      <div className="space-y-3">
        {isLoading ? <p>Cargando...</p> : notifications.length === 0 ? <p>No hay notificaciones.</p> : notifications.map(n => (
          <Card key={n.id} className="flex items-start gap-4 p-4">
            <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${n.leida ? 'bg-surface-container-high' : 'bg-primary-container text-primary'}`}>
              <span className="material-symbols-outlined">{n.leida ? 'drafts' : 'notifications'}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-on-surface">{n.titulo}</h3>
              <p className="mt-1 text-sm text-on-surface-variant">{n.mensaje}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {new Date(n.createdAt).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            {!n.leida && (
              <Button onClick={() => void markAsRead(n.id)} variant="tertiary" className="h-9 text-xs">
                Marcar leída
              </Button>
            )}
          </Card>
        ))}
      </div>
    </section>
  )
}
