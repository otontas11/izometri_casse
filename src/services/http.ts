import axios from 'axios'

interface ApiErrorPayload {
  error?: string
  message?: string
}

export class ApiRequestError extends Error {
  readonly status: number | null
  readonly code: string | null

  constructor(message: string, status: number | null, code: string | null) {
    super(message)
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
  }
}

const getResponseMessage = (payload: unknown) => {
  if (typeof payload === 'string' && payload.trim()) {
    return payload
  }

  if (payload && typeof payload === 'object') {
    const { error, message } = payload as ApiErrorPayload

    return message?.trim() || error?.trim() || ''
  }

  return ''
}

const getStatusMessage = (status?: number) => {
  switch (status) {
    case 400:
      return 'Gönderilen bilgiler geçersiz. Lütfen alanları kontrol edin.'
    case 401:
      return 'Oturumunuz doğrulanamadı. Lütfen yeniden giriş yapın.'
    case 403:
      return 'Bu işlem için yetkiniz bulunmuyor.'
    case 404:
      return 'İstenen kayıt bulunamadı.'
    case 409:
      return 'Bu işlem mevcut verilerle çakışıyor.'
    case 422:
      return 'Gönderilen bilgiler işlenemedi.'
    default:
      return status && status >= 500
        ? 'Servis geçici olarak kullanılamıyor. Lütfen tekrar deneyin.'
        : 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'
  }
}

export const toApiRequestError = (error: unknown) => {
  if (error instanceof ApiRequestError) {
    return error
  }

  if (!axios.isAxiosError(error)) {
    return new ApiRequestError(
      error instanceof Error ? error.message : 'Beklenmeyen bir hata oluştu.',
      null,
      null,
    )
  }

  if (error.code === 'ECONNABORTED') {
    return new ApiRequestError(
      'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
      error.response?.status ?? null,
      error.code,
    )
  }

  if (!error.response) {
    return new ApiRequestError(
      'Fake API sunucusuna ulaşılamadı. `npm run api` komutunun çalıştığını kontrol edin.',
      null,
      error.code ?? null,
    )
  }

  return new ApiRequestError(
    getResponseMessage(error.response.data) || getStatusMessage(error.response.status),
    error.response.status,
    error.code ?? null,
  )
}

export const getApiErrorMessage = (
  error: unknown,
  fallback = 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
) => {
  const apiError = toApiRequestError(error)

  return apiError.message || fallback
}

export const httpClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3001',
  headers: {
    Accept: 'application/json',
  },
  timeout: 10_000,
})

httpClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(toApiRequestError(error)),
)
