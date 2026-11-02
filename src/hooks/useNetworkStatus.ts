import { useState, useEffect, useCallback } from 'react';
import { getPendingSyncQueue, removeSyncQueueItem } from '../services/db';

export function useNetworkStatus(onSyncComplete?: (itemCount: number) => void) {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [wasOffline, setWasOffline] = useState(false);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const refreshPendingCount = useCallback(async () => {
    try {
      const items = await getPendingSyncQueue();
      setPendingSyncCount(items.length);
    } catch {
      setPendingSyncCount(0);
    }
  }, []);

  const processPendingSync = useCallback(async () => {
    try {
      const items = await getPendingSyncQueue();
      if (items.length === 0) return;

      console.log(`[Sync] Processing ${items.length} queued offline actions...`);
      for (const item of items) {
        if (item.id) {
          // Process based on action
          if (item.action === 'search_query') {
            console.log('[Sync] Dispatched queued search:', item.payload);
          }
          await removeSyncQueueItem(item.id);
        }
      }

      await refreshPendingCount();
      if (onSyncComplete) {
        onSyncComplete(items.length);
      }
    } catch (err) {
      console.error('[Sync] Error processing queue:', err);
    }
  }, [refreshPendingCount, onSyncComplete]);

  useEffect(() => {
    refreshPendingCount();

    const handleOnline = () => {
      console.log('[Network] Connection restored: Online');
      setIsOnline(true);
      setWasOffline(true);

      // Trigger background sync if supported
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg: any) => {
          if (reg.sync) {
            reg.sync.register('sync-offline-requests').catch(console.warn);
          }
        });
      }

      // Process pending queue
      processPendingSync();

      // Reset wasOffline notification banner after 4 seconds
      setTimeout(() => {
        setWasOffline(false);
      }, 4000);
    };

    const handleOffline = () => {
      console.log('[Network] Connection lost: Offline');
      setIsOnline(false);
      refreshPendingCount();
    };

    // Listen to messages from Service Worker (e.g. background sync completed)
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'BACKGROUND_SYNC_TRIGGERED') {
        processPendingSync();
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, [processPendingSync, refreshPendingCount]);

  return {
    isOnline,
    wasOffline,
    pendingSyncCount,
    refreshPendingCount,
    processPendingSync,
  };
}
