import {
  fetchDashboardSummary,
  fetchOwnedDocument,
  fetchRecentDocuments,
  fetchTimestampJobs,
  fetchUserProfile,
  insertTimestampDocument,
  mapTimestampJob,
  updateUserProfile,
} from '../data/applicationData'
import {
  createJsonResponse,
  WorkerApiError,
} from '../http/apiResponse'
import type {
  AuthenticatedUser,
  DocumentDatabaseRecord,
  TimestampTransactionResponse,
  UpdateProfilePayload,
} from '../types'

const MAX_TIMESTAMP_FILE_SIZE_BYTES = 25 * 1024 * 1024
const TIMESTAMP_CREDIT_COST = 1
const RECENT_DOCUMENT_LIMIT = 5
const PROFILE_NAME_MINIMUM_LENGTH = 2
const PROFILE_NAME_MAXIMUM_LENGTH = 50
const profileNamePattern = /^[\p{L}\p{M}]+(?:[ '\-’][\p{L}\p{M}]+)*$/u
const normalizedPhonePattern = /^\+?[1-9]\d{9,14}$/

const getNormalizedPathname = (pathname: string) =>
  pathname.replace(/\/+$/, '') || '/'

const getDocumentLimit = (requestUrl: URL) => {
  const requestedLimit = Number.parseInt(
    requestUrl.searchParams.get('_limit') ?? '',
    10,
  )

  return Number.isSafeInteger(requestedLimit)
    ? Math.min(50, Math.max(1, requestedLimit))
    : RECENT_DOCUMENT_LIMIT
}

const readProfileUpdatePayload = async (
  request: Request,
): Promise<UpdateProfilePayload> => {
  let requestPayload: unknown

  try {
    requestPayload = await request.json()
  } catch {
    throw new WorkerApiError(
      400,
      'INVALID_PROFILE',
      'Profil için gönderilen bilgiler geçersiz.',
    )
  }

  if (!requestPayload || typeof requestPayload !== 'object') {
    throw new WorkerApiError(
      400,
      'INVALID_PROFILE',
      'Profil için gönderilen bilgiler geçersiz.',
    )
  }

  const profileCandidate = requestPayload as Record<string, unknown>
  const firstName =
    typeof profileCandidate.firstName === 'string'
      ? profileCandidate.firstName.trim()
      : ''
  const lastName =
    typeof profileCandidate.lastName === 'string'
      ? profileCandidate.lastName.trim()
      : ''
  const phone =
    typeof profileCandidate.phone === 'string'
      ? profileCandidate.phone.trim()
      : ''
  const normalizedPhone = phone.replace(/[\s()-]/g, '')
  const hasValidNames = [firstName, lastName].every(
    (profileName) =>
      profileName.length >= PROFILE_NAME_MINIMUM_LENGTH &&
      profileName.length <= PROFILE_NAME_MAXIMUM_LENGTH &&
      profileNamePattern.test(profileName),
  )

  if (!hasValidNames || !normalizedPhonePattern.test(normalizedPhone)) {
    throw new WorkerApiError(
      422,
      'INVALID_PROFILE',
      'Profil alanlarını kontrol edip tekrar deneyin.',
    )
  }

  return { firstName, lastName, phone }
}

const readTimestampFile = async (request: Request) => {
  if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
    throw new WorkerApiError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Dosya multipart/form-data biçiminde gönderilmelidir.',
    )
  }

  let timestampFormData: FormData

  try {
    timestampFormData = await request.formData()
  } catch {
    throw new WorkerApiError(
      400,
      'INVALID_TIMESTAMP_TRANSACTION',
      'Zaman damgalama için gönderilen dosya okunamadı.',
    )
  }

  const timestampFile = timestampFormData.get('file')

  if (!(timestampFile instanceof File) || timestampFile.size === 0) {
    throw new WorkerApiError(
      400,
      'INVALID_TIMESTAMP_TRANSACTION',
      'Zaman damgalama için geçerli bir dosya gönderin.',
    )
  }

  if (timestampFile.size > MAX_TIMESTAMP_FILE_SIZE_BYTES) {
    throw new WorkerApiError(
      413,
      'TIMESTAMP_FILE_TOO_LARGE',
      'Dosya boyutu 25 MB sınırını aşamaz.',
    )
  }

  const safeFileName =
    timestampFile.name.split(/[\\/]/).pop()?.trim().slice(0, 255) ?? ''

  if (!safeFileName) {
    throw new WorkerApiError(
      400,
      'INVALID_TIMESTAMP_TRANSACTION',
      'Dosya adı geçersiz.',
    )
  }

  return {
    file: timestampFile,
    fileName: safeFileName,
    mimeType:
      timestampFile.type.trim().slice(0, 255) || 'application/octet-stream',
  }
}

