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
      registerType: 'prompt',
      includeAssets: ['favicon.ico', 'icon.svg', 'apple-touch-icon-180x180.png'],
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
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
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
