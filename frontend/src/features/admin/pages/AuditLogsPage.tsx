import { useCallback, useEffect, useState } from 'react'
import { Badge, Card } from '../../../shared/components/common'
import { apiClient, ApiClientError, type AuditLogDto } from '../../../shared/services/apiClient'

const actionLabels: Record<string, { label: string; variant: 'safe' | 'warning' | 'danger' | 'neutral' }> = {
  LOGIN:       { label: 'Inicio de sesión', variant: 'safe' },
  REGISTER:    { label: 'Registro',         variant: 'safe' },
  CREATE_USER: { label: 'Crear usuario',    variant: 'warning' },
  UPDATE_USER: { label: 'Editar usuario',   variant: 'neutral' },
  DELETE_USER: { label: 'Eliminar usuario', variant: 'danger' },
}

function timeAgo(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Ahora mismo'
  if (mins < 60) return `Hace ${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `Hace ${hrs} h`
  return new Date(isoStr).toLocaleString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLogDto[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterAction, setFilterAction] = useState('')

  const loadLogs = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await apiClient.users.auditLogs({
        limit: 100,
        action: filterAction || undefined,
      })
      setLogs(data)
    } catch (unknownError) {
      if (unknownError instanceof ApiClientError) {
        setError(unknownError.message)
      } else {
        setError('No fue posible cargar los logs.')
      }
    } finally {
      setIsLoading(false)
    }
  }, [filterAction])

  useEffect(() => { void loadLogs() }, [loadLogs])

  return (
    <section className="space-y-6">
      <header>
        <h1 className="text-headline-md text-on-primary-fixed-variant">Registro de Actividad</h1>
        <p className="mt-1 max-w-2xl text-on-surface-variant">
          Historial de acciones realizadas en el sistema (RF48/RF49).
        </p>
      </header>

      {error ? (
        <p className="rounded-xl bg-error-container px-3 py-2 text-sm font-semibold text-on-error-container">{error}</p>
      ) : null}

      <Card>
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h2 className="text-title-md font-semibold text-on-surface">
            Logs del sistema
            <span className="ml-2 rounded-full bg-surface-container-high px-2.5 py-0.5 text-xs font-bold text-on-surface-variant">
              {logs.length}
            </span>
          </h2>
          <select
            className="ml-auto rounded-xl border border-outline-variant/45 bg-surface-container-lowest px-3 py-2 text-sm text-on-surface outline-none focus:border-primary/60"
            value={filterAction}
            onChange={(e) => setFilterAction(e.target.value)}
          >
            <option value="">Todas las acciones</option>
            <option value="LOGIN">Inicio de sesión</option>
            <option value="REGISTER">Registro</option>
            <option value="CREATE_USER">Crear usuario</option>
            <option value="UPDATE_USER">Editar usuario</option>
            <option value="DELETE_USER">Eliminar usuario</option>
          </select>
        </div>

        {isLoading ? (
          <p className="text-on-surface-variant">Cargando logs...</p>
        ) : logs.length === 0 ? (
          <div className="py-8 text-center">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant">history</span>
            <p className="mt-2 text-on-surface-variant">No hay registros de actividad.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container-high">
                <tr>
                  <th className="px-4 py-3 text-on-surface-variant">Acción</th>
                  <th className="hidden px-4 py-3 text-on-surface-variant md:table-cell">Usuario</th>
                  <th className="hidden px-4 py-3 text-on-surface-variant sm:table-cell">Entidad</th>
                  <th className="px-4 py-3 text-on-surface-variant">Cuándo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/30">
                {logs.map((log) => {
                  const meta = actionLabels[log.action] ?? { label: log.action, variant: 'neutral' as const }
                  return (
                    <tr key={log.id} className="hover:bg-surface-container-low">
                      <td className="px-4 py-3">
                        <Badge variant={meta.variant}>{meta.label}</Badge>
                      </td>
                      <td className="hidden px-4 py-3 md:table-cell">
                        <p className="font-medium text-on-surface">{log.user_nombre ?? '—'}</p>
                        <p className="text-xs text-on-surface-variant">{log.user_email ?? ''}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-on-surface-variant sm:table-cell">
                        {log.entity}
                        {log.entity_id ? ` #${log.entity_id}` : ''}
                      </td>
                      <td className="px-4 py-3 text-xs text-on-surface-variant">
                        {timeAgo(log.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </section>
  )
}
