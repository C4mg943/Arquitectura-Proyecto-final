import { useCallback, useEffect, useState } from 'react'

import { Card } from '../../../shared/components/common'
import {
  apiClient,
  ApiClientError,
  type ParcelaDto,
  type WeatherCurrentDto,
  type WeatherForecastDayDto,
} from '../../../shared/services/apiClient'

interface AlertForToday {
  tipo: string
  mensaje: string
}

interface RecommendationForToday {
  tipo: string
  mensaje: string
}

function getWeatherIcon(probabilidadLluvia: number): string {
  if (probabilidadLluvia > 70) return 'rainy'
  if (probabilidadLluvia > 40) return 'partly_cloudy_day'
  return 'sunny'
}

function getDayName(fecha: string): string {
  const date = new Date(fecha + 'T00:00:00')
  return date.toLocaleDateString('es-CO', { weekday: 'short' })
}

function WeatherMetric({
  icon,
  label,
  value,
  unit,
}: {
  icon: string
  label: string
  value: string | number
  unit?: string
}) {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-5">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: '24px' }}>
          {icon}
        </span>
      </div>
      <div>
        <p className="text-label-md text-on-surface-variant">{label}</p>
        <p className="font-headline text-xl font-bold text-on-surface">
          {value}
          {unit && <span className="text-sm font-normal text-on-surface-variant"> {unit}</span>}
        </p>
      </div>
    </div>
  )
}

