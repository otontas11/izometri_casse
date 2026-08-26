import axios from 'axios'

import { environmentConfig } from '@/config/env'

import { toApiRequestError } from './apiError'

export const axiosInstance = axios.create({
  baseURL: environmentConfig.apiBaseUrl,
  headers: {
    Accept: 'application/json',
  },
  timeout: 10_000,
})

axiosInstance.interceptors.response.use(
  (axiosResponse) => axiosResponse,
  (requestError: unknown) => Promise.reject(toApiRequestError(requestError)),
)
