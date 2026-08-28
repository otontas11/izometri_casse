import { watch } from 'vue'
import type { NavigationGuard, Router } from 'vue-router'

import { auth0Plugin } from '@/features/auth/auth.plugin'
import { i18n, translate } from '@/locales'

const waitForAuth0Initialization = async () => {
  const configuredAuth0Plugin = auth0Plugin

  if (!configuredAuth0Plugin?.isLoading.value) {
    return
  }

  await new Promise<void>(resolveInitialization => {
    const stopWatchingAuth0Loading = watch(configuredAuth0Plugin.isLoading, isAuth0Loading => {
      if (!isAuth0Loading) {
        stopWatchingAuth0Loading()
        resolveInitialization()
      }
    })
  })
}

const requireAuthenticatedRoute: NavigationGuard = async targetRoute => {
  const requiresAuthentication = targetRoute.matched.some(matchedRoute => matchedRoute.meta.requiresAuth)

  if (!requiresAuthentication) {
    return true
  }

  if (!auth0Plugin) {
    return {
      name: 'login',
      query: {
        reason: 'configuration',
        redirect: targetRoute.fullPath,
      },
    }
  }

  await waitForAuth0Initialization()

  if (auth0Plugin.isAuthenticated.value) {
    return true
  }

  return {
    name: 'login',
    query: {
      ...(auth0Plugin.error.value ? { reason: 'auth_error' } : {}),
      redirect: targetRoute.fullPath,
    },
  }
}

export const registerRouterGuards = (applicationRouter: Router) => {
  applicationRouter.beforeEach(requireAuthenticatedRoute)

  const updateDocumentTitle = (titleTranslationKey: string) => {
    document.title = `${translate(titleTranslationKey)} · ${translate('common.appName')}`
  }

  applicationRouter.afterEach(targetRoute => updateDocumentTitle(targetRoute.meta.titleKey))

  watch(i18n.global.locale, () => updateDocumentTitle(applicationRouter.currentRoute.value.meta.titleKey))
}
