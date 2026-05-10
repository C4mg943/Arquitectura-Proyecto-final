import { useCallback, useEffect, useState } from 'react'

import { Badge, Button, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type CultivoDto, type ParcelaDto } from '../../../shared/services/apiClient'

const estadoLabels: Record<string, string> = {
  EN_CRECIMIENTO: 'En Crecimiento',
  COSECHADO: 'Cosechado',
  AFECTADO: 'Afectado',
}

const estadoVariants: Record<string, 'success' | 'neutral' | 'error'> = {
  EN_CRECIMIENTO: 'success',
  COSECHADO: 'neutral',
  AFECTADO: 'error',
}

export default function TecnicoCultivosPage() {
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [parcelas, setParcelas] = useState<ParcelaDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterEstado, setFilterEstado] = useState<string>('')
  const [selectedCultivo, setSelectedCultivo] = useState<CultivoDto | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [cultivosData, parcelasData] = await Promise.all([
        apiClient.cultivos.list(),
        apiClient.parcelas.list(),
      ])
      setCultivos(cultivosData)
      setParcelas(parcelasData)
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

  const getParcelaName = (parcelaId: number) => parcelas.find((p) => p.id === parcelaId)?.nombre || `Parcela ${parcelaId}`

  const filteredCultivos = filterEstado
    ? cultivos.filter((c) => c.estado === filterEstado)
    : cultivos

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Catálogo de Cultivos</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Visualiza todos los cultivos del sistema para análisis técnico.
        </p>
      </header>

      {error && <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>}

      <Card title="Filtrar Cultivos">
        <div className="flex gap-2">
          <select
            className="rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-2 text-sm text-on-surface outline-none focus:border-primary/60"
            value={filterEstado}
            onChange={(event) => setFilterEstado(event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="EN_CRECIMIENTO">En Crecimiento</option>
            <option value="COSECHADO">Cosechados</option>
            <option value="AFECTADO">Afectados</option>
          </select>
        </div>
      </Card>

      <Card title={`Cultivos (${filteredCultivos.length})`}>
        {isLoading ? (
          <p className="text-on-surface-variant">Cargando...</p>
        ) : filteredCultivos.length === 0 ? (
          <p className="text-on-surface-variant">No hay cultivos registrados.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCultivos.map((cultivo) => (
              <div
                key={cultivo.id}
                className="surface-panel cursor-pointer rounded-xl p-4 hover:bg-surface-container-high"
                onClick={() => setSelectedCultivo(cultivo)}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-title-md font-semibold text-on-surface">{cultivo.tipoCultivo}</h3>
                    <p className="text-sm text-on-surface-variant">{getParcelaName(cultivo.parcelaId)}</p>
                  </div>
                  <Badge variant={estadoVariants[cultivo.estado]}>{estadoLabels[cultivo.estado]}</Badge>
                </div>
                <div className="mt-3 text-sm text-on-surface-variant">
                  <p>Siembra: {new Date(cultivo.fechaSiembra).toLocaleDateString()}</p>
                  {cultivo.observaciones && (
                    <p className="line-clamp-2 mt-1">{cultivo.observaciones}</p>
                  )}
                </div>
                <div className="mt-4 flex gap-2">
                  <Button
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedCultivo(cultivo)
                    }}
                    variant="secondary"
                  >
                    Ver Detalle
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {selectedCultivo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-surface-container-high p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-title-lg font-semibold text-on-surface">Detalle del Cultivo</h2>
              <button
                className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-surface-container-low"
                onClick={() => setSelectedCultivo(null)}
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="mt-4 space-y-3">
              <div>
                <p className="text-label-md text-on-surface-variant">Tipo de Cultivo</p>
                <p className="text-on-surface">{selectedCultivo.tipoCultivo}</p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant">Parcela</p>
                <p className="text-on-surface">{getParcelaName(selectedCultivo.parcelaId)}</p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant">Fecha de Siembra</p>
                <p className="text-on-surface">{new Date(selectedCultivo.fechaSiembra).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-label-md text-on-surface-variant">Estado</p>
                <Badge variant={estadoVariants[selectedCultivo.estado]}>{estadoLabels[selectedCultivo.estado]}</Badge>
              </div>
              {selectedCultivo.observaciones && (
                <div>
                  <p className="text-label-md text-on-surface-variant">Observaciones</p>
                  <p className="text-on-surface">{selectedCultivo.observaciones}</p>
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={() => setSelectedCultivo(null)} variant="secondary">
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}