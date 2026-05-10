import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../../store/authStore'
import { apiClient, type WeatherCurrentDto } from '../../../shared/services/apiClient'

const features = [
  {
    icon: '🛰️',
    title: 'Monitoreo Satelital',
    description: 'Observa tus cultivos desde el espacio con imágenes satelitales actualizadas.',
  },
  {
    icon: '📴',
    title: 'Modo Offline',
    description: 'Registra actividades sin conexión y sincroniza cuando tengas señal.',
  },
  {
    icon: '🔔',
    title: 'Alertas Inteligentes',
    description: 'Recibe notificaciones sobre condiciones climáticas y amenazas en tiempo real.',
  },
  {
    icon: '🗺️',
    title: 'Gestión Geo-espacial',
    description: 'Administra tus fincas y parcelas con herramientas de mapeo avanzado.',
  },
]

const producers = [
  { name: 'Carlos Mendoza', location: 'Tolima', crops: 'Maíz, Arroz', image: '👨‍🌾' },
  { name: 'María López', location: 'Cundinamarca', crops: 'Tomate, Frijol', image: '👩‍🌾' },
  { name: 'Pedro García', location: 'Córdoba', crops: 'Café, Cacao', image: '👨‍🌾' },
]

export default function LandingPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuthStore()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true })
    }
  }, [isAuthenticated, navigate])

  if (isAuthenticated) {
    return null
  }

  const [weather, setWeather] = useState<WeatherCurrentDto | null>(null)
  const [weatherError, setWeatherError] = useState(false)

  useEffect(() => {
    apiClient.weather
      .getCurrent(1)
      .then(setWeather)
      .catch(() => setWeatherError(true))
  }, [])

  return (
    <div className="min-h-screen bg-surface">
      <nav className="sticky top-0 z-50 border-b border-outline-variant/30 bg-surface/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-on-primary text-xl font-bold">
              P
            </div>
            <span className="text-xl font-bold text-on-surface">PDIA</span>
          </Link>
          <div className="hidden items-center gap-8 md:flex">
            <a href="#features" className="text-on-surface-variant hover:text-primary">Características</a>
            <a href="#producers" className="text-on-surface-variant hover:text-primary">Productores</a>
            <a href="#contact" className="text-on-surface-variant hover:text-primary">Contacto</a>
          </div>
          <div className="flex gap-3">
            <Link
              to="/login"
              className="rounded-full px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/10"
            >
              Iniciar Sesión
            </Link>
            <Link
              to="/register"
              className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-on-primary transition-colors hover:bg-primary/90"
            >
              Regístrate
            </Link>
          </div>
        </div>
      </nav>

      <section className="relative overflow-hidden bg-gradient-to-b from-primary/10 to-surface px-6 py-20 md:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold leading-tight text-on-surface md:text-5xl lg:text-6xl">
                Plataforma de{' '}
                <span className="text-primary">Desarrollo</span>{' '}
                Integral Agroecológico
              </h1>
              <p className="text-lg text-on-surface-variant md:text-xl">
                Monitorea tus cultivos, gestiona tus fincas y recibe alertas inteligentes.
                Todo lo que necesitas para una agricultura eficiente y sostenible.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/register"
                  className="rounded-full bg-primary px-8 py-3 text-lg font-semibold text-on-primary shadow-lg shadow-primary/30 transition-transform hover:scale-105 hover:bg-primary/90"
                >
                  Empezar Gratis
                </Link>
                <Link
                  to="/login"
                  className="rounded-full border border-outline-variant px-8 py-3 text-lg font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
                >
                  Ver Demo
                </Link>
              </div>
            </div>
            <div className="relative">
              <div className="absolute -right-4 top-4 -z-10 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"></div>
              <div className="relative rounded-3xl bg-surface-container-high p-6 shadow-xl">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-on-surface">Clima Actual</span>
                  <span className="text-sm text-on-surface-variant">🌤️</span>
                </div>
                {weatherError ? (
                  <div className="py-8 text-center text-on-surface-variant">
                    <p className="text-4xl mb-2">☁️</p>
                    <p className="text-sm">Consultando clima...</p>
                  </div>
                ) : weather ? (
                  <>
                    <div className="mb-4 text-5xl font-bold text-on-surface">
                      {Math.round(weather.temperatura)}°C
                    </div>
                    <div className="grid grid-cols-3 gap-4 text-center text-sm">
                      <div className="rounded-xl bg-surface-container-low p-3">
                        <div className="text-on-surface-variant">💧</div>
                        <div className="font-semibold text-on-surface">{weather.humedad}%</div>
                        <div className="text-xs text-on-surface-variant">Humedad</div>
                      </div>
                      <div className="rounded-xl bg-surface-container-low p-3">
                        <div className="text-on-surface-variant">🌧️</div>
                        <div className="font-semibold text-on-surface">{weather.probabilidadLluvia}%</div>
                        <div className="text-xs text-on-surface-variant">Lluvia</div>
                      </div>
                      <div className="rounded-xl bg-surface-container-low p-3">
                        <div className="text-on-surface-variant">💨</div>
                        <div className="font-semibold text-on-surface">{Math.round(weather.velocidadViento)} km/h</div>
                        <div className="text-xs text-on-surface-variant">Viento</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="py-8 text-center text-on-surface-variant">
                    <p className="animate-pulse">Cargando clima...</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-on-surface md:text-4xl">Características Principales</h2>
            <p className="mt-4 text-lg text-on-surface-variant">
              Herramientas diseñadas para potenciar la productividad de tu negocio agrícola
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group rounded-3xl border border-outline-variant/30 bg-surface-container-low p-6 transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10"
              >
                <div className="mb-4 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-xl font-bold text-on-surface">{feature.title}</h3>
                <p className="text-on-surface-variant">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="producers" className="bg-surface-container-low px-6 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-on-surface md:text-4xl">Pequeños Productores</h2>
            <p className="mt-4 text-lg text-on-surface-variant">
              Únete a la comunidad de agricultores que ya transforman sus fincas con tecnología
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {producers.map((producer, index) => (
              <div
                key={index}
                className="rounded-3xl bg-surface p-6 text-center shadow-md"
              >
                <div className="mb-4 text-6xl">{producer.image}</div>
                <h3 className="text-lg font-bold text-on-surface">{producer.name}</h3>
                <p className="text-sm text-on-surface-variant">{producer.location}</p>
                <p className="mt-2 text-sm font-medium text-primary">{producer.crops}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Link
              to="/register"
              className="inline-block rounded-full bg-tertiary px-8 py-3 text-lg font-semibold text-on-tertiary transition-colors hover:bg-tertiary/90"
            >
              Únete a la Comunidad
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="text-3xl font-bold text-on-surface md:text-4xl">
            ¿Listo para transformar tu agricultura?
          </h2>
          <p className="mt-4 text-lg text-on-surface-variant">
            Comienza hoy mismo con nuestra plataforma y lleva tu gestión agrícola al siguiente nivel.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link
              to="/register"
              className="rounded-full bg-primary px-8 py-3 text-lg font-semibold text-on-primary shadow-lg shadow-primary/30 transition-transform hover:scale-105 hover:bg-primary/90"
            >
              Crear Cuenta Gratis
            </Link>
            <Link
              to="/contact"
              className="rounded-full border border-outline-variant px-8 py-3 text-lg font-semibold text-on-surface transition-colors hover:bg-surface-container-high"
            >
              Contactar Ventas
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-outline-variant/30 bg-surface-container-low px-6 py-12">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-on-primary text-sm font-bold">
                  P
                </div>
                <span className="text-lg font-bold text-on-surface">PDIA</span>
              </div>
              <p className="mt-4 text-sm text-on-surface-variant">
                Plataforma de Desarrollo Integral Agroecológico para pequeños y medianos productores.
              </p>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-on-surface">Producto</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="#" className="hover:text-primary">Características</a></li>
                <li><a href="#" className="hover:text-primary">Precios</a></li>
                <li><a href="#" className="hover:text-primary">Tutoriales</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-on-surface">Empresa</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="#" className="hover:text-primary">Sobre Nosotros</a></li>
                <li><a href="#" className="hover:text-primary">Blog</a></li>
                <li><a href="#" className="hover:text-primary">Carreras</a></li>
              </ul>
            </div>
            <div>
              <h4 className="mb-4 font-semibold text-on-surface">Legal</h4>
              <ul className="space-y-2 text-sm text-on-surface-variant">
                <li><a href="#" className="hover:text-primary">Términos</a></li>
                <li><a href="#" className="hover:text-primary">Privacidad</a></li>
                <li><a href="#" className="hover:text-primary">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-outline-variant/30 pt-8 text-center text-sm text-on-surface-variant">
            © 2024 PDIA. Todos los derechos reservados.
          </div>
        </div>
      </footer>
    </div>
  )
}