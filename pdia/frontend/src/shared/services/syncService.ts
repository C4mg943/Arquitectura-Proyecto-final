import { apiClient, ApiClientError, type ActividadDto } from './apiClient'
import {
  getPendingActivities,
  removePendingActivity,
  updatePendingActivity,
  type PendingActivityRecord,
} from './offlineDb'

export interface SyncResult {
  synced: number
  failed: number
  errors: { id: string; message: string }[]
}

type SyncListener = (result: SyncResult) => void
type StatusListener = () => void

const syncListeners = new Set<SyncListener>()
const statusListeners = new Set<StatusListener>()

let syncInProgress = false

export function subscribeToSyncResults(listener: SyncListener): () => void {
  syncListeners.add(listener)
  return () => {
    syncListeners.delete(listener)
  }
}

/**
 * Suscriptor para notificar cambios en la cola (add, remove, status change).
 * Sirve para que la UI refresque el contador de pendientes sin polling.
 */
export function subscribeToPendingChanges(listener: StatusListener): () => void {
  statusListeners.add(listener)
  return () => {
    statusListeners.delete(listener)
  }
}

export function notifyPendingChanged(): void {
  statusListeners.forEach((listener) => {
    try {
      listener()
    } catch {
      // swallow listener errors
    }
  })
}

async function sendPendingRecord(record: PendingActivityRecord): Promise<ActividadDto> {
  switch (record.kind) {
    case 'riego':
      return apiClient.actividades.createRiego(
        record.payload as import('./apiClient').CreateRiegoPayload,
      )
    case 'fertilizante':
      return apiClient.actividades.createFertilizante(
        record.payload as import('./apiClient').CreateFertilizantePayload,
      )
    case 'plaga':
      return apiClient.actividades.createPlaga(
        record.payload as import('./apiClient').CreatePlagaPayload,
      )
    case 'generic':
    default:
      return apiClient.actividades.create(
        record.payload as import('./apiClient').CreateActividadPayload,
      )
  }
}

/**
 * Intenta sincronizar todas las actividades pendientes.
 * Es idempotente: si ya hay una sync en curso, ignora la llamada.
 */
export async function syncPendingActivities(userId?: number): Promise<SyncResult> {
  if (syncInProgress) {
    return { synced: 0, failed: 0, errors: [] }
  }
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { synced: 0, failed: 0, errors: [] }
  }

  syncInProgress = true
  const result: SyncResult = { synced: 0, failed: 0, errors: [] }

  try {
    const pending = await getPendingActivities(userId)
    const toSync = pending.filter((r) => r.status !== 'syncing')

    for (const record of toSync) {
      await updatePendingActivity(record.id, { status: 'syncing' })
      notifyPendingChanged()

      try {
        await sendPendingRecord(record)
        await removePendingActivity(record.id)
        result.synced += 1
      } catch (error) {
        const message =
          error instanceof ApiClientError
            ? error.message
            : error instanceof Error
              ? error.message
              : 'Error desconocido al sincronizar'

        // 4xx que no son 401: el registro es inválido → descartar para no bloquear la cola
        if (error instanceof ApiClientError && error.status >= 400 && error.status < 500 && error.status !== 401) {
          await removePendingActivity(record.id)
          result.failed += 1
          result.errors.push({ id: record.id, message })
        } else {
          await updatePendingActivity(record.id, {
            status: 'error',
            attempts: record.attempts + 1,
            lastError: message,
          })
          result.failed += 1
          result.errors.push({ id: record.id, message })
        }
      } finally {
        notifyPendingChanged()
      }
    }
  } finally {
    syncInProgress = false
  }

  syncListeners.forEach((listener) => {
    try {
      listener(result)
    } catch {
      // swallow listener errors
    }
  })

  return result
}

let autoSyncInstalled = false

/**
 * Instala un listener global que intenta sincronizar cuando vuelve la conexión.
 * Seguro de llamar múltiples veces: solo se instala una vez por sesión.
 */
export function installAutoSync(): void {
  if (autoSyncInstalled || typeof window === 'undefined') return
  autoSyncInstalled = true

  const run = () => {
    void syncPendingActivities().catch(() => {
      /* errores individuales ya quedan registrados en lastError */
    })
  }

  window.addEventListener('online', run)

  // Intento inicial al cargar la app por si ya hay pendientes y estamos online
  if (navigator.onLine) {
    // retraso pequeño para no bloquear el arranque
    setTimeout(run, 1500)
  }
}
