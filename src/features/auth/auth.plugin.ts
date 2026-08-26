import { createAuth0 } from '@auth0/auth0-vue'

import { auth0Config, isAuth0Configured } from '@/config/auth0.config'

const auth0AuthorizationParameters = {
  redirect_uri: auth0Config.callbackUri,
  scope: 'openid profile email',
  ...(auth0Config.audience ? { audience: auth0Config.audience } : {}),
}

export const auth0Plugin = isAuth0Configured
  ? createAuth0(
      {
        domain: auth0Config.domain,
        clientId: auth0Config.clientId,
        cacheLocation: 'localstorage',
        authorizationParams: auth0AuthorizationParameters,
      },
      {
        errorPath: '/login?reason=auth_error',
      },
    )
  : null
