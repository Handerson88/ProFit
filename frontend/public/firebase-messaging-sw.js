/**
 * Firebase Cloud Messaging Service Worker
 * 
 * This file handles background push notifications from Firebase.
 */

// Import Firebase scripts for the service worker
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// ────────────────────────────────────────────────────────────
// CONFIGURAÇÃO REAL DO FIREBASE:
// ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyCwshZakv7BWNuFwhnYANezEzamKVRfme0",
  authDomain: "profit-47c12.firebaseapp.com",
  projectId: "profit-47c12",
  storageBucket: "profit-47c12.firebasestorage.app",
  messagingSenderId: "485837590512",
  appId: "1:485837590512:web:96b1210be7121b16d05735",
  measurementId: "G-ZKN7ZFDR09"
};
// ────────────────────────────────────────────────────────────

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Handle background push messages from FCM
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] FCM Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'ProFit';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [100, 50, 100],
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

// Handle notification click
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
