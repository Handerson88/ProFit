/**
 * Unified Service Worker: PWA Caching + Firebase Cloud Messaging
 */

// 1. Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// 2. Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCwshZakv7BWNuFwhnYANezEzamKVRfme0",
  authDomain: "profit-47c12.firebaseapp.com",
  projectId: "profit-47c12",
  storageBucket: "profit-47c12.firebasestorage.app",
  messagingSenderId: "485837590512",
  appId: "1:485837590512:web:96b1210be7121b16d05735",
  measurementId: "G-ZKN7ZFDR09"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// 3. PWA Caching Logic
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
  // Only cache GET requests and non-api calls
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        // Optional: Cache new successful responses
        // return caches.open(CACHE_NAME).then((cache) => {
        //   cache.put(event.request, fetchResponse.clone());
        //   return fetchResponse;
        // });
        return fetchResponse;
      });
    }).catch(() => {
        // Fallback or custom offline page could go here
    })
  );
});

// 4. FCM Background Messaging
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] FCM Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Profit';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/faviconnovo.png',
    badge: '/faviconnovo.png',
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.click_action || '/',
      ...payload.data,
    },
    actions: [
      { action: 'open', title: 'Abrir' },
      { action: 'close', title: 'Fechar' },
    ],
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// 5. Notification Click Handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
