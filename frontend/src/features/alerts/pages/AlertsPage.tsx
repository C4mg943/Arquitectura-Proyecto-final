import { useCallback, useEffect, useState } from 'react'
import { Badge, Button, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type AlertaDto } from '../../../shared/services/apiClient'
import { useAuthStore } from '../../../store/authStore'

const tipoLabels: Record<string, string> = {
  LLUVIA: 'Lluvia intensa',
  TEMPERATURA_ALTA: 'Temperatura alta',
  TEMPERATURA_BAJA: 'Temperatura baja',
  VIENTO: 'Viento fuerte',
}

const tipoDescriptions: Record<string, string> = {
  LLUVIA: 'Se esperan lluvias intensas. Considera posponer fumigaciones.',
  TEMPERATURA_ALTA: 'Temperatura elevada. Aumenta el monitoreo hídrico.',
  TEMPERATURA_BAJA: 'Temperatura baja detectada. Evalúa protección contra frío.',
  VIENTO: 'Vientos fuertes. Protege estructuras y cultivos sensibles.',
}

export default function AlertsPage() {
  const user = useAuthStore((state) => state.user)
  const isAdmin = user?.rol === 'ADMINISTRADOR'
  const [alerts, setAlerts] = useState<AlertaDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSeeding, setIsSeeding] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const loadAlerts = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.alertas.list()
      setAlerts(data)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('Error al cargar alertas')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadAlerts() }, [loadAlerts])

  const handleMarkRead = async (id: number) => {
    try {
      await apiClient.alertas.markRead(id)
      setAlerts((current) => current.map((a) => a.id === id ? { ...a, leida: true } : a))
    } catch {
      // silencioso
    }
  }

  const handleSeedTest = async () => {
    setIsSeeding(true)
    setError(null)
    setInfo(null)
    try {
      const result = await apiClient.alertas.seedTest()
      setInfo(result.message)
      void loadAlerts()
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible generar alertas de prueba.')
      }
    } finally {
      setIsSeeding(false)
    }
  }

  const unread = alerts.filter((a) => !a.leida).length

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Historial de Alertas</h1>
          <p className="mt-1 text-on-surface-variant">
            Alertas automáticas generadas por el sistema de monitoreo climático.
          </p>
        </div>
        {isAdmin ? (
          <Button
            size="small"
            variant="secondary"
            onClick={() => void handleSeedTest()}
            disabled={isSeeding}
            leadingIcon="science"
          >
            {isSeeding ? 'Generando...' : 'Generar alertas de prueba'}
          </Button>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}
      {info ? (
        <p className="rounded-xl bg-tertiary-container px-3 py-2 text-sm font-semibold text-on-tertiary-container">{info}</p>
      ) : null}

      {unread > 0 ? (
        <div className="flex items-center gap-2 rounded-2xl bg-error-container px-4 py-3 text-on-error-container">
          <span className="material-symbols-outlined">warning</span>
          <p className="text-sm font-semibold">{unread} alerta{unread === 1 ? '' : 's'} sin leer</p>
        </div>
      ) : null}

      <div className="space-y-3">
        {isLoading ? (
          <Card><p className="text-on-surface-variant">Cargando alertas...</p></Card>
        ) : alerts.length === 0 ? (
          <Card>
            <div className="py-8 text-center">
              <span className="material-symbols-outlined text-4xl text-on-surface-variant">check_circle</span>
              <p className="mt-2 text-on-surface-variant">No hay alertas activas.</p>
              {isAdmin ? (
                <p className="mt-1 text-sm text-on-surface-variant">
                  Usa el botón "Generar alertas de prueba" para crear datos de ejemplo.
                </p>
              ) : null}
            </div>
          </Card>
        ) : (
          alerts.map((a) => (
            <Card key={a.id} className="p-0 overflow-hidden">
              <div className="flex">
                <div className={`w-1.5 ${a.leida ? 'bg-outline-variant' : 'bg-error'}`} />
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-error-container text-error">
                        <span className="material-symbols-outlined">warning</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-bold text-on-surface">{tipoLabels[a.tipo] ?? a.tipo}</h3>
                          <Badge variant={a.leida ? 'neutral' : 'danger'}>{a.leida ? 'Leída' : 'Nueva'}</Badge>
                        </div>
                        <p className="mt-1 text-sm text-on-surface-variant">
                          {tipoDescriptions[a.tipo] ?? `Valor detectado: ${a.valorDetectado}`}
                        </p>
                        <p className="mt-1 text-xs text-on-surface-variant">
                          Valor: {a.valorDetectado} · Cultivo #{a.cultivoId} ·{' '}
                          {new Date(a.fecha + 'T00:00:00').toLocaleDateString('es-CO', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    {!a.leida ? (
                      <Button
                        size="small"
                        variant="tertiary"
                        onClick={() => void handleMarkRead(a.id)}
                      >
                        Marcar leída
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </section>
  )
}
