import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStatus } from '@/hooks/useSyncStatus';
import { WifiOff, Wifi, CloudOff, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();
  const { status, queueCount, isSyncing } = useSyncStatus();

  // Don't show anything if online and nothing in queue
  if (isOnline && queueCount === 0 && !isSyncing) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-md">
      {!isOnline && (
        <Alert className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
          <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <div className="flex items-center justify-between">
              <span className="font-medium">You're offline</span>
              {queueCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {queueCount} pending
                </Badge>
              )}
            </div>
            <p className="text-sm mt-1 text-yellow-700 dark:text-yellow-300">
              Changes will sync when you reconnect
            </p>
          </AlertDescription>
        </Alert>
      )}

      {isOnline && isSyncing && (
        <Alert className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
          <RefreshCw className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
          <AlertDescription className="text-blue-800 dark:text-blue-200">
            <span className="font-medium">Syncing changes...</span>
            {queueCount > 0 && (
              <span className="text-sm ml-2">({queueCount} remaining)</span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isOnline && !isSyncing && queueCount > 0 && (
        <Alert className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
          <Wifi className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertDescription className="text-green-800 dark:text-green-200">
            <div className="flex items-center justify-between">
              <span className="font-medium">Back online</span>
              <Badge variant="secondary" className="ml-2">
                {queueCount} queued
              </Badge>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {status === 'error' && (
        <Alert className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
          <CloudOff className="h-4 w-4 text-red-600 dark:text-red-400" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            <span className="font-medium">Sync error</span>
            <p className="text-sm mt-1 text-red-700 dark:text-red-300">
              Some changes couldn't sync. We'll try again later.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
