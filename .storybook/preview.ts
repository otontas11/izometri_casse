import { setup, type Preview } from '@storybook/vue3-vite'
import { createMemoryHistory, createRouter } from 'vue-router'

import { i18n } from '../src/locales'
import '../src/styles/main.css'

const storybookRouter = createRouter({
  history: createMemoryHistory(),
  routes: [
    {
      path: '/documents',
      name: 'document-history',
      component: { template: '<div />' },
    },
  ],
})

setup((vueApplication) => {
  vueApplication.use(i18n)
  vueApplication.use(storybookRouter)
})

const storybookPreview: Preview = {
  parameters: {
    a11y: {
      test: 'todo',
    },
    controls: {
      expanded: false,
    },
    layout: 'centered',
  },
}

export default storybookPreview
