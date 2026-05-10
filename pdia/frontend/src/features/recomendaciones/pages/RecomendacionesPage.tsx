import { useCallback, useEffect, useState } from 'react'

import { Badge, Card } from '../../../shared/components/common'
import { apiClient, type RecomendacionDto } from '../../../shared/services/apiClient'

const tipoLabels: Record<string, string> = {
  RIEGO: 'Riego',
  FERTILIZACION: 'Fertilización',
  FITORECOMENDACION: 'Fitorecomendación',
}

export default function RecomendacionesPage() {
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterTipo, setFilterTipo] = useState<string>('')

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.recomendaciones.list()
      setRecomendaciones(data)
    } catch (unknownError) {
      setError('No fue posible cargar las recomendaciones.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredRecs = filterTipo
    ? recomendaciones.filter((r) => r.tipo === filterTipo)
    : recomendaciones

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Recomendaciones Técnicas</h1>
        <p className="mt-1 text-on-surface-variant">
          Recomendaciones de tu técnico agrónomo asignado.
        </p>
      </header>

      {error && (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      )}

      <Card title="Filtrar">
        <select
          className="rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none focus:border-primary/60"
          value={filterTipo}
          onChange={(event) => setFilterTipo(event.target.value)}
        >
          <option value="">Todos los tipos</option>
          <option value="RIEGO">Riego</option>
          <option value="FERTILIZACION">Fertilización</option>
          <option value="FITORECOMENDACION">Fitorecomendación</option>
        </select>
      </Card>

      <Card title={`Recomendaciones (${filteredRecs.length})`}>
        {isLoading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : filteredRecs.length === 0 ? (
          <p className="text-on-surface-variant">No hay recomendaciones.</p>
        ) : (
          <div className="space-y-4">
            {filteredRecs.map((rec) => (
              <div key={rec.id} className="surface-panel rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{tipoLabels[rec.tipo]}</Badge>
                  <span className="text-sm text-on-surface-variant">Cultivo #{rec.cultivoId}</span>
                </div>
                <p className="mt-2 text-on-surface">{rec.descripcion}</p>
                <p className="mt-2 text-xs text-on-surface-variant">
                  Fecha: {new Date(rec.fecha).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}