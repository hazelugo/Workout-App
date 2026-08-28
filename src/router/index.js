import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: () => import('../views/ProgramView.vue'), meta: { requiresAuth: true } },
    { path: '/custom', component: () => import('../views/CustomView.vue'), meta: { requiresAuth: true } },
    { path: '/login', component: () => import('../views/AuthView.vue') },
    { path: '/history', component: () => import('../views/HistoryView.vue'), meta: { requiresAuth: true } },
    { path: '/reset-password', component: () => import('../views/ResetPasswordView.vue') },
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
