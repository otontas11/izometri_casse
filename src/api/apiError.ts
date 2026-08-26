import axios from 'axios'

interface ApiErrorPayload {
  error?: string
  message?: string
}

export class ApiRequestError extends Error {
  readonly statusCode: number | null
  readonly errorCode: string | null

  constructor(
    message: string,
    statusCode: number | null,
    errorCode: string | null,
  ) {
    super(message)
    this.name = 'ApiRequestError'
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

const extractApiErrorMessage = (responsePayload: unknown) => {
  if (typeof responsePayload === 'string' && responsePayload.trim()) {
    return responsePayload
  }

  if (responsePayload && typeof responsePayload === 'object') {
    const { error, message } = responsePayload as ApiErrorPayload

    return message?.trim() || error?.trim() || ''
  }

  return ''
}

const getDefaultHttpStatusMessage = (statusCode?: number) => {
  switch (statusCode) {
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
      return statusCode && statusCode >= 500
        ? 'Servis geçici olarak kullanılamıyor. Lütfen tekrar deneyin.'
        : 'İşlem tamamlanamadı. Lütfen tekrar deneyin.'
  }
}

export const toApiRequestError = (requestError: unknown) => {
  if (requestError instanceof ApiRequestError) {
    return requestError
  }

  if (!axios.isAxiosError(requestError)) {
    return new ApiRequestError(
      requestError instanceof Error
        ? requestError.message
        : 'Beklenmeyen bir hata oluştu.',
      null,
      null,
    )
  }

  if (requestError.code === 'ECONNABORTED') {
    return new ApiRequestError(
      'İstek zaman aşımına uğradı. Lütfen tekrar deneyin.',
      requestError.response?.status ?? null,
      requestError.code,
    )
  }

  if (!requestError.response) {
    return new ApiRequestError(
      'Fake API sunucusuna ulaşılamadı. `npm run api` komutunun çalıştığını kontrol edin.',
      null,
      requestError.code ?? null,
    )
  }

  return new ApiRequestError(
    extractApiErrorMessage(requestError.response.data) ||
      getDefaultHttpStatusMessage(requestError.response.status),
    requestError.response.status,
    requestError.code ?? null,
  )
}

export const getApiErrorMessage = (
  requestError: unknown,
  fallbackMessage = 'İşlem tamamlanamadı. Lütfen tekrar deneyin.',
) => {
  const normalizedApiError = toApiRequestError(requestError)

  return normalizedApiError.message || fallbackMessage
}
