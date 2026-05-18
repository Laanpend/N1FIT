import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Vercel'e atarken PWA bazen sw.js'in adını değiştirip çalıştırır, 
    // ama biz manuel injectManifest kullandığımız için genelde /sw.js olarak çıkar.
    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then((registration) => {
        console.log('SW Amelesi şantiyeye başarıyla girdi! Scope:', registration.scope);
      })
      .catch((error) => {
        console.error('SW Amelesi kapıda takıldı amq:', error);
      });
  });
}
