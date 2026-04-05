import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  apiClient,
  ApiClientError,
  type CreateCultivoPayload,
  type CultivoDto,
  type ParcelaDto,
  type UpdateCultivoPayload,
} from '../../../shared/services/apiClient'
import { Badge, Button, Card, CropForm, Input } from '../../../shared/components/common'

function mapEstadoToLabel(estado: CultivoDto['estado']): string {
  if (estado === 'EN_CRECIMIENTO') {
    return 'Crecimiento'
  }

  if (estado === 'COSECHADO') {
    return 'Cosechado'
  }

  return 'Afectado'
}

function mapEstadoToBadge(estado: CultivoDto['estado']): 'safe' | 'warning' | 'danger' {
  if (estado === 'EN_CRECIMIENTO') {
    return 'safe'
  }

  if (estado === 'COSECHADO') {
    return 'warning'
  }

  return 'danger'
}

export default function CropsPage() {
  const [crops, setCrops] = useState<CultivoDto[]>([])
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [search, setSearch] = useState('')
  const [selectedEstado, setSelectedEstado] = useState<'TODOS' | CultivoDto['estado']>('TODOS')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<CultivoDto | null>(null)

  const parcelaById = useMemo(() => {
    const map = new Map<number, ParcelaDto>()
    parcelas.forEach((parcela) => {
      map.set(parcela.id, parcela)
    })
    return map
  }, [parcelas])

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const [cropsResponse, parcelasResponse] = await Promise.all([apiClient.cultivos.list(), apiClient.parcelas.list()])
      setCrops(cropsResponse)
      setParcelas(parcelasResponse)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar los cultivos.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredCrops = useMemo(() => {
    const normalized = search.trim().toLowerCase()

    return crops.filter((crop) => {
      const parcelName = parcelaById.get(crop.parcelaId)?.nombre.toLowerCase() ?? ''
      const matchesSearch =
        normalized.length === 0 ||
        crop.tipoCultivo.toLowerCase().includes(normalized) ||
        crop.observaciones?.toLowerCase().includes(normalized) ||
        parcelName.includes(normalized)

      const matchesEstado = selectedEstado === 'TODOS' || crop.estado === selectedEstado

      return matchesSearch && matchesEstado
    })
  }, [crops, search, selectedEstado, parcelaById])

  const openCreate = () => {
    setEditing(null)
    setIsFormOpen(true)
  }

  const openEdit = (crop: CultivoDto) => {
    setEditing(crop)
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (isSubmitting) {
      return
    }

    setEditing(null)
    setIsFormOpen(false)
  }

  const handleSave = async (payload: CreateCultivoPayload) => {
    setIsSubmitting(true)
    setError(null)

    try {
      if (editing) {
        const updatePayload: UpdateCultivoPayload = {
          tipoCultivo: payload.tipoCultivo,
          fechaSiembra: payload.fechaSiembra,
          estado: payload.estado,
          observaciones: payload.observaciones,
        }
        const updated = await apiClient.cultivos.update(editing.id, updatePayload)
        setCrops((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      } else {
        const created = await apiClient.cultivos.create(payload)
        setCrops((current) => [created, ...current])
      }

      setEditing(null)
      setIsFormOpen(false)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible guardar el cultivo.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (crop: CultivoDto) => {
    const confirmed = window.confirm(`¿Deseas eliminar el cultivo "${crop.tipoCultivo}"?`)
    if (!confirmed) {
      return
    }

    setError(null)
    try {
      await apiClient.cultivos.delete(crop.id)
      setCrops((current) => current.filter((item) => item.id !== crop.id))
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible eliminar el cultivo.')
      }
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Gestión de Cultivos</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Administra tus cultivos, monitorea su estado de crecimiento y planifica la producción.
          </p>
        </div>
        <Button leadingIcon="add_circle" onClick={openCreate} variant="primary">
          Nuevo Cultivo
        </Button>
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card className="p-4 text-center">
          <span className="material-symbols-outlined text-primary">eco</span>
          <p className="font-headline mt-2 text-2xl font-bold text-on-surface">{isLoading ? '...' : crops.length}</p>
          <p className="text-label-md text-on-surface-variant">Cultivos Activos</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="material-symbols-outlined text-primary">landscape</span>
          <p className="font-headline mt-2 text-2xl font-bold text-on-surface">{isLoading ? '...' : parcelas.length}</p>
          <p className="text-label-md text-on-surface-variant">Área Sembrada</p>
        </Card>
        <Card className="p-4 text-center">
          <span className="material-symbols-outlined text-primary">trending_up</span>
          <p className="font-headline mt-2 text-2xl font-bold text-on-surface">{isLoading ? '...' : filteredCrops.length}</p>
          <p className="text-label-md text-on-surface-variant">Resultados filtrados</p>
        </Card>
        <Card className="bg-error-container p-4 text-center">
          <span className="material-symbols-outlined text-on-error-container">warning</span>
          <p className="font-headline mt-2 text-2xl font-bold text-on-error-container">{crops.filter((item) => item.estado === 'AFECTADO').length}</p>
          <p className="text-label-md text-on-error-container">En Alerta</p>
        </Card>
      </div>

      <Card>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            id="crop-search"
            label="Buscar cultivo"
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Nombre, tipo o parcela..."
            type="text"
            value={search}
          />
          <label className="space-y-2" htmlFor="crop-status-filter">
            <span className="text-label-md block text-on-surface-variant">Tipo de cultivo</span>
            <select
              id="crop-status-filter"
              className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-4 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
              onChange={(event) => setSelectedEstado(event.target.value as 'TODOS' | CultivoDto['estado'])}
              value={selectedEstado}
            >
              <option value="TODOS">Todos</option>
              <option value="EN_CRECIMIENTO">En crecimiento</option>
              <option value="COSECHADO">Cosechado</option>
              <option value="AFECTADO">Afectado</option>
            </select>
          </label>
          <div className="flex items-end">
            <Button className="w-full" leadingIcon="refresh" onClick={() => void loadData()} variant="primary">
              Recargar
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {isLoading ? (
          <Card>
            <p className="text-on-surface-variant">Cargando cultivos...</p>
          </Card>
        ) : null}

        {!isLoading && filteredCrops.length === 0 ? (
          <Card>
            <p className="text-on-surface-variant">No se encontraron cultivos con los filtros actuales.</p>
          </Card>
        ) : null}

        {filteredCrops.map((crop) => (
          <Card className="p-5" key={crop.id}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary-fixed">
                  <span className="material-symbols-outlined text-primary">eco</span>
                </div>
                <div>
                  <h3 className="font-semibold text-on-surface">{crop.tipoCultivo}</h3>
                  <p className="text-xs text-on-surface-variant">{parcelaById.get(crop.parcelaId)?.nombre ?? 'Sin parcela'}</p>
                </div>
              </div>
              <Badge variant={mapEstadoToBadge(crop.estado)}>{mapEstadoToLabel(crop.estado)}</Badge>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-2 text-center">
              <div className="surface-panel rounded-xl p-2">
                <p className="text-label-md text-on-surface-variant">Estado</p>
                <p className="mt-1 text-xs font-semibold text-on-surface">{mapEstadoToLabel(crop.estado)}</p>
              </div>
              <div className="surface-panel rounded-xl p-2">
                <p className="text-label-md text-on-surface-variant">Parcela ID</p>
                <p className="mt-1 text-xs font-semibold text-on-surface">#{crop.parcelaId}</p>
              </div>
              <div className="surface-panel rounded-xl p-2">
                <p className="text-label-md text-on-surface-variant">Siembra</p>
                <p className="mt-1 text-xs font-semibold text-on-surface">{new Date(crop.fechaSiembra).toLocaleDateString('es-CO', { month: 'short', day: 'numeric' })}</p>
              </div>
            </div>

            {crop.observaciones ? <p className="mt-4 text-xs text-on-surface-variant">{crop.observaciones}</p> : null}

            <div className="mt-4 flex items-center gap-2">
              <Button className="flex-1" onClick={() => openEdit(crop)} variant="tertiary">Editar</Button>
              <button
                aria-label={`Eliminar ${crop.tipoCultivo}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-error-container text-on-error-container hover:brightness-95 transition-colors"
                onClick={() => {
                  void handleDelete(crop)
                }}
                type="button"
              >
                <span className="material-symbols-outlined" style={{ fontSize: '20px' }}>delete</span>
              </button>
            </div>
          </Card>
        ))}
      </div>

      {isFormOpen ? (
        <CropForm
          initialValue={editing}
          isSubmitting={isSubmitting}
          mode={editing ? 'edit' : 'create'}
          onCancel={closeForm}
          onSubmit={handleSave}
          parcelas={parcelas}
        />
      ) : null}
    </section>
  )
}
