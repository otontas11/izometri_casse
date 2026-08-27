import { setup, type Preview } from '@storybook/vue3-vite'

import { i18n } from '../src/locales'
import '../src/styles/main.css'

setup((vueApplication) => {
  vueApplication.use(i18n)
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
