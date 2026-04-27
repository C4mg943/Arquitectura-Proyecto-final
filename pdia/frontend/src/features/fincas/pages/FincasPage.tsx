import { useCallback, useEffect, useMemo, useState } from 'react'

import {
  apiClient,
  ApiClientError,
  type CreateFincaPayload,
  type FincaDto,
  type UpdateFincaPayload,
} from '../../../shared/services/apiClient'
import { Badge, Button, Card, Input } from '../../../shared/components/common'

function formatArea(total: number): string {
  return total.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })
}

function getTipoLabel(tipo: FincaDto['tipoFinca']): string {
  if (tipo === 'AGRICOLA') return 'Agrícola'
  if (tipo === 'GANADERA') return 'Ganadera'
  if (tipo === 'MIXTA') return 'Mixta'
  return 'Forestal'
}

function getBadge(tipo: FincaDto['tipoFinca']): { variant: 'safe' | 'warning' | 'neutral'; text: string } {
  if (tipo === 'AGRICOLA') return { variant: 'safe', text: 'Agrícola' }
  if (tipo === 'GANADERA') return { variant: 'warning', text: 'Ganadera' }
  if (tipo === 'MIXTA') return { variant: 'neutral', text: 'Mixta' }
  return { variant: 'neutral', text: 'Forestal' }
}

interface FincaFormState {
  nombre: string
  ubicacion: string
  descripcion: string
  area: string
  tipoFinca: FincaDto['tipoFinca']
  fechaRegistro: string
  codigoIcaInvima: string
}

const initialForm: FincaFormState = {
  nombre: '',
  ubicacion: '',
  descripcion: '',
  area: '',
  tipoFinca: 'AGRICOLA',
  fechaRegistro: new Date().toISOString().split('T')[0],
  codigoIcaInvima: '',
}

