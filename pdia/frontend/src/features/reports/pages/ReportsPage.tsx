import { useCallback, useEffect, useState } from 'react'

import { Button, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type CultivoDto, type ActividadDto } from '../../../shared/services/apiClient'

const activityMeta: Record<ActividadDto['tipo'], { label: string; icon: string; color: string; iconBg: string }> = {
  RIEGO: { label: 'Riego', icon: 'water_drop', color: 'text-blue-600', iconBg: 'bg-blue-100' },
  FERTILIZACION: { label: 'Fertilización', icon: 'science', color: 'text-green-600', iconBg: 'bg-green-100' },
  PLAGA: { label: 'Control de Plagas', icon: 'bug_report', color: 'text-red-600', iconBg: 'bg-red-100' },
  OBSERVACION: { label: 'Observación', icon: 'visibility', color: 'text-amber-600', iconBg: 'bg-amber-100' },
}

type ReporteTipo = 'ACTIVIDADES' | 'RIEGOS' | 'FERTILIZACIONES' | 'RENDIMIENTO'

export default function ReportsPage() {
  const [cultivos, setCultivos] = useState<CultivoDto[]>([])
  const [actividades, setActividades] = useState<ActividadDto[]>([])
  const [reporteTipo, setReporteTipo] = useState<ReporteTipo>('ACTIVIDADES')
  const [cultivoFilter, setCultivoFilter] = useState<number | 'TODOS'>('TODOS')
  const [fechaInicio, setFechaInicio] = useState('')
  const [fechaFin, setFechaFin] = useState('')
  const [tipoActividad, setTipoActividad] = useState<string>('TODAS')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const [cultivosResponse, actividadesResponse] = await Promise.all([
        apiClient.cultivos.list(),
        apiClient.actividades.list(),
      ])
      setCultivos(cultivosResponse)
      setActividades(actividadesResponse)
    } catch (err) {
      const unknownError = err as unknown
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar los datos')
      }
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  const filteredActividades = actividades.filter((a) => {
    const matchCultivo = cultivoFilter === 'TODOS' || a.cultivoId === Number(cultivoFilter)
    const matchTipo = tipoActividad === 'TODAS' || a.tipo === tipoActividad
    let matchFecha = true
    if (fechaInicio && a.fecha < fechaInicio) matchFecha = false
    if (fechaFin && a.fecha > fechaFin) matchFecha = false
    return matchCultivo && matchTipo && matchFecha
  })

  const generateCSV = () => {
    const headers = reporteTipo === 'ACTIVIDADES'
      ? ['ID', 'Tipo', 'Fecha', 'Descripción', 'Cultivo ID']
      : reporteTipo === 'RIEGOS'
      ? ['ID', 'Fecha', 'Descripción', 'Cultivo ID']
      : reporteTipo === 'FERTILIZACIONES'
      ? ['ID', 'Fecha', 'Descripción', 'Cultivo ID']
      : ['Parcela', 'Cultivo', 'Fecha', 'Rendimiento']

    const rows = filteredActividades.map((a) => [
      a.id,
      a.tipo,
      a.fecha,
      a.descripcion,
      a.cultivoId,
    ])

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reporte-${reporteTipo.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  if (isLoading) {
    return (
      <section className="space-y-6">
        <div className="flex items-center justify-center py-20">
          <span className="material-symbols-outlined animate-spin text-4xl text-on-surface-variant">sync</span>
        </div>
      </section>
    )
  }

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Reportes y Exportación</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Genera reportes detallados de tus operaciones agrícolas y descárgalos en PDF o CSV.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card
          className={`cursor-pointer transition-all hover:ring-2 ${reporteTipo === 'ACTIVIDADES' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setReporteTipo('ACTIVIDADES')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-surface-container-high">
              <span className="material-symbols-outlined text-on-surface-variant">history</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface">Reporte de Actividades</p>
              <p className="text-sm text-on-surface-variant">Historial completo</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:ring-2 ${reporteTipo === 'RIEGOS' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setReporteTipo('RIEGOS')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
              <span className="material-symbols-outlined text-blue-600">water_drop</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface">Reporte de Riegos</p>
              <p className="text-sm text-on-surface-variant">Detalle de riegos</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:ring-2 ${reporteTipo === 'FERTILIZACIONES' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setReporteTipo('FERTILIZACIONES')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
              <span className="material-symbols-outlined text-green-600">science</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface">Reporte de Fertilizaciones</p>
              <p className="text-sm text-on-surface-variant">Aplicaciones de fertilizante</p>
            </div>
          </div>
        </Card>

        <Card
          className={`cursor-pointer transition-all hover:ring-2 ${reporteTipo === 'RENDIMIENTO' ? 'ring-2 ring-primary' : ''}`}
          onClick={() => setReporteTipo('RENDIMIENTO')}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
              <span className="material-symbols-outlined text-purple-600">trending_up</span>
            </div>
            <div>
              <p className="font-semibold text-on-surface">Reporte de Rendimiento</p>
              <p className="text-sm text-on-surface-variant">Análisis de producción</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <p className="mb-4 text-title-lg font-semibold text-on-surface">
          {reporteTipo === 'ACTIVIDADES' && 'Reporte de Actividades'}
          {reporteTipo === 'RIEGOS' && 'Reporte de Riegos'}
          {reporteTipo === 'FERTILIZACIONES' && 'Reporte de Fertilizaciones'}
          {reporteTipo === 'RENDIMIENTO' && 'Reporte de Rendimiento'}
        </p>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <label className="space-y-1">
            <span className="text-label-md text-on-surface-variant">Cultivo</span>
            <select
              className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
              onChange={(event) => setCultivoFilter(event.target.value === 'TODOS' ? 'TODOS' : Number(event.target.value))}
              value={cultivoFilter}
            >
              <option value="TODOS">Todos los cultivos</option>
              {cultivos.map((c) => (
                <option key={c.id} value={c.id}>{c.tipoCultivo}</option>
              ))}
            </select>
          </label>

          {reporteTipo !== 'RENDIMIENTO' && (
            <>
              <label className="space-y-1">
                <span className="text-label-md text-on-surface-variant">Fecha inicio</span>
                <input
                  type="date"
                  className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  onChange={(event) => setFechaInicio(event.target.value)}
                  value={fechaInicio}
                />
              </label>

              <label className="space-y-1">
                <span className="text-label-md text-on-surface-variant">Fecha fin</span>
                <input
                  type="date"
                  className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                  onChange={(event) => setFechaFin(event.target.value)}
                  value={fechaFin}
                />
              </label>
            </>
          )}

          {reporteTipo === 'ACTIVIDADES' && (
            <label className="space-y-1">
              <span className="text-label-md text-on-surface-variant">Tipo de actividad</span>
              <select
                className="w-full rounded-xl border-0 bg-surface-container-low px-3 py-2 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
                onChange={(event) => setTipoActividad(event.target.value)}
                value={tipoActividad}
              >
                <option value="TODAS">Todas</option>
                <option value="RIEGO">Riego</option>
                <option value="FERTILIZACION">Fertilización</option>
                <option value="PLAGA">Control de Plagas</option>
                <option value="OBSERVACION">Observación</option>
              </select>
            </label>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="flex-1" disabled variant="secondary">
            PDF (próximamente)
          </Button>
          <Button className="flex-1" leadingIcon="download" onClick={generateCSV} variant="primary">
            CSV
          </Button>
        </div>
      </Card>

      {error ? (
        <Card className="bg-error-container text-on-error-container">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined">error</span>
            <p>{error}</p>
          </div>
        </Card>
      ) : filteredActividades.length === 0 ? (
        <Card className="bg-surface-container-high">
          <div className="py-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">assessment</span>
            <p className="mt-2 text-on-surface-variant">No fue posible cargar el reporte.</p>
            <p className="mt-1 text-sm text-on-surface-variant">No hay datos para mostrar.</p>
          </div>
        </Card>
      ) : (
        <Card>
          <p className="mb-3 text-title-sm font-medium text-on-surface">
            Resumen del reporte seleccionado ({filteredActividades.length} registros)
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="pb-2 text-left text-on-surface-variant">Tipo</th>
                  <th className="pb-2 text-left text-on-surface-variant">Fecha</th>
                  <th className="pb-2 text-left text-on-surface-variant">Descripción</th>
                  <th className="pb-2 text-left text-on-surface-variant">Cultivo</th>
                </tr>
              </thead>
              <tbody>
                {filteredActividades.slice(0, 10).map((a) => {
                  const meta = activityMeta[a.tipo]
                  const cultivo = cultivos.find((c) => c.id === a.cultivoId)
                  return (
                    <tr key={a.id} className="border-b border-outline-variant">
                      <td className="py-2">
                        <span className={`inline-flex items-center gap-1 ${meta.color}`}>
                          <span className="material-symbols-outlined text-sm">{meta.icon}</span>
                          {meta.label}
                        </span>
                      </td>
                      <td className="py-2 text-on-surface">{a.fecha}</td>
                      <td className="py-2 text-on-surface-variant">{a.descripcion}</td>
                      <td className="py-2 text-on-surface-variant">{cultivo?.tipoCultivo ?? `Cultivo #${a.cultivoId}`}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Card className="bg-surface-container-high">
        <p className="mb-3 text-title-sm font-medium text-on-surface">Reportes Recientes</p>
        <div className="py-4 text-center">
          <span className="material-symbols-outlined text-2xl text-on-surface-variant">folder_open</span>
          <p className="mt-1 text-sm text-on-surface-variant">Aún no hay reportes descargados en esta sesión.</p>
        </div>
      </Card>
    </section>
  )
}