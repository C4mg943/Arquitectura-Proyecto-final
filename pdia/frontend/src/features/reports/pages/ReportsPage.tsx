import { useCallback, useEffect, useState } from 'react'

import { Button, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type CultivoDto, type ReporteActividadesDto } from '../../../shared/services/apiClient'

const reportTypes = [
  {
    id: 'activities',
    icon: 'history',
    title: 'Reporte de Actividades',
    description: 'Historial completo de actividades agrícolas por cultivo y periodo.',
    fields: ['Cultivo', 'Rango de fechas', 'Tipo de actividad'],
  },
  {
    id: 'irrigation',
    icon: 'water_drop',
    title: 'Reporte de Riegos',
    description: 'Detalle de riegos aplicados, caudal, duración y eficiencia hídrica.',
    fields: ['Cultivo', 'Rango de fechas'],
  },
  {
    id: 'fertilization',
    icon: 'science',
    title: 'Reporte de Fertilizaciones',
    description: 'Registro de aplicaciones de fertilizante por tipo, dosis y cultivo.',
    fields: ['Cultivo', 'Rango de fechas', 'Tipo de fertilizante'],
  },
  {
    id: 'yield',
    icon: 'trending_up',
    title: 'Reporte de Rendimiento',
    description: 'Análisis de producción por parcela y cultivo comparado con proyecciones.',
    fields: ['Parcela', 'Temporada'],
  },
]

const recentReports: Array<{ name: string; type: string; date: string; format: 'CSV'; size: string }> = []

