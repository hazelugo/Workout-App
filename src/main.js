import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { registerSW } from 'virtual:pwa-register'
import { VueQueryPlugin } from '@tanstack/vue-query'
import { useAuthStore } from './stores/auth'
import { queryClient } from './lib/queryClient'
import App from './App.vue'
import router from './router'

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  registerSW({ immediate: true })
}

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(VueQueryPlugin, { queryClient })

const authStore = useAuthStore(pinia)
await authStore.init()

app.use(router)
app.mount('#app')
