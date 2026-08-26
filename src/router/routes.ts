import type { RouteRecordRaw } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    title: string
    requiresAuth?: boolean
  }
}

export const applicationRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { title: 'Giriş' },
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/pages/auth/AuthCallbackPage.vue'),
    meta: { title: 'Oturum doğrulanıyor' },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { title: 'İzİmza', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { title: 'Anasayfa' },
      },
      {
        path: 'timestamp',
        name: 'timestamp',
        component: () => import('@/pages/TimestampPage.vue'),
        meta: { title: 'Zaman Damgala' },
      },
      {
        path: 'settings/profile',
        name: 'profile',
        component: () => import('@/pages/ProfilePage.vue'),
        meta: { title: 'Profil ve Güvenlik' },
      },
    ],
  },
]
