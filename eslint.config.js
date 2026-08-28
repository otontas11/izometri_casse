import eslint from '@eslint/js'
import eslintConfigPrettier from 'eslint-config-prettier/flat'
import eslintPluginVue from 'eslint-plugin-vue'
import globals from 'globals'
import typescriptEslint from 'typescript-eslint'

export default typescriptEslint.config(
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      'storybook-static/**',
      '.wrangler/**',
      'worker/.wrangler/**',
      'worker/worker-configuration.d.ts',
    ],
  },
  eslint.configs.recommended,
  ...typescriptEslint.configs.recommended,
  ...eslintPluginVue.configs['flat/essential'],
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        parser: typescriptEslint.parser,
      },
    },
    rules: {
      'vue/block-order': [
        'error',
        {
          order: ['template', 'script', 'style'],
        },
      ],
    },
  },
  {
    files: ['src/**/*.{ts,vue}'],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ['worker/**/*.ts'],
    languageOptions: {
      globals: globals.serviceworker,
    },
  },
  {
    files: ['*.config.{js,ts}', 'eslint.config.js', '.husky/**/*.mjs', '.storybook/**/*.ts', 'mock/**/*.cjs'],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ['mock/**/*.cjs'],
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  eslintConfigPrettier,
  {
    files: ['**/*.vue'],
    rules: {
      'vue/first-attribute-linebreak': [
        'error',
        {
          multiline: 'beside',
          singleline: 'beside',
        },
      ],
      'vue/html-closing-bracket-newline': [
        'error',
        {
          multiline: 'always',
          singleline: 'never',
        },
      ],
      'vue/html-indent': [
        'error',
        2,
        {
          alignAttributesVertically: true,
          attribute: 1,
          baseIndent: 1,
          closeBracket: 0,
        },
      ],
      'vue/max-attributes-per-line': [
        'error',
        {
          multiline: {
            max: 1,
          },
          singleline: {
            max: 3,
          },
        },
      ],
    },
  }
)
