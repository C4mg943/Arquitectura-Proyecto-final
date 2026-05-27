import { openDB, type DBSchema, type IDBPDatabase } from 'idb'

import type {
  ActividadDto,
  CreateActividadPayload,
  CreateFertilizantePayload,
  CreatePlagaPayload,
  CreateRiegoPayload,
  CultivoDto,
  FincaDto,
  ParcelaDto,
} from './apiClient'

const DB_NAME = 'pdia-offline'
const DB_VERSION = 1

export type PendingActivityKind = 'generic' | 'riego' | 'fertilizante' | 'plaga'

export type PendingActivityPayload =
  | { kind: 'generic'; payload: CreateActividadPayload }
  | { kind: 'riego'; payload: CreateRiegoPayload }
  | { kind: 'fertilizante'; payload: CreateFertilizantePayload }
  | { kind: 'plaga'; payload: CreatePlagaPayload }

export type PendingSyncStatus = 'pending' | 'syncing' | 'error'

export interface PendingActivityRecord {
  /** local uuid (clientRef) — también es la key del store */
  id: string
  kind: PendingActivityKind
  /** payload tal como se mandaría al backend */
  payload:
    | CreateActividadPayload
    | CreateRiegoPayload
    | CreateFertilizantePayload
    | CreatePlagaPayload
  /** copia denormalizada para mostrar el registro en la UI sin hit al backend */
  optimistic: ActividadDto
  createdAt: number
  status: PendingSyncStatus
  attempts: number
  lastError?: string
  /** userId de quien creó el registro, para filtrar si cambia la sesión */
  userId: number
}

interface PdiaOfflineDb extends DBSchema {
  pendingActivities: {
    key: string
    value: PendingActivityRecord
    indexes: {
      byStatus: PendingSyncStatus
      byUser: number
    }
  }
  cachedCultivos: {
    key: number
    value: CultivoDto
  }
  cachedParcelas: {
    key: number
    value: ParcelaDto
  }
  cachedFincas: {
    key: number
    value: FincaDto
  }
  cachedActivities: {
    key: number
    value: ActividadDto
    indexes: { byCultivo: number }
  }
  meta: {
    key: string
    value: { key: string; value: unknown; updatedAt: number }
  }
}

let dbPromise: Promise<IDBPDatabase<PdiaOfflineDb>> | null = null

function getDb(): Promise<IDBPDatabase<PdiaOfflineDb>> {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB no está disponible en este entorno'))
  }
  if (!dbPromise) {
    dbPromise = openDB<PdiaOfflineDb>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('pendingActivities')) {
          const store = db.createObjectStore('pendingActivities', { keyPath: 'id' })
          store.createIndex('byStatus', 'status')
          store.createIndex('byUser', 'userId')
        }
        if (!db.objectStoreNames.contains('cachedCultivos')) {
          db.createObjectStore('cachedCultivos', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('cachedParcelas')) {
          db.createObjectStore('cachedParcelas', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('cachedFincas')) {
          db.createObjectStore('cachedFincas', { keyPath: 'id' })
        }
        if (!db.objectStoreNames.contains('cachedActivities')) {
          const store = db.createObjectStore('cachedActivities', { keyPath: 'id' })
          store.createIndex('byCultivo', 'cultivoId')
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta', { keyPath: 'key' })
        }
      },
    })
  }
  return dbPromise
}

/** Genera un id único local para actividades pendientes. */
export function generateClientRef(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `local-${crypto.randomUUID()}`
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// ============ Actividades pendientes ============

export async function addPendingActivity(record: PendingActivityRecord): Promise<void> {
  const db = await getDb()
  await db.put('pendingActivities', record)
}

export async function getPendingActivities(userId?: number): Promise<PendingActivityRecord[]> {
  const db = await getDb()
  const all = await db.getAll('pendingActivities')
  if (userId === undefined) return all
  return all.filter((r) => r.userId === userId)
}

export async function updatePendingActivity(
  id: string,
  changes: Partial<PendingActivityRecord>,
): Promise<void> {
  const db = await getDb()
  const current = await db.get('pendingActivities', id)
  if (!current) return
  await db.put('pendingActivities', { ...current, ...changes })
}

export async function removePendingActivity(id: string): Promise<void> {
  const db = await getDb()
  await db.delete('pendingActivities', id)
}

export async function countPendingActivities(userId?: number): Promise<number> {
  const list = await getPendingActivities(userId)
  return list.filter((r) => r.status !== 'syncing').length
}

// ============ Caches de lectura ============

async function replaceStore<Name extends 'cachedCultivos' | 'cachedParcelas' | 'cachedFincas'>(
  storeName: Name,
  items: PdiaOfflineDb[Name]['value'][],
): Promise<void> {
  const db = await getDb()
  const tx = db.transaction(storeName, 'readwrite')
  await tx.store.clear()
  for (const item of items) {
    await tx.store.put(item)
  }
  await tx.done
}

export const cacheCultivos = (items: CultivoDto[]) => replaceStore('cachedCultivos', items)
export const cacheParcelas = (items: ParcelaDto[]) => replaceStore('cachedParcelas', items)
export const cacheFincas = (items: FincaDto[]) => replaceStore('cachedFincas', items)

export async function readCachedCultivos(): Promise<CultivoDto[]> {
  const db = await getDb()
  return db.getAll('cachedCultivos')
}

export async function readCachedParcelas(): Promise<ParcelaDto[]> {
  const db = await getDb()
  return db.getAll('cachedParcelas')
}

export async function readCachedFincas(): Promise<FincaDto[]> {
  const db = await getDb()
  return db.getAll('cachedFincas')
}

export async function cacheActivities(items: ActividadDto[]): Promise<void> {
  const db = await getDb()
  const tx = db.transaction('cachedActivities', 'readwrite')
  await tx.store.clear()
  for (const item of items) {
    await tx.store.put(item)
  }
  await tx.done
}

export async function readCachedActivities(): Promise<ActividadDto[]> {
  const db = await getDb()
  return db.getAll('cachedActivities')
}
