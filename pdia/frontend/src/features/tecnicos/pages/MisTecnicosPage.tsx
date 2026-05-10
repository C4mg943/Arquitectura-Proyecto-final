import { useCallback, useEffect, useState } from 'react'

import { Button, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type UserDto, type TecnicoAsignadoDto } from '../../../shared/services/apiClient'
import { useAuthStore } from '../../../store/authStore'

export default function MisTecnicosPage() {
  const currentUser = useAuthStore((state) => state.user)
  const [tecnicosAsignados, setTecnicosAsignados] = useState<TecnicoAsignadoDto[]>([])
  const [todosTecnicos, setTodosTecnicos] = useState<UserDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [selectedTecnicoId, setSelectedTecnicoId] = useState<number | null>(null)

  const loadData = useCallback(async () => {
    if (!currentUser) return
    setIsLoading(true)
    setError(null)

    try {
      const [asignados, tecnicos] = await Promise.all([
        apiClient.tecnicos.listAsignados(),
        apiClient.users.listByRol('TECNICO'),
      ])
      setTecnicosAsignados(asignados)
      setTodosTecnicos(tecnicos)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar los datos.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [currentUser])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const tecnicoIdsAsignados = tecnicosAsignados.map((t) => t.id)
  const tecnicosDisponibles = todosTecnicos.filter((t) => !tecnicoIdsAsignados.includes(t.id))

  const handleAsignar = async () => {
    if (!selectedTecnicoId || !currentUser) {
      setError('Selecciona un técnico.')
      return
    }

    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      await apiClient.tecnicos.asignar(selectedTecnicoId, currentUser.id)
      setSuccess('Técnico asignado correctamente.')
      setSelectedTecnicoId(null)
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

  const handleDesasignar = async (tecnicoId: number) => {
    if (!confirm('¿Estás seguro de desasignar este técnico?')) return

    setError(null)
    setSuccess(null)

    try {
      await apiClient.tecnicos.desasignar(tecnicoId, currentUser?.id || 0)
      setSuccess('Técnico desasignado correctamente.')
      void loadData()
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible desasignar el técnico.')
      }
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Mis Técnicos Agrónomos</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Asigna técnicos agrónomos para que puedan ver tus fincas, parcelas y cultivos, y darte recomendaciones.
        </p>
      </header>

      {error && (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      )}
      {success && (
        <p className="rounded-xl bg-tertiary-container px-3 py-2 text-sm font-semibold text-on-tertiary-container">{success}</p>
      )}

      <Card title="Asignar Nuevo Técnico">
        <div className="flex flex-wrap gap-4">
          <select
            className="flex-1 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/60"
            value={selectedTecnicoId ?? ''}
            onChange={(event) => setSelectedTecnicoId(Number(event.target.value))}
          >
            <option value="">Seleccionar técnico...</option>
            {tecnicosDisponibles.map((tecnico) => (
              <option key={tecnico.id} value={tecnico.id}>
                {tecnico.nombre} - {tecnico.email}
              </option>
            ))}
          </select>
          <Button
            disabled={!selectedTecnicoId || isSubmitting}
            onClick={() => void handleAsignar()}
            variant="primary"
          >
            {isSubmitting ? 'Asignando...' : 'Asignar Técnico'}
          </Button>
        </div>
      </Card>

      <Card title="Técnicos Asignados">
        {isLoading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : tecnicosAsignados.length === 0 ? (
          <p className="text-on-surface-variant">No hay técnicos asignados.</p>
        ) : (
          <div className="space-y-3">
            {tecnicosAsignados.map((tecnico) => (
              <div key={tecnico.id} className="surface-panel flex items-center justify-between rounded-xl p-4">
                <div>
                  <h3 className="font-semibold text-on-surface">{tecnico.nombre}</h3>
                  <p className="text-sm text-on-surface-variant">{tecnico.email}</p>
                  <p className="text-xs text-on-surface-variant">
                    Asignado: {new Date(tecnico.fechaAsignacion).toLocaleDateString()}
                  </p>
                </div>
                <Button size="small" onClick={() => handleDesasignar(tecnico.id)} variant="danger">
                  Desasignar
                </Button>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}