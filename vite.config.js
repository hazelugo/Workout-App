import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
let VitePWA = () => ({
  name: 'virtual-pwa-fallback',
  resolveId(id) {
    if (id === 'virtual:pwa-register') return '\0virtual:pwa-register'
  },
  load(id) {
    if (id === '\0virtual:pwa-register') return 'export function registerSW() { return () => {} }'
  }
})
try {
  const mod = await import('vite-plugin-pwa')
  if (mod?.VitePWA) VitePWA = mod.VitePWA
} catch {}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    vueJsx(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Workout App',
        short_name: 'Workout',
        description: 'Build From Zero — 8 Week Program',
        theme_color: '#141414',
        background_color: '#141414',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,svg,woff2}'],
        navigateFallback: '/index.html',
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
