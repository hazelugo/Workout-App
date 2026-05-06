// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import ProgramView from '../views/ProgramView.vue'
import CustomView from '../views/CustomView.vue'
import AuthView from '../views/AuthView.vue'
import HistoryView from '../views/HistoryView.vue'
import ResetPasswordView from '../views/ResetPasswordView.vue'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: ProgramView, meta: { requiresAuth: true } },
    { path: '/custom', component: CustomView, meta: { requiresAuth: true } },
    { path: '/login', component: AuthView },
    { path: '/history', component: HistoryView, meta: { requiresAuth: true } },
    { path: '/reset-password', component: ResetPasswordView },
  ],
})

router.beforeEach((to) => {
  const auth = useAuthStore()
  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { path: '/login', query: { redirect: to.fullPath } }
  }
  if (to.path === '/login' && auth.isAuthenticated) {
    return { path: '/' }
  }
})

export default router
