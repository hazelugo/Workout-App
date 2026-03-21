// src/main.js
// Note: top-level await is valid here — Vite treats main.js as an ES module.
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { useAuthStore } from './stores/auth'
import App from './App.vue'
import router from './router'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)

// Auth must initialize before router mounts so navigation guards
// see correct session state on hard refresh.
const authStore = useAuthStore(pinia)
await authStore.init()

app.use(router)
app.mount('#app')
