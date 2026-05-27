import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge, Button, Card } from '../../../shared/components/common'
import { apiClient, type CultivoDto, type ParcelaDto, type UserDto } from '../../../shared/services/apiClient'
import { useAuthStore } from '../../../store/authStore'

// ─── Dashboard para PRODUCTOR / OPERARIO / TÉCNICO ───────────────────────────

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

function FieldDashboard() {
  const user = useAuthStore((state) => state.user)
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [alertas, setAlertas] = useState<{ id: number; tipo: string; valorDetectado: number; fecha: string }[]>([])
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadWeather = async (parcelaId: number | null) => {
    if (!parcelaId) { setWeather(null); return }
    try {
      const current = await apiClient.weather.getCurrent(parcelaId)
      const temp = Math.round(current.temperatura)
      const wind = Math.round(current.velocidadViento)
      let condicion = 'Parcialmente nublado'
      let icon = 'partly_cloudy_day'
      if (current.probabilidadLluvia > 60) { condicion = 'Lluvia probable'; icon = 'rainy' }
      else if (temp > 30) { condicion = 'Caluroso'; icon = 'wb_sunny' }
      else if (temp < 20) { condicion = 'Fresco'; icon = 'cool_mode' }
      setWeather({ temperatura: temp, humedad: current.humedad, viento: wind, condicion, icon })
    } catch { setWeather(null) }
  }

  useEffect(() => {
    const load = async () => {
      setIsLoading(true)
      setError(null)
      try {
        const [parcelasRes, cultivosRes, alertasRes] = await Promise.all([
          apiClient.parcelas.list().catch(() => []),
          apiClient.cultivos.list().catch(() => []),
          apiClient.alertas.list().catch(() => []),
        ])
        setParcelas(parcelasRes)
        setCultivos(cultivosRes)
        setAlertas(alertasRes)
        await loadWeather(parcelasRes[0]?.id ?? null)
      } catch { setError('No fue posible cargar algunos datos.') }
      finally { setIsLoading(false) }
    }
    void load()
  }, [])

  const totalHectareas = useMemo(() => parcelas.reduce((s, p) => s + Number(p.hectareas), 0), [parcelas])
  const tiposCultivo = useMemo(() => new Set(cultivos.map((c) => c.tipoCultivo.toLowerCase())).size, [cultivos])
  const cultivosActivos = useMemo(() => cultivos.filter((c) => c.estado === 'EN_CRECIMIENTO').slice(0, 3), [cultivos])

  const summaryCards = [
    { icon: 'grid_view',    value: String(parcelas.length),          label: 'Parcelas' },
    { icon: 'area_chart',   value: `${totalHectareas.toFixed(1)}`,   label: 'Hectáreas' },
    { icon: 'potted_plant', value: String(cultivos.length),          label: 'Cultivos' },
    { icon: 'category',     value: String(tiposCultivo),             label: 'Tipos' },
  ]

  const isProductor = user?.rol === 'PRODUCTOR'
  const isOperario  = user?.rol === 'OPERARIO'

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Hola, {user?.nombre || 'Usuario'}</h1>
        <p className="mt-1 text-on-surface-variant">
          Estado: <strong className="text-primary">{error ? 'Con novedades' : 'Óptimo'}</strong>
        </p>
      </header>

      {(isProductor || isOperario) ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Link className="w-full" to="/actividades">
            <Button className="w-full h-14 text-base" leadingIcon="add_task" variant="primary">
              Registrar Actividad
            </Button>
          </Link>
          <Link className="w-full" to="/cultivos">
            <Button className="w-full h-14 text-base" leadingIcon="grass" variant="secondary">
              {isOperario ? 'Ver Cultivos' : 'Añadir Cultivo'}
            </Button>
          </Link>
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <Card className="md:col-span-4 bg-primary-container text-on-primary-container">
          <p className="text-label-md opacity-80">CLIMA</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="material-symbols-outlined text-5xl">{weather?.icon ?? 'partly_cloudy_day'}</span>
            <div>
              <h2 className="font-headline text-4xl font-bold">{weather?.temperatura ?? '--'}°C</h2>
              <p className="text-sm opacity-90">{weather?.condicion ?? 'Cargando...'}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <p className="text-sm">Humedad: {weather?.humedad ?? '--'}%</p>
            <p className="text-sm">Viento: {weather?.viento ?? '--'} km/h</p>
          </div>
        </Card>

        <Card className="md:col-span-8" title="Resumen">
          {error ? <p className="mb-3 rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p> : null}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {summaryCards.map((card) => (
              <div className="surface-panel rounded-2xl p-4 text-center" key={card.label}>
                <span className="material-symbols-outlined text-primary">{card.icon}</span>
                <p className="font-headline mt-1 text-2xl font-bold text-on-surface">{isLoading ? '...' : card.value}</p>
                <p className="text-xs text-on-surface-variant">{card.label}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="md:col-span-6" title="Cultivos Activos">
          <div className="space-y-3">
            {cultivosActivos.length === 0 && !isLoading
              ? <p className="text-sm text-on-surface-variant">Sin cultivos activos.</p>
              : cultivosActivos.map((crop) => (
                  <article className="surface-panel rounded-2xl p-4" key={crop.id}>
                    <p className="font-semibold text-on-surface">{crop.tipoCultivo}</p>
                    <p className="text-xs text-on-surface-variant">
                      Siembra: {new Date(crop.fechaSiembra + 'T00:00:00').toLocaleDateString('es-CO')}
                    </p>
                    <p className="text-xs font-bold text-primary">{mapStatusLabel(crop.estado)}</p>
                  </article>
                ))}
          </div>
        </Card>

        <Card className="md:col-span-6" title="Alertas recientes">
          <div className="space-y-3">
            {alertas.slice(0, 2).map((alerta) => (
              <article className="rounded-2xl bg-error-container p-4" key={alerta.id}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold text-on-error-container">{alerta.tipo}</p>
                  <Badge variant="danger">Nueva</Badge>
                </div>
                <p className="text-sm text-on-error-container">
                  {alerta.valorDetectado} · {new Date(alerta.fecha + 'T00:00:00').toLocaleDateString('es-CO')}
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

// ─── Dashboard para ADMINISTRADOR ────────────────────────────────────────────

function AdminDashboard() {
  const user = useAuthStore((state) => state.user)
  const [users, setUsers] = useState<UserDto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    apiClient.users.list()
      .then(setUsers)
      .catch(() => undefined)
      .finally(() => setIsLoading(false))
  }, [])

  const byRol = useMemo(() => {
    const counts: Record<string, number> = { PRODUCTOR: 0, OPERARIO: 0, TECNICO: 0, ADMINISTRADOR: 0 }
    users.forEach((u) => { counts[u.rol] = (counts[u.rol] ?? 0) + 1 })
    return counts
  }, [users])

  const statCards = [
    { icon: 'person',       label: 'Productores',    value: byRol.PRODUCTOR,     color: 'text-primary' },
    { icon: 'engineering',  label: 'Operarios',      value: byRol.OPERARIO,      color: 'text-secondary' },
    { icon: 'science',      label: 'Técnicos',       value: byRol.TECNICO,       color: 'text-tertiary' },
    { icon: 'admin_panel_settings', label: 'Admins', value: byRol.ADMINISTRADOR, color: 'text-on-surface' },
  ]

  const recentUsers = useMemo(() => [...users].slice(0, 5), [users])

  const rolBadgeVariant = (rol: string) => {
    if (rol === 'ADMINISTRADOR') return 'primary' as const
    if (rol === 'TECNICO') return 'warning' as const
    if (rol === 'OPERARIO') return 'neutral' as const
    return 'safe' as const
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Panel de Administración</h1>
        <p className="mt-1 text-on-surface-variant">
          Bienvenido, {user?.nombre}. Gestiona los usuarios y supervisa el sistema.
        </p>
      </header>

      {/* Stats por rol */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {statCards.map((card) => (
          <Card className="p-5 text-center" key={card.label}>
            <span className={`material-symbols-outlined text-3xl ${card.color}`}>{card.icon}</span>
            <p className="font-headline mt-2 text-3xl font-bold text-on-surface">
              {isLoading ? '...' : card.value}
            </p>
            <p className="mt-1 text-xs text-on-surface-variant">{card.label}</p>
          </Card>
        ))}
      </div>

      {/* Total usuarios */}
      <Card className="bg-primary-container text-on-primary-container p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-label-md opacity-80 uppercase tracking-wide">Total usuarios en el sistema</p>
            <p className="font-headline mt-1 text-5xl font-bold">{isLoading ? '...' : users.length}</p>
          </div>
          <span className="material-symbols-outlined text-6xl opacity-30">group</span>
        </div>
        <div className="mt-4">
          <Link to="/usuarios">
            <Button variant="secondary" size="small">
              Gestionar usuarios →
            </Button>
          </Link>
        </div>
      </Card>

      {/* Usuarios recientes */}
      <Card title="Usuarios recientes">
        {isLoading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : recentUsers.length === 0 ? (
          <p className="text-on-surface-variant">No hay usuarios registrados.</p>
        ) : (
          <div className="space-y-2">
            {recentUsers.map((u) => (
              <div key={u.id} className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{u.nombre}</p>
                  <p className="text-xs text-on-surface-variant">{u.email}</p>
                </div>
                <Badge variant={rolBadgeVariant(u.rol)}>
                  {u.rol === 'ADMINISTRADOR' ? 'Admin'
                    : u.rol === 'PRODUCTOR' ? 'Productor'
                    : u.rol === 'TECNICO' ? 'Técnico'
                    : 'Operario'}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}

// ─── Selector de dashboard por rol ───────────────────────────────────────────

export default function DashboardPage() {
  const rol = useAuthStore((state) => state.user?.rol)
  if (rol === 'ADMINISTRADOR') return <AdminDashboard />
  return <FieldDashboard />
}