const createTimestampTransaction = async (
  request: Request,
  environment: Env,
  authenticatedUser: AuthenticatedUser,
) => {
  const timestampFileDetails = await readTimestampFile(request)
  const transactionDate = new Date().toISOString()
  const timestampDocumentObjectKey = `documents/${crypto.randomUUID()}`

  try {
    await environment.DOCUMENT_STORAGE.put(
      timestampDocumentObjectKey,
      timestampFileDetails.file.stream(),
      {
        httpMetadata: {
          contentType: timestampFileDetails.mimeType,
        },
      },
    )
  } catch (fileStorageError) {
    console.error(
      JSON.stringify({
        error:
          fileStorageError instanceof Error
            ? fileStorageError.message
            : String(fileStorageError),
        message: 'Zaman damgası dosyası R2 arşivine kaydedilemedi.',
        objectKey: timestampDocumentObjectKey,
      }),
    )

    throw new WorkerApiError(
      500,
      'FILE_STORAGE_FAILED',
      'Dosya güvenli arşive kaydedilemedi.',
    )
  }

  let createdTimestampDocument: DocumentDatabaseRecord

  try {
    createdTimestampDocument = await insertTimestampDocument(
      environment.DATABASE,
      authenticatedUser.userId,
      {
        completedAt: transactionDate,
        createdAt: transactionDate,
        creditCost: TIMESTAMP_CREDIT_COST,
        fileName: timestampFileDetails.fileName,
        fileSize: timestampFileDetails.file.size,
        mimeType: timestampFileDetails.mimeType,
        objectKey: timestampDocumentObjectKey,
      },
    )
  } catch (documentCreationError) {
    try {
      await environment.DOCUMENT_STORAGE.delete(timestampDocumentObjectKey)
    } catch (fileCleanupError) {
      console.error(
        JSON.stringify({
          error:
            fileCleanupError instanceof Error
              ? fileCleanupError.message
              : String(fileCleanupError),
          message:
            'D1 kayıt hatasından sonra R2 dosyası temizlenemedi.',
          objectKey: timestampDocumentObjectKey,
        }),
      )
    }

    if (String(documentCreationError).includes('INSUFFICIENT_CREDITS')) {
      throw new WorkerApiError(
        409,
        'INSUFFICIENT_CREDITS',
        'Zaman damgalama işlemi için yeterli kontörünüz bulunmuyor.',
      )
    }

    throw documentCreationError
  }

  const [dashboardSummary, recentDocuments] = await Promise.all([
    fetchDashboardSummary(
      environment.DATABASE,
      authenticatedUser.userId,
    ),
    fetchRecentDocuments(
      environment.DATABASE,
      authenticatedUser.userId,
      RECENT_DOCUMENT_LIMIT,
    ),
  ])
  const timestampTransactionResponse: TimestampTransactionResponse = {
    dashboardSummary,
    recentDocuments,
    timestampJob: mapTimestampJob(createdTimestampDocument),
  }

  return timestampTransactionResponse
}

const downloadOwnedDocument = async (
  environment: Env,
  authenticatedUserId: string,
  documentId: number,
  corsHeaders: Headers,
) => {
  const ownedDocument = await fetchOwnedDocument(
    environment.DATABASE,
    authenticatedUserId,
    documentId,
  )
  const storedDocument = await environment.DOCUMENT_STORAGE.get(
    ownedDocument.object_key,
  )

  if (!storedDocument) {
    throw new WorkerApiError(
      404,
      'DOCUMENT_FILE_NOT_FOUND',
      'Belge dosyası güvenli arşivde bulunamadı.',
    )
  }

  const responseHeaders = new Headers(corsHeaders)
  storedDocument.writeHttpMetadata(responseHeaders)
  responseHeaders.set('Content-Type', ownedDocument.mime_type)
  responseHeaders.set(
    'Content-Disposition',
    `attachment; filename*=UTF-8''${encodeURIComponent(ownedDocument.file_name)}`,
  )
  responseHeaders.set('Cache-Control', 'private, no-store')
  responseHeaders.set('ETag', storedDocument.httpEtag)

  return new Response(storedDocument.body, { headers: responseHeaders })
}

export const routeAuthenticatedRequest = async (
  request: Request,
  environment: Env,
  authenticatedUser: AuthenticatedUser,
  corsHeaders: Headers,
) => {
  const requestUrl = new URL(request.url)
  const requestPathname = getNormalizedPathname(requestUrl.pathname)

  if (request.method === 'GET' && requestPathname === '/dashboard') {
    const dashboardSummary = await fetchDashboardSummary(
      environment.DATABASE,
      authenticatedUser.userId,
    )
    return createJsonResponse(dashboardSummary, 200, corsHeaders)
  }

  if (request.method === 'GET' && requestPathname === '/documents') {
    const recentDocuments = await fetchRecentDocuments(
      environment.DATABASE,
      authenticatedUser.userId,
      getDocumentLimit(requestUrl),
    )
    return createJsonResponse(recentDocuments, 200, corsHeaders)
  }

  if (request.method === 'GET' && requestPathname === '/timestampJobs') {
    const timestampJobs = await fetchTimestampJobs(
      environment.DATABASE,
      authenticatedUser.userId,
    )
    return createJsonResponse(timestampJobs, 200, corsHeaders)
  }

  if (
    request.method === 'POST' &&
    requestPathname === '/timestamp-transactions'
  ) {
    const timestampTransaction = await createTimestampTransaction(
      request,
      environment,
      authenticatedUser,
    )
    return createJsonResponse(timestampTransaction, 201, corsHeaders)
  }

  if (request.method === 'GET' && requestPathname === '/profile') {
    const userProfile = await fetchUserProfile(
      environment.DATABASE,
      authenticatedUser.userId,
    )
    return createJsonResponse(userProfile, 200, corsHeaders)
  }

  if (request.method === 'PATCH' && requestPathname === '/profile') {
    const profileUpdates = await readProfileUpdatePayload(request)
    const updatedUserProfile = await updateUserProfile(
      environment.DATABASE,
      authenticatedUser.userId,
      profileUpdates,
    )
    return createJsonResponse(updatedUserProfile, 200, corsHeaders)
  }

  const documentDownloadPathMatch = requestPathname.match(
    /^\/documents\/(\d+)\/download$/,
  )

  if (request.method === 'GET' && documentDownloadPathMatch?.[1]) {
    return downloadOwnedDocument(
      environment,
      authenticatedUser.userId,
      Number.parseInt(documentDownloadPathMatch[1], 10),
      corsHeaders,
    )
  }

  throw new WorkerApiError(
    404,
    'ENDPOINT_NOT_FOUND',
    'İstenen API endpoint’i bulunamadı.',
  )
}
