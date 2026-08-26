import type { RouteRecordRaw } from 'vue-router'

import AppLayout from '@/components/layout/AppLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    titleKey: string
    requiresAuth?: boolean
  }
}

export const applicationRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: () => import('@/pages/auth/LoginPage.vue'),
    meta: { titleKey: 'routes.login' },
  },
  {
    path: '/auth/callback',
    name: 'auth-callback',
    component: () => import('@/pages/auth/AuthCallbackPage.vue'),
    meta: { titleKey: 'routes.authCallback' },
  },
  {
    path: '/',
    component: AppLayout,
    meta: { titleKey: 'routes.application', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'dashboard',
        component: () => import('@/pages/DashboardPage.vue'),
        meta: { titleKey: 'routes.dashboard' },
      },
      {
        path: 'timestamp',
        name: 'timestamp',
        component: () => import('@/pages/TimestampPage.vue'),
        meta: { titleKey: 'routes.timestamp' },
      },
      {
        path: 'settings/profile',
        name: 'profile',
        component: () => import('@/pages/ProfilePage.vue'),
        meta: { titleKey: 'routes.profile' },
      },
    ],
  },
]
