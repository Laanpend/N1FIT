// src/sw.js
import { precacheAndRoute } from 'workbox-precaching';
// Arka planda Vercel'den veya C#'tan gelen bildirimi yakalayan motor!
self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    
    // Telefondaki o fiyakalı bildirimi oluştur
    const options = {
      body: data.message,
      icon: '/pwa-192x192.png', // Senin fiyakalı N1FIT logon
      badge: '/pwa-192x192.png', // Ufak bildirim ikonu
      vibrate: [200, 100, 200, 100, 200], // Telefonu aslanlar gibi titret!
      data: {
        url: data.url || '/' // Bildirime tıklayınca nereye gidecek?
      }
    };

    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Bildirime tıklandığında ne bok yiyeceğini belirleyen motor
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});