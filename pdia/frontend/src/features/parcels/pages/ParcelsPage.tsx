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
  const inicial = parcel.nombre.charAt(0).toUpperCase()
  return (
    <Card className="w-full overflow-visible p-0" key={parcel.id}>
      {/* BODY */}
      <div className="flex items-start gap-3 p-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
          <span className="font-headline text-2xl font-bold">{inicial}</span>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="text-base font-bold text-on-surface">{parcel.nombre}</h3>
            <Badge className="shrink-0 px-3 py-0.5 text-xs" variant={badge.variant}>
              {badge.text}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-on-surface-variant">{parcel.municipio}</p>
        </div>
      </div>

{/* Pills */}
<div className="grid grid-cols-2 gap-2 px-4 pb-4">
  <div className="surface-panel rounded-xl p-3">
    <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">Área</p>
    <p className="mt-1 whitespace-nowrap text-xl font-bold text-on-surface">
      {parcel.hectareas} Ha
    </p>
  </div>
  <div className="surface-panel rounded-xl p-3">
    <p className="text-[10px] font-medium uppercase tracking-wide text-on-surface-variant">Coordenadas</p>
    {/* Dos líneas en lugar de truncar */}
    <p className="mt-1 text-xs font-semibold leading-snug text-on-surface">
      {parcel.latitud.toFixed(3)}<br />
      {parcel.longitud.toFixed(3)}
    </p>
  </div>
</div>

{/* Footer — finca ID siempre visible */}
{canManageParcelas ? (
  <div className="flex items-center gap-2 border-t border-outline-variant px-4 py-3">
    <span className="shrink-0 text-xs text-on-surface-variant">
      Finca #{parcel.fincaId}
    </span>
    <div className="flex-1" />
    <Button
      className="h-9 shrink-0 px-4 text-sm"
      onClick={() => openEdit(parcel)}
      variant="tertiary"
    >
      Editar
    </Button>
    <button
      aria-label={`Eliminar ${parcel.nombre}`}
      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-error-container text-on-error-container hover:brightness-95"
      onClick={() => { void handleDelete(parcel) }}
      type="button"
    >
      <span className="material-symbols-outlined text-base">delete</span>
    </button>
  </div>
) : null}
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
