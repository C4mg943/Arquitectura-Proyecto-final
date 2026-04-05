import { Card } from '../../../shared/components/common'

const currentWeather = {
  temp: 24,
  feelsLike: 26,
  humidity: 45,
  wind: 12,
  pressure: 1013,
  uvIndex: 6,
  rainfall: 0,
  condition: 'Mayormente soleado',
  icon: 'partly_cloudy_day',
}

const forecast = [
  { day: 'Lunes', icon: 'sunny', tempMax: 28, tempMin: 18, rain: 5, wind: 8 },
  { day: 'Martes', icon: 'partly_cloudy_day', tempMax: 26, tempMin: 17, rain: 15, wind: 10 },
  { day: 'Miércoles', icon: 'rainy', tempMax: 22, tempMin: 16, rain: 75, wind: 18 },
  { day: 'Jueves', icon: 'thunderstorm', tempMax: 20, tempMin: 15, rain: 90, wind: 25 },
  { day: 'Viernes', icon: 'partly_cloudy_day', tempMax: 25, tempMin: 16, rain: 20, wind: 12 },
]

const parcels = [
  { id: 1, name: 'Finca El Paraíso' },
  { id: 2, name: 'Lote Las Brisas' },
  { id: 3, name: 'Hacienda Real' },
]

function WeatherMetric({ icon, label, value, unit }: { icon: string; label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-surface-container-low p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed">
        <span className="material-symbols-outlined text-primary" style={{fontSize: '20px'}}>{icon}</span>
      </div>
      <div>
        <p className="text-label-md text-on-surface-variant">{label}</p>
        <p className="font-headline text-lg font-bold text-on-surface">{value}{unit && <span className="text-sm font-normal text-on-surface-variant"> {unit}</span>}</p>
      </div>
    </div>
  )
}

export default function WeatherPage() {
  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between md:gap-8">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Clima y Pronóstico</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Consulta las condiciones meteorológicas actuales y el pronóstico para tus parcelas.
          </p>
        </div>
        <label className="space-y-2.5 md:min-w-[18rem]">
          <span className="text-label-md text-on-surface-variant">Parcela</span>
          <select className="w-full rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3 text-sm font-semibold text-on-surface shadow-sm outline-none focus:ring-2 focus:ring-primary">
            {parcels.map((p) => <option key={p.id}>{p.name}</option>)}
          </select>
        </label>
      </header>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        {/* Current weather hero */}
        <Card className="md:col-span-5 bg-[linear-gradient(145deg,var(--color-tertiary-container),var(--color-tertiary))] p-8 text-on-tertiary">
          <p className="text-label-md uppercase tracking-wider opacity-80">Clima Actual</p>
          <div className="mt-4 flex items-center gap-5">
            <span className="material-symbols-outlined" style={{fontSize: '72px'}}>{currentWeather.icon}</span>
            <div>
              <h2 className="font-headline text-6xl font-bold">{currentWeather.temp}°C</h2>
              <p className="mt-1 text-sm opacity-90">{currentWeather.condition}</p>
              <p className="text-xs opacity-70">Sensación térmica: {currentWeather.feelsLike}°C</p>
            </div>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">Humedad</p>
              <p className="font-headline text-lg font-bold">{currentWeather.humidity}%</p>
            </div>
            <div className="rounded-xl bg-white/10 p-3">
              <p className="text-xs opacity-80">Viento</p>
              <p className="font-headline text-lg font-bold">{currentWeather.wind} km/h</p>
            </div>
          </div>
        </Card>

        {/* Weather metrics */}
        <div className="md:col-span-7 grid grid-cols-2 gap-3 md:grid-cols-3 content-start">
          <WeatherMetric icon="thermostat" label="Temperatura" value={`${currentWeather.temp}°C`} />
          <WeatherMetric icon="humidity_percentage" label="Humedad" value={currentWeather.humidity} unit="%" />
          <WeatherMetric icon="air" label="Viento" value={currentWeather.wind} unit="km/h" />
          <WeatherMetric icon="water_drop" label="Lluvia" value={currentWeather.rainfall} unit="mm" />
          <WeatherMetric icon="compress" label="Presión" value={currentWeather.pressure} unit="hPa" />
          <WeatherMetric icon="wb_sunny" label="Índice UV" value={currentWeather.uvIndex} />
        </div>
      </div>

      {/* 5-day forecast */}
      <Card title="Pronóstico de 5 Días" subtitle="Previsión meteorológica para planificar actividades">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          {forecast.map((day) => (
            <div key={day.day} className="surface-panel flex flex-col items-center rounded-2xl p-4 text-center transition-colors hover:bg-surface-container-high">
              <p className="text-sm font-bold text-on-surface">{day.day}</p>
              <span className="material-symbols-outlined my-3 text-primary" style={{fontSize: '40px'}}>{day.icon}</span>
              <p className="font-headline text-xl font-bold text-on-surface">{day.tempMax}°</p>
              <p className="text-sm text-on-surface-variant">{day.tempMin}°</p>
              <div className="mt-3 w-full space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined" style={{fontSize: '14px'}}>water_drop</span>
                    Lluvia
                  </span>
                  <span className={`font-semibold ${day.rain > 60 ? 'text-error' : 'text-on-surface'}`}>{day.rain}%</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1 text-on-surface-variant">
                    <span className="material-symbols-outlined" style={{fontSize: '14px'}}>air</span>
                    Viento
                  </span>
                  <span className="font-semibold text-on-surface">{day.wind} km/h</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Agricultural advice */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="bg-error-container">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-on-error-container" style={{fontSize: '28px'}}>storm</span>
            <div>
              <h3 className="font-semibold text-on-error-container">Alerta Meteorológica</h3>
              <p className="mt-1 text-sm text-on-error-container">
                Se esperan lluvias intensas el miércoles y jueves. Se recomienda posponer actividades de fumigación y fertilización.
              </p>
            </div>
          </div>
        </Card>
        <Card className="bg-primary-fixed">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-on-primary-fixed" style={{fontSize: '28px'}}>tips_and_updates</span>
            <div>
              <h3 className="font-semibold text-on-primary-fixed">Recomendación</h3>
              <p className="mt-1 text-sm text-on-primary-fixed">
                Condiciones favorables para riego hoy y mañana. Aproveche las bajas temperaturas del miércoles para aplicar fertilizante foliar.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </section>
  )
}
