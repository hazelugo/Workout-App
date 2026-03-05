import { createRouter, createWebHistory } from 'vue-router'
import ProgramView from '../views/ProgramView.vue'
import CustomView from '../views/CustomView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: ProgramView },
    { path: '/custom', component: CustomView },
  ],
})

export default router
