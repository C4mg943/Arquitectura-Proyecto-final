import { useEffect, useMemo, useState } from 'react'

import { Badge, Button, Card } from '../../../shared/components/common'
import { apiClient, type CultivoDto, type ParcelaDto } from '../../../shared/services/apiClient'
import { useAuthStore } from '../../../store/authStore'

function mapStatusLabel(estado: CultivoDto['estado']): string {
  if (estado === 'EN_CRECIMIENTO') {
    return 'Crecimiento'
  }

  if (estado === 'COSECHADO') {
    return 'Cosechado'
  }

  return 'Afectado'
}

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user)
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [alertas, setAlertas] = useState<{ id: number; tipo: string; valorDetectado: number; fecha: string }[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [parcelasResponse, cultivosResponse, alertasResponse] = await Promise.all([
          apiClient.parcelas.list(),
          apiClient.cultivos.list(),
          apiClient.alertas.list().catch(() => []),
        ])

        setParcelas(parcelasResponse)
        setCultivos(cultivosResponse)
        setAlertas(alertasResponse)
      } catch {
        setError('No fue posible cargar el resumen del panel.')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  const totalHectareas = useMemo(
    () => parcelas.reduce((sum, parcela) => sum + Number(parcela.hectareas), 0),
    [parcelas],
  )

  const tiposCultivo = useMemo(() => {
    const unique = new Set(cultivos.map((item) => item.tipoCultivo.toLowerCase()))
    return unique.size
  }, [cultivos])

  const cultivosActivos = useMemo(
    () => cultivos.filter((item) => item.estado === 'EN_CRECIMIENTO').slice(0, 3),
    [cultivos],
  )

  const summaryCards = [
    { icon: 'grid_view', value: String(parcelas.length), label: 'Parcelas Totales' },
    { icon: 'area_chart', value: `${totalHectareas.toFixed(1)}`, label: 'Hectáreas' },
    { icon: 'potted_plant', value: String(cultivos.length), label: 'Cultivos' },
    { icon: 'category', value: String(tiposCultivo), label: 'Tipos de Cultivo' },
  ]

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Bienvenido, {user?.nombre ?? 'Productor'}</h1>
          <p className="mt-1 text-on-surface-variant">
            Estado general de la explotación: <strong className="text-primary">{error ? 'Con novedades' : 'Óptimo'}</strong>
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button leadingIcon="add_task" variant="primary">
            Registrar Actividad
          </Button>
          <Button leadingIcon="nature_people" variant="secondary">
            Añadir Cultivo
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="md:col-span-4 bg-[linear-gradient(145deg,var(--color-tertiary-container),var(--color-tertiary))] text-on-tertiary">
          <p className="text-label-md opacity-80">CLIMA ACTUAL</p>
          <div className="mt-4 flex items-center gap-4">
            <span className="material-symbols-outlined text-6xl">partly_cloudy_day</span>
            <div>
              <h2 className="font-headline text-5xl font-bold">24°C</h2>
              <p className="text-sm opacity-90">Mayormente soleado</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4">
            <p className="text-sm">Humedad: 45%</p>
            <p className="text-sm">Viento: 12 km/h</p>
          </div>
        </Card>

        <Card className="md:col-span-8" subtitle="Resumen de estado productivo" title="Resumen de Parcelas">
          {error ? (
            <p className="mb-4 rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div className="surface-panel rounded-2xl p-4 text-center" key={card.label}>
                <span className="material-symbols-outlined text-primary">{card.icon}</span>
                <p className="font-headline mt-2 text-2xl font-bold text-on-surface">
                  {isLoading ? '...' : card.value}
                </p>
                <p className="mt-1 text-xs text-on-surface-variant">{card.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-6" title="Cultivos Activos">
          <div className="space-y-3">
            {cultivosActivos.length === 0 && !isLoading ? (
              <article className="surface-panel rounded-2xl p-4">
                <p className="text-sm text-on-surface-variant">No hay cultivos activos en este momento.</p>
              </article>
            ) : null}
            {cultivosActivos.map((crop) => (
              <article className="surface-panel rounded-2xl p-4" key={crop.id}>
                <p className="font-semibold text-on-surface">{crop.tipoCultivo}</p>
                <p className="mt-1 text-xs text-on-surface-variant">
                  Siembra: {new Date(crop.fechaSiembra).toLocaleDateString('es-CO')}
                </p>
                <p className="mt-2 text-xs font-bold text-primary">{mapStatusLabel(crop.estado)}</p>
              </article>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-6" title="Alertas y Notificaciones">
          <div className="space-y-3">
            {alertas.slice(0, 2).map((alerta) => (
              <article className="rounded-2xl bg-error-container p-4" key={alerta.id}>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <p className="font-semibold text-on-error-container">{alerta.tipo}</p>
                  <Badge variant="danger">Nueva</Badge>
                </div>
                <p className="text-sm text-on-error-container">
                  Valor detectado: {alerta.valorDetectado} · {new Date(alerta.fecha).toLocaleString('es-CO')}
                </p>
              </article>
            ))}
            <article className="surface-panel rounded-2xl p-4">
              <p className="font-semibold text-on-surface">Reporte semanal disponible</p>
              <p className="mt-1 text-sm text-on-surface-variant">Semana 22 lista para descarga.</p>
            </article>
          </div>
        </Card>
      </div>
    </section>
  )
}
