/**
 * Unified Service Worker: PWA Caching + Web Push
 */

const CACHE_NAME = 'profit-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/faviconnovo.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(URLS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return fetchResponse;
      });
    }).catch(() => {
        // Fallback or custom offline page could go here
    })
  );
});

// Web Push Notification Event
self.addEventListener('push', (event) => {
  if (!event.data) return;

  try {
    const data = event.data.json();
    const title = data.title || 'ProFit';
    
    // Support for both 'url' and 'click_action' from backend
    const targetUrl = data.data?.url || data.data?.click_action || data.url || data.click_action || '/';
    
    const options = {
      body: data.body || '',
      icon: '/faviconnovo.png',
      badge: '/faviconnovo.png',
      vibrate: [200, 100, 200, 100, 200], // More distinct vibration
      timestamp: Date.now(),
      tag: data.data?.tag || 'profit-alert', // Group related notifications
      renotify: true, // Re-notify if the same tag is used
      data: {
        url: targetUrl,
        ...data.data
      },
      actions: [
        { action: 'open', title: 'Abrir' },
        { action: 'close', title: 'Ignorar' },
      ],
      requireInteraction: false // Let it disappear after some time
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (error) {
    console.error('[SW] Push event error:', error);
    const textData = event.data.text();
    event.waitUntil(self.registration.showNotification('ProFit', { 
        body: textData,
        icon: '/faviconnovo.png'
    }));
  }
});

// Notification Click Handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Use 'url' then fallback to 'click_action'
  const urlToOpen = event.notification.data?.url || event.notification.data?.click_action || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Try to find an existing tab and focus it
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && 'focus' in client) {
          return client.focus();
        }
      }
      // If no tab, open a new one
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
