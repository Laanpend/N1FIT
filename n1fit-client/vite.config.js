import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Biz güncellemeyi çıkınca arkada çaktırmadan indirir, adamı darlamaz!
      // devOptions: {
      //   enabled: true
      // },

      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
      },
      injectRegister: 'auto',
      strategies: 'injectManifest', // Makineye diyoruz ki: Benim kendi yazdığım bir SW amelem var, onu kullan!
      srcDir: 'src',
      filename: 'sw.js',
      includeAssets: ['favicon.svg', 'icons.svg'], // Önbelleğe atılacak demirbaşlar
      manifest: {
        name: 'N1FIT Fitness Dashboard',
        short_name: 'N1FIT',
        description: 'Gölyaka n1fit Spor Salonu Yönetim ve İdman Sistemi',
        theme_color: '#050505', // Chrome sekmesinin ve uygulamanın tepe rengi (Karanlık tema amq)
        background_color: '#050505',
        display: 'standalone', // Tarayıcı zımbırtılarını siktir eder, tam ekran mobil app gibi açılır!
        start_url: '/',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Telefondaki ikonların kenarlarını jilet gibi yontması için
          }
        ]
      }
    })
  ],
})