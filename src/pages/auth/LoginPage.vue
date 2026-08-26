<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import {
  auth0Config,
  isAuth0Configured,
} from '@/config/auth0.config'

type AuthMode = 'login' | 'signup'

const currentRoute = useRoute()
const applicationRouter = useRouter()
const auth0Client = isAuth0Configured ? useAuth0() : null
const { locale, t } = useI18n({ useScope: 'global' })
const isAuthenticationSubmitting = ref(false)
const localAuthenticationError = ref('')

const authenticationRedirectTarget = computed(() => {
  const requestedRedirectPath = currentRoute.query.redirect

  if (
    typeof requestedRedirectPath !== 'string' ||
    !requestedRedirectPath.startsWith('/') ||
    requestedRedirectPath.startsWith('//') ||
    requestedRedirectPath.startsWith('/login') ||
    requestedRedirectPath.startsWith('/auth/callback')
  ) {
    return '/'
  }

  return requestedRedirectPath
})

const isAuth0Loading = computed(() => auth0Client?.isLoading.value ?? false)
const authenticationErrorMessage = computed(
  () =>
    localAuthenticationError.value ||
    (auth0Client?.error.value
      ? t('auth.login.authenticationErrorDescription')
      : ''),
)
const hasAuth0ConfigurationError = computed(
  () =>
    !isAuth0Configured || currentRoute.query.reason === 'configuration',
)

const handleAuthenticationStart = async (authenticationMode: AuthMode) => {
  if (!auth0Client) {
    return
  }

  localAuthenticationError.value = ''
  isAuthenticationSubmitting.value = true

  try {
    await auth0Client.loginWithRedirect({
      appState: { target: authenticationRedirectTarget.value },
      authorizationParams: {
        ui_locales: locale.value,
        ...(authenticationMode === 'signup' ? { screen_hint: 'signup' } : {}),
      },
    })
  } catch {
    localAuthenticationError.value = t('auth.login.startError')
    isAuthenticationSubmitting.value = false
  }
}

watch(
  () => auth0Client?.isAuthenticated.value,
  (isAuthenticated) => {
    if (isAuthenticated) {
      void applicationRouter.replace(authenticationRedirectTarget.value)
    }
  },
  { immediate: true },
)
</script>

<template>
  <main class="login-page">
    <section class="login-page__story" aria-labelledby="login-story-title">
      <a
        class="login-page__brand"
        href="/"
        :aria-label="t('auth.login.homeAriaLabel')"
      >
        iz<span>imza</span>
      </a>

      <div class="login-page__story-content">
        <span class="login-page__eyebrow">{{ t('auth.login.eyebrow') }}</span>
        <h1 id="login-story-title">{{ t('auth.login.title') }}</h1>
        <p>{{ t('auth.login.description') }}</p>

        <ul :aria-label="t('auth.login.featureListAriaLabel')">
          <li>
            <span aria-hidden="true">✓</span>
            {{ t('auth.login.oauthFeature') }}
          </li>
          <li>
            <span aria-hidden="true">✓</span>
            {{ t('auth.login.sessionFeature') }}
          </li>
          <li>
            <span aria-hidden="true">✓</span>
            {{ t('auth.login.historyFeature') }}
          </li>
        </ul>
      </div>

      <small>{{ t('auth.login.footer') }}</small>
    </section>

    <section class="login-page__panel" aria-labelledby="login-title">
      <LanguageSwitcher class="login-page__language-switcher" />

      <div class="login-page__card">
        <div class="login-page__card-seal" aria-hidden="true">
          <span>✓</span>
        </div>

        <div class="login-page__card-heading">
          <span>{{ t('auth.login.eyebrowPanel') }}</span>
          <h2 id="login-title">{{ t('auth.login.panelTitle') }}</h2>
          <p>{{ t('auth.login.panelDescription') }}</p>
        </div>

        <div
          v-if="hasAuth0ConfigurationError"
          class="login-page__card-notice login-page__card-notice--warning"
          role="alert"
        >
          <strong>{{ t('auth.login.configurationTitle') }}</strong>
          <p>
            {{ t('auth.login.configurationBeforeKeys') }}
            <code>VITE_AUTH0_DOMAIN</code>
            {{ t('auth.login.configurationBetweenKeys') }}
            <code>VITE_AUTH0_CLIENT_ID</code>
            {{ t('auth.login.configurationAfterKeys') }}
          </p>
          <small>
            {{ t('auth.login.callbackUrl') }}:
            <code>{{ auth0Config.callbackUri }}</code>
          </small>
        </div>

        <div
          v-else-if="
            authenticationErrorMessage ||
            currentRoute.query.reason === 'auth_error'
          "
          class="login-page__card-notice login-page__card-notice--error"
          role="alert"
        >
          <strong>{{ t('auth.login.authenticationErrorTitle') }}</strong>
          <p>
            {{
              authenticationErrorMessage ||
              t('auth.login.authenticationErrorDescription')
            }}
          </p>
        </div>

        <div class="login-page__card-actions">
          <button
            class="login-page__card-button login-page__card-button--primary"
            type="button"
            :disabled="
              !isAuth0Configured ||
              isAuth0Loading ||
              isAuthenticationSubmitting
            "
            @click="handleAuthenticationStart('login')"
          >
            <span
              v-if="isAuth0Loading || isAuthenticationSubmitting"
              class="login-page__card-spinner"
            ></span>
            {{
              isAuth0Loading || isAuthenticationSubmitting
                ? t('auth.login.checkingSession')
                : t('auth.login.signIn')
            }}
          </button>

          <button
            class="login-page__card-button login-page__card-button--secondary"
            type="button"
            :disabled="
              !isAuth0Configured ||
              isAuth0Loading ||
              isAuthenticationSubmitting
            "
            @click="handleAuthenticationStart('signup')"
          >
            {{ t('auth.login.signUp') }}
          </button>
        </div>

        <p class="login-page__card-privacy">
          {{ t('auth.login.privacy') }}
        </p>
      </div>
    </section>
  </main>
