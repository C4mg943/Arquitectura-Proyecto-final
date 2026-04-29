import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge, Button, Card } from '../../../shared/components/common'
import {
  apiClient,
  ApiClientError,
  type ActividadDto,
  type CreateActividadPayload,
  type CultivoDto,
  type FincaDto,
  type ParcelaDto,
} from '../../../shared/services/apiClient'
import { useAuthStore } from '../../../store/authStore'

const activityMeta: Record<ActividadDto['tipo'], { icon: string; color: string; iconBg: string; label: string }> = {
  RIEGO: { icon: 'water_drop', color: 'text-tertiary', iconBg: 'bg-tertiary-container', label: 'Riego' },
  FERTILIZACION: { icon: 'science', color: 'text-primary', iconBg: 'bg-primary-fixed', label: 'Fertilización' },
  PLAGA: { icon: 'pest_control', color: 'text-error', iconBg: 'bg-error-container', label: 'Control de Plagas' },
  OBSERVACION: { icon: 'visibility', color: 'text-secondary', iconBg: 'bg-secondary-container', label: 'Observación' },
}

export default function ActivitiesPage() {
  const user = useAuthStore((state) => state.user)
  const [activities, setActivities] = useState<ActividadDto[]>([])
  const [fincas, setFincas] = useState<FincaDto[]>([])
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [tipoFilter, setTipoFilter] = useState<'TODAS' | ActividadDto['tipo']>('TODAS')
  const [fincaFilter, setFincaFilter] = useState<number | 'TODAS'>('TODAS')
  const [parcelaFilter, setParcelaFilter] = useState<number | 'TODAS'>('TODAS')
  const [cultivoFilter, setCultivoFilter] = useState<number | 'TODAS'>('TODAS')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<ActividadDto['tipo']>('RIEGO')
  const [cultivoId, setCultivoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [descripcion, setDescripcion] = useState('')

  // Specific fields for RF12, RF13, RF14
  const [cantidadAgua, setCantidadAgua] = useState<number>(0)
  const [tipoFertilizante, setTipoFertilizante] = useState('')
  const [tipoPlaga, setTipoPlaga] = useState('')
  const [accionAplicada, setAccionAplicada] = useState('')

  const parcelaById = useMemo(() => {
    const map = new Map<number, ParcelaDto>()
    parcelas.forEach((parcela) => map.set(parcela.id, parcela))
    return map
  }, [parcelas])

  const cultivoById = useMemo(() => {
    const map = new Map<number, CultivoDto>()
    cultivos.forEach((cultivo) => map.set(cultivo.id, cultivo))
    return map
  }, [cultivos])

  const filteredParcelas = useMemo(() => {
    if (fincaFilter === 'TODAS') return parcelas
    return parcelas.filter((p) => p.fincaId === Number(fincaFilter))
  }, [parcelas, fincaFilter])

  const filteredCultivos = useMemo(() => {
    if (parcelaFilter === 'TODAS') return cultivos
    return cultivos.filter((c) => c.parcelaId === Number(parcelaFilter))
  }, [cultivos, parcelaFilter])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [activitiesResponse, fincasResponse, parcelasResponse, cultivosResponse] = await Promise.all([
        apiClient.actividades.list(),
        apiClient.fincas.list(),
        apiClient.parcelas.list(),
        apiClient.cultivos.list(),
      ])
      setActivities(activitiesResponse)
      setFincas(fincasResponse)
      setParcelas(parcelasResponse)
      setCultivos(cultivosResponse)
      if (cultivosResponse.length > 0) {
        setCultivoId(cultivosResponse[0].id)
      }
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar actividades')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredActivities = useMemo(() => {
    return activities
      .filter((activity) => {
        const matchTipo = tipoFilter === 'TODAS' || activity.tipo === tipoFilter
        const matchCultivo = cultivoFilter === 'TODAS' || activity.cultivoId === cultivoFilter
        return matchTipo && matchCultivo
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [activities, cultivoFilter, tipoFilter])

  const handleCreate = async () => {
    if (!cultivoId) {
      setError('Selecciona un cultivo.')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      let created: ActividadDto
      
      if (tipo === 'RIEGO') {
        created = await apiClient.actividades.createRiego({
          cultivoId,
          fecha,
          cantidadAgua,
          observaciones: descripcion.trim(),
        })
      } else if (tipo === 'FERTILIZACION') {
        created = await apiClient.actividades.createFertilizante({
          cultivoId,
          fecha,
          tipoFertilizante,
          observaciones: descripcion.trim(),
        })
      } else if (tipo === 'PLAGA') {
        created = await apiClient.actividades.createPlaga({
          cultivoId,
          fecha,
          tipoPlaga,
          accionAplicada,
          observaciones: descripcion.trim(),
        })
      } else {
        const payload: CreateActividadPayload = {
          tipo,
          cultivoId,
          fecha,
          descripcion: descripcion.trim(),
        }
        created = await apiClient.actividades.create(payload)
      }

      setActivities((current) => [created, ...current])
      setDescripcion('')
      setCantidadAgua(0)
      setTipoFertilizante('')
      setTipoPlaga('')
      setAccionAplicada('')
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible crear la actividad.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Historial de Actividades</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          {user?.rol === 'OPERARIO'
            ? 'Registra y consulta actividades sobre los cultivos de tus parcelas asignadas.'
            : 'Seguimiento detallado de operaciones de campo y gestión de cultivos.'}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card className="md:col-span-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <label className="space-y-2">
              <span className="text-label-md block text-on-surface-variant">Filtrar por tipo</span>
              <select
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => setTipoFilter(event.target.value as 'TODAS' | ActividadDto['tipo'])}
                value={tipoFilter}
              >
                <option value="TODAS">Todas las actividades</option>
                <option value="RIEGO">Riego</option>
                <option value="FERTILIZACION">Fertilización</option>
                <option value="PLAGA">Control de Plagas</option>
                <option value="OBSERVACION">Observaciones</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-label-md block text-on-surface-variant">Finca</span>
              <select
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => {
                  const val = event.target.value
                  setFincaFilter(val === 'TODAS' ? 'TODAS' : Number(val))
                  setParcelaFilter('TODAS')
                  setCultivoFilter('TODAS')
                }}
                value={fincaFilter}
              >
                <option value="TODAS">Todas las fincas</option>
                {fincas.map((f) => (
                  <option key={f.id} value={f.id}>{f.nombre}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-label-md block text-on-surface-variant">Parcela</span>
              <select
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => {
                  const val = event.target.value
                  setParcelaFilter(val === 'TODAS' ? 'TODAS' : Number(val))
                  setCultivoFilter('TODAS')
                }}
                value={parcelaFilter}
                disabled={fincaFilter !== 'TODAS' && filteredParcelas.length === 0}
              >
                <option value="TODAS">Todas las parcelas</option>
                {filteredParcelas.map((p) => (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-label-md block text-on-surface-variant">Cultivo</span>
              <select
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => {
                  const val = event.target.value
                  setCultivoFilter(val === 'TODAS' ? 'TODAS' : Number(val))
                }}
                value={cultivoFilter}
              >
                <option value="TODAS">Todos los cultivos</option>
                {filteredCultivos.map((c) => (
                  <option key={c.id} value={c.id}>{c.tipoCultivo}</option>
                ))}
              </select>
            </label>
          </div>
        </Card>

        <Card className="bg-tertiary text-on-tertiary">
          <div className="flex items-center gap-3">
              <span className="material-symbols-outlined" style={{fontSize: '32px'}}>cloud_off</span>
              <div>
                <p className="font-headline text-3xl font-bold">{activities.length}</p>
                <p className="text-sm opacity-90">Actividades registradas</p>
              </div>
            </div>
          </Card>
        </div>

        <Card>
          <div className="grid gap-3 md:grid-cols-5">
            <label className="space-y-1" htmlFor="create-activity-type">
              <span className="text-label-md text-on-surface-variant">Tipo</span>
              <select
                id="create-activity-type"
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => setTipo(event.target.value as ActividadDto['tipo'])}
                value={tipo}
              >
                <option value="RIEGO">Riego</option>
                <option value="FERTILIZACION">Fertilización</option>
                <option value="PLAGA">Plaga</option>
                <option value="OBSERVACION">Observación</option>
              </select>
            </label>

            <label className="space-y-1" htmlFor="create-activity-crop">
              <span className="text-label-md text-on-surface-variant">Cultivo</span>
              <select
                id="create-activity-crop"
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => setCultivoId(Number(event.target.value))}
                value={cultivoId ?? ''}
              >
                {cultivos.length === 0 ? <option value="">Sin cultivos</option> : null}
                {cultivos.map((c) => (
                  <option key={c.id} value={c.id}>{c.tipoCultivo}</option>
                ))}
              </select>
            </label>

            <label className="space-y-1" htmlFor="create-activity-date">
              <span className="text-label-md text-on-surface-variant">Fecha</span>
              <input
                id="create-activity-date"
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => setFecha(event.target.value)}
                type="date"
                value={fecha}
              />
            </label>

            {/* Dynamic Fields */}
            {tipo === 'RIEGO' && (
              <label className="space-y-1" htmlFor="create-activity-water">
                <span className="text-label-md text-on-surface-variant">Agua (litros)</span>
                <input
                  id="create-activity-water"
                  className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  onChange={(event) => setCantidadAgua(Number(event.target.value))}
                  type="number"
                  value={cantidadAgua}
                />
              </label>
            )}

            {tipo === 'FERTILIZACION' && (
              <label className="space-y-1" htmlFor="create-activity-fert">
                <span className="text-label-md text-on-surface-variant">Fertilizante</span>
                <input
                  id="create-activity-fert"
                  className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  onChange={(event) => setTipoFertilizante(event.target.value)}
                  placeholder="Ej: Urea"
                  type="text"
                  value={tipoFertilizante}
                />
              </label>
            )}

            {tipo === 'PLAGA' && (
              <>
                <label className="space-y-1" htmlFor="create-activity-pest">
                  <span className="text-label-md text-on-surface-variant">Plaga</span>
                  <input
                    id="create-activity-pest"
                    className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                    onChange={(event) => setTipoPlaga(event.target.value)}
                    placeholder="Ej: Pulgón"
                    type="text"
                    value={tipoPlaga}
                  />
                </label>
                <label className="space-y-1" htmlFor="create-activity-action">
                  <span className="text-label-md text-on-surface-variant">Acción</span>
                  <input
                    id="create-activity-action"
                    className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                    onChange={(event) => setAccionAplicada(event.target.value)}
                    placeholder="Ej: Insecticida"
                    type="text"
                    value={accionAplicada}
                  />
                </label>
              </>
            )}

            <label className={`space-y-1 ${tipo === 'PLAGA' ? 'md:col-span-5' : 'md:col-span-1'}`} htmlFor="create-activity-desc">
              <span className="text-label-md text-on-surface-variant">Observaciones</span>
              <input
                id="create-activity-desc"
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Detalle extra..."
                type="text"
                value={descripcion}
              />
            </label>
          </div>

          <div className="mt-3 flex justify-end">
            <Button disabled={isSubmitting} onClick={() => void handleCreate()} variant="primary">
              {isSubmitting ? 'Guardando...' : 'Registrar actividad'}
            </Button>
          </div>
        </Card>

        {error ? (
          <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
        ) : null}

      <div className="space-y-3">
        {isLoading ? (
          <Card><p className="text-on-surface-variant">Cargando actividades...</p></Card>
        ) : null}

        {!isLoading && filteredActivities.length === 0 ? (
          <Card><p className="text-on-surface-variant">No hay actividades para los filtros seleccionados.</p></Card>
        ) : null}

        {filteredActivities.map((activity) => {
          const meta = activityMeta[activity.tipo]
          const cultivo = cultivoById.get(activity.cultivoId)
          const parcela = cultivo ? parcelaById.get(cultivo.parcelaId) : null
          return (
            <Card className="p-0 overflow-hidden" key={activity.id}>
              <div className="flex">
                <div className="w-1.5 bg-primary" />
                <div className="flex-1 p-4 md:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.iconBg}`}>
                        <span className={`material-symbols-outlined ${meta.color}`}>{meta.icon}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-on-surface">{meta.label}</p>
                          <Badge variant="safe">Sincronizado</Badge>
                        </div>
                        <p className="mt-1 text-sm text-on-surface-variant">{activity.descripcion}</p>
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined" style={{fontSize: '14px'}}>eco</span>
                          {cultivo?.tipoCultivo ?? `Cultivo #${activity.cultivoId}`}
                          {parcela && <span> · {parcela.nombre}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-sm text-on-surface-variant md:text-right">
                      <p>{new Date(activity.fecha).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      <p className="mt-0.5 text-xs">{new Date(activity.fecha).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })}</p>
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
