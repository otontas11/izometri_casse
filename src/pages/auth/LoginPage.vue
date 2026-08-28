<template>
  <main class="login-page">
    <section aria-labelledby="login-story-title" class="login-page__story">
      <a :aria-label="t('auth.login.homeAriaLabel')"
         class="login-page__brand"
         href="/"
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

    <section aria-labelledby="login-title" class="login-page__panel">
      <LanguageSwitcher class="login-page__language-switcher" />

      <div class="login-page__card">
        <div aria-hidden="true" class="login-page__card-seal">
          <span>✓</span>
        </div>

        <div class="login-page__card-heading">
          <span>{{ t('auth.login.eyebrowPanel') }}</span>
          <h2 id="login-title">{{ t('auth.login.panelTitle') }}</h2>
          <p>{{ t('auth.login.panelDescription') }}</p>
        </div>

        <div v-if="hasAuth0ConfigurationError"
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

        <div v-else-if="
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
          <button :disabled="
                    !isAuth0Configured || isAuth0Loading || isAuthenticationSubmitting
                  "
                  class="login-page__card-button login-page__card-button--primary"
                  type="button"
                  @click="handleAuthenticationStart('login')"
          >
            <span v-if="isAuth0Loading || isAuthenticationSubmitting"
                  class="login-page__card-spinner"
            ></span>
            {{
              isAuth0Loading || isAuthenticationSubmitting
                ? t('auth.login.checkingSession')
                : t('auth.login.signIn')
            }}
          </button>

          <button :disabled="
                    !isAuth0Configured || isAuth0Loading || isAuthenticationSubmitting
                  "
                  class="login-page__card-button login-page__card-button--secondary"
                  type="button"
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

<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import { auth0Config, isAuth0Configured } from '@/config/auth0.config'

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
  () => !isAuth0Configured || currentRoute.query.reason === 'configuration',
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

<style scoped src="./LoginPage.css"></style>