export default function ReportsPage() {
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [selectedCultivoId, setSelectedCultivoId] = useState<number | null>(null)
  const [reporte, setReporte] = useState<ReporteActividadesDto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const loadCultivos = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await apiClient.cultivos.list()
      setCultivos(response)
      if (response.length > 0) {
        setSelectedCultivoId(response[0].id)
      }
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar los cultivos para reportes.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  const loadReporte = useCallback(async (cultivoId: number) => {
    setError(null)
    try {
      const response = await apiClient.reportes.actividades(cultivoId)
      setReporte(response)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar el reporte.')
      }
      setReporte(null)
    }
  }, [])

  useEffect(() => {
    void loadCultivos()
  }, [loadCultivos])

  useEffect(() => {
    if (selectedCultivoId) {
      void loadReporte(selectedCultivoId)
    }
  }, [loadReporte, selectedCultivoId])

  const downloadCsv = async () => {
    if (!selectedCultivoId) {
      return
    }

    try {
      const blob = await apiClient.reportes.actividadesCsv(selectedCultivoId)
      const url = window.URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `reporte-actividades-cultivo-${selectedCultivoId}.csv`
      anchor.click()
      window.URL.revokeObjectURL(url)
    } catch {
      setError('No fue posible descargar el CSV.')
    }
  }

  return (
    <section className="space-y-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-headline-md text-on-primary-fixed-variant">Reportes y Exportación</h1>
          <p className="mt-1 max-w-2xl text-on-surface-variant">
            Genera reportes detallados de tus operaciones agrícolas y descárgalos en PDF o CSV.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {reportTypes.map((report) => (
          <Card className="p-0 overflow-hidden" key={report.id}>
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary-fixed">
                  <span className="material-symbols-outlined text-primary">{report.icon}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-title-lg text-on-surface">{report.title}</h3>
                  <p className="mt-1 text-sm text-on-surface-variant">{report.description}</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                {report.fields.map((field) => (
                  <label key={field} className="block space-y-1" htmlFor={`${report.id}-${field.replace(/\s+/g, '-').toLowerCase()}`}>
                    <span className="text-label-md text-on-surface-variant">{field}</span>
                    {field === 'Tipo de actividad' ? (
                      <select id={`${report.id}-${field.replace(/\s+/g, '-').toLowerCase()}`} className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary">
                        <option>Todas</option>
                        <option>Riego</option>
                        <option>Fertilización</option>
                        <option>Control de plagas</option>
                        <option>Observaciones</option>
                      </select>
                    ) : field === 'Cultivo' ? (
                      <select
                        id={`${report.id}-${field.replace(/\s+/g, '-').toLowerCase()}`}
                        className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                        onChange={(event) => setSelectedCultivoId(Number(event.target.value))}
                        value={selectedCultivoId ?? ''}
                      >
                        {cultivos.length === 0 ? <option value="">Sin cultivos</option> : null}
                        {cultivos.map((crop) => (
                          <option key={crop.id} value={crop.id}>{crop.tipoCultivo}</option>
                        ))}
                      </select>
                    ) : field === 'Parcela' ? (
                      <select id={`${report.id}-${field.replace(/\s+/g, '-').toLowerCase()}`} className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary">
                        <option>Todas las parcelas</option>
                        {cultivos.map((crop) => (
                          <option key={crop.id} value={crop.id}>Cultivo #{crop.id}</option>
                        ))}
                      </select>
                    ) : field === 'Temporada' ? (
                      <select id={`${report.id}-${field.replace(/\s+/g, '-').toLowerCase()}`} className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary">
                        <option>2026-A</option>
                        <option>2025-B</option>
                        <option>2025-A</option>
                      </select>
                    ) : field === 'Tipo de fertilizante' ? (
                      <select id={`${report.id}-${field.replace(/\s+/g, '-').toLowerCase()}`} className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary">
                        <option>Todos</option>
                        <option>NPK Granulado</option>
                        <option>Urea</option>
                        <option>Orgánico</option>
                        <option>Foliar</option>
                      </select>
                    ) : (
                      <input
                        id={`${report.id}-${field.replace(/\s+/g, '-').toLowerCase()}`}
                        className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-3 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                        type="date"
                      />
                    )}
                  </label>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <Button className="flex-1" disabled variant="primary">
                  PDF (próximamente)
                </Button>
                <Button className="flex-1" leadingIcon="table_chart" onClick={() => void downloadCsv()} variant="secondary">
                  CSV
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {error ? (
        <Card>
          <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
        </Card>
      ) : null}

      <Card title="Resumen del reporte seleccionado" subtitle={selectedCultivoId ? `Cultivo #${selectedCultivoId}` : 'Sin cultivo seleccionado'}>
        {isLoading ? (
          <p className="text-on-surface-variant">Cargando resumen...</p>
        ) : null}

        {!isLoading && !reporte ? (
          <p className="text-on-surface-variant">No hay datos para mostrar.</p>
        ) : null}

        {reporte ? (
          <div className="space-y-2 text-sm text-on-surface">
            <p>Total actividades: <strong>{reporte.totalActividades}</strong></p>
            <p>Desde: <strong>{reporte.desde ?? 'N/A'}</strong></p>
            <p>Hasta: <strong>{reporte.hasta ?? 'N/A'}</strong></p>
            <div className="flex flex-wrap gap-2 pt-2">
              {Object.entries(reporte.porTipo).map(([tipo, total]) => (
                <span className="rounded-full bg-surface-container-low px-3 py-1 text-xs font-semibold" key={tipo}>
                  {tipo}: {total}
                </span>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      {/* Recent reports */}
      <Card title="Reportes Recientes" subtitle="Últimos reportes generados">
        <div className="space-y-2">
          {recentReports.length === 0 ? (
            <p className="text-sm text-on-surface-variant">Aún no hay reportes descargados en esta sesión.</p>
          ) : null}
          {recentReports.map((report) => (
            <div key={report.name} className="flex items-center justify-between gap-3 rounded-2xl bg-surface-container-low p-4 transition-colors hover:bg-surface-container-high">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-fixed">
                  <span className="material-symbols-outlined text-primary" style={{fontSize: '20px'}}>
                    table_chart
                  </span>
                </div>
                <div>
                  <p className="text-sm font-semibold text-on-surface">{report.name}</p>
                  <p className="text-xs text-on-surface-variant">{report.type} · {new Date(report.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' })} · {report.size}</p>
                </div>
              </div>
              <button
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl text-on-surface-variant hover:bg-surface-container-highest transition-colors"
                type="button"
                aria-label={`Descargar ${report.name}`}
              >
                <span className="material-symbols-outlined">download</span>
              </button>
            </div>
          ))}
        </div>
      </Card>
    </section>
  )
}
