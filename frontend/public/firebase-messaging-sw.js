/**
 * Firebase Cloud Messaging Service Worker
 * 
 * This file handles background push notifications from Firebase.
 * 
 * REQUIRED: Replace the firebaseConfig values below with your actual Firebase project config.
 * Firebase Console → ⚙️ Configurações → Geral → Seus apps → Configuração do SDK
 */

// Import Firebase scripts for the service worker
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js');

// ────────────────────────────────────────────────────────────
// FILL IN YOUR FIREBASE CONFIG BELOW:
// ────────────────────────────────────────────────────────────
const firebaseConfig = {
  apiKey: self.__FIREBASE_CONFIG_API_KEY__ || "FILL_IN_API_KEY",
  authDomain: self.__FIREBASE_CONFIG_AUTH_DOMAIN__ || "FILL_IN_AUTH_DOMAIN",
  projectId: self.__FIREBASE_CONFIG_PROJECT_ID__ || "FILL_IN_PROJECT_ID",
  storageBucket: self.__FIREBASE_CONFIG_STORAGE_BUCKET__ || "FILL_IN_STORAGE_BUCKET",
  messagingSenderId: self.__FIREBASE_CONFIG_MESSAGING_SENDER_ID__ || "FILL_IN_MESSAGING_SENDER_ID",
  appId: self.__FIREBASE_CONFIG_APP_ID__ || "FILL_IN_APP_ID",
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
