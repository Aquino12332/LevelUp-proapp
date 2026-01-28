// IndexedDB wrapper for offline data persistence
const DB_NAME = 'ProAppOfflineDB';
const DB_VERSION = 1;

// Store names
export const STORES = {
  TASKS: 'tasks',
  FOCUS_SESSIONS: 'focusSessions',
  NOTES: 'notes',
  USER_DATA: 'userData',
  SYNC_QUEUE: 'syncQueue',
} as const;

export interface SyncQueueItem {
  id: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  data?: any;
  timestamp: number;
  retries: number;
}

class OfflineStorage {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<void> | null = null;

  async init(): Promise<void> {
    if (this.db) return;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores if they don't exist
        if (!db.objectStoreNames.contains(STORES.TASKS)) {
          db.createObjectStore(STORES.TASKS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.FOCUS_SESSIONS)) {
          db.createObjectStore(STORES.FOCUS_SESSIONS, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.NOTES)) {
          db.createObjectStore(STORES.NOTES, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(STORES.USER_DATA)) {
          db.createObjectStore(STORES.USER_DATA, { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains(STORES.SYNC_QUEUE)) {
          const syncStore = db.createObjectStore(STORES.SYNC_QUEUE, { keyPath: 'id' });
          syncStore.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };
    });

    return this.initPromise;
  }

  async get<T>(storeName: string, key: string): Promise<T | null> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.get(key);

      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readonly');
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result || []);
      request.onerror = () => reject(request.error);
    });
  }

  async set<T>(storeName: string, value: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.put(value);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async delete(storeName: string, key: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.delete(key);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(storeName, 'readwrite');
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  // Sync queue specific methods
  async addToSyncQueue(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retries'>): Promise<void> {
    const queueItem: SyncQueueItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retries: 0,
    };
    await this.set(STORES.SYNC_QUEUE, queueItem);
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    return this.getAll<SyncQueueItem>(STORES.SYNC_QUEUE);
  }

  async removeSyncQueueItem(id: string): Promise<void> {
    await this.delete(STORES.SYNC_QUEUE, id);
  }

  async updateSyncQueueItem(item: SyncQueueItem): Promise<void> {
    await this.set(STORES.SYNC_QUEUE, item);
  }
}

export const offlineStorage = new OfflineStorage();
