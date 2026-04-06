import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge, Button, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type ActividadDto, type CreateActividadPayload, type CultivoDto } from '../../../shared/services/apiClient'
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
  const [crops, setCrops] = useState<CultivoDto[]>([])
  const [tipoFilter, setTipoFilter] = useState<'TODAS' | ActividadDto['tipo']>('TODAS')
  const [cultivoFilter, setCultivoFilter] = useState<number | 'TODOS'>('TODOS')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [tipo, setTipo] = useState<ActividadDto['tipo']>('RIEGO')
  const [cultivoId, setCultivoId] = useState<number | null>(null)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [descripcion, setDescripcion] = useState('')

  const cropById = useMemo(() => {
    const map = new Map<number, CultivoDto>()
    crops.forEach((crop) => {
      map.set(crop.id, crop)
    })
    return map
  }, [crops])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [activitiesResponse, cropsResponse] = await Promise.all([apiClient.actividades.list(), apiClient.cultivos.list()])
      setActivities(activitiesResponse)
      setCrops(cropsResponse)
      if (cropsResponse.length > 0) {
        setCultivoId(cropsResponse[0].id)
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
    return activities.filter((activity) => {
      const matchTipo = tipoFilter === 'TODAS' || activity.tipo === tipoFilter
      const matchCultivo = cultivoFilter === 'TODOS' || activity.cultivoId === cultivoFilter
      return matchTipo && matchCultivo
    })
  }, [activities, cultivoFilter, tipoFilter])

  const handleCreate = async () => {
    if (!cultivoId || descripcion.trim().length < 3) {
      setError('Completa tipo, cultivo y descripción (mínimo 3 caracteres).')
      return
    }

    setError(null)
    setIsSubmitting(true)
    try {
      const payload: CreateActividadPayload = {
        tipo,
        cultivoId,
        fecha,
        descripcion: descripcion.trim(),
      }
      const created = await apiClient.actividades.create(payload)
      setActivities((current) => [created, ...current])
      setDescripcion('')
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
        <Card className="md:col-span-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
              <span className="text-label-md block text-on-surface-variant">Cultivo</span>
              <select
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => {
                  const raw = event.target.value
                  setCultivoFilter(raw === 'TODOS' ? 'TODOS' : Number(raw))
                }}
                value={cultivoFilter}
              >
                <option value="TODOS">Todos los cultivos</option>
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>{crop.tipoCultivo}</option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <Button className="w-full" leadingIcon="refresh" onClick={() => void loadData()} variant="primary">
                Recargar
              </Button>
            </div>
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
                {crops.length === 0 ? <option value="">Sin cultivos</option> : null}
                {crops.map((crop) => (
                  <option key={crop.id} value={crop.id}>{crop.tipoCultivo}</option>
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

            <label className="space-y-1 md:col-span-2" htmlFor="create-activity-desc">
              <span className="text-label-md text-on-surface-variant">Descripción</span>
              <input
                id="create-activity-desc"
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => setDescripcion(event.target.value)}
                placeholder="Detalle de la actividad"
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
                          {cropById.get(activity.cultivoId)?.tipoCultivo ?? `Cultivo #${activity.cultivoId}`}
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
