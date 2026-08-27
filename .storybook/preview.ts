import { AUTH0_INJECTION_KEY } from '@auth0/auth0-vue'
import type { Auth0VueClient } from '@auth0/auth0-vue'
import { setup } from '@storybook/vue3'
import type { Preview } from '@storybook/vue3-vite'
import { ref } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mswLoader } from 'msw-storybook-addon/csf3'

import { i18n } from '../src/locales'
import { storybookApiHandlers } from '../src/mocks/storybookApiHandlers'
import { pinia } from '../src/stores'
import '../src/styles/main.css'

const storybookRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/',
      name: 'dashboard',
      component: { template: '<div />' },
    },
    {
      path: '/timestamp',
      name: 'timestamp',
      component: { template: '<div />' },
    },
    {
      path: '/settings/profile',
      name: 'profile',
      component: { template: '<div />' },
    },
  ],
})

const storybookAuth0Client = {
  error: ref<Error | null>(null),
  isAuthenticated: ref(true),
  isLoading: ref(false),
  user: ref({
    email: 'oktay.tontas@example.com',
    email_verified: true,
    given_name: 'Oktay',
    name: 'Oktay Tontaş',
    picture: '',
  }),
} as unknown as Auth0VueClient

setup((vueApplication) => {
  vueApplication.use(pinia)
  vueApplication.use(i18n)
  vueApplication.use(storybookRouter)
  vueApplication.provide(AUTH0_INJECTION_KEY, storybookAuth0Client)
})

const storybookPreview: Preview = {
  loaders: [mswLoader()],
  parameters: {
    a11y: {
      test: 'todo',
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    docs: {
      codePanel: true,
    },
    layout: 'padded',
    msw: storybookApiHandlers,
  },
}

export default storybookPreview
