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

<style scoped>
.auth-callback-page {
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: 1.5rem;
  background:
    radial-gradient(circle at 50% 10%, rgb(15 159 132 / 12%), transparent 35%),
    var(--color-surface-canvas);
}

.auth-callback-page__card {
  display: grid;
  width: min(100%, 30rem);
  justify-items: center;
  padding: 3rem;
  text-align: center;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-md);
}

.auth-callback-page__card h1,
.auth-callback-page__card p {
  margin: 0;
}

.auth-callback-page__card h1 {
  margin-top: 1.5rem;
  color: var(--color-brand-950);
  font-size: 1.625rem;
  letter-spacing: -0.035em;
}

.auth-callback-page__card p {
  margin-top: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.875rem;
  line-height: 1.65;
}

.auth-callback-page__card a {
  margin-top: 1.5rem;
  padding: 0.75rem 1rem;
  color: var(--color-text-inverse);
  font-size: 0.8rem;
  font-weight: 800;
  text-decoration: none;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
}

.auth-callback-page__card-spinner,
.auth-callback-page__card-icon {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  border-radius: 50%;
}

.auth-callback-page__card-spinner {
  border: 4px solid var(--color-accent-100);
  border-top-color: var(--color-accent-600);
  animation: spin 750ms linear infinite;
}

.auth-callback-page__card-icon--error {
  color: var(--color-danger);
  font-size: 1.5rem;
  font-weight: 800;
  background: #fff0f1;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
