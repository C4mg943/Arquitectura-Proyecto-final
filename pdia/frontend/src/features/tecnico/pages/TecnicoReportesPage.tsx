import { useCallback, useEffect, useState } from 'react'

import { Badge, Button, Card } from '../../../shared/components/common'
import {
  apiClient,
  ApiClientError,
  type CultivoDto,
  type ReporteActividadesDto,
} from '../../../shared/services/apiClient'

export default function TecnicoReportesPage() {
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [selectedCultivo, setSelectedCultivo] = useState<number | null>(null)
  const [reporte, setReporte] = useState<ReporteActividadesDto | null>(null)
  const [isLoadingCultivos, setIsLoadingCultivos] = useState(true)
  const [isLoadingReporte, setIsLoadingReporte] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadCultivos = useCallback(async () => {
    setIsLoadingCultivos(true)
    setError(null)
    try {
      const data = await apiClient.cultivos.list()
      setCultivos(data)
      if (data.length > 0) {
        setSelectedCultivo(data[0].id)
      }
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar los cultivos.')
      }
    } finally {
      setIsLoadingCultivos(false)
    }
  }, [])

  useEffect(() => {
    void loadCultivos()
  }, [loadCultivos])

  const loadReporte = async () => {
    if (!selectedCultivo) return

    setIsLoadingReporte(true)
    setError(null)

    try {
      const data = await apiClient.reportes.actividades(selectedCultivo)
      setReporte(data)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible generar el reporte.')
      }
    } finally {
      setIsLoadingReporte(false)
    }
  }

  const totalActividades = reporte?.totalActividades ?? 0
  const riegos = reporte?.porTipo?.RIEGO ?? 0
  const fertilizaciones = reporte?.porTipo?.FERTILIZACION ?? 0
  const detalleEntries = reporte ? Object.entries(reporte.porTipo) : []

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Reportes Técnicos</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Genera reportes de actividades y estadísticas de cultivos.
        </p>
      </header>

      {error && <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>}

      <Card title="Seleccionar Cultivo">
        <div className="flex flex-wrap gap-4">
          <select
            className="flex-1 rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface outline-none focus:border-primary/60"
            value={selectedCultivo ?? ''}
            onChange={(event) => {
              setSelectedCultivo(Number(event.target.value))
              setReporte(null)
            }}
            disabled={isLoadingCultivos}
          >
            {isLoadingCultivos ? (
              <option value="">Cargando...</option>
            ) : cultivos.length === 0 ? (
              <option value="">No hay cultivos</option>
            ) : (
              cultivos.map((cultivo) => (
                <option key={cultivo.id} value={cultivo.id}>
                  {cultivo.tipoCultivo} - {cultivo.estado}
                </option>
              ))
            )}
          </select>
          <Button
            disabled={!selectedCultivo || isLoadingCultivos || isLoadingReporte}
            onClick={() => void loadReporte()}
            variant="primary"
          >
            {isLoadingReporte ? 'Generando...' : 'Generar Reporte'}
          </Button>
        </div>
      </Card>

      {reporte && (
        <>
          <Card title="Resumen de Actividades">
            <div className="grid gap-4 md:grid-cols-3">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{totalActividades}</p>
                <p className="text-sm text-on-surface-variant">Total Actividades</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-secondary">{riegos}</p>
                <p className="text-sm text-on-surface-variant">Riegos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-tertiary">{fertilizaciones}</p>
                <p className="text-sm text-on-surface-variant">Fertilizaciones</p>
              </div>
            </div>
            {reporte.desde && reporte.hasta ? (
              <p className="mt-4 text-sm text-on-surface-variant">
                Rango de fechas: {reporte.desde} → {reporte.hasta}
              </p>
            ) : null}
          </Card>

          <Card title="Detalle por Tipo">
            {detalleEntries.length > 0 ? (
              <div className="space-y-2">
                {detalleEntries.map(([tipo, total]) => (
                  <div key={tipo} className="flex items-center justify-between rounded-xl bg-surface-container-low p-3">
                    <span className="font-medium text-on-surface">{tipo}</span>
                    <Badge variant="neutral">{total}</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-on-surface-variant">No hay actividades registradas.</p>
            )}
          </Card>
        </>
      )}
    </section>
  )
}
