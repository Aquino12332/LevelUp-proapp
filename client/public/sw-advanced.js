/* Advanced Service Worker with:
   - Push notifications
   - Asset caching (Cache API)
   - Network-first with cache fallback for API calls
   - Cache-first for static assets
   - Background sync support
*/

const CACHE_VERSION = 'v1';
const STATIC_CACHE = `static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `dynamic-${CACHE_VERSION}`;
const API_CACHE = `api-${CACHE_VERSION}`;

// Assets to cache immediately on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/favicon.png',
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => {
      console.log('[SW] Caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.error('[SW] Failed to cache some static assets:', err);
        // Don't fail installation if some assets fail
      });
    }).then(() => {
      console.log('[SW] Skip waiting');
      return self.skipWaiting();
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE && cacheName !== API_CACHE) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] Claiming clients');
      return self.clients.claim();
    })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip cross-origin requests (except for fonts/CDN assets)
  if (url.origin !== self.location.origin && !url.hostname.includes('fonts.g')) {
    return;
  }

  // API requests - Network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request, API_CACHE));
    return;
  }

  // Static assets (JS, CSS, images, fonts) - Cache first
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'image' ||
    request.destination === 'font' ||
    url.pathname.match(/\.(js|css|png|jpg|jpeg|svg|woff|woff2|ttf|gif|webp)$/)
  ) {
    event.respondWith(cacheFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // HTML pages - Network first
  if (request.destination === 'document' || request.mode === 'navigate') {
    event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
    return;
  }

  // Default - try network first
  event.respondWith(networkFirstStrategy(request, DYNAMIC_CACHE));
});

// Network-first strategy (with cache fallback)
async function networkFirstStrategy(request, cacheName) {
  try {
    const networkResponse = await fetch(request);
    
    // Only cache successful responses
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      // Clone the response because it can only be consumed once
      cache.put(request, networkResponse.clone()).catch((err) => {
        console.warn('[SW] Failed to cache response:', err);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // If it's an API request and we have no cache, return offline response
    if (request.url.includes('/api/')) {
      return new Response(
        JSON.stringify({ 
          error: 'Offline', 
          message: 'You are currently offline. Changes will sync when you reconnect.' 
        }),
        { 
          status: 503,
          statusText: 'Service Unavailable',
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // For navigation requests, return a basic offline page
    if (request.mode === 'navigate') {
      return caches.match('/') || new Response('Offline', { status: 503 });
    }
    
    throw error;
  }
}

// Cache-first strategy (with network fallback)
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse && networkResponse.status === 200) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone()).catch((err) => {
        console.warn('[SW] Failed to cache response:', err);
      });
    }
    
    return networkResponse;
  } catch (error) {
    console.error('[SW] Both cache and network failed:', error);
    throw error;
  }
}

// Push notification handling (from original sw.js)
self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Alarm', body: event.data ? event.data.text() : 'Alarm fired' };
  }

  const title = data.title || 'Alarm';
  const options = {
    body: data.body || 'Tap to open app',
    tag: data.tag || 'alarm',
    requireInteraction: data.requireInteraction !== undefined ? data.requireInteraction : true,
    icon: '/favicon.png',
    badge: '/favicon.png',
    data: data
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url === self.location.origin + '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background sync for offline queue
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-offline-queue') {
    event.waitUntil(syncOfflineQueue());
  }
});

async function syncOfflineQueue() {
  try {
    // Notify clients to process their sync queue
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
      client.postMessage({ type: 'SYNC_QUEUE' });
    });
  } catch (error) {
    console.error('[SW] Sync failed:', error);
    throw error; // Re-throw to retry later
  }
}

// Message handling from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

console.log('[SW] Service worker script loaded');
