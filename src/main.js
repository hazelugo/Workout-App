import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { useAuthStore } from './stores/auth'
import { usePwaStore } from './stores/pwa'
import { queryClient } from './lib/queryClient'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(VueQueryPlugin, { queryClient })

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const pwaStore = usePwaStore(pinia)
  const updateSW = registerSW({
    immediate: true,
    onNeedRefresh() {
      pwaStore.setRefreshHandler(updateSW)
      pwaStore.markNeedRefresh()
    },
    onOfflineReady() {
      pwaStore.markOfflineReady()
    },
  })
}

const authStore = useAuthStore(pinia)
await authStore.init()

app.use(router)
app.mount('#app')
