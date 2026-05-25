import { useCallback, useEffect, useState } from 'react'
import jsPDF from 'jspdf'

import { Button, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type CultivoDto, type ActividadDto } from '../../../shared/services/apiClient'

const activityMeta: Record<ActividadDto['tipo'], { label: string; icon: string; color: string; iconBg: string }> = {
  RIEGO: { label: 'Riego', icon: 'water_drop', color: 'text-blue-600', iconBg: 'bg-blue-100' },
  FERTILIZACION: { label: 'Fertilización', icon: 'science', color: 'text-green-600', iconBg: 'bg-green-100' },
  PLAGA: { label: 'Control de Plagas', icon: 'bug_report', color: 'text-red-600', iconBg: 'bg-red-100' },
  OBSERVACION: { label: 'Observación', icon: 'visibility', color: 'text-amber-600', iconBg: 'bg-amber-100' },
}

type ReporteTipo = 'ACTIVIDADES' | 'RIEGOS' | 'FERTILIZACIONES' | 'RENDIMIENTO'

interface ReporteReciente {
  tipo: ReporteTipo
  fecha: string
  registros: number
  archivo: string
}

const STORAGE_KEY = 'pdia-reportes-recientes'

function loadReportesRecientes(): ReporteReciente[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as ReporteReciente[]
  } catch {
    return []
  }
}

function saveReporteReciente(reporte: ReporteReciente): void {
  try {
    const existing = loadReportesRecientes()
    const updated = [reporte, ...existing].slice(0, 10) // máximo 10
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // ignorar errores de storage
  }
}

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
  const [reportesRecientes, setReportesRecientes] = useState<ReporteReciente[]>(() => loadReportesRecientes())

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

  const generatePDF = () => {
    const doc = new jsPDF()
    const titulo = reporteTipo === 'ACTIVIDADES' ? 'Reporte de Actividades'
      : reporteTipo === 'RIEGOS' ? 'Reporte de Riegos'
      : reporteTipo === 'FERTILIZACIONES' ? 'Reporte de Fertilizaciones'
      : 'Reporte de Rendimiento'

    // ── Encabezado ──────────────────────────────────────────────────────────
    doc.setFillColor(21, 66, 18)
    doc.rect(0, 0, 210, 28, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(16)
    doc.text('PDIA - Plataforma Digital de Agricultura Inteligente', 14, 12)
    doc.setFontSize(11)
    doc.text(titulo, 14, 22)

    // ── Metadata ─────────────────────────────────────────────────────────────
    doc.setTextColor(80, 80, 80)
    doc.setFontSize(8)
    doc.text(`Generado: ${new Date().toLocaleString('es-CO')}   Registros: ${filteredActividades.length}`, 14, 34)

    // ── Cabecera de tabla ────────────────────────────────────────────────────
    const colWidths = [35, 25, 90, 35]
    const headers = ['Tipo', 'Fecha', 'Descripción', 'Cultivo']
    let y = 40

    doc.setFillColor(21, 66, 18)
    doc.rect(14, y, 182, 7, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(8)
    let x = 14
    headers.forEach((h, i) => { doc.text(h, x + 2, y + 5); x += colWidths[i] })
    y += 7

    // ── Filas ────────────────────────────────────────────────────────────────
    filteredActividades.forEach((a, idx) => {
      if (y > 270) { doc.addPage(); y = 20 }
      const cultivo = cultivos.find((c) => c.id === a.cultivoId)
      const row = [
        activityMeta[a.tipo]?.label ?? a.tipo,
        a.fecha,
        a.descripcion.length > 55 ? a.descripcion.slice(0, 52) + '...' : a.descripcion,
        cultivo?.tipoCultivo ?? `Cultivo #${a.cultivoId}`,
      ]
      if (idx % 2 === 0) {
        doc.setFillColor(245, 250, 245)
        doc.rect(14, y, 182, 7, 'F')
      }
      doc.setTextColor(40, 40, 40)
      x = 14
      row.forEach((cell, i) => { doc.text(String(cell), x + 2, y + 5); x += colWidths[i] })
      y += 7
    })

    // ── Pie de página ────────────────────────────────────────────────────────
    const pageCount = (doc as any).internal.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(7)
      doc.setTextColor(150)
      doc.text(`Página ${i} de ${pageCount}`, 14, 290)
    }

    const filename = `reporte-${reporteTipo.toLowerCase()}-${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)

    const nuevo: ReporteReciente = {
      tipo: reporteTipo,
      fecha: new Date().toISOString(),
      registros: filteredActividades.length,
      archivo: filename,
    }
    saveReporteReciente(nuevo)
    setReportesRecientes(loadReportesRecientes())
  }

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
    const filename = `reporte-${reporteTipo.toLowerCase()}-${new Date().toISOString().split('T')[0]}.csv`
    link.download = filename
    link.click()
    URL.revokeObjectURL(url)

    // Guardar en historial local
    const nuevo: ReporteReciente = {
      tipo: reporteTipo,
      fecha: new Date().toISOString(),
      registros: filteredActividades.length,
      archivo: filename,
    }
    saveReporteReciente(nuevo)
    setReportesRecientes(loadReportesRecientes())
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
          <Button className="flex-1" leadingIcon="picture_as_pdf" onClick={generatePDF} variant="secondary">
            PDF
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
        {reportesRecientes.length === 0 ? (
          <div className="py-4 text-center">
            <span className="material-symbols-outlined text-2xl text-on-surface-variant">folder_open</span>
            <p className="mt-1 text-sm text-on-surface-variant">Aún no hay reportes descargados.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {reportesRecientes.map((r, i) => (
              <div key={i} className="flex items-center justify-between rounded-xl bg-surface-container-low px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-on-surface">{r.archivo}</p>
                  <p className="text-xs text-on-surface-variant">
                    {r.registros} registros · {new Date(r.fecha).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <span className="material-symbols-outlined text-on-surface-variant">download_done</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </section>
  )
}