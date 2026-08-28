<template>
  <main class="auth-callback-page">
    <section class="auth-callback-page__card" aria-live="polite">
      <template
        v-if="authenticationCallbackErrorMessage || !isAuth0Configured"
      >
        <span class="auth-callback-page__card-icon auth-callback-page__card-icon--error" aria-hidden="true">!</span>
        <h1>{{ t('auth.callback.failedTitle') }}</h1>
        <p>
          {{
            authenticationCallbackErrorMessage ||
            t('auth.callback.configurationError')
          }}
        </p>
        <RouterLink :to="{ name: 'login', query: { reason: 'auth_error' } }">
          {{ t('auth.callback.backToLogin') }}
        </RouterLink>
      </template>

      <template v-else>
        <span class="auth-callback-page__card-spinner" aria-hidden="true"></span>
        <h1>{{ t('auth.callback.preparingTitle') }}</h1>
        <p>{{ t('auth.callback.preparingDescription') }}</p>
      </template>
    </section>
  </main>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import { isAuth0Configured } from '@/config/auth0.config'

const auth0Client = isAuth0Configured ? useAuth0() : null
const { t } = useI18n({ useScope: 'global' })
const authenticationCallbackErrorMessage = computed(
  () =>
    auth0Client?.error.value ? t('auth.callback.authenticationError') : '',
)
</script>

<style scoped src="./AuthCallbackPage.css"></style>
