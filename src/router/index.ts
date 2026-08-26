import { createRouter, createWebHistory } from 'vue-router'

import { registerRouterGuards } from './guards'
import { applicationRoutes } from './routes'

const applicationRouter = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: applicationRoutes,
  scrollBehavior: () => ({ top: 0 }),
})

registerRouterGuards(applicationRouter)

export default applicationRouter
