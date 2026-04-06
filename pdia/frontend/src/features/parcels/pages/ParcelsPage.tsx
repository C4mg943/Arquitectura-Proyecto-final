import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  apiClient,
  ApiClientError,
  type CreateParcelaPayload,
  type FincaDto,
  type ParcelaDto,
  type UpdateParcelaPayload,
} from '../../../shared/services/apiClient'
import { Badge, Button, Card, Input, ParcelForm } from '../../../shared/components/common'
import { useAuthStore } from '../../../store/authStore'

function formatHectareas(total: number): string {
  return total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function getStatus(parcela: ParcelaDto): { variant: 'safe' | 'warning' | 'danger'; text: string } {
  if (parcela.hectareas >= 100) {
    return { variant: 'safe', text: 'Productivo' }
  }

  if (parcela.hectareas >= 30) {
    return { variant: 'warning', text: 'En seguimiento' }
  }

  return { variant: 'danger', text: 'Prioritario' }
}

export default function ParcelsPage() {
  const user = useAuthStore((state) => state.user)
  const canManageParcelas = user?.rol === 'PRODUCTOR'
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [fincas, setFincas] = useState<FincaDto[]>([])
  const [filter, setFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<ParcelaDto | null>(null)

  const loadParcelas = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [parcelasResponse, fincasResponse] = await Promise.all([
        apiClient.parcelas.list(),
        canManageParcelas ? apiClient.fincas.list() : Promise.resolve([] as FincaDto[]),
      ])
      setParcelas(parcelasResponse)
      setFincas(fincasResponse)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar las parcelas.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [canManageParcelas])

  useEffect(() => {
    void loadParcelas()
  }, [loadParcelas])

  const filteredParcelas = useMemo(() => {
    const normalized = filter.trim().toLowerCase()
    if (!normalized) {
      return parcelas
    }

    return parcelas.filter((parcela) => {
      return parcela.nombre.toLowerCase().includes(normalized) || parcela.municipio.toLowerCase().includes(normalized)
    })
  }, [filter, parcelas])

  const totalHectareas = useMemo(
    () => parcelas.reduce((sum, parcela) => sum + Number(parcela.hectareas), 0),
    [parcelas],
  )

  const heading = canManageParcelas ? 'Inventario de Parcelas' : 'Mis Parcelas Asignadas'
  const subtitle = canManageParcelas
    ? 'Gestiona tus activos agrícolas y monitorea rendimiento en todas las ubicaciones registradas.'
    : 'Consulta las parcelas que tienes asignadas y registra actividades en sus cultivos.'

  const openCreate = () => {
    if (canManageParcelas && fincas.length === 0) {
      setError('Debes crear al menos una finca antes de registrar parcelas.')
      return
    }

    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (parcela: ParcelaDto) => {
    setEditing(parcela)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (isSubmitting) {
      return
    }

    setIsFormOpen(false)
    setEditing(null)
  }

  const handleSave = async (payload: CreateParcelaPayload) => {
    if (!canManageParcelas) {
      setError('Solo los productores pueden crear o editar parcelas.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (editing) {
        const updatePayload: UpdateParcelaPayload = payload
        const updated = await apiClient.parcelas.update(editing.id, updatePayload)
        setParcelas((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      } else {
        const created = await apiClient.parcelas.create(payload)
        setParcelas((current) => [created, ...current])
      }

      setIsFormOpen(false)
      setEditing(null)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible guardar la parcela.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (parcela: ParcelaDto) => {
    if (!canManageParcelas) {
      setError('Solo los productores pueden eliminar parcelas.')
      return
    }

    const confirmed = window.confirm(`¿Deseas eliminar la parcela "${parcela.nombre}"?`)
    if (!confirmed) {
      return
    }

    setError(null)
    try {
      await apiClient.parcelas.delete(parcela.id)
      setParcelas((current) => current.filter((item) => item.id !== parcela.id))
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible eliminar la parcela.')
      }
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">{heading}</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">{subtitle}</p>
        </div>
        {canManageParcelas ? (
          <Button leadingIcon="add_circle" onClick={openCreate} variant="primary">
            Añadir Parcela
          </Button>
        ) : null}
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6" title="Área total">
          <p className="font-headline text-4xl font-bold text-primary">{isLoading ? '...' : `${formatHectareas(totalHectareas)} Ha`}</p>
        </Card>
        <Card className="surface-panel p-6" title="Parcelas activas">
          <p className="font-headline text-4xl font-bold text-primary">{isLoading ? '...' : parcelas.length}</p>
        </Card>
        <Card className="bg-secondary-container p-6" title="Estado promedio">
          <p className="font-headline text-3xl font-bold text-on-secondary-container">{parcelas.length === 0 ? 'Sin datos' : 'Óptimo'}</p>
        </Card>
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <Input
          id="parcel-filter"
          label="Buscar"
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filtrar por nombre o municipio..."
          type="text"
          value={filter}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <Card>
            <p className="text-on-surface-variant">Cargando parcelas...</p>
          </Card>
        ) : null}

        {!isLoading && filteredParcelas.length === 0 ? (
          <Card>
            <p className="text-on-surface-variant">No hay parcelas registradas.</p>
          </Card>
        ) : null}

        {filteredParcelas.map((parcel) => {
          const badge = getStatus(parcel)
          return (
            <Card className="overflow-hidden p-0" key={parcel.id}>
              <div className="h-40 bg-gradient-to-br from-primary-container to-surface-container-high" />
              <div className="space-y-4 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-title-lg wrap-break-word text-on-surface">{parcel.nombre}</h3>
                    <p className="mt-1 text-sm text-on-surface-variant">{parcel.municipio}</p>
                  </div>
                  <Badge variant={badge.variant}>{badge.text}</Badge>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="surface-panel rounded-xl p-3">
                    <p className="text-label-md text-on-surface-variant">ÁREA</p>
                    <p className="font-headline mt-1 text-lg font-bold text-on-surface">{parcel.hectareas} Ha</p>
                  </div>
                  <div className="surface-panel rounded-xl p-3">
                    <p className="text-label-md text-on-surface-variant">COORDENADAS</p>
                    <p className="mt-1 text-xs font-semibold text-on-surface">{parcel.latitud.toFixed(4)}, {parcel.longitud.toFixed(4)}</p>
                  </div>
                </div>

                {canManageParcelas ? (
                  <p className="text-xs text-on-surface-variant">Finca #{parcel.fincaId}</p>
                ) : null}

                {canManageParcelas ? (
                  <div className="flex items-center gap-2">
                    <Button className="flex-1" onClick={() => openEdit(parcel)} variant="tertiary">
                      Editar
                    </Button>
                    <button
                      aria-label={`Eliminar ${parcel.nombre}`}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-error-container text-on-error-container hover:brightness-95"
                      onClick={() => {
                        void handleDelete(parcel)
                      }}
                      type="button"
                    >
                      <span className="material-symbols-outlined">delete</span>
                    </button>
                  </div>
                ) : null}
              </div>
            </Card>
          )
        })}
      </div>

      {isFormOpen && canManageParcelas ? (
        <ParcelForm
          fincas={fincas}
          initialValue={editing}
          isSubmitting={isSubmitting}
          mode={editing ? 'edit' : 'create'}
          onCancel={closeForm}
          onSubmit={handleSave}
        />
      ) : null}
    </section>
  )
}