</template>

<style scoped>
.login-page {
  display: grid;
  grid-template-columns: minmax(24rem, 0.9fr) minmax(32rem, 1.1fr);
  min-height: 100vh;
  background: var(--color-surface-canvas);
}

.login-page__story {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: clamp(2rem, 5vw, 5rem);
  overflow: hidden;
  color: var(--color-text-inverse);
  background:
    radial-gradient(circle at 15% 10%, rgb(37 99 235 / 38%), transparent 30%),
    radial-gradient(circle at 90% 85%, rgb(15 159 132 / 28%), transparent 32%),
    var(--color-brand-950);
}

.login-page__story::before,
.login-page__story::after {
  position: absolute;
  content: '';
  border: 1px solid rgb(255 255 255 / 10%);
  border-radius: 50%;
}

.login-page__story::before {
  top: -10rem;
  right: -10rem;
  width: 28rem;
  height: 28rem;
}

.login-page__story::after {
  bottom: -18rem;
  left: -12rem;
  width: 34rem;
  height: 34rem;
}

.login-page__brand {
  position: relative;
  z-index: 1;
  width: fit-content;
  color: var(--color-text-inverse);
  font-size: 2.25rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.08em;
  text-decoration: none;
}

.login-page__brand span {
  color: #52e0c5;
}

.login-page__story-content {
  position: relative;
  z-index: 1;
  display: grid;
  max-width: 36rem;
  margin-block: auto;
}

.login-page__eyebrow {
  width: fit-content;
  margin-bottom: 1.5rem;
  padding: 0.45rem 0.75rem;
  color: #b8f3e8;
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  background: rgb(15 159 132 / 18%);
  border: 1px solid rgb(82 224 197 / 18%);
  border-radius: 999px;
}

.login-page__story h1,
.login-page__story p,
.login-page__story ul {
  margin: 0;
}

.login-page__story h1 {
  max-width: 34rem;
  font-size: clamp(2.5rem, 5vw, 4.5rem);
  line-height: 1.02;
  letter-spacing: -0.055em;
}

.login-page__story p {
  max-width: 32rem;
  margin-top: 1.5rem;
  color: rgb(255 255 255 / 68%);
  line-height: 1.75;
}

.login-page__story ul {
  display: grid;
  gap: 0.875rem;
  margin-top: 2rem;
  padding: 0;
  list-style: none;
}

.login-page__story li {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  color: rgb(255 255 255 / 84%);
  font-size: 0.875rem;
  font-weight: 600;
}

