import { useEffect, useMemo, useState } from 'react'

import { Link } from 'react-router-dom'

import { Badge, Button, Card } from '../../../shared/components/common'
import { apiClient, type CultivoDto, type ParcelaDto } from '../../../shared/services/apiClient'

function mapStatusLabel(estado: CultivoDto['estado']): string {
  if (estado === 'EN_CRECIMIENTO') return 'Crecimiento'
  if (estado === 'COSECHADO') return 'Cosechado'
  return 'Afectado'
}

interface WeatherData {
  temperatura: number
  humedad: number
  viento: number
  condicion: string
  icon: string
}

export default function DashboardPage() {
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [alertas, setAlertas] = useState<{ id: number; tipo: string; valorDetectado: number; fecha: string }[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadWeather = async () => {
    try {
      const parcelasResponse = await apiClient.parcelas.list()
      if (parcelasResponse.length === 0) return

      const parcela = parcelasResponse[0]
      const lat = Number(parcela.latitud)
      const lon = Number(parcela.longitud)

      const res = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`
      )
      const data = await res.json()

      const temp = Math.round(data.current.temperature_2m)
      const wind = Math.round(data.current.wind_speed_10m)

      let condicion = 'Parcialmente nublado'
      let icon = 'partly_cloudy_day'
      if (temp > 30) {
        condicion = 'Caluroso'
        icon = 'wb_sunny'
      } else if (temp < 20) {
        condicion = 'Fresco'
        icon = 'cool_mode'
      }

      setWeather({ temperatura: temp, humedad: data.current.relative_humidity_2m, viento: wind, condicion, icon })
    } catch {
      setWeather(null)
    }
  }

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
        await loadWeather()
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
    { icon: 'grid_view', value: String(parcelas.length), label: 'Parcelas' },
    { icon: 'area_chart', value: `${totalHectareas.toFixed(1)}`, label: 'Hectáreas' },
    { icon: 'potted_plant', value: String(cultivos.length), label: 'Cultivos' },
    { icon: 'category', value: String(tiposCultivo), label: 'Tipos' },
  ]

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Inicio</h1>
        <p className="mt-1 text-on-surface-variant">
          Estado: <strong className="text-primary">{error ? 'Con novedades' : 'Óptimo'}</strong>
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Link className="w-full" to="/actividades">
          <Button className="w-full h-14 text-base" leadingIcon="add_task" variant="primary">
            Registrar Actividad
          </Button>
        </Link>
        <Link className="w-full" to="/cultivos">
          <Button className="w-full h-14 text-base" leadingIcon="grass" variant="secondary">
            Añadir Cultivo
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="md:col-span-4 bg-primary-container text-on-primary-container">
          <p className="text-label-md opacity-80">CLIMA</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="material-symbols-outlined text-5xl">
              {weather?.icon ?? 'partly_cloudy_day'}
            </span>
            <div>
              <h2 className="font-headline text-4xl font-bold">
                {weather?.temperatura ?? '--'}°C
              </h2>
              <p className="text-sm opacity-90">{weather?.condicion ?? 'Cargando...'}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <p className="text-sm">Humedad: {weather?.humedad ?? '--'}%</p>
            <p className="text-sm">Viento: {weather?.viento ?? '--'} km/h</p>
          </div>
        </Card>

        <Card className="md:col-span-8" title="Resumen">
          {error ? (
            <p className="mb-3 rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div className="surface-panel rounded-2xl p-4 text-center" key={card.label}>
                <span className="material-symbols-outlined text-primary">{card.icon}</span>
                <p className="font-headline mt-1 text-2xl font-bold text-on-surface">
                  {isLoading ? '...' : card.value}
                </p>
                <p className="text-xs text-on-surface-variant">{card.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-6" title="Cultivos Activos">
          <div className="space-y-3">
            {cultivosActivos.length === 0 && !isLoading ? (
              <p className="text-sm text-on-surface-variant">Sin cultivos activos.</p>
            ) : null}
            {cultivosActivos.map((crop) => (
              <article className="surface-panel rounded-2xl p-4" key={crop.id}>
                <p className="font-semibold text-on-surface">{crop.tipoCultivo}</p>
                <p className="text-xs text-on-surface-variant">
                  Siembra: {new Date(crop.fechaSiembra).toLocaleDateString('es-CO')}
                </p>
                <p className="text-xs font-bold text-primary">{mapStatusLabel(crop.estado)}</p>
              </article>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-6" title="Alertas">
          <div className="space-y-3">
            {alertas.slice(0, 2).map((alerta) => (
              <article className="rounded-2xl bg-error-container p-4" key={alerta.id}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-on-error-container">{alerta.tipo}</p>
                  <Badge variant="danger">Nueva</Badge>
                </div>
                <p className="text-sm text-on-error-container">
                  {alerta.valorDetectado} · {new Date(alerta.fecha).toLocaleString('es-CO')}
                </p>
              </article>
            ))}
            {alertas.length === 0 && !isLoading && (
              <p className="text-sm text-on-surface-variant">Sin alertas activas.</p>
            )}
          </div>
        </Card>
      </div>
    </section>
  )
}