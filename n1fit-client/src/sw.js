import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

self.skipWaiting();
clientsClaim();
cleanupOutdatedCaches();

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== 'n1fit-images-cache' && name !== 'n1fit-pages-cache' && !name.startsWith('workbox-precache'))
          .map((name) => caches.delete(name))
      );
    })
  );
});

precacheAndRoute(self.__WB_MANIFEST);

// 1. Sayfa Gezinmeleri (HTML):
// İnternet varken HER ZAMAN önce sunucudan son sürümü çeker (NetworkFirst).
// Böylece site güncellemeleri için gizli sekmeye gerek kalmaz, Chrome anında son sürümü açar.
// Eğer internet yoksa (offline), 3 saniye sonra önbelleğe döner.
registerRoute(
  ({ request }) => request.mode === 'navigate',
  new NetworkFirst({
    cacheName: 'n1fit-pages-cache',
    networkTimeoutSeconds: 3,
  })
);

// 2. Resim ve Medya Dosyaları (Salon fotoğrafları, logolar, paket resimleri):
// StaleWhileRevalidate: Görseli önbellekten anında açar (asla kaybolmaz veya beyaz kalmaz),
// arka planda sunucudan kontrol edip önbelleği sessizce günceller.
registerRoute(
  ({ request, url }) =>
    request.destination === 'image' ||
    url.pathname.startsWith('/SalonunFotolari/') ||
    url.pathname.startsWith('/PaketlerinFotolari/') ||
    url.pathname.startsWith('/uploads/') ||
    /\.(?:png|jpg|jpeg|svg|webp|gif|ico)$/i.test(url.pathname),
  new StaleWhileRevalidate({
    cacheName: 'n1fit-images-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 gün sakla
      }),
    ],
  })
);

self.addEventListener('push', function (event) {
  if (event.data) {
    let data = {};
    try {
      data = event.data.json();
    } catch {
      data = { title: 'N1FIT', message: event.data.text(), url: '/', tag: 'n1fit-reminder' };
    }

    const options = {
      body: data.message || 'Yeni bir bildiriminiz var.',
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      tag: data.tag || 'n1fit-reminder',
      renotify: true,
      vibrate: [200, 100, 200, 100, 200],
      data: {
        url: data.url || '/'
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'N1FIT', options)
    );
  }
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const targetUrl = event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
