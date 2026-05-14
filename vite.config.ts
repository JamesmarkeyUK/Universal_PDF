import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// Deployed to GitHub Pages at https://<owner>.github.io/Universal_PDF/.
// Production assets need that base path; dev/preview serve from root.
const PROD_BASE = '/Universal_PDF/'

export default defineConfig(({ command }) => ({
  base: command === 'build' ? PROD_BASE : '/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Universal PDF',
        short_name: 'UniPDF',
        description: 'Annotate and sign PDFs anywhere',
        theme_color: '#0f172a',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '.',
        scope: '.',
        icons: [
          { src: 'favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }
        ]
      },
      devOptions: { enabled: false }
    })
  ],
  optimizeDeps: {
    exclude: ['canvas']
  },
  worker: {
    format: 'es'
  }
}))
