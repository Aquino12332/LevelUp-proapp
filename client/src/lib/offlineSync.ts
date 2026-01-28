// Offline sync queue manager
import { offlineStorage, STORES, type SyncQueueItem } from './offlineStorage';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // Start with 1 second, exponential backoff

class OfflineSyncManager {
  private syncing = false;
  private listeners: Set<(status: 'syncing' | 'idle' | 'error') => void> = new Set();

  // Add a request to the sync queue
  async queueRequest(method: 'POST' | 'PUT' | 'DELETE' | 'PATCH', url: string, data?: any): Promise<void> {
    await offlineStorage.addToSyncQueue({ method, url, data });
    console.log('[OfflineSync] Queued request:', method, url);
  }

  // Process the sync queue
  async processQueue(): Promise<void> {
    if (this.syncing) {
      console.log('[OfflineSync] Already syncing, skipping...');
      return;
    }

    if (!navigator.onLine) {
      console.log('[OfflineSync] Offline, skipping sync');
      return;
    }

    this.syncing = true;
    this.notifyListeners('syncing');

    try {
      const queue = await offlineStorage.getSyncQueue();
      console.log(`[OfflineSync] Processing ${queue.length} queued items`);

      // Sort by timestamp to maintain order
      queue.sort((a, b) => a.timestamp - b.timestamp);

      for (const item of queue) {
        try {
          await this.processSyncItem(item);
          await offlineStorage.removeSyncQueueItem(item.id);
          console.log('[OfflineSync] Successfully synced:', item.url);
        } catch (error) {
          console.error('[OfflineSync] Failed to sync item:', item.url, error);
          
          // Increment retry count
          item.retries += 1;
          
          if (item.retries >= MAX_RETRIES) {
            console.warn('[OfflineSync] Max retries reached, removing from queue:', item.url);
            await offlineStorage.removeSyncQueueItem(item.id);
          } else {
            console.log(`[OfflineSync] Will retry (${item.retries}/${MAX_RETRIES}):`, item.url);
            await offlineStorage.updateSyncQueueItem(item);
          }
        }
      }

      this.notifyListeners('idle');
    } catch (error) {
      console.error('[OfflineSync] Queue processing failed:', error);
      this.notifyListeners('error');
    } finally {
      this.syncing = false;
    }
  }

  private async processSyncItem(item: SyncQueueItem): Promise<void> {
    const response = await fetch(item.url, {
      method: item.method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: item.data ? JSON.stringify(item.data) : undefined,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Get queue status
  async getQueueStatus(): Promise<{ count: number; items: SyncQueueItem[] }> {
    const items = await offlineStorage.getSyncQueue();
    return { count: items.length, items };
  }

  // Clear the entire queue
  async clearQueue(): Promise<void> {
    await offlineStorage.clear(STORES.SYNC_QUEUE);
    console.log('[OfflineSync] Queue cleared');
  }

  // Subscribe to sync status changes
  onStatusChange(callback: (status: 'syncing' | 'idle' | 'error') => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notifyListeners(status: 'syncing' | 'idle' | 'error'): void {
    this.listeners.forEach((callback) => callback(status));
  }

  // Register background sync (if supported)
  async registerBackgroundSync(): Promise<void> {
    if ('serviceWorker' in navigator && 'sync' in ServiceWorkerRegistration.prototype) {
      try {
        const registration = await navigator.serviceWorker.ready;
        await (registration as any).sync.register('sync-offline-queue');
        console.log('[OfflineSync] Background sync registered');
      } catch (error) {
        console.warn('[OfflineSync] Background sync registration failed:', error);
      }
    }
  }
}

export const offlineSyncManager = new OfflineSyncManager();

// Listen for service worker messages to trigger sync
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SYNC_QUEUE') {
      console.log('[OfflineSync] Received sync request from service worker');
      offlineSyncManager.processQueue();
    }
  });
}

// Auto-sync when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Network restored, processing queue...');
    offlineSyncManager.processQueue();
  });
}
