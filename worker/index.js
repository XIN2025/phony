import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache assets injected by next-pwa
precacheAndRoute(self.__WB_MANIFEST);

// Cache API responses
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60, // 5 minutes
      }),
    ],
  })
);

// --- Push Notification Logic ---
self.addEventListener('push', function (event) {
  console.log('[SW] Push event received:', event);

  let data = {};
  if (event.data) {
    try {
      // First try to parse as JSON
      data = event.data.json();
      console.log('[SW] Parsed push data as JSON:', data);
    } catch (jsonError) {
      console.log('[SW] Failed to parse as JSON, trying as text:', jsonError.message);

      try {
        // If JSON parsing fails, try to get as text
        const textData = event.data.text();
        console.log('[SW] Raw text data:', textData);

        // Try to parse the text as JSON (in case it's JSON string)
        try {
          data = JSON.parse(textData);
          console.log('[SW] Successfully parsed text as JSON:', data);
        } catch (parseError) {
          // If it's not JSON, treat it as plain text
          console.log('[SW] Treating as plain text message');
          data = {
            title: 'New Notification',
            body: textData || 'You have a new message.',
          };
        }
      } catch (textError) {
        console.error('[SW] Error reading push data as text:', textError);
        data = {
          title: 'New Notification',
          body: 'You have a new message.',
        };
      }
    }
  } else {
    console.log('[SW] No data in push event, using default notification');
    data = {
      title: 'New Notification',
      body: 'You have a new message.',
    };
  }

  const title = data.title || 'New Notification';
  const options = {
    body: data.body || 'You have a new message.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: {
      url: data.url || '/',
      timestamp: Date.now(),
    },
    requireInteraction: false,
    silent: false,
    tag: data.tag || 'default',
    actions: data.actions || [],
  };

  console.log('[SW] Showing notification with options:', options);

  event.waitUntil(
    self.registration
      .showNotification(title, options)
      .then(() => {
        console.log('[SW] Notification shown successfully');
      })
      .catch((error) => {
        console.error('[SW] Error showing notification:', error);
      })
  );
});

self.addEventListener('notificationclick', function (event) {
  console.log('[SW] Notification click received:', event);

  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  console.log('[SW] Opening URL:', urlToOpen);

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        console.log('[SW] Found window clients:', windowClients.length);

        // Check if there's already a window/tab open with the target URL
        for (let client of windowClients) {
          if (client.url === urlToOpen && 'focus' in client) {
            console.log('[SW] Focusing existing window');
            return client.focus();
          }
        }

        // If no existing window/tab, open a new one
        if (clients.openWindow) {
          console.log('[SW] Opening new window');
          return clients.openWindow(urlToOpen);
        }
      })
      .catch((error) => {
        console.error('[SW] Error handling notification click:', error);
      })
  );
});

self.addEventListener('notificationclose', function (event) {
  console.log('[SW] Notification closed:', event);
});

// Handle service worker installation
self.addEventListener('install', function (event) {
  console.log('[SW] Service Worker installing...');
  self.skipWaiting();
});

// Handle service worker activation
self.addEventListener('activate', function (event) {
  console.log('[SW] Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Handle service worker message events
self.addEventListener('message', function (event) {
  console.log('[SW] Message received:', event.data);

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
