import { useCallback, useEffect, useState } from 'react'

import {
  countPendingActivities,
  getPendingActivities,
  type PendingActivityRecord,
} from '../services/offlineDb'
import {
  subscribeToPendingChanges,
  subscribeToSyncResults,
  syncPendingActivities,
  type SyncResult,
} from '../services/syncService'

interface UseOfflineSyncState {
  pendingCount: number
  pendingList: PendingActivityRecord[]
  lastSync: SyncResult | null
  isSyncing: boolean
  refresh: () => Promise<void>
  forceSync: () => Promise<SyncResult | null>
}

export function useOfflineSync(userId?: number): UseOfflineSyncState {
  const [pendingCount, setPendingCount] = useState(0)
  const [pendingList, setPendingList] = useState<PendingActivityRecord[]>([])
  const [lastSync, setLastSync] = useState<SyncResult | null>(null)
  const [isSyncing, setIsSyncing] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const [count, list] = await Promise.all([
        countPendingActivities(userId),
        getPendingActivities(userId),
      ])
      setPendingCount(count)
      setPendingList(list.sort((a, b) => b.createdAt - a.createdAt))
    } catch {
      setPendingCount(0)
      setPendingList([])
    }
  }, [userId])

  useEffect(() => {
    void refresh()

    const unsubPending = subscribeToPendingChanges(() => {
      void refresh()
    })
    const unsubSync = subscribeToSyncResults((result) => {
      setLastSync(result)
    })

    return () => {
      unsubPending()
      unsubSync()
    }
  }, [refresh])

  const forceSync = useCallback(async (): Promise<SyncResult | null> => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return null
    }
    setIsSyncing(true)
    try {
      const result = await syncPendingActivities(userId)
      setLastSync(result)
      await refresh()
      return result
    } finally {
      setIsSyncing(false)
    }
  }, [refresh, userId])

  return { pendingCount, pendingList, lastSync, isSyncing, refresh, forceSync }
}
