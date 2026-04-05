import { useCallback, useEffect, useState } from 'react'

import { Badge, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type AlertaDto, type CultivoDto } from '../../../shared/services/apiClient'

type AlertSeverity = 'critical' | 'high' | 'medium' | 'low'

interface AlertItem {
  id: number
  type: string
  icon: string
  message: string
  detail: string
  severity: AlertSeverity
  parcel: string
  crop: string
  timestamp: string
  read: boolean
}

function mapAlertType(tipo: AlertaDto['tipo']): { type: string; icon: string; message: string; detail: string; severity: AlertSeverity } {
  if (tipo === 'LLUVIA') {
    return {
      type: 'Lluvia intensa',
      icon: 'thunderstorm',
      message: 'Probabilidad de lluvia elevada',
      detail: 'Monitorea drenaje y ajusta actividades de campo.',
      severity: 'high'
    }
  }

  if (tipo === 'VIENTO') {
    return {
      type: 'Viento fuerte',
      icon: 'air',
      message: 'Velocidad de viento superior al umbral',
      detail: 'Protege estructuras y cultivos sensibles.',
      severity: 'high'
    }
  }

  if (tipo === 'TEMPERATURA_ALTA') {
    return {
      type: 'Temperatura alta',
      icon: 'device_thermostat',
      message: 'Temperatura por encima de rango ideal',
      detail: 'Aumenta monitoreo hídrico del cultivo.',
      severity: 'critical'
    }
  }

  return {
    type: 'Temperatura baja',
    icon: 'ac_unit',
    message: 'Temperatura por debajo de rango ideal',
    detail: 'Evalúa protección contra frío en cultivos sensibles.',
    severity: 'medium'
  }
}

const severityConfig: Record<AlertSeverity, { bg: string; text: string; badge: 'danger' | 'warning' | 'neutral'; label: string }> = {
  critical: { bg: 'bg-error-container', text: 'text-on-error-container', badge: 'danger', label: 'Crítica' },
  high: { bg: 'bg-secondary-container', text: 'text-on-secondary-container', badge: 'warning', label: 'Alta' },
  medium: { bg: 'bg-surface-container-low', text: 'text-on-surface', badge: 'neutral', label: 'Media' },
  low: { bg: 'bg-surface-container-low', text: 'text-on-surface', badge: 'neutral', label: 'Baja' },
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [alertasResponse, cultivosResponse] = await Promise.all([
        apiClient.alertas.list(),
        apiClient.cultivos.list(),
      ])

      const cropById = new Map<number, CultivoDto>()
      cultivosResponse.forEach((crop) => {
        cropById.set(crop.id, crop)
      })

      const mapped: AlertItem[] = alertasResponse.map((alerta) => {
        const meta = mapAlertType(alerta.tipo)
        const crop = cropById.get(alerta.cultivoId)

        return {
          id: alerta.id,
          type: meta.type,
          icon: meta.icon,
          message: meta.message,
          detail: `${meta.detail} Valor detectado: ${alerta.valorDetectado}`,
          severity: meta.severity,
          parcel: `Cultivo #${alerta.cultivoId}`,
          crop: crop?.tipoCultivo ?? `Cultivo #${alerta.cultivoId}`,
          timestamp: alerta.fecha,
          read: alerta.leida,
        }
      })

      setAlerts(mapped)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar las alertas.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleDelete = async (id: number) => {
    try {
      await apiClient.alertas.delete(id)
      setAlerts((current) => current.filter((item) => item.id !== id))
    } catch {
      setError('No fue posible eliminar la alerta.')
    }
  }

  const unreadCount = alerts.filter((a) => !a.read).length
  const criticalCount = alerts.filter((a) => a.severity === 'critical').length

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Alertas del Sistema</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Monitoreo de condiciones críticas que pueden afectar tus cultivos y parcelas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="danger">{unreadCount} sin leer</Badge>
          {criticalCount > 0 && <Badge variant="danger">{criticalCount} crítica{criticalCount > 1 ? 's' : ''}</Badge>}
        </div>
      </header>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="bg-error-container p-4 text-center">
          <span className="material-symbols-outlined text-on-error-container">crisis_alert</span>
          <p className="font-headline mt-2 text-2xl font-bold text-on-error-container">{criticalCount}</p>
          <p className="text-label-md text-on-error-container">Críticas</p>
        </Card>
        <Card className="bg-secondary-container p-4 text-center">
          <span className="material-symbols-outlined text-on-secondary-container">warning</span>
          <p className="font-headline mt-2 text-2xl font-bold text-on-secondary-container">{alerts.filter(a => a.severity === 'high').length}</p>
          <p className="text-label-md text-on-secondary-container">Altas</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="material-symbols-outlined text-primary">info</span>
          <p className="font-headline mt-2 text-2xl font-bold text-on-surface">{alerts.filter(a => a.severity === 'medium').length}</p>
          <p className="text-label-md text-on-surface-variant">Medias</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="material-symbols-outlined text-primary">check_circle</span>
          <p className="font-headline mt-2 text-2xl font-bold text-on-surface">{alerts.filter(a => a.severity === 'low').length}</p>
          <p className="text-label-md text-on-surface-variant">Bajas</p>
        </Card>
      </div>

      <Card>
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <label className="flex-1 space-y-1">
            <span className="text-label-md text-on-surface-variant">Tipo</span>
            <select className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary">
              <option>Todas las alertas</option>
              <option>Estrés Hídrico</option>
              <option>Lluvia</option>
              <option>Viento</option>
              <option>Temperatura</option>
              <option>Plagas</option>
            </select>
          </label>
          <label className="flex-1 space-y-1">
            <span className="text-label-md text-on-surface-variant">Parcela</span>
            <select className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary">
              <option>Todas las parcelas</option>
              <option>Finca El Paraíso</option>
              <option>Lote Las Brisas</option>
              <option>Hacienda Real</option>
            </select>
          </label>
          <label className="flex-1 space-y-1">
            <span className="text-label-md text-on-surface-variant">Severidad</span>
            <select className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary">
              <option>Todas</option>
              <option>Crítica</option>
              <option>Alta</option>
              <option>Media</option>
              <option>Baja</option>
            </select>
          </label>
        </div>
      </Card>

      <div className="space-y-3">
        {error ? (
          <Card>
            <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
          </Card>
        ) : null}

        {isLoading ? (
          <Card><p className="text-on-surface-variant">Cargando alertas...</p></Card>
        ) : null}

        {!isLoading && alerts.length === 0 ? (
          <Card><p className="text-on-surface-variant">No hay alertas registradas.</p></Card>
        ) : null}

        {alerts.map((alert) => {
          const config = severityConfig[alert.severity]
          return (
            <Card className={`p-0 overflow-hidden ${!alert.read ? 'ring-2 ring-primary/20' : ''}`} key={alert.id}>
              <div className="flex">
                <div className={`w-1.5 ${alert.severity === 'critical' ? 'bg-error' : alert.severity === 'high' ? 'bg-secondary' : 'bg-outline-variant'}`} />
                <div className="flex-1 p-4 md:p-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${config.bg}`}>
                        <span className={`material-symbols-outlined ${config.text}`}>{alert.icon}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-on-surface">{alert.type}</p>
                          <Badge variant={config.badge}>{config.label}</Badge>
                          {!alert.read && <Badge variant="danger">Nueva</Badge>}
                        </div>
                        <p className="mt-1 font-medium text-on-surface">{alert.message}</p>
                        <p className="mt-1 text-sm text-on-surface-variant">{alert.detail}</p>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-on-surface-variant md:text-sm">
                      <p>{new Date(alert.timestamp).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })}</p>
                      <p className="mt-0.5">{new Date(alert.timestamp).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
                      <div className="mt-1 flex flex-wrap gap-1 justify-end">
                        <span className="inline-flex items-center gap-0.5 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined" style={{fontSize: '12px'}}>location_on</span>
                          {alert.parcel}
                        </span>
                        <button
                          className="ml-2 inline-flex h-7 items-center rounded-lg bg-error-container px-2 text-xs font-semibold text-on-error-container"
                          onClick={() => {
                            void handleDelete(alert.id)
                          }}
                          type="button"
                        >
                          Eliminar
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </section>
  )
}
