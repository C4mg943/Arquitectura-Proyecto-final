import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge, Button, Card } from '../../../shared/components/common'
import {
  apiClient,
  ApiClientError,
  type ActividadDto,
  type CreateActividadPayload,
  type CreateFertilizantePayload,
  type CreatePlagaPayload,
  type CreateRiegoPayload,
  type CultivoDto,
  type FincaDto,
  type ParcelaDto,
} from '../../../shared/services/apiClient'
import {
  addPendingActivity,
  cacheActivities,
  cacheCultivos,
  cacheFincas,
  cacheParcelas,
  generateClientRef,
  readCachedActivities,
  readCachedCultivos,
  readCachedFincas,
  readCachedParcelas,
  type PendingActivityRecord,
} from '../../../shared/services/offlineDb'
import { notifyPendingChanged, syncPendingActivities } from '../../../shared/services/syncService'
import { useOffline } from '../../../shared/hooks/useOffline'
import { useOfflineSync } from '../../../shared/hooks/useOfflineSync'
import { useAuthStore } from '../../../store/authStore'

const activityMeta: Record<ActividadDto['tipo'], { icon: string; color: string; iconBg: string; label: string }> = {
  RIEGO: { icon: 'water_drop', color: 'text-tertiary', iconBg: 'bg-tertiary-container', label: 'Riego' },
  FERTILIZACION: { icon: 'science', color: 'text-primary', iconBg: 'bg-primary-fixed', label: 'Fertilización' },
  PLAGA: { icon: 'pest_control', color: 'text-error', iconBg: 'bg-error-container', label: 'Control de Plagas' },
  OBSERVACION: { icon: 'visibility', color: 'text-secondary', iconBg: 'bg-secondary-container', label: 'Observación' },
}

type DisplayActivity = ActividadDto & {
  _pending?: boolean
  _pendingId?: string
  _syncStatus?: PendingActivityRecord['status']
}

export default function ActivitiesPage() {
  const user = useAuthStore((state) => state.user)
  const isOffline = useOffline()
  const { pendingList, pendingCount, isSyncing, forceSync } = useOfflineSync(user?.id)

  const [serverActivities, setServerActivities] = useState<ActividadDto[]>([])
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
  const [info, setInfo] = useState<string | null>(null)

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

  const todayIso = new Date().toISOString().split('T')[0]
  const selectedCultivo = cultivoId ? cultivoById.get(cultivoId) : null
  const minFechaActividad = selectedCultivo?.fechaSiembra ?? undefined

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

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Offline: hidratar desde IndexedDB
      try {
        const [cachedActivities, cachedFincas, cachedParcelas, cachedCultivos] = await Promise.all([
          readCachedActivities(),
          readCachedFincas(),
          readCachedParcelas(),
          readCachedCultivos(),
        ])
        setServerActivities(cachedActivities)
        setFincas(cachedFincas)
        setParcelas(cachedParcelas)
        setCultivos(cachedCultivos)
        if (cachedCultivos.length > 0 && cultivoId === null) {
          setCultivoId(cachedCultivos[0].id)
        }
        if (cachedActivities.length === 0 && cachedCultivos.length === 0) {
          setError('Sin conexión y sin datos en caché. Conéctate para cargar la información.')
        }
      } catch {
        setError('Sin conexión y no fue posible leer la caché local.')
      } finally {
        setIsLoading(false)
      }
      return
    }

    try {
      const [activitiesResponse, fincasResponse, parcelasResponse, cultivosResponse] = await Promise.all([
        apiClient.actividades.list(),
        apiClient.fincas.list().catch(() => [] as import('../../../shared/services/apiClient').FincaDto[]),
        apiClient.parcelas.list(),
        apiClient.cultivos.list(),
      ])
      setServerActivities(activitiesResponse)
      setFincas(fincasResponse)
      setParcelas(parcelasResponse)
      setCultivos(cultivosResponse)
      if (cultivosResponse.length > 0 && cultivoId === null) {
        setCultivoId(cultivosResponse[0].id)
      }

      // Actualizar caché para próxima sesión offline
      void Promise.all([
        cacheActivities(activitiesResponse),
        cacheFincas(fincasResponse),
        cacheParcelas(parcelasResponse),
        cacheCultivos(cultivosResponse),
      ]).catch(() => {
        /* ignorar errores de caché, no críticos */
      })
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar actividades')
      }
    } finally {
      setIsLoading(false)
    }
  }, [cultivoId])

  useEffect(() => {
    void loadData()
    // Solo queremos correr loadData al montar y cuando cambia el estado de conexión.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOffline])

  // Al terminar una sync exitosa, recargar datos del servidor para traer ids reales
  useEffect(() => {
    if (isOffline) return
    if (pendingCount === 0) return
    // nada que hacer; la UI se actualiza por el hook
  }, [isOffline, pendingCount])

  const combinedActivities: DisplayActivity[] = useMemo(() => {
    const pendingAsActivities: DisplayActivity[] = pendingList.map((record) => ({
      ...record.optimistic,
      _pending: true,
      _pendingId: record.id,
      _syncStatus: record.status,
    }))
    return [...pendingAsActivities, ...serverActivities]
  }, [pendingList, serverActivities])

  const filteredActivities = useMemo(() => {
    return combinedActivities
      .filter((activity) => {
        const matchTipo = tipoFilter === 'TODAS' || activity.tipo === tipoFilter
        const matchCultivo = cultivoFilter === 'TODAS' || activity.cultivoId === cultivoFilter
        return matchTipo && matchCultivo
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
  }, [combinedActivities, cultivoFilter, tipoFilter])

  const queueOffline = useCallback(
    async (opts: { optimistic: ActividadDto; record: PendingActivityRecord }) => {
      await addPendingActivity(opts.record)
      notifyPendingChanged()
    },
    [],
  )

  const resetForm = () => {
    setDescripcion('')
    setCantidadAgua(0)
    setTipoFertilizante('')
    setTipoPlaga('')
    setAccionAplicada('')
  }

  const handleCreate = async () => {
    if (!user) {
      setError('Sesión inválida.')
      return
    }
    if (!cultivoId) {
      setError('Selecciona un cultivo.')
      return
    }

    // Validaciones de fecha (duplica la del backend para feedback inmediato)
    if (fecha > todayIso) {
      setError('La fecha de la actividad no puede ser futura.')
      return
    }
    if (selectedCultivo && fecha < selectedCultivo.fechaSiembra) {
      setError(
        `La fecha no puede ser anterior a la siembra del cultivo (${selectedCultivo.fechaSiembra}).`,
      )
      return
    }

    setError(null)
    setInfo(null)
    setIsSubmitting(true)

    const clientRef = generateClientRef()
    const fechaIso = fecha.includes('T') ? fecha : `${fecha}T00:00:00`

    const descripcionCalculada =
      tipo === 'RIEGO'
        ? `Riego de ${cantidadAgua} litros. ${descripcion.trim()}`
        : tipo === 'FERTILIZACION'
          ? `Aplicación de fertilizante: ${tipoFertilizante}. ${descripcion.trim()}`
          : tipo === 'PLAGA'
            ? `Control de plaga: ${tipoPlaga}. Acción: ${accionAplicada}. ${descripcion.trim()}`
            : descripcion.trim()

    const optimistic: ActividadDto = {
      id: -Date.now(), // id negativo temporal para no chocar con ids reales
      tipo,
      fecha,
      descripcion: descripcionCalculada,
      datos: null,
      cultivoId,
      creadoPorId: user.id,
    }

    try {
      if (isOffline) {
        let record: PendingActivityRecord
        if (tipo === 'RIEGO') {
          const payload: CreateRiegoPayload = { cultivoId, fecha: fechaIso, cantidadAgua, observaciones: descripcion.trim() || undefined }
          record = { id: clientRef, kind: 'riego', payload, optimistic, createdAt: Date.now(), status: 'pending', attempts: 0, userId: user.id }
        } else if (tipo === 'FERTILIZACION') {
          const payload: CreateFertilizantePayload = { cultivoId, fecha: fechaIso, tipoFertilizante, observaciones: descripcion.trim() || undefined }
          record = { id: clientRef, kind: 'fertilizante', payload, optimistic, createdAt: Date.now(), status: 'pending', attempts: 0, userId: user.id }
        } else if (tipo === 'PLAGA') {
          const payload: CreatePlagaPayload = { cultivoId, fecha: fechaIso, tipoPlaga, accionAplicada, observaciones: descripcion.trim() || undefined }
          record = { id: clientRef, kind: 'plaga', payload, optimistic, createdAt: Date.now(), status: 'pending', attempts: 0, userId: user.id }
        } else {
          const payload: CreateActividadPayload = { tipo, cultivoId, fecha: fechaIso, descripcion: descripcion.trim() || tipo }
          record = { id: clientRef, kind: 'generic', payload, optimistic, createdAt: Date.now(), status: 'pending', attempts: 0, userId: user.id }
        }
        await queueOffline({ optimistic, record })
        setInfo('Sin conexión: la actividad se guardó local y se sincronizará automáticamente.')
        resetForm()
        return
      }

      // Online: enviar directo
      let created: ActividadDto
      if (tipo === 'RIEGO') {
        created = await apiClient.actividades.createRiego({ cultivoId, fecha: fechaIso, cantidadAgua, observaciones: descripcion.trim() || undefined })
      } else if (tipo === 'FERTILIZACION') {
        created = await apiClient.actividades.createFertilizante({ cultivoId, fecha: fechaIso, tipoFertilizante, observaciones: descripcion.trim() || undefined })
      } else if (tipo === 'PLAGA') {
        created = await apiClient.actividades.createPlaga({ cultivoId, fecha: fechaIso, tipoPlaga, accionAplicada, observaciones: descripcion.trim() || undefined })
      } else {
        const payload: CreateActividadPayload = { tipo, cultivoId, fecha: fechaIso, descripcion: descripcion.trim() || tipo }
        created = await apiClient.actividades.create(payload)
      }
      setServerActivities((current) => [created, ...current])
      resetForm()
    } catch (unknownError) {
      // Falló el envío aun estando online (ej. backend caído): encolar para reintentar
      if (unknownError instanceof ApiClientError && unknownError.status >= 500) {
        let record: PendingActivityRecord
        if (tipo === 'RIEGO') {
          record = { id: clientRef, kind: 'riego', payload: { cultivoId, fecha: fechaIso, cantidadAgua, observaciones: descripcion.trim() || undefined }, optimistic, createdAt: Date.now(), status: 'error', attempts: 1, lastError: unknownError.message, userId: user.id }
        } else if (tipo === 'FERTILIZACION') {
          record = { id: clientRef, kind: 'fertilizante', payload: { cultivoId, fecha: fechaIso, tipoFertilizante, observaciones: descripcion.trim() || undefined }, optimistic, createdAt: Date.now(), status: 'error', attempts: 1, lastError: unknownError.message, userId: user.id }
        } else if (tipo === 'PLAGA') {
          record = { id: clientRef, kind: 'plaga', payload: { cultivoId, fecha: fechaIso, tipoPlaga, accionAplicada, observaciones: descripcion.trim() || undefined }, optimistic, createdAt: Date.now(), status: 'error', attempts: 1, lastError: unknownError.message, userId: user.id }
        } else {
          record = { id: clientRef, kind: 'generic', payload: { tipo, cultivoId, fecha: fechaIso, descripcion: descripcion.trim() || tipo }, optimistic, createdAt: Date.now(), status: 'error', attempts: 1, lastError: unknownError.message, userId: user.id }
        }
        await queueOffline({ optimistic, record })
        setInfo('El servidor no respondió. La actividad quedó en cola y se reintentará automáticamente.')
        resetForm()
      } else if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible crear la actividad.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleForceSync = async () => {
    setError(null)
    setInfo(null)
    const result = await forceSync()
    if (!result) {
      setInfo('Estás sin conexión. Intenta cuando vuelvas online.')
      return
    }
    if (result.synced > 0) {
      setInfo(`${result.synced} actividad(es) sincronizada(s).`)
      await loadData()
    } else if (result.failed > 0) {
      setError(`No se pudieron sincronizar ${result.failed} actividad(es). Se reintentará.`)
    } else {
      setInfo('Nada que sincronizar.')
    }
  }

  // Intento explícito al hacer click en el botón del banner (fuera del useOfflineSync)
  const handleRetry = async () => {
    if (!navigator.onLine) {
      setInfo('Seguimos sin conexión.')
      return
    }
    await syncPendingActivities(user?.id)
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

      {pendingCount > 0 ? (
        <div className="flex flex-col gap-3 rounded-2xl bg-secondary-container px-4 py-3 text-on-secondary-container sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined">cloud_sync</span>
            <p className="text-sm font-semibold">
              {pendingCount} actividad{pendingCount === 1 ? '' : 'es'} pendiente{pendingCount === 1 ? '' : 's'} de sincronizar
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              size="small"
              variant="tertiary"
              onClick={() => void handleRetry()}
              disabled={isSyncing || isOffline}
            >
              Reintentar ahora
            </Button>
            <Button
              size="small"
              variant="primary"
              onClick={() => void handleForceSync()}
              disabled={isSyncing || isOffline}
            >
              {isSyncing ? 'Sincronizando...' : 'Sincronizar'}
            </Button>
          </div>
        </div>
      ) : null}

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
            <span className="material-symbols-outlined" style={{ fontSize: '32px' }}>
              {isOffline ? 'cloud_off' : 'cloud_done'}
            </span>
            <div>
              <p className="font-headline text-3xl font-bold">{combinedActivities.length}</p>
              <p className="text-sm opacity-90">
                {isOffline ? 'Actividades (modo offline)' : 'Actividades registradas'}
              </p>
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
              max={todayIso}
              min={minFechaActividad}
              onChange={(event) => setFecha(event.target.value)}
              type="date"
              value={fecha}
            />
            {selectedCultivo ? (
              <span className="block text-[11px] text-on-surface-variant">
                Desde siembra: {selectedCultivo.fechaSiembra} · Hasta hoy: {todayIso}
              </span>
            ) : null}
          </label>

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
            {isSubmitting
              ? 'Guardando...'
              : isOffline
                ? 'Guardar para sincronizar'
                : 'Registrar actividad'}
          </Button>
        </div>
      </Card>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}
      {info ? (
        <p className="rounded-xl bg-tertiary-container px-3 py-2 text-sm font-semibold text-on-tertiary-container">{info}</p>
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
          const key = activity._pending ? `pending-${activity._pendingId}` : `server-${activity.id}`
          return (
            <Card className="p-0 overflow-hidden" key={key}>
              <div className="flex">
                <div
                  className={`w-1.5 ${
                    activity._pending
                      ? activity._syncStatus === 'error'
                        ? 'bg-error'
                        : 'bg-secondary'
                      : 'bg-primary'
                  }`}
                />
                <div className="flex-1 p-4 md:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-start gap-3">
                      <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${meta.iconBg}`}>
                        <span className={`material-symbols-outlined ${meta.color}`}>{meta.icon}</span>
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-on-surface">{meta.label}</p>
                          {activity._pending ? (
                            activity._syncStatus === 'error' ? (
                              <Badge variant="danger">Error sync</Badge>
                            ) : activity._syncStatus === 'syncing' ? (
                              <Badge variant="warning">Sincronizando</Badge>
                            ) : (
                              <Badge variant="warning">Pendiente</Badge>
                            )
                          ) : (
                            <Badge variant="safe">Sincronizado</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-on-surface-variant">{activity.descripcion}</p>
                        <p className="mt-1.5 inline-flex items-center gap-1 text-xs text-on-surface-variant">
                          <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>eco</span>
                          {cultivo?.tipoCultivo ?? `Cultivo #${activity.cultivoId}`}
                          {parcela && <span> · {parcela.nombre}</span>}
                        </p>
                      </div>
                    </div>

                    <div className="shrink-0 text-sm text-on-surface-variant md:text-right">
                      <p>
                        {new Date(activity.fecha).toLocaleDateString('es-CO', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
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
