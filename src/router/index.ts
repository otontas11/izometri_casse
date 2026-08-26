import { createRouter, createWebHistory } from 'vue-router'

import { requireAuthentication } from '@/features/auth/router/requireAuthentication'
import AppShell from '@/layouts/AppShell.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    requiresAuth?: boolean
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/features/auth/views/LoginView.vue'),
      meta: { title: 'Giriş' },
    },
    {
      path: '/auth/callback',
      name: 'auth-callback',
      component: () => import('@/features/auth/views/AuthCallbackView.vue'),
      meta: { title: 'Oturum doğrulanıyor' },
    },
    {
      path: '/',
      component: AppShell,
      meta: { title: 'İzİmza', requiresAuth: true },
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

router.beforeEach(requireAuthentication)

router.afterEach((to) => {
  document.title = `${to.meta.title} · İzİmza`
})

export default router
