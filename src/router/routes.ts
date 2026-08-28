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
        component: () => import('@/pages/dashboard/DashboardPage.vue'),
        meta: { titleKey: 'routes.dashboard' },
      },
      {
        path: 'signature',
        name: 'signature',
        component: () => import('@/pages/signature/SignaturePage.vue'),
        meta: { titleKey: 'routes.signature' },
      },
      {
        path: 'timestamp',
        name: 'timestamp',
        component: () => import('@/pages/timestamp/TimestampPage.vue'),
        meta: { titleKey: 'routes.timestamp' },
      },
      {
        path: 'documents',
        name: 'document-history',
        component: () =>
          import('@/pages/document-history/DocumentHistoryPage.vue'),
        meta: { titleKey: 'routes.documentHistory' },
      },
      {
        path: 'settings/profile',
        name: 'profile',
        component: () => import('@/pages/profile/ProfilePage.vue'),
        meta: { titleKey: 'routes.profile' },
      },
    ],
  },
]
