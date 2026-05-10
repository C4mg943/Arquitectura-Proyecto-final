import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type CultivoDto, type RecomendacionDto } from '../../../shared/services/apiClient'

export default function TecnicoDashboard() {
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      try {
        const [cultivosData, recomendacionesData] = await Promise.all([
          apiClient.cultivos.list(),
          apiClient.recomendaciones.list(),
        ])
        setCultivos(cultivosData)
        setRecomendaciones(recomendacionesData)
      } catch (unknownError) {
        if (unknownError instanceof ApiClientError) {
          setError(unknownError.message)
        } else {
          setError('No fue posible cargar los datos.')
        }
      } finally {
        setIsLoading(false)
      }
    }
    void loadData()
  }, [])

  const enCrecimiento = cultivos.filter((c) => c.estado === 'EN_CRECIMIENTO').length
  const cosechados = cultivos.filter((c) => c.estado === 'COSECHADO').length
  const afectados = cultivos.filter((c) => c.estado === 'AFECTADO').length

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Panel del Técnico Agrónomo</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Vista general para monitoreo de cultivos y gestión de recomendaciones técnicas.
        </p>
      </header>

      {error && <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="text-center">
          <span className="material-symbols-outlined text-4xl text-primary">agriculture</span>
          <p className="mt-2 text-title-lg font-bold text-on-surface">{isLoading ? '...' : cultivos.length}</p>
          <p className="text-sm text-on-surface-variant">Total Cultivos</p>
        </Card>

        <Card className="text-center">
          <span className="material-symbols-outlined text-4xl text-tertiary">eco</span>
          <p className="mt-2 text-title-lg font-bold text-on-surface">{isLoading ? '...' : enCrecimiento}</p>
          <p className="text-sm text-on-surface-variant">En Crecimiento</p>
        </Card>

        <Card className="text-center">
          <span className="material-symbols-outlined text-4xl text-secondary">grass</span>
          <p className="mt-2 text-title-lg font-bold text-on-surface">{isLoading ? '...' : cosechados}</p>
          <p className="text-sm text-on-surface-variant">Cosechados</p>
        </Card>

        <Card className="text-center">
          <span className="material-symbols-outlined text-4xl text-error">warning</span>
          <p className="mt-2 text-title-lg font-bold text-on-surface">{isLoading ? '...' : afectados}</p>
          <p className="text-sm text-on-surface-variant">Afectados</p>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card title="Acciones Rápidas">
          <div className="space-y-2">
            <Link
              to="/tecnico/cultivos"
              className="flex items-center gap-3 rounded-xl bg-surface-container-high p-3 text-on-surface hover:bg-surface-container-high/80"
            >
              <span className="material-symbols-outlined text-primary">agriculture</span>
              <span className="font-medium">Ver Cultivos</span>
            </Link>
            <Link
              to="/tecnico/recomendaciones"
              className="flex items-center gap-3 rounded-xl bg-surface-container-high p-3 text-on-surface hover:bg-surface-container-high/80"
            >
              <span className="material-symbols-outlined text-tertiary">tips_and_updates</span>
              <span className="font-medium">Gestionar Recomendaciones</span>
            </Link>
            <Link
              to="/tecnico/reportes"
              className="flex items-center gap-3 rounded-xl bg-surface-container-high p-3 text-on-surface hover:bg-surface-container-high/80"
            >
              <span className="material-symbols-outlined text-secondary">assessment</span>
              <span className="font-medium">Generar Reportes</span>
            </Link>
          </div>
        </Card>

        <Card title="Recomendaciones Recientes">
          {isLoading ? (
            <p className="text-on-surface-variant">Cargando...</p>
          ) : recomendaciones.length === 0 ? (
            <p className="text-on-surface-variant">No hay recomendaciones.</p>
          ) : (
            <div className="space-y-2">
              {recomendaciones.slice(0, 5).map((rec) => (
                <div key={rec.id} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
                  <div>
                    <p className="font-medium text-on-surface">{rec.tipo}</p>
                    <p className="text-sm text-on-surface-variant line-clamp-1">{rec.descripcion}</p>
                  </div>
                  <span className="text-xs text-on-surface-variant">{new Date(rec.fecha).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </section>
  )
}