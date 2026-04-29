import { useCallback, useEffect, useState } from 'react'
import { Card, Badge } from '../../../shared/components/common'
import { apiClient, type AlertaDto } from '../../../shared/services/apiClient'

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<AlertaDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadAlerts = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await apiClient.alertas.list()
      setAlerts(data)
    } catch {
      setError('Error al cargar alertas')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { void loadAlerts() }, [loadAlerts])

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Historial de Alertas</h1>
      </header>
      
      {error && <p className="text-error">{error}</p>}
      
      <div className="space-y-3">
        {isLoading ? <p>Cargando...</p> : alerts.length === 0 ? <p>No hay alertas.</p> : alerts.map(a => (
          <Card key={a.id} className="flex items-start gap-4 p-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-error-container text-error">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-on-surface">{a.tipo}</h3>
                <Badge variant={a.leida ? 'neutral' : 'danger'}>{a.leida ? 'Leída' : 'Nueva'}</Badge>
              </div>
              <p className="mt-1 text-sm text-on-surface-variant">Valor detectado: {a.valorDetectado}</p>
              <p className="mt-1 text-xs text-on-surface-variant">
                {new Date(a.fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
