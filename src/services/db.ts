import { PerfumeItem, RecommendationResponse } from '../types/perfume';

const DB_NAME = 'AuraPerfumeDB';
const DB_VERSION = 1;

export interface CachedQueryRecord {
  id: string; // generated query key
  query: string;
  maxPrice: number;
  data: RecommendationResponse;
  savedAt: number;
}

export interface OfflineSyncItem {
  id?: number;
  action: 'search_query' | 'toggle_favorite' | 'feedback';
  payload: any;
  createdAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB no es soportado en este navegador'));
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Store for caching recommendation queries & results
      if (!db.objectStoreNames.contains('queries_cache')) {
        db.createObjectStore('queries_cache', { keyPath: 'id' });
      }

      // 2. Store for robust favorites persistence
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }

      // 3. Store for offline background synchronization queue
      if (!db.objectStoreNames.contains('offline_sync_queue')) {
        const syncStore = db.createObjectStore('offline_sync_queue', {
          keyPath: 'id',
          autoIncrement: true,
        });
        syncStore.createIndex('status', 'status', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** Helper to generate cache key */
function makeKey(query: string, maxPrice: number): string {
  return `${query.trim().toLowerCase()}_${maxPrice}`;
}

// ----------------- QUERIES CACHE -----------------

export async function cacheQueryResult(
  query: string,
  maxPrice: number,
  data: RecommendationResponse
): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('queries_cache', 'readwrite');
    const store = tx.objectStore('queries_cache');
    const key = makeKey(query, maxPrice);

    store.put({
      id: key,
      query,
      maxPrice,
      data,
      savedAt: Date.now(),
    });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error caching query:', err);
  }
}

export async function getCachedQueryResult(
  query: string,
  maxPrice: number
): Promise<RecommendationResponse | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('queries_cache', 'readonly');
    const store = tx.objectStore('queries_cache');
    const key = makeKey(query, maxPrice);

    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = () => {
        const record = req.result as CachedQueryRecord | undefined;
        if (record && record.data) {
          resolve(record.data);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error reading cached query:', err);
    return null;
  }
}

export async function getAllCachedQueries(): Promise<CachedQueryRecord[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('queries_cache', 'readonly');
    const store = tx.objectStore('queries_cache');

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ----------------- FAVORITES -----------------

export async function saveFavoriteDB(perfume: PerfumeItem): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    store.put({ ...perfume, savedAt: Date.now() });

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error saving favorite:', err);
  }
}

export async function removeFavoriteDB(id: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('favorites', 'readwrite');
    const store = tx.objectStore('favorites');
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error removing favorite:', err);
  }
}

export async function getFavoritesDB(): Promise<PerfumeItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('favorites', 'readonly');
    const store = tx.objectStore('favorites');

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ----------------- OFFLINE SYNC QUEUE -----------------

export async function queueOfflineAction(
  action: OfflineSyncItem['action'],
  payload: any
): Promise<number | null> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_sync_queue', 'readwrite');
    const store = tx.objectStore('offline_sync_queue');

    const item: OfflineSyncItem = {
      action,
      payload,
      createdAt: Date.now(),
      status: 'pending',
    };

    return new Promise((resolve, reject) => {
      const req = store.add(item);
      req.onsuccess = () => {
        resolve(req.result as number);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error queuing offline action:', err);
    return null;
  }
}

export async function getPendingSyncQueue(): Promise<OfflineSyncItem[]> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_sync_queue', 'readonly');
    const store = tx.objectStore('offline_sync_queue');

    return new Promise((resolve) => {
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result as OfflineSyncItem[]) || [];
        resolve(items.filter((i) => i.status === 'pending'));
      };
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function removeSyncQueueItem(id: number): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_sync_queue', 'readwrite');
    const store = tx.objectStore('offline_sync_queue');
    store.delete(id);

    return new Promise((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn('[IndexedDB] Error removing sync item:', err);
  }
}

export async function clearAllSyncQueue(): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction('offline_sync_queue', 'readwrite');
    tx.objectStore('offline_sync_queue').clear();
  } catch (err) {
    console.warn('[IndexedDB] Error clearing sync queue:', err);
  }
}
