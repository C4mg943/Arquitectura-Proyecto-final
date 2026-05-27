import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'

interface DemoWeather {
  temperatura: number
  humedad: number
  probabilidadLluvia: number
  velocidadViento: number
}

// Santa Marta, Magdalena (capital del Magdalena - referencia para la demo)
const DEMO_LOCATION = { name: 'Santa Marta', region: 'Magdalena', lat: 11.2404, lon: -74.1990 }

const features = [
  {
    icon: '🌱',
    title: 'Gestión de Cultivos',
    description:
      'Registra siembras, controla el estado de cada cultivo y consulta su historial completo de actividades.',
  },
  {
    icon: '📴',
    title: 'Modo Offline Real',
    description:
      'Trabaja sin conexión en zonas rurales. Tus registros se sincronizan solos cuando vuelve la señal.',
  },
  {
    icon: '⛈️',
    title: 'Alertas Climáticas',
    description:
      'El sistema vigila temperatura, lluvia y viento por parcela, y te avisa antes de que sea tarde.',
  },
  {
    icon: '🗺️',
    title: 'Validación Geográfica',
    description:
      'Cada parcela se valida automáticamente con su municipio para evitar errores de captura.',
  },
  {
    icon: '👥',
    title: 'Roles y Equipos',
    description:
      'Productores, operarios, técnicos y administradores trabajan en una sola plataforma con permisos claros.',
  },
  {
    icon: '📄',
    title: 'Reportes en PDF / CSV',
    description:
      'Exporta el historial de actividades, riegos y fertilizaciones de cualquier cultivo en segundos.',
  },
]

const stats = [
  { value: '70', label: 'Requisitos funcionales' },
  { value: '10', label: 'Microservicios' },
  { value: '4', label: 'Roles diferenciados' },
  { value: '36', label: 'Municipios validados' },
]

