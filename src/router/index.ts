import { createRouter, createWebHistory } from 'vue-router'

import AppShell from '@/layouts/AppShell.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      component: AppShell,
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/features/dashboard/views/DashboardView.vue'),
          meta: { title: 'Anasayfa' },
        },
        {
          path: 'timestamp',
          name: 'timestamp',
          component: () => import('@/features/timestamp/views/TimestampView.vue'),
          meta: { title: 'Zaman Damgala' },
        },
        {
          path: 'settings/profile',
          name: 'profile',
          component: () => import('@/features/profile/views/ProfileView.vue'),
          meta: { title: 'Profil ve Güvenlik' },
        },
      ],
    },
  ],
  scrollBehavior: () => ({ top: 0 }),
})

router.afterEach((to) => {
  document.title = `${to.meta.title} · İzİmza`
})

export default router

