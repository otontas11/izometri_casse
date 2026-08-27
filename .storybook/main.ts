import type { StorybookConfig } from '@storybook/vue3-vite'

const storybookConfig: StorybookConfig = {
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
  framework: {
    name: '@storybook/vue3-vite',
    options: {},
  },
  stories: ['../src/**/*.stories.ts'],
}

export default storybookConfig