export default function WeatherPage() {
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [selectedParcelaId, setSelectedParcelaId] = useState<number | null>(null)
  const [currentWeather, setCurrentWeather] = useState<WeatherCurrentDto | null>(null)
  const [forecast, setForecast] = useState<WeatherForecastDayDto[]>([])
  const [alertasDelDia, setAlertasDelDia] = useState<AlertForToday[]>([])
  const [recomendacionesDelDia, setRecomendacionesDelDia] = useState<RecommendationForToday[]>([])
  const [isLoadingWeather, setIsLoadingWeather] = useState(false)
  const [isLoadingParcelas, setIsLoadingParcelas] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [weatherError, setWeatherError] = useState<string | null>(null)

  const loadParcelas = useCallback(async () => {
    setIsLoadingParcelas(true)
    try {
      const data = await apiClient.parcelas.list()
      setParcelas(data)
      if (data.length > 0 && selectedParcelaId === null) {
        setSelectedParcelaId(data[0].id)
      }
    } catch {
      setError('No fue posible cargar las parcelas.')
    } finally {
      setIsLoadingParcelas(false)
    }
  }, [selectedParcelaId])

  const loadWeather = useCallback(async () => {
    if (!selectedParcelaId) return

    setIsLoadingWeather(true)
    setWeatherError(null)
    setCurrentWeather(null)
    setForecast([])

    try {
      const [current, forecastData, alertasData, recomendacionesData] = await Promise.all([
        apiClient.weather.getCurrent(selectedParcelaId),
        apiClient.weather.getForecast(selectedParcelaId),
        apiClient.alertas.list().catch(() => []),
        apiClient.recomendaciones.list().catch(() => []),
      ])

      setCurrentWeather(current)
      setForecast(forecastData)

      const today = new Date().toISOString().split('T')[0]
      const alertasHoy = alertasData.filter((a) => a.fecha.startsWith(today))
      const recomendacionesHoy = recomendacionesData.filter((r) => r.fecha.startsWith(today))

      setAlertasDelDia(
        alertasHoy.map((a) => ({
          tipo: a.tipo,
          mensaje:
            a.tipo === 'LLUVIA'
              ? 'Se esperan lluvias intensas. Se recomienda posponer actividades de fumigación.'
              : a.tipo === 'VIENTO'
                ? 'Vientos fuertes detectados. Protege estructuras y cultivos sensibles.'
                : a.tipo === 'TEMPERATURA_ALTA'
                  ? 'Temperatura elevada. Aumenta el monitoreo hídrico del cultivo.'
                  : 'Temperatura baja detectada. Evalúa protección contra frío.',
        })),
      )

      setRecomendacionesDelDia(
        recomendacionesHoy.map((r) => ({
          tipo: r.tipo,
          mensaje: r.descripcion,
        })),
      )
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setWeatherError(unknownError.message)
      } else {
        setWeatherError('No fue posible cargar los datos climáticos.')
      }
    } finally {
      setIsLoadingWeather(false)
    }
  }, [selectedParcelaId])

  useEffect(() => {
    void loadParcelas()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (selectedParcelaId) {
      void loadWeather()
    }
  }, [selectedParcelaId, loadWeather])

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Clima y Pronóstico</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Consulta las condiciones meteorológicas actuales y el pronóstico para tus parcelas.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <label className="space-y-2.5 md:min-w-[18rem]">
            <span className="text-label-md text-on-surface-variant">Parcela</span>
            <select
              className="w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface shadow-sm outline-none focus:ring-2 focus:ring-primary"
              onChange={(event) => setSelectedParcelaId(Number(event.target.value))}
              value={selectedParcelaId ?? ''}
            >
              {isLoadingParcelas ? (
                <option value="">Cargando parcelas...</option>
              ) : parcelas.length === 0 ? (
                <option value="">Sin parcelas</option>
              ) : (
                parcelas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombre} ({p.municipio})
                  </option>
                ))
              )}
            </select>
          </label>
          <button
            className="mt-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary-fixed text-primary shadow-sm transition-colors hover:bg-primary-fixed/80"
            onClick={() => void loadWeather()}
            title="Actualizar clima"
            type="button"
          >
            <span className="material-symbols-outlined">refresh</span>
          </button>
        </div>
      </header>

      {error ? (
        <Card>
          <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">
            {error}
          </p>
        </Card>
      ) : null}

      {isLoadingWeather ? (
        <Card>
          <p className="text-center text-on-surface-variant">Cargando datos climáticos...</p>
        </Card>
      ) : weatherError ? (
        <Card>
          <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">
            {weatherError}
          </p>
        </Card>
      ) : !selectedParcelaId ? (
        <Card>
          <p className="text-center text-on-surface-variant">
            Selecciona una parcela para ver el clima.
          </p>
        </Card>
      ) : currentWeather ? (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          {/* Current weather hero */}
          <Card className="md:col-span-5 bg-[linear-gradient(145deg,var(--color-tertiary-container),var(--color-tertiary))] p-8 text-on-tertiary">
            <p className="text-label-md uppercase tracking-wider opacity-80">Clima Actual</p>
            <div className="mt-6 flex items-center gap-6">
              <span className="material-symbols-outlined" style={{ fontSize: '88px' }}>
                {getWeatherIcon(currentWeather.probabilidadLluvia)}
              </span>
              <div>
                <h2 className="font-headline text-7xl font-bold">
                  {currentWeather.temperatura.toFixed(1)}°C
                </h2>
                <p className="mt-2 text-base opacity-90">
                  Probabilidad de lluvia: {currentWeather.probabilidadLluvia}%
                </p>
                <p className="mt-1 text-sm opacity-70">
                  Actualizado: {new Date(currentWeather.timestamp).toLocaleTimeString('es-CO')}
                </p>
              </div>
            </div>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-sm opacity-80">Humedad</p>
                <p className="font-headline text-2xl font-bold">{currentWeather.humedad}%</p>
              </div>
              <div className="rounded-xl bg-white/10 p-4">
                <p className="text-sm opacity-80">Viento</p>
                <p className="font-headline text-2xl font-bold">
                  {currentWeather.velocidadViento} km/h
                </p>
              </div>
            </div>
          </Card>

          {/* Weather metrics */}
          <div className="md:col-span-7 grid grid-cols-2 gap-3 md:grid-cols-3 content-start">
            <WeatherMetric
              icon="thermostat"
              label="Temperatura"
              value={`${currentWeather.temperatura.toFixed(1)}°C`}
            />
            <WeatherMetric
              icon="humidity_percentage"
              label="Humedad"
              value={currentWeather.humedad}
              unit="%"
            />
            <WeatherMetric
              icon="air"
              label="Viento"
              value={currentWeather.velocidadViento}
              unit="km/h"
            />
            <WeatherMetric
              icon="water_drop"
              label="Prob. Lluvia"
              value={currentWeather.probabilidadLluvia}
              unit="%"
            />
            <WeatherMetric
              icon="compressed"
              label="Presión"
              value={1013}
              unit="hPa"
            />
            <WeatherMetric
              icon="wb_sunny"
              label="Índice UV"
              value={6}
            />
          </div>
        </div>
      ) : null}

      {/* 5-day forecast */}
      {forecast.length > 0 && (
        <Card title="Pronóstico de 5 Días" subtitle="Previsión meteorológica para planificar actividades">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            {forecast.map((day) => (
              <div
                key={day.fecha}
                className="surface-panel flex flex-col items-center rounded-2xl p-4 text-center transition-colors hover:bg-surface-container-high"
              >
                <p className="text-sm font-bold text-on-surface">{getDayName(day.fecha)}</p>
                <span
                  className="material-symbols-outlined my-3 text-primary"
                  style={{ fontSize: '40px' }}
                >
                  {getWeatherIcon(day.probabilidadLluvia)}
                </span>
                <p className="font-headline text-xl font-bold text-on-surface">{day.tempMax}°</p>
                <p className="text-sm text-on-surface-variant">{day.tempMin}°</p>
                <div className="mt-3 w-full space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        water_drop
                      </span>
                      Lluvia
                    </span>
                    <span
                      className={`font-semibold ${day.probabilidadLluvia > 60 ? 'text-error' : 'text-on-surface'}`}
                    >
                      {day.probabilidadLluvia}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-on-surface-variant">
                      <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>
                        air
                      </span>
                      Viento
                    </span>
                    <span className="font-semibold text-on-surface">-- km/h</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Agricultural advice */}
      {alertasDelDia.length > 0 || recomendacionesDelDia.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {alertasDelDia.slice(0, 1).map((alerta, index) => (
            <Card key={index} className="bg-error-container">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-error-container" style={{ fontSize: '28px' }}>
                  storm
                </span>
                <div>
                  <h3 className="font-semibold text-on-error-container">Alerta Meteorológica</h3>
                  <p className="mt-1 text-sm text-on-error-container">{alerta.mensaje}</p>
                </div>
              </div>
            </Card>
          ))}
          {recomendacionesDelDia.slice(0, 1).map((rec, index) => (
            <Card key={index} className="bg-primary-fixed">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-on-primary-fixed" style={{ fontSize: '28px' }}>
                  tips_and_updates
                </span>
                <div>
                  <h3 className="font-semibold text-on-primary-fixed">Recomendación</h3>
                  <p className="mt-1 text-sm text-on-primary-fixed">{rec.mensaje}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  )
}