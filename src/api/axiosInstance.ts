import axios from 'axios'

import { environmentConfig } from '@/config/env'
import { auth0Plugin } from '@/features/auth/auth.plugin'

import { toApiRequestError } from './apiError'

export const axiosInstance = axios.create({
  baseURL: environmentConfig.apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
  timeout: 10_000,
})

axiosInstance.interceptors.request.use(
  async requestConfig => {
    const canRequestApiAccessToken = Boolean(auth0Plugin && environmentConfig.auth0Audience && auth0Plugin.isAuthenticated.value)

    if (!canRequestApiAccessToken || !auth0Plugin) {
      return requestConfig
    }

    const apiAccessToken = await auth0Plugin.getAccessTokenSilently()
    requestConfig.headers.set('Authorization', `Bearer ${apiAccessToken}`)

    return requestConfig
  },
  (requestError: unknown) => Promise.reject(toApiRequestError(requestError))
)

axiosInstance.interceptors.response.use(
  axiosResponse => axiosResponse,
  (requestError: unknown) => Promise.reject(toApiRequestError(requestError))
)
