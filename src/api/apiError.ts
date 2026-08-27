import axios from 'axios'

import { translate } from '@/locales'

interface ApiErrorPayload {
  error?: string
  message?: string
}

const apiErrorTranslationKeys: Record<string, string> = {
  DRAFT_FILE_ALREADY_PROCESSED: 'errors.draftFileAlreadyProcessed',
  DRAFT_FILE_CONTENT_NOT_FOUND: 'errors.draftFileContentNotFound',
  DRAFT_FILE_DELETE_CONFLICT: 'errors.draftFileDeleteFailed',
  DRAFT_FILE_NOT_AVAILABLE: 'errors.draftFileNotAvailable',
  DRAFT_FILE_NOT_FOUND: 'errors.draftFileDeleteFailed',
  DRAFT_FILE_PROCESSING_CONFLICT: 'errors.draftFileNotAvailable',
  DRAFT_FILE_STORAGE_FAILED: 'errors.draftFileUploadFailed',
  DRAFT_FILE_TOO_LARGE: 'errors.draftFileTooLarge',
  DRAFT_FILE_UPLOAD_FAILED: 'errors.draftFileUploadFailed',
  INSUFFICIENT_CREDITS: 'errors.insufficientCredits',
  INVALID_DRAFT_FILE_OPERATION: 'errors.invalidDraftFileOperation',
  INVALID_DRAFT_FILE_UPLOAD: 'errors.invalidDraftFileUpload',
  INVALID_SIGNATURE_TRANSACTION: 'errors.invalidSignatureTransaction',
  INVALID_TIMESTAMP_TRANSACTION: 'errors.invalidTimestampTransaction',
  SIGNATURE_TRANSACTION_FAILED: 'errors.signatureTransactionFailed',
  TIMESTAMP_TRANSACTION_FAILED: 'errors.timestampTransactionFailed',
  UNSUPPORTED_DRAFT_FILE_TYPE: 'errors.unsupportedDraftFileType',
  UNSUPPORTED_SIGNATURE_FILE_TYPE:
    'errors.unsupportedSignatureFileType',
}

class ApiRequestError extends Error {
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

const extractApiErrorCode = (responsePayload: unknown) => {
  if (!responsePayload || typeof responsePayload !== 'object') {
    return ''
  }

  const { error } = responsePayload as ApiErrorPayload
  return error?.trim() ?? ''
}

const getLocalizedApiErrorMessage = (responsePayload: unknown) => {
  const apiErrorCode = extractApiErrorCode(responsePayload)
  const apiErrorTranslationKey = apiErrorTranslationKeys[apiErrorCode]

  return apiErrorTranslationKey
    ? translate(apiErrorTranslationKey)
    : extractApiErrorMessage(responsePayload)
}

const getDefaultHttpStatusMessage = (statusCode?: number) => {
  switch (statusCode) {
    case 400:
      return translate('errors.badRequest')
    case 401:
      return translate('errors.unauthorized')
    case 403:
      return translate('errors.forbidden')
    case 404:
      return translate('errors.notFound')
    case 409:
      return translate('errors.conflict')
    case 422:
      return translate('errors.unprocessable')
    default:
      return statusCode && statusCode >= 500
        ? translate('errors.serviceUnavailable')
        : translate('errors.fallback')
  }
}

export const toApiRequestError = (requestError: unknown) => {
  if (requestError instanceof ApiRequestError) {
    return requestError
  }

  if (!axios.isAxiosError(requestError)) {
    return new ApiRequestError(
      translate('errors.unexpected'),
      null,
      null,
    )
  }

  if (requestError.code === 'ECONNABORTED') {
    return new ApiRequestError(
      translate('errors.timeout'),
      requestError.response?.status ?? null,
      requestError.code,
    )
  }

  if (!requestError.response) {
    return new ApiRequestError(
      translate('errors.apiUnavailable'),
      null,
      requestError.code ?? null,
    )
  }

  return new ApiRequestError(
    getLocalizedApiErrorMessage(requestError.response.data) ||
      getDefaultHttpStatusMessage(requestError.response.status),
    requestError.response.status,
    extractApiErrorCode(requestError.response.data) || requestError.code || null,
  )
}

export const getApiErrorMessage = (
  requestError: unknown,
  fallbackMessage = translate('errors.fallback'),
) => {
  const normalizedApiError = toApiRequestError(requestError)

  return normalizedApiError.message || fallbackMessage
}
