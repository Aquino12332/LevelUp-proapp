import { useState, useEffect } from 'react';
import { offlineSyncManager } from '@/lib/offlineSync';

export function useSyncStatus() {
  const [status, setStatus] = useState<'syncing' | 'idle' | 'error'>('idle');
  const [queueCount, setQueueCount] = useState(0);

  useEffect(() => {
    // Subscribe to status changes
    const unsubscribe = offlineSyncManager.onStatusChange(setStatus);

    // Update queue count
    const updateQueueCount = async () => {
      const { count } = await offlineSyncManager.getQueueStatus();
      setQueueCount(count);
    };

    updateQueueCount();
    const interval = setInterval(updateQueueCount, 5000); // Update every 5 seconds

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, []);

  return { status, queueCount, isSyncing: status === 'syncing' };
}
