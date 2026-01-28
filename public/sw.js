/* Service worker to show notifications for push events.
   - Listens for `push` and displays a notification with the payload.
   - Handles `notificationclick` to focus or open the client.
*/
self.addEventListener('push', function(event) {
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
    data: data
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