.login-page__story li span {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  color: #52e0c5;
  background: rgb(15 159 132 / 18%);
  border-radius: 50%;
}

.login-page__story > small {
  position: relative;
  z-index: 1;
  color: rgb(255 255 255 / 48%);
  font-size: var(--font-size-small);
}

.login-page__panel {
  position: relative;
  display: grid;
  min-height: 100vh;
  place-items: center;
  padding: clamp(1.5rem, 5vw, 5rem);
}

.login-page__language-switcher {
  position: absolute;
  top: 1.5rem;
  right: 1.5rem;
}

.login-page__card {
  width: min(100%, 31rem);
  padding: clamp(1.75rem, 4vw, 3rem);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 1.5rem;
  box-shadow: var(--shadow-md);
}

.login-page__card-seal {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  margin-bottom: 1.5rem;
  place-items: center;
  color: var(--color-text-inverse);
  font-size: 1.25rem;
  font-weight: 800;
  background: var(--color-accent-600);
  border: 6px solid var(--color-accent-100);
  border-radius: 50%;
}

.login-page__card-heading {
  display: grid;
  gap: 0.625rem;
}

.login-page__card-heading span {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.login-page__card-heading h2,
.login-page__card-heading p,
.login-page__card-notice p,
.login-page__card-privacy {
  margin: 0;
}

.login-page__card-heading h2 {
  color: var(--color-brand-950);
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  line-height: 1.18;
  letter-spacing: -0.04em;
}

.login-page__card-heading p {
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.65;
}

.login-page__card-notice {
  display: grid;
  gap: 0.375rem;
  margin-top: 1.5rem;
  padding: 1rem;
  font-size: 0.8rem;
  line-height: 1.55;
  border-radius: var(--radius-md);
}

.login-page__card-notice--warning {
  color: #7c4a05;
  background: #fff7e7;
  border: 1px solid #f4d7a1;
}

.login-page__card-notice--error {
  color: #8f2430;
  background: #fff0f1;
  border: 1px solid #f5c7cc;
}

.login-page__card-notice code {
  font-family: var(--font-family-mono);
  font-size: var(--font-size-small);
}

.login-page__card-actions {
  display: grid;
  gap: 0.75rem;
  margin-top: 1.75rem;
}

.login-page__card-button {
  display: flex;
  gap: 0.625rem;
  align-items: center;
  justify-content: center;
  min-height: 3.125rem;
  padding: 0.75rem 1.25rem;
  font-size: 0.875rem;
  font-weight: 800;
  cursor: pointer;
  border-radius: var(--radius-md);
  transition:
    transform var(--transition-fast),
    background-color var(--transition-fast),
    border-color var(--transition-fast);
}

.login-page__card-button:not(:disabled):hover {
  transform: translateY(-1px);
}

.login-page__card-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.login-page__card-button--primary {
  color: var(--color-text-inverse);
  background: var(--color-brand-950);
}

.login-page__card-button--primary:not(:disabled):hover {
  background: var(--color-brand-800);
}

.login-page__card-button--secondary {
  color: var(--color-brand-950);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
}

.login-page__card-button--secondary:not(:disabled):hover {
  border-color: var(--color-brand-800);
}

.login-page__card-spinner {
  width: 1rem;
  height: 1rem;
  border: 2px solid rgb(255 255 255 / 35%);
  border-top-color: var(--color-text-inverse);
  border-radius: 50%;
  animation: spin 700ms linear infinite;
}

.login-page__card-privacy {
  margin-top: 1.25rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.55;
  text-align: center;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 63.99rem) {
  .login-page {
    grid-template-columns: 1fr;
  }

  .login-page__story {
    min-height: auto;
    padding-block: 2rem 3rem;
  }

  .login-page__story-content {
    margin-block: 4rem;
  }

  .login-page__story h1 {
    max-width: 42rem;
  }

  .login-page__panel {
    min-height: auto;
    padding-block: 4rem;
  }
}

@media (max-width: 35.99rem) {
  .login-page__story-content {
    margin-block: 3rem;
  }

  .login-page__story h1 {
    font-size: 2.4rem;
  }

  .login-page__panel {
    padding: 1rem;
  }

  .login-page__card {
    padding: 1.5rem;
    border-radius: var(--radius-lg);
  }
}
</style>
