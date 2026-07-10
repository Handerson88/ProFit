/**
 * ProFit Service Worker — PWA Cache + Web Push
 * Compatible: Chrome, Firefox, Edge, Safari iOS 16.4+ (PWA)
 */

const CACHE_NAME = 'profit-v3';
const PRECACHE = ['/', '/index.html', '/manifest.json', '/faviconnovo.png'];

// ── Install ──────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── Fetch (cache-first for static, network-first for API) ────
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;
      return fetch(event.request).catch(() => caches.match('/index.html'));
    })
  );
});

// ── Push ─────────────────────────────────────────────────────
// Uses ONLY options that are safe across ALL browsers including iOS Safari PWA.
// Never use: vibrate, actions, renotify, badge, requireInteraction
// (they silently fail or crash showNotification on iOS).
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let title = 'ProFit';
  let options = {
    body: '',
    icon: '/faviconnovo.png',
    data: { url: '/' },
  };

  try {
    const payload = event.data.json();

    title = payload.title || 'ProFit';

    const targetUrl =
      payload.data?.url ||
      payload.data?.click_action ||
      payload.url ||
      payload.click_action ||
      '/';

    options = {
      body: payload.body || '',
      icon: '/faviconnovo.png',
      // tag groups duplicate notifications — safe on all platforms
      tag: payload.data?.tag || payload.tag || 'profit-push',
      // timestamp is safe on all platforms
      timestamp: Date.now(),
      data: { url: targetUrl, ...payload.data },
    };
  } catch (_) {
    // Fallback for plain-text payloads
    options.body = event.data.text();
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

// ── Notification click ────────────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        // Navigate an existing window to the target URL then focus it
        for (const client of list) {
          if ('navigate' in client && 'focus' in client) {
            return client.navigate(urlToOpen).then((c) => c && c.focus());
          }
        }
        // No existing window — open a new one
        if (clients.openWindow) return clients.openWindow(urlToOpen);
      })
  );
});
