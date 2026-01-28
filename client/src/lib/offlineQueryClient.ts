// Enhanced query client with offline support
import { QueryClient, QueryFunction, MutationOptions } from "@tanstack/react-query";
import { offlineStorage, STORES } from './offlineStorage';
import { offlineSyncManager } from './offlineSync';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Enhanced API request with offline queue support
export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // If offline, queue the mutation and return optimistic response
  if (!navigator.onLine && (method === 'POST' || method === 'PUT' || method === 'DELETE' || method === 'PATCH')) {
    console.log('[OfflineAPI] Queueing request:', method, url);
    await offlineSyncManager.queueRequest(method as any, url, data);
    
    // Return a fake successful response for optimistic updates
    return new Response(JSON.stringify({ success: true, queued: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";

// Enhanced query function with offline cache fallback
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  offlineStoreName?: string;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, offlineStoreName }) =>
  async ({ queryKey }) => {
    const url = queryKey.join("/") as string;
    
    try {
      const res = await fetch(url, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      const data = await res.json();
      
      // Cache successful responses in IndexedDB for offline access
      if (offlineStoreName && data) {
        try {
          // Store array items individually with their IDs
          if (Array.isArray(data)) {
            for (const item of data) {
              if (item.id) {
                await offlineStorage.set(offlineStoreName, item);
              }
            }
          } else if (data.id) {
            await offlineStorage.set(offlineStoreName, data);
          }
        } catch (err) {
          console.warn('[OfflineCache] Failed to cache data:', err);
        }
      }
      
      return data;
    } catch (error) {
      // If offline and we have cached data, return it
      if (!navigator.onLine && offlineStoreName) {
        console.log('[OfflineCache] Using cached data for:', url);
        
        // Check if the query is for a list or single item
        const isList = url.includes('/api/') && !url.match(/\/\d+$/);
        
        if (isList) {
          const cachedData = await offlineStorage.getAll(offlineStoreName);
          if (cachedData.length > 0) {
            return cachedData as any;
          }
        } else {
          // Try to extract ID from URL for single item queries
          const idMatch = url.match(/\/(\d+)$/);
          if (idMatch) {
            const cachedItem = await offlineStorage.get(offlineStoreName, idMatch[1]);
            if (cachedItem) {
              return cachedItem as any;
            }
          }
        }
      }
      
      throw error;
    }
  };

// Create enhanced query client with offline support
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
      // Prevent automatic refetch when offline
      networkMode: 'offlineFirst',
    },
    mutations: {
      retry: false,
      // Allow mutations when offline (they'll be queued)
      networkMode: 'offlineFirst',
    },
  },
});

// Helper function to create offline-aware query options
export function offlineQuery<T>(
  queryKey: any[],
  storeName: string,
  on401: UnauthorizedBehavior = "throw"
) {
  return {
    queryKey,
    queryFn: getQueryFn<T>({ on401, offlineStoreName: storeName }),
  };
}

// Helper to invalidate and refetch when coming back online
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('[QueryClient] Network restored, invalidating queries...');
    queryClient.invalidateQueries();
  });
}