export default function FincasPage() {
  const [fincas, setFincas] = useState<FincaDto[]>([])
  const [filter, setFilter] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editing, setEditing] = useState<FincaDto | null>(null)
  const [form, setForm] = useState<FincaFormState>(initialForm)

  const loadFincas = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.fincas.list()
      setFincas(response)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar las fincas.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadFincas()
  }, [loadFincas])

  const filteredFincas = useMemo(() => {
    const normalized = filter.trim().toLowerCase()
    if (!normalized) {
      return fincas
    }

    return fincas.filter((finca) => {
      return (
        finca.nombre.toLowerCase().includes(normalized) ||
        finca.ubicacion.toLowerCase().includes(normalized) ||
        (finca.codigoIcaInvima ?? '').toLowerCase().includes(normalized)
      )
    })
  }, [filter, fincas])

  const areaTotal = useMemo(() => fincas.reduce((sum, finca) => sum + Number(finca.area), 0), [fincas])

  const openCreate = () => {
    setEditing(null)
    setForm(initialForm)
    setIsFormOpen(true)
  }

  const openEdit = (finca: FincaDto) => {
    setEditing(finca)
    setForm({
      nombre: finca.nombre,
      ubicacion: finca.ubicacion,
      descripcion: finca.descripcion ?? '',
      area: String(finca.area),
      tipoFinca: finca.tipoFinca,
      fechaRegistro: finca.fechaRegistro,
      codigoIcaInvima: finca.codigoIcaInvima ?? '',
    })
    setIsFormOpen(true)
  }

  const closeForm = () => {
    if (isSubmitting) {
      return
    }
    setIsFormOpen(false)
    setEditing(null)
    setForm(initialForm)
  }

  const handleSave = async () => {
    if (
      form.nombre.trim().length < 2 ||
      form.ubicacion.trim().length < 2 ||
      Number(form.area) <= 0 ||
      form.fechaRegistro.trim().length === 0
    ) {
      setError('Completa todos los campos obligatorios de la finca.')
      return
    }

    const payload: CreateFincaPayload = {
      nombre: form.nombre.trim(),
      ubicacion: form.ubicacion.trim(),
      descripcion: form.descripcion.trim() || undefined,
      area: Number(form.area),
      tipoFinca: form.tipoFinca,
      fechaRegistro: form.fechaRegistro,
      codigoIcaInvima: form.codigoIcaInvima.trim() || undefined,
    }

    setIsSubmitting(true)
    setError(null)

    try {
      if (editing) {
        const updatePayload: UpdateFincaPayload = payload
        const updated = await apiClient.fincas.update(editing.id, updatePayload)
        setFincas((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      } else {
        const created = await apiClient.fincas.create(payload)
        setFincas((current) => [created, ...current])
      }

      setIsFormOpen(false)
      setEditing(null)
      setForm(initialForm)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible guardar la finca.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (finca: FincaDto) => {
    const confirmed = window.confirm(`¿Deseas eliminar la finca "${finca.nombre}"?`)
    if (!confirmed) {
      return
    }

    setError(null)
    try {
      await apiClient.fincas.delete(finca.id)
      setFincas((current) => current.filter((item) => item.id !== finca.id))
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible eliminar la finca.')
      }
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Gestión de Fincas</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Organiza tus unidades productivas. Cada finca puede contener varias parcelas y operarios asignados.
          </p>
        </div>
        <Button leadingIcon="add_circle" onClick={openCreate} variant="primary">
          Añadir Finca
        </Button>
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="p-6" title="Área total en fincas">
          <p className="font-headline text-4xl font-bold text-primary">{isLoading ? '...' : `${formatArea(areaTotal)} Ha`}</p>
        </Card>
        <Card className="surface-panel p-6" title="Fincas registradas">
          <p className="font-headline text-4xl font-bold text-primary">{isLoading ? '...' : fincas.length}</p>
        </Card>
        <Card className="bg-secondary-container p-6" title="Código ICA/INVIMA">
          <p className="font-headline text-3xl font-bold text-on-secondary-container">
            {fincas.filter((finca) => Boolean(finca.codigoIcaInvima)).length}
          </p>
        </Card>
      </div>

      <Input
        id="finca-filter"
        label="Buscar"
        onChange={(event) => setFilter(event.target.value)}
        placeholder="Filtrar por nombre, ubicación o código..."
        type="text"
        value={filter}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          <Card>
            <p className="text-on-surface-variant">Cargando fincas...</p>
          </Card>
        ) : null}

        {!isLoading && filteredFincas.length === 0 ? (
          <Card>
            <p className="text-on-surface-variant">No hay fincas registradas.</p>
          </Card>
        ) : null}

        {filteredFincas.map((finca) => {
          const badge = getBadge(finca.tipoFinca)
          const inicial = finca.nombre.charAt(0).toUpperCase()
          return (
            <Card className="w-full overflow-visible p-0" key={finca.id}>
              {/* BODY */}
              <div className="flex items-start gap-3 p-4">
                {/* Avatar */}
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary text-on-primary">
                  <span className="font-headline text-2xl font-bold">{inicial}</span>
                </div>

                {/* Contenido */}
                <div className="min-w-0 flex-1">
                  {/* Nombre + Badge en la misma línea, badge baja si no cabe */}
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="text-base font-bold text-on-surface">{finca.nombre}</h3>
                    <Badge className="shrink-0 px-3 py-0.5 text-xs" variant={badge.variant}>
                      {badge.text}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-on-surface-variant">{finca.ubicacion}</p>
                </div>
              </div>

              {/* Pills de stats — fuera del flex para usar el ancho total */}
              <div className="grid grid-cols-2 gap-2 px-4 pb-4">
                <div className="surface-panel rounded-xl p-3">
                  <p className="text-xs font-medium text-on-surface-variant">ÁREA</p>
                  <p className="mt-1 whitespace-nowrap text-xl font-bold text-on-surface">
                    {finca.area} Ha
                  </p>
                </div>
                <div className="surface-panel rounded-xl p-3">
                  <p className="text-xs font-medium text-on-surface-variant">TIPO</p>
                  <p className="mt-1 text-base font-semibold text-on-surface">
                    {getTipoLabel(finca.tipoFinca)}
                  </p>
                </div>
              </div>

{/* Footer */}
<div className="flex items-center gap-2 border-t border-outline-variant px-4 py-3">
  {/* shrink-0 + sin truncate = siempre visible */}
  <span className="shrink-0 text-xs text-on-surface-variant">
    ICA: {finca.codigoIcaInvima ?? 'Sin código'}
  </span>
  <div className="flex-1" />
  <Button
    className="h-9 shrink-0 px-4 text-sm"
    onClick={() => openEdit(finca)}
    variant="tertiary"
  >
    Editar
  </Button>
  <button
    aria-label={`Eliminar ${finca.nombre}`}
    className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-error-container text-on-error-container hover:brightness-95"
    onClick={() => { void handleDelete(finca) }}
    type="button"
  >
    <span className="material-symbols-outlined text-base">delete</span>
  </button>
</div>
            </Card>
          )
        })}
      </div>

      {isFormOpen ? (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-3xl rounded-3xl bg-surface p-6 shadow-[0_20px_60px_rgb(0_0_0_/_30%)]">
            <h2 className="mb-4 text-xl font-bold text-on-surface">{editing ? 'Editar finca' : 'Nueva finca'}</h2>

            <div className="grid gap-4 md:grid-cols-2">
              <Input
                id="finca-nombre"
                label="Nombre"
                onChange={(event) => setForm((current) => ({ ...current, nombre: event.target.value }))}
                placeholder="Finca La Esperanza"
                type="text"
                value={form.nombre}
              />

              <Input
                id="finca-ubicacion"
                label="Ubicación"
                onChange={(event) => setForm((current) => ({ ...current, ubicacion: event.target.value }))}
                placeholder="Santa Marta, Vereda El Mamey"
                type="text"
                value={form.ubicacion}
              />

              <Input
                id="finca-area"
                label="Área (Ha)"
                min="0"
                onChange={(event) => setForm((current) => ({ ...current, area: event.target.value }))}
                placeholder="120"
                step="0.01"
                type="number"
                value={form.area}
              />

              <label className="space-y-2" htmlFor="finca-tipo">
                <span className="text-label-md block text-on-surface-variant">Tipo de finca</span>
                <select
                  id="finca-tipo"
                  className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      tipoFinca: event.target.value as FincaFormState['tipoFinca'],
                    }))
                  }
                  value={form.tipoFinca}
                >
                  <option value="AGRICOLA">Agrícola</option>
                  <option value="GANADERA">Ganadera</option>
                  <option value="MIXTA">Mixta</option>
                  <option value="FORESTAL">Forestal</option>
                </select>
              </label>

              <Input
                id="finca-fecha"
                label="Fecha de registro"
                onChange={(event) => setForm((current) => ({ ...current, fechaRegistro: event.target.value }))}
                type="date"
                value={form.fechaRegistro}
              />

              <Input
                id="finca-codigo"
                label="Código ICA/INVIMA"
                onChange={(event) => setForm((current) => ({ ...current, codigoIcaInvima: event.target.value }))}
                placeholder="ICA-001-2026"
                type="text"
                value={form.codigoIcaInvima}
              />

              <div className="md:col-span-2">
                <label className="space-y-2" htmlFor="finca-descripcion">
                  <span className="text-label-md block text-on-surface-variant">Descripción</span>
                  <textarea
                    id="finca-descripcion"
                    className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/30"
                    onChange={(event) => setForm((current) => ({ ...current, descripcion: event.target.value }))}
                    placeholder="Detalles de la finca"
                    rows={4}
                    value={form.descripcion}
                  />
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <Button disabled={isSubmitting} onClick={closeForm} type="button" variant="tertiary">
                Cancelar
              </Button>
              <Button disabled={isSubmitting} onClick={() => void handleSave()} type="button" variant="primary">
                {isSubmitting ? 'Guardando...' : editing ? 'Guardar cambios' : 'Crear finca'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
