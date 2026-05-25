import { useCallback, useEffect, useState } from 'react'

import { Button, Card, Input } from '../../../shared/components/common'
import {
  apiClient,
  ApiClientError,
  type CreateUserPayload,
  type UserDto,
  type TecnicoAsignadoDto,
} from '../../../shared/services/apiClient'

interface TecnicoFormState {
  nombre: string
  identificacion: string
  email: string
  password: string
}

const initialForm: TecnicoFormState = {
  nombre: '',
  identificacion: '',
  email: '',
  password: '',
}

export default function GestionTecnicosPage() {
  const [tecnicos, setTecnicos] = useState<UserDto[]>([])
  const [productores, setProductores] = useState<UserDto[]>([])
  const [asignaciones, setAsignaciones] = useState<Map<number, TecnicoAsignadoDto[]>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [form, setForm] = useState<TecnicoFormState>(initialForm)
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<number | null>(null)
  const [selectedProductorId, setSelectedProductorId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [tecnicosData, productoresData] = await Promise.all([
        apiClient.users.listByRol('TECNICO'),
        apiClient.users.listByRol('PRODUCTOR'),
      ])
      setTecnicos(tecnicosData)
      setProductores(productoresData)

      if (tecnicosData.length > 0) setSelectedTecnicoId(tecnicosData[0].id)
      if (productoresData.length > 0) setSelectedProductorId(productoresData[0].id)

      // Cargar asignaciones de cada técnico
      const asignMap = new Map<number, TecnicoAsignadoDto[]>()
      await Promise.all(
        productoresData.map(async (p) => {
          try {
            const res = await apiClient.get<TecnicoAsignadoDto[]>(
              `/api/auth/tecnicos/asignados?productorId=${p.id}`,
            )
            asignMap.set(p.id, res)
          } catch {
            asignMap.set(p.id, [])
          }
        }),
      )
      setAsignaciones(asignMap)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar los datos.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const handleCreate = async () => {
    if (!form.nombre || !form.identificacion || !form.email || !form.password) {
      setError('Todos los campos son requeridos.')
      return
    }
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      const payload: CreateUserPayload = {
        nombre: form.nombre,
        identificacion: form.identificacion,
        email: form.email,
        password: form.password,
        rol: 'TECNICO',
      }
      await apiClient.users.create(payload)
      setSuccess('Técnico creado correctamente.')
      setForm(initialForm)
      void loadData()
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible crear el técnico.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este técnico? Se eliminarán sus asignaciones.')) return
    setError(null)
    setSuccess(null)
    try {
      await apiClient.users.delete(id)
      setSuccess('Técnico eliminado correctamente.')
      void loadData()
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible eliminar el técnico.')
      }
    }
  }

  const handleAsignar = async () => {
    if (!selectedTecnicoId || !selectedProductorId) {
      setError('Selecciona técnico y productor.')
      return
    }
    setError(null)
    setSuccess(null)
    setIsSubmitting(true)
    try {
      await apiClient.tecnicos.asignar(selectedTecnicoId, selectedProductorId)
      setSuccess('Técnico asignado al productor correctamente.')
      void loadData()
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible asignar el técnico.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDesasignar = async (tecnicoId: number, productorId: number) => {
    setError(null)
    setSuccess(null)
    try {
      await apiClient.tecnicos.desasignar(tecnicoId, productorId)
      setSuccess('Asignación eliminada correctamente.')
      void loadData()
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible desasignar el técnico.')
      }
    }
  }

  // helper usado en el template para mostrar nombre del productor
  const _getProductorName = (id: number) => productores.find((p) => p.id === id)?.nombre ?? `Productor #${id}`
  void _getProductorName

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Gestión de Técnicos</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Crea técnicos agrónomos y asígnalos a productores para que puedan ver sus fincas y dar recomendaciones.
        </p>
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}
      {success ? (
        <p className="rounded-xl bg-tertiary-container px-3 py-2 text-sm font-semibold text-on-tertiary-container">{success}</p>
      ) : null}

      <Card title="Registrar Nuevo Técnico">
        <div className="grid gap-4 md:grid-cols-2">
          <Input id="tec-nombre" label="Nombre completo"
            onChange={(e) => setForm((c) => ({ ...c, nombre: e.target.value }))}
            placeholder="María García" type="text" value={form.nombre} />
          <Input id="tec-id" label="Identificación"
            onChange={(e) => setForm((c) => ({ ...c, identificacion: e.target.value }))}
            placeholder="123456789" type="text" value={form.identificacion} />
          <Input id="tec-email" label="Correo"
            onChange={(e) => setForm((c) => ({ ...c, email: e.target.value }))}
            placeholder="tecnico@correo.com" type="email" value={form.email} />
          <Input id="tec-pass" label="Contraseña"
            onChange={(e) => setForm((c) => ({ ...c, password: e.target.value }))}
            placeholder="******" type="password" value={form.password} />
        </div>
        <div className="mt-4 flex justify-end">
          <Button disabled={isSubmitting} onClick={() => void handleCreate()} variant="primary">
            {isSubmitting ? 'Guardando...' : 'Registrar técnico'}
          </Button>
        </div>
      </Card>

      <Card title="Asignar Técnico a Productor">
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-2" htmlFor="sel-tecnico">
            <span className="text-label-md block text-on-surface-variant">Técnico</span>
            <select id="sel-tecnico"
              className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60"
              onChange={(e) => setSelectedTecnicoId(Number(e.target.value))}
              value={selectedTecnicoId ?? ''}>
              {tecnicos.length === 0 ? <option value="">Sin técnicos</option> : null}
              {tecnicos.map((t) => (
                <option key={t.id} value={t.id}>{t.nombre}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2" htmlFor="sel-productor">
            <span className="text-label-md block text-on-surface-variant">Productor</span>
            <select id="sel-productor"
              className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60"
              onChange={(e) => setSelectedProductorId(Number(e.target.value))}
              value={selectedProductorId ?? ''}>
              {productores.length === 0 ? <option value="">Sin productores</option> : null}
              {productores.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <Button className="w-full"
              disabled={isSubmitting || !selectedTecnicoId || !selectedProductorId}
              onClick={() => void handleAsignar()} variant="secondary">
              Asignar
            </Button>
          </div>
        </div>
      </Card>

      <Card title={`Técnicos registrados (${tecnicos.length})`}>
        {isLoading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : tecnicos.length === 0 ? (
          <p className="text-on-surface-variant">No hay técnicos registrados.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {tecnicos.map((tecnico) => (
              <Card key={tecnico.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-title-lg text-on-surface">{tecnico.nombre}</h3>
                    <p className="text-sm text-on-surface-variant">{tecnico.email}</p>
                    <p className="text-xs text-on-surface-variant">{tecnico.identificacion}</p>
                  </div>
                  <Button size="small" variant="danger"
                    onClick={() => void handleDelete(tecnico.id)}>
                    Eliminar
                  </Button>
                </div>

                {/* Productores asignados a este técnico */}
                <div className="mt-4 space-y-2">
                  <p className="text-label-md text-on-surface-variant">Productores asignados:</p>
                  {productores
                    .filter((p) => {
                      const asig = asignaciones.get(p.id) ?? []
                      return asig.some((a) => a.id === tecnico.id)
                    })
                    .map((p) => (
                      <div key={p.id}
                        className="surface-panel flex items-center justify-between rounded-xl px-3 py-2">
                        <p className="text-sm font-semibold text-on-surface">{p.nombre}</p>
                        <button
                          aria-label={`Desasignar ${tecnico.nombre} de ${p.nombre}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-error-container text-on-error-container hover:brightness-95"
                          onClick={() => void handleDesasignar(tecnico.id, p.id)}
                          type="button">
                          <span className="material-symbols-outlined text-base">close</span>
                        </button>
                      </div>
                    ))}
                  {productores.filter((p) => {
                    const asig = asignaciones.get(p.id) ?? []
                    return asig.some((a) => a.id === tecnico.id)
                  }).length === 0 ? (
                    <p className="text-sm text-on-surface-variant">Sin productores asignados.</p>
                  ) : null}
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}