const producers = [
  { name: 'Carlos Mendoza', location: 'Ibagué, Tolima', crops: 'Maíz · Arroz', image: '👨‍🌾' },
  { name: 'María López', location: 'Fusagasugá, Cundinamarca', crops: 'Tomate · Frijol', image: '👩‍🌾' },
  { name: 'Pedro García', location: 'Montería, Córdoba', crops: 'Café · Cacao', image: '👨‍🌾' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()
  const [weather, setWeather] = useState<DemoWeather | null>(null)
  const [weatherError, setWeatherError] = useState(false)

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (isAuthenticated) return
    // Fetch directo a Open-Meteo (público, no requiere auth) para mostrar clima real en la landing
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${DEMO_LOCATION.lat}&longitude=${DEMO_LOCATION.lon}&current=temperature_2m,relative_humidity_2m,precipitation_probability,wind_speed_10m&timezone=America%2FBogota`
    fetch(url)
      .then(r => {
        if (!r.ok) throw new Error('weather error')
        return r.json()
      })
      .then(data => {
        const c = data.current
        setWeather({
          temperatura: c.temperature_2m,
          humedad: c.relative_humidity_2m,
          probabilidadLluvia: c.precipitation_probability ?? 0,
          velocidadViento: c.wind_speed_10m,
        })
      })
      .catch(() => setWeatherError(true))
  }, [isAuthenticated])

  if (isAuthenticated) {
    return null
  }

  return (
    <div className="min-h-screen bg-surface">
      {/* ===================== NAV ===================== */}
      <nav className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/70 text-on-primary text-xl font-bold shadow-md shadow-primary/20">
              P
            </div>
            <span className="text-xl font-bold text-on-surface">PDIA</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary">
              Características
            </a>
            <a href="#producers" className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary">
              Productores
            </a>
            <a href="#about" className="text-sm font-medium text-on-surface-variant transition-colors hover:text-primary">
              Sobre el proyecto
            </a>
          </div>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Iniciar sesión
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/30"
            >
              Regístrate
            </Link>
          </div>
        </div>
      </nav>

      {/* ===================== HERO ===================== */}
      <section className="relative overflow-hidden px-6 py-20 md:py-28">
        {/* Decoración de fondo */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute top-1/2 -right-32 h-96 w-96 rounded-full bg-secondary/15 blur-3xl" />
          <div
            className="absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)',
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-7">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Plataforma activa · 10 microservicios funcionando
              </div>

              <h1 className="text-4xl font-bold leading-tight text-on-surface md:text-5xl lg:text-6xl">
                Agricultura inteligente para{' '}
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  pequeños productores
                </span>
              </h1>

              <p className="max-w-xl text-lg text-on-surface-variant md:text-xl">
                Gestiona tus fincas, monitorea tus cultivos y recibe alertas climáticas
                en tiempo real. Diseñada para funcionar incluso sin internet.
              </p>

              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="rounded-full bg-primary px-8 py-3.5 text-base font-semibold text-on-primary shadow-lg shadow-primary/30 transition-all hover:scale-105 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40"
                >
                  Empezar gratis →
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-outline-variant bg-surface px-8 py-3.5 text-base font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  Ver demo
                </Link>
              </div>

              {/* Mini badges */}
              <div className="flex flex-wrap gap-x-6 gap-y-2 pt-4 text-sm text-on-surface-variant">
                <span className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Funciona offline
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-primary">✓</span> PWA instalable
                </span>
                <span className="flex items-center gap-2">
                  <span className="text-primary">✓</span> Sin costo
                </span>
              </div>
            </div>

            {/* Tarjeta de clima */}
            <div className="relative">
              <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-br from-primary/20 via-secondary/10 to-transparent blur-2xl" />
              <div className="relative overflow-hidden rounded-3xl border border-outline-variant/40 bg-surface-container-high p-7 shadow-2xl shadow-primary/10">
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-primary/10 blur-2xl" />
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-wider text-on-surface-variant">
                      Datos en vivo
                    </div>
                    <div className="text-base font-semibold text-on-surface">
                      📍 {DEMO_LOCATION.name}, {DEMO_LOCATION.region}
                    </div>
                  </div>
                  <span className="text-3xl">🌤️</span>
                </div>

                {weatherError ? (
                  <div className="py-10 text-center">
                    <p className="mb-2 text-5xl">☁️</p>
                    <p className="text-sm text-on-surface-variant">
                      No se pudo cargar el clima en este momento
                    </p>
                  </div>
                ) : weather ? (
                  <>
                    <div className="mb-1 flex items-baseline gap-2">
                      <div className="text-6xl font-bold text-on-surface">
                        {Math.round(weather.temperatura)}°
                      </div>
                      <div className="text-lg text-on-surface-variant">C</div>
                    </div>
                    <div className="mb-5 text-sm text-on-surface-variant">
                      Costa Caribe colombiana
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center text-sm">
                      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
                        <div className="text-xl">💧</div>
                        <div className="font-semibold text-on-surface">{weather.humedad}%</div>
                        <div className="text-xs text-on-surface-variant">Humedad</div>
                      </div>
                      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
                        <div className="text-xl">🌧️</div>
                        <div className="font-semibold text-on-surface">{weather.probabilidadLluvia}%</div>
                        <div className="text-xs text-on-surface-variant">Lluvia</div>
                      </div>
                      <div className="rounded-2xl border border-outline-variant/30 bg-surface-container-low p-3">
                        <div className="text-xl">💨</div>
                        <div className="font-semibold text-on-surface">{Math.round(weather.velocidadViento)}</div>
                        <div className="text-xs text-on-surface-variant">km/h viento</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="space-y-4 py-4">
                    <div className="h-12 w-32 animate-pulse rounded-lg bg-surface-container-low" />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="h-20 animate-pulse rounded-2xl bg-surface-container-low" />
                      <div className="h-20 animate-pulse rounded-2xl bg-surface-container-low" />
                      <div className="h-20 animate-pulse rounded-2xl bg-surface-container-low" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Banda de stats */}
          <div className="mt-20 grid grid-cols-2 gap-6 rounded-3xl border border-outline-variant/30 bg-surface-container-low/60 p-8 backdrop-blur-sm md:grid-cols-4">
            {stats.map(stat => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold text-primary md:text-4xl">{stat.value}</div>
                <div className="mt-1 text-xs uppercase tracking-wider text-on-surface-variant md:text-sm">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== FEATURES ===================== */}
      <section id="features" className="px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Características
            </span>
            <h2 className="mt-2 text-3xl font-bold text-on-surface md:text-4xl">
              Todo lo que un productor necesita
            </h2>
            <p className="mt-4 text-lg text-on-surface-variant">
              Herramientas pensadas para el campo colombiano: simples, robustas y siempre disponibles.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, i) => (
              <div
                key={i}
                className="group relative overflow-hidden rounded-3xl border border-outline-variant/30 bg-surface-container-low p-7 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity group-hover:bg-primary/15" />
                <div className="relative">
                  <div className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-3xl transition-transform group-hover:scale-110">
                    {feature.icon}
                  </div>
                  <h3 className="mb-2 text-xl font-bold text-on-surface">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-on-surface-variant">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== PRODUCTORES ===================== */}
      <section id="producers" className="bg-surface-container-low/50 px-6 py-24">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">
              Comunidad
            </span>
            <h2 className="mt-2 text-3xl font-bold text-on-surface md:text-4xl">
              Hecho para productores como tú
            </h2>
            <p className="mt-4 text-lg text-on-surface-variant">
              Casos de uso reales de quienes ya transforman sus fincas con tecnología accesible.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {producers.map((producer, i) => (
              <div
                key={i}
                className="group rounded-3xl border border-outline-variant/30 bg-surface p-7 text-center shadow-sm transition-all hover:shadow-xl hover:shadow-primary/10"
              >
                <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-secondary/15 text-5xl transition-transform group-hover:scale-110">
                  {producer.image}
                </div>
                <h3 className="text-lg font-bold text-on-surface">{producer.name}</h3>
                <p className="mt-1 text-sm text-on-surface-variant">{producer.location}</p>
                <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
                  🌾 {producer.crops}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SOBRE EL PROYECTO ===================== */}
      <section id="about" className="px-6 py-24">
        <div className="mx-auto max-w-5xl">
          <div className="overflow-hidden rounded-3xl border border-outline-variant/30 bg-gradient-to-br from-primary/5 via-surface to-secondary/5 p-10 md:p-14">
            <div className="grid gap-10 md:grid-cols-2 md:items-center">
              <div>
                <span className="text-sm font-semibold uppercase tracking-wider text-primary">
                  Sobre PDIA
                </span>
                <h2 className="mt-2 text-3xl font-bold text-on-surface md:text-4xl">
                  Un proyecto académico con impacto real
                </h2>
                <p className="mt-5 text-base text-on-surface-variant">
                  PDIA es una plataforma desarrollada como proyecto final de Arquitectura de Software
                  para apoyar a pequeños productores agrícolas colombianos. Construida con
                  microservicios, eventos asíncronos y arquitectura offline-first, demuestra cómo
                  la ingeniería de software puede atender contextos rurales reales.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Frontend', value: 'React 18 · Vite · Tailwind · PWA' },
                  { label: 'Backend', value: 'Node.js · TypeScript · Express' },
                  { label: 'Datos', value: 'PostgreSQL · MongoDB' },
                  { label: 'Mensajería', value: 'RabbitMQ · Eventos AMQP' },
                  { label: 'Infraestructura', value: 'Docker · Docker Compose' },
                ].map(item => (
                  <div
                    key={item.label}
                    className="flex items-start gap-4 rounded-2xl border border-outline-variant/30 bg-surface p-4"
                  >
                    <div className="text-xs font-bold uppercase tracking-wider text-primary md:w-32">
                      {item.label}
                    </div>
                    <div className="flex-1 text-sm text-on-surface">{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== CTA FINAL ===================== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-700 via-emerald-600 to-green-700 px-8 py-16 text-center shadow-2xl shadow-emerald-700/30">
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/15 blur-3xl" />
            <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
                backgroundSize: '24px 24px',
              }}
            />
            <div className="relative">
              <h2 className="text-3xl font-bold text-white drop-shadow-md md:text-4xl">
                ¿Listo para transformar tu agricultura?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-50">
                Crea tu cuenta gratis y empieza a registrar tus cultivos hoy mismo.
              </p>
              <div className="mt-8 flex justify-center">
                <Link
                  to="/register"
                  className="rounded-full bg-white px-10 py-4 text-base font-semibold text-emerald-700 shadow-xl transition-all hover:scale-105 hover:bg-emerald-50"
                >
                  Crear cuenta gratis →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t border-outline-variant/30 bg-surface-container-low/50 px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary text-sm font-bold">
                  P
                </div>
                <span className="text-lg font-bold text-on-surface">PDIA</span>
              </div>
              <p className="mt-4 max-w-sm text-sm text-on-surface-variant">
                Plataforma Digital de Agricultura Inteligente. Proyecto académico de
                Arquitectura de Software.
              </p>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-on-surface">
                Plataforma
              </h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>
                  <a href="#features" className="transition-colors hover:text-primary">
                    Características
                  </a>
                </li>
                <li>
                  <a href="#producers" className="transition-colors hover:text-primary">
                    Productores
                  </a>
                </li>
                <li>
                  <a href="#about" className="transition-colors hover:text-primary">
                    Sobre el proyecto
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-on-surface">
                Acceder
              </h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li>
                  <Link to="/login" className="transition-colors hover:text-primary">
                    Iniciar sesión
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="transition-colors hover:text-primary">
                    Crear cuenta
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center justify-between gap-3 border-t border-outline-variant/30 pt-8 text-sm text-on-surface-variant md:flex-row">
            <span>© 2026 PDIA. Proyecto académico.</span>
            <span className="flex items-center gap-2">
              Hecho con <span className="text-primary">🌱</span> para el campo colombiano
            </span>
          </div>
        </div>
      </footer>
    </div>
  )
}
