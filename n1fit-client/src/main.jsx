import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    // updateViaCache: 'none' -> Tarayıcının sw.js dosyasını önbelleğe almasını engeller, her zaman sunucudan taze kontrol eder!
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .then((registration) => {
        console.log('Service Worker başarıyla kaydedildi. Scope:', registration.scope);

        // Sayfa açıldığında ve sekme görünür olduğunda hemen güncelleme kontrolü yap
        registration.update();

        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') {
            registration.update();
          }
        });

        // 15 dakikada bir sessizce güncelleme kontrolü yap
        setInterval(() => {
          registration.update();
        }, 15 * 60 * 1000);
      })
      .catch((error) => {
        console.error('Service Worker kaydı başarısız:', error);
      });

    // Yeni Service Worker devreye girdiğinde (skipWaiting sonrası) uygulamayı anında en güncel sürüme geçir
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        refreshing = true;
        window.location.reload();
      }
    });
  });
}
