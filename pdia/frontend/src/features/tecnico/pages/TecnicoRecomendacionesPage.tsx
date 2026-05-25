import { useCallback, useEffect, useState } from 'react'

import { Badge, Button, Card, Input } from '../../../shared/components/common'
import { apiClient, ApiClientError, type RecomendacionDto, type CultivoDto } from '../../../shared/services/apiClient'

const tipoLabels: Record<string, string> = {
  RIEGO: 'Riego',
  FERTILIZACION: 'Fertilización',
  FITORECOMENDACION: 'Fitorecomendación',
}

interface NuevaRecomendacion {
  tipo: 'RIEGO' | 'FERTILIZACION' | 'FITORECOMENDACION'
  descripcion: string
  cultivoId: number
}

const initialRec: NuevaRecomendacion = {
  tipo: 'RIEGO',
  descripcion: '',
  cultivoId: 0,
}

export default function TecnicoRecomendacionesPage() {
  const [recomendaciones, setRecomendaciones] = useState<RecomendacionDto[]>([])
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [filterTipo, setFilterTipo] = useState<string>('')
  const [nuevaRec, setNuevaRec] = useState<NuevaRecomendacion>(initialRec)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [recomData, cultivosData] = await Promise.all([
        apiClient.recomendaciones.list(),
        apiClient.cultivos.list(),
      ])
      setRecomendaciones(recomData)
      setCultivos(cultivosData)
      if (cultivosData.length > 0 && nuevaRec.cultivoId === 0) {
        setNuevaRec((c) => ({ ...c, cultivoId: cultivosData[0].id }))
      }
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar las recomendaciones.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const getCultivoName = (cultivoId: number) => cultivos.find((c) => c.id === cultivoId)?.tipoCultivo || `Cultivo ${cultivoId}`

  const filteredRecs = filterTipo
    ? recomendaciones.filter((r) => r.tipo === filterTipo)
    : recomendaciones

  const handleCrear = async () => {
    if (!nuevaRec.descripcion || nuevaRec.cultivoId === 0) {
      setError('Selecciona un cultivo y escribe una descripción.')
      return
    }

    setError(null)
    setSuccess(null)
    setIsSubmitting(true)

    try {
      await apiClient.post<RecomendacionDto>('/api/recomendaciones', {
        tipo: nuevaRec.tipo,
        descripcion: nuevaRec.descripcion,
        cultivoId: nuevaRec.cultivoId,
      })
      setSuccess('Recomendación creada correctamente.')
      setNuevaRec(initialRec)
      if (cultivos.length > 0) {
        setNuevaRec((c) => ({ ...c, cultivoId: cultivos[0].id }))
      }
      void loadData()
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible crear la recomendación.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Recomendaciones Técnicas</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Crea y visualiza recomendaciones técnicas para los cultivos de tus productores asignados.
        </p>
      </header>

      {error && <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>}
      {success && <p className="rounded-xl bg-tertiary-container px-3 py-2 text-sm font-semibold text-on-tertiary-container">{success}</p>}

      <Card title="Crear Nueva Recomendación">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-2" htmlFor="rec-cultivo">
            <span className="text-label-md block text-on-surface-variant">Cultivo</span>
            <select
              id="rec-cultivo"
              className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60"
              value={nuevaRec.cultivoId || ''}
              onChange={(event) => setNuevaRec((c) => ({ ...c, cultivoId: parseInt(event.target.value) }))}
            >
              <option value="">Seleccionar cultivo</option>
              {cultivos.map((cultivo) => (
                <option key={cultivo.id} value={cultivo.id}>
                  {cultivo.tipoCultivo}
                </option>
              ))}
            </select>
          </label>

          <label className="space-y-2" htmlFor="rec-tipo">
            <span className="text-label-md block text-on-surface-variant">Tipo</span>
            <select
              id="rec-tipo"
              className="w-full rounded-2xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3.5 text-sm text-on-surface outline-none focus:border-primary/60"
              value={nuevaRec.tipo}
              onChange={(event) => setNuevaRec((c) => ({ ...c, tipo: event.target.value as NuevaRecomendacion['tipo'] }))}
            >
              <option value="RIEGO">Riego</option>
              <option value="FERTILIZACION">Fertilización</option>
              <option value="FITORECOMENDACION">Fitorecomendación</option>
            </select>
          </label>

          <div className="md:col-span-2">
            <Input
              id="rec-descripcion"
              label="Descripción"
              onChange={(event) => setNuevaRec((c) => ({ ...c, descripcion: event.target.value }))}
              placeholder="Describe la recomendación..."
              value={nuevaRec.descripcion}
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button disabled={isSubmitting} onClick={() => void handleCrear()} variant="primary">
            {isSubmitting ? 'Guardando...' : 'Crear Recomendación'}
          </Button>
        </div>
      </Card>

      <Card title="Filtrar Recomendaciones">
        <div className="flex gap-2">
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
        </div>
      </Card>

      <Card title={`Recomendaciones (${filteredRecs.length})`}>
        {isLoading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : filteredRecs.length === 0 ? (
          <div className="text-center">
            <p className="text-on-surface-variant">No hay recomendaciones registradas.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecs.map((rec) => (
              <div key={rec.id} className="surface-panel rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="primary">{tipoLabels[rec.tipo]}</Badge>
                      <span className="text-sm text-on-surface-variant">
                        {getCultivoName(rec.cultivoId)}
                      </span>
                    </div>
                    <p className="mt-2 text-on-surface">{rec.descripcion}</p>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      Fecha: {new Date(rec.fecha + 'T00:00:00').toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}