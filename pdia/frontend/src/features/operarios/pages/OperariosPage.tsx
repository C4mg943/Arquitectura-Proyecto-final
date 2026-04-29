import { useCallback, useEffect, useMemo, useState } from 'react'

import { Badge, Button, Card, Input } from '../../../shared/components/common'
import {
  apiClient,
  ApiClientError,
  type FincaDto,
  type OperarioConParcelasDto,
  type ParcelaDto,
  type RegisterOperarioPayload,
} from '../../../shared/services/apiClient'
import { operarioSchema } from '../../../shared/utils/validators'

interface OperarioFormState {
  nombre: string
  identificacion: string
  email: string
  password: string
}

const initialOperarioForm: OperarioFormState = {
  nombre: '',
  identificacion: '',
  email: '',
  password: '',
}

export default function OperariosPage() {
  const [operarios, setOperarios] = useState<OperarioConParcelasDto[]>([])
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [fincasById, setFincasById] = useState<Map<number, FincaDto>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<OperarioFormState>(initialOperarioForm)
  const [assignOperarioId, setAssignOperarioId] = useState<number | null>(null)
  const [assignParcelaId, setAssignParcelaId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [operariosResponse, parcelasResponse, fincasResponse] = await Promise.all([
        apiClient.operarios.list(),
        apiClient.parcelas.list(),
        apiClient.fincas.list(),
      ])

      setOperarios(operariosResponse)
      setParcelas(parcelasResponse)
      setFincasById(new Map(fincasResponse.map((finca) => [finca.id, finca])))

      if (operariosResponse.length > 0) {
        setAssignOperarioId(operariosResponse[0].operario.id)
      }
      if (parcelasResponse.length > 0) {
        setAssignParcelaId(parcelasResponse[0].id)
      }
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar la gestión de operarios.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const operarioById = useMemo(() => {
    const map = new Map<number, OperarioConParcelasDto>()
    operarios.forEach((item) => {
      map.set(item.operario.id, item)
    })
    return map
  }, [operarios])

  const availableParcelas = useMemo(() => {
    if (!assignOperarioId) {
      return parcelas
    }

    const selectedOperario = operarioById.get(assignOperarioId)
    if (!selectedOperario) {
      return parcelas
    }

    const assignedParcelas = selectedOperario.parcelas
    if (assignedParcelas.length === 0) {
      return parcelas
    }

    const allowedFincaId = assignedParcelas[0].fincaId
    return parcelas.filter((parcela) => parcela.fincaId === allowedFincaId)
  }, [assignOperarioId, operarioById, parcelas])

  useEffect(() => {
    if (availableParcelas.length === 0) {
      setAssignParcelaId(null)
      return
    }

    const parcelaStillAvailable = availableParcelas.some((parcela) => parcela.id === assignParcelaId)
    if (!parcelaStillAvailable) {
      setAssignParcelaId(availableParcelas[0].id)
    }
  }, [assignParcelaId, availableParcelas])

  const handleCreate = async () => {
    const parsed = operarioSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Datos inválidos para el operario.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      const payload: RegisterOperarioPayload = parsed.data
      const created = await apiClient.operarios.register(payload)

      setOperarios((current) => [
        {
          operario: created,
          parcelas: [],
        },
        ...current,
      ])

      setAssignOperarioId((current) => current ?? created.id)
      setForm(initialOperarioForm)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible crear el operario.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAssign = async () => {
    if (!assignOperarioId || !assignParcelaId) {
      setError('Selecciona operario y parcela para asignar.')
      return
    }

    setError(null)
    setIsSubmitting(true)

    try {
      await apiClient.operarios.assign(assignOperarioId, assignParcelaId)
      await loadData()
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible asignar el operario.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleUnassign = async (operarioId: number, parcelaId: number) => {
    setError(null)

    try {
      await apiClient.operarios.unassign(operarioId, parcelaId)
      setOperarios((current) =>
        current.map((item) => {
          if (item.operario.id !== operarioId) {
            return item
          }

          return {
            ...item,
            parcelas: item.parcelas.filter((parcela) => parcela.id !== parcelaId),
          }
        }),
      )
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible desasignar el operario.')
      }
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Gestión de Operarios</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Registra operarios y asígnalos a parcelas. Un operario puede trabajar en varias parcelas de una misma finca.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}

      <Card title="Registrar nuevo operario">
        <div className="grid gap-4 md:grid-cols-2">
          <Input
            id="operario-nombre"
            label="Nombre completo"
            onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
            placeholder="Juan Pérez"
            type="text"
            value={form.nombre}
          />

          <Input
            id="operario-identificacion"
            label="Identificación"
            onChange={(event) => setForm((current) => ({ ...current, identificacion: event.target.value }))}
            placeholder="123456789"
            type="text"
            value={form.identificacion}
          />

          <Input
            id="operario-email"
            label="Correo"
            onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
            placeholder="operario@correo.com"
            type="email"
            value={form.email}
          />

          <Input
            id="operario-password"
            label="Contraseña"
            onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
            placeholder="******"
            type="password"
            value={form.password}
          />
        </div>

        <div className="mt-4 flex justify-end">
          <Button disabled={isSubmitting} onClick={() => void handleCreate()} variant="primary">
            {isSubmitting ? 'Guardando...' : 'Registrar operario'}
          </Button>
        </div>
      </Card>

      <Card title="Asignar operario a parcela">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2" htmlFor="assign-operario">
            <span className="text-label-md block text-on-surface-variant">Operario</span>
            <select
              id="assign-operario"
              className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setAssignOperarioId(Number(event.target.value))}
              value={assignOperarioId ?? ''}
            >
              {operarios.length === 0 ? <option value="">Sin operarios</option> : null}
              {operarios.map((item) => (
                <option key={item.operario.id} value={item.operario.id}>
                  {item.operario.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2" htmlFor="assign-parcela">
            <span className="text-label-md block text-on-surface-variant">Parcela</span>
            <select
              id="assign-parcela"
              className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
              onChange={(event) => setAssignParcelaId(Number(event.target.value))}
              value={assignParcelaId ?? ''}
            >
              {availableParcelas.length === 0 ? <option value="">Sin parcelas disponibles</option> : null}
              {availableParcelas.map((parcela) => {
                const finca = fincasById.get(parcela.fincaId)
                return (
                  <option key={parcela.id} value={parcela.id}>
                    {parcela.nombre} · {finca?.nombre ?? `Finca ${parcela.fincaId}`}
                  </option>
                )
              })}
            </select>
          </label>

          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={isSubmitting || operarios.length === 0 || availableParcelas.length === 0}
              onClick={() => void handleAssign()}
              variant="secondary"
            >
              Asignar
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {isLoading ? (
          <Card>
            <p className="text-on-surface-variant">Cargando operarios...</p>
          </Card>
        ) : null}

        {!isLoading && operarios.length === 0 ? (
          <Card>
            <p className="text-on-surface-variant">No hay operarios registrados.</p>
          </Card>
        ) : null}

        {operarios.map((item) => (
          <Card key={item.operario.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-title-lg text-on-surface">{item.operario.nombre}</h3>
                <p className="text-sm text-on-surface-variant">{item.operario.email}</p>
              </div>
              <Badge variant="neutral">{item.parcelas.length} parcelas</Badge>
            </div>

            <div className="mt-4 space-y-2">
              {item.parcelas.length === 0 ? (
                <p className="text-sm text-on-surface-variant">Sin asignaciones aún.</p>
              ) : (
                item.parcelas.map((parcela) => {
                  const finca = fincasById.get(parcela.fincaId)
                  return (
                    <div className="surface-panel flex items-center justify-between rounded-xl px-3 py-2" key={`${item.operario.id}-${parcela.id}`}>
                      <div>
                        <p className="text-sm font-semibold text-on-surface">{parcela.nombre}</p>
                        <p className="text-xs text-on-surface-variant">{finca?.nombre ?? `Finca ${parcela.fincaId}`}</p>
                      </div>
                      <button
                        aria-label={`Desasignar ${item.operario.nombre} de ${parcela.nombre}`}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-error-container text-on-error-container hover:brightness-95"
                        onClick={() => {
                          void handleUnassign(item.operario.id, parcela.id)
                        }}
                        type="button"
                      >
                        <span className="material-symbols-outlined text-base">close</span>
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </Card>
        ))}
      </div>
    </section>
  )
}
