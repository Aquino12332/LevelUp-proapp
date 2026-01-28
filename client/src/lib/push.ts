/* Minimal Push subscription helper.
   - Subscribes the browser to PushManager and POSTs the subscription to the server.
   - Replace <VAPID_PUBLIC_KEY_PLACEHOLDER> with your VAPID public key.
*/
function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function subscribeToPush(registration: ServiceWorkerRegistration) {
  if (typeof window === "undefined") return;
  if (!('PushManager' in window)) {
    console.warn('PushManager not supported in this browser');
    return;
  }

  const existing = await registration.pushManager.getSubscription();
  if (existing) {
    console.log('Already subscribed to push');
    // Send existing subscription to server with actual user ID
    const userIdFromStorage = localStorage.getItem('userId');
    if (userIdFromStorage) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: existing, userId: userIdFromStorage })
      }).catch(console.error);
    }
    return existing;
  }

  // Replace with your app server public VAPID key
  const VAPID_PUBLIC_KEY = 'BMngnidkuzQ0yhhRpL4uEqasMT0AJO0enKGN7TGl2UBFyzr1cLmyaSXBorwVxEhpKih7N7zhQwvA3aVeD6MN9ps';
  try {
    const sub = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
    });

    // Get actual user ID from localStorage
    const userIdFromStorage = localStorage.getItem('userId');
    if (userIdFromStorage) {
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub, userId: userIdFromStorage })
      });
      console.log('Push subscription created for user:', userIdFromStorage);
    } else {
      console.warn('User ID not found in localStorage - push notifications may not work');
    }

    return sub;
  } catch (err) {
    console.error('Failed to subscribe to push:', err);
    throw err;
  }
}

export async function unsubscribeFromPush(registration: ServiceWorkerRegistration) {
  const sub = await registration.pushManager.getSubscription();
  if (!sub) return;
  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subscription: sub })
  }).catch(console.error);
  await sub.unsubscribe();
}
