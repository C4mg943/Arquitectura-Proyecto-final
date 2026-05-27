import { useCallback, useEffect, useState } from 'react'
import { Button, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type NotificationDto } from '../../../shared/services/apiClient'

// Mapa de tipo de evento → icono y color
const tipoMeta: Record<string, { icon: string; bg: string; color: string }> = {
  'user.registered':       { icon: 'waving_hand',        bg: 'bg-primary-container',    color: 'text-primary' },
  'alerta.creada':         { icon: 'warning',             bg: 'bg-error-container',      color: 'text-error' },
  'recommendation.creada': { icon: 'tips_and_updates',    bg: 'bg-tertiary-container',   color: 'text-tertiary' },
  'operario.asignado':     { icon: 'assignment_ind',      bg: 'bg-secondary-container',  color: 'text-secondary' },
  'tecnico.asignado':      { icon: 'science',             bg: 'bg-secondary-container',  color: 'text-secondary' },
  'actividad.created':     { icon: 'task_alt',            bg: 'bg-primary-fixed',        color: 'text-primary' },
  'cultivo.created':       { icon: 'potted_plant',        bg: 'bg-primary-fixed',        color: 'text-primary' },
  'cultivo.updated':       { icon: 'edit_note',           bg: 'bg-surface-container-high', color: 'text-on-surface' },
  'parcela.created':       { icon: 'map',                 bg: 'bg-primary-container',    color: 'text-primary' },
}

const defaultMeta = { icon: 'notifications', bg: 'bg-surface-container-high', color: 'text-on-surface' }

function getMeta(tipo: string) {
  return tipoMeta[tipo] ?? defaultMeta
}

function timeAgo(isoStr: string | null | undefined): string {
  if (!isoStr) return ''
  const ts = new Date(isoStr).getTime()
  if (Number.isNaN(ts)) return ''
  const diff = Date.now() - ts
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  const days = Math.floor(hrs / 24)
  if (days < 7) return `Hace ${days} día${days === 1 ? '' : 's'}`
  return new Date(isoStr).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isMarkingAll, setIsMarkingAll] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const loadNotifications = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.notifications.list()
      setNotifications(data)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar las notificaciones.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadNotifications() }, [loadNotifications])

  const markAsRead = async (id: number) => {
    try {
      await apiClient.notifications.markRead(id)
      setNotifications((current) =>
        current.map((n) => n.id === id ? { ...n, leida: true } : n)
      )
    } catch {
      // silencioso
    }
  }

  const markAllRead = async () => {
    setIsMarkingAll(true)
    try {
      await apiClient.notifications.markAllRead()
      setNotifications((current) => current.map((n) => ({ ...n, leida: true })))
    } catch {
      // silencioso
    } finally {
      setIsMarkingAll(false)
    }
  }

  const displayed = filter === 'unread'
    ? notifications.filter((n) => !n.leida)
    : notifications

  const unreadCount = notifications.filter((n) => !n.leida).length

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Notificaciones</h1>
          <p className="mt-1 text-on-surface-variant">
            Actividad reciente relacionada con tus fincas, cultivos y equipo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 ? (
            <Button
              size="small"
              variant="tertiary"
              onClick={() => void markAllRead()}
              disabled={isMarkingAll}
            >
              {isMarkingAll ? 'Marcando...' : 'Marcar todas como leídas'}
            </Button>
          ) : null}
          <Button
            size="small"
            variant={filter === 'all' ? 'primary' : 'tertiary'}
            onClick={() => setFilter('all')}
          >
            Todas
          </Button>
          <Button
            size="small"
            variant={filter === 'unread' ? 'primary' : 'tertiary'}
            onClick={() => setFilter('unread')}
          >
            No leídas {unreadCount > 0 ? `(${unreadCount})` : ''}
          </Button>
        </div>
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}

      {isLoading ? (
        <Card><p className="text-on-surface-variant">Cargando notificaciones...</p></Card>
      ) : displayed.length === 0 ? (
        <Card>
          <div className="py-10 text-center">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant">
              {filter === 'unread' ? 'done_all' : 'notifications_off'}
            </span>
            <p className="mt-3 text-on-surface-variant">
              {filter === 'unread' ? 'No tienes notificaciones sin leer.' : 'No hay notificaciones aún.'}
            </p>
          </div>
        </Card>
      ) : (
        <div className="space-y-2">
          {displayed.map((n) => {
            const meta = getMeta(n.tipo)
            return (
              <div
                key={n.id}
                className={`flex items-start gap-4 rounded-2xl p-4 transition-colors ${
                  n.leida
                    ? 'bg-surface-container-low'
                    : 'bg-surface ring-1 ring-primary/20 shadow-sm'
                }`}
              >
                {/* Icono */}
                <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.bg}`}>
                  <span className={`material-symbols-outlined ${meta.color}`}>{meta.icon}</span>
                </div>

                {/* Contenido */}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className={`font-semibold ${n.leida ? 'text-on-surface-variant' : 'text-on-surface'}`}>
                      {n.titulo}
                    </p>
                    {!n.leida ? (
                      <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">{n.mensaje}</p>
                  <p className="mt-1.5 text-xs text-on-surface-variant">
                    {timeAgo(n.createdAt ?? (n as unknown as { created_at?: string }).created_at)}
                  </p>
                </div>

                {/* Acción */}
                {!n.leida ? (
                  <button
                    aria-label="Marcar como leída"
                    className="shrink-0 rounded-xl p-2 text-on-surface-variant hover:bg-surface-container-high"
                    onClick={() => void markAsRead(n.id)}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-base">done</span>
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
      )}
    </section>
  )
}
