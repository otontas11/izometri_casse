import {
  fetchDashboardSummary,
  fetchOwnedDocument,
  fetchRecentDocuments,
  fetchTimestampJobs,
  fetchUserProfile,
  insertSignatureDocument,
  insertTimestampDocument,
  mapArchivedDocument,
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
  DocumentOperation,
  SignatureTransactionResponse,
  TimestampTransactionResponse,
  UpdateProfilePayload,
} from '../types'

const MAX_DOCUMENT_FILE_SIZE_BYTES = 25 * 1024 * 1024
const TIMESTAMP_CREDIT_COST = 1
const RECENT_DOCUMENT_LIMIT = 5
const PROFILE_NAME_MINIMUM_LENGTH = 2
const PROFILE_NAME_MAXIMUM_LENGTH = 50
const profileNamePattern = /^[\p{L}\p{M}]+(?:[ '\-’][\p{L}\p{M}]+)*$/u
const normalizedPhonePattern = /^\+?[1-9]\d{9,14}$/

interface DocumentTransactionConfiguration {
  actionName: string
  creditCost: number
  fileTooLargeErrorCode: string
  invalidTransactionErrorCode: string
  operation: DocumentOperation
  transactionFailedErrorCode: string
}

const signatureTransactionConfiguration = {
  actionName: 'İmzalama',
  creditCost: 0,
  fileTooLargeErrorCode: 'SIGNATURE_FILE_TOO_LARGE',
  invalidTransactionErrorCode: 'INVALID_SIGNATURE_TRANSACTION',
  operation: 'signature',
  transactionFailedErrorCode: 'SIGNATURE_TRANSACTION_FAILED',
} satisfies DocumentTransactionConfiguration

const timestampTransactionConfiguration = {
  actionName: 'Zaman damgalama',
  creditCost: TIMESTAMP_CREDIT_COST,
  fileTooLargeErrorCode: 'TIMESTAMP_FILE_TOO_LARGE',
  invalidTransactionErrorCode: 'INVALID_TIMESTAMP_TRANSACTION',
  operation: 'timestamp',
  transactionFailedErrorCode: 'TIMESTAMP_TRANSACTION_FAILED',
} satisfies DocumentTransactionConfiguration

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

const readDocumentTransactionFile = async (
  request: Request,
  transactionConfiguration: DocumentTransactionConfiguration,
) => {
  if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
    throw new WorkerApiError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Dosya multipart/form-data biçiminde gönderilmelidir.',
    )
  }

  let documentFormData: FormData

  try {
    documentFormData = await request.formData()
  } catch {
    throw new WorkerApiError(
      400,
      transactionConfiguration.invalidTransactionErrorCode,
      `${transactionConfiguration.actionName} için gönderilen dosya okunamadı.`,
    )
  }

  const transactionFile = documentFormData.get('file')

  if (!(transactionFile instanceof File) || transactionFile.size === 0) {
    throw new WorkerApiError(
      400,
      transactionConfiguration.invalidTransactionErrorCode,
      `${transactionConfiguration.actionName} için geçerli bir dosya gönderin.`,
    )
  }

  if (transactionFile.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new WorkerApiError(
      413,
      transactionConfiguration.fileTooLargeErrorCode,
      'Dosya boyutu 25 MB sınırını aşamaz.',
    )
  }

  const safeFileName =
    transactionFile.name.split(/[\\/]/).pop()?.trim().slice(0, 255) ?? ''

  if (!safeFileName) {
    throw new WorkerApiError(
      400,
      transactionConfiguration.invalidTransactionErrorCode,
      'Dosya adı geçersiz.',
    )
  }

  return {
    file: transactionFile,
    fileName: safeFileName,
    mimeType:
      transactionFile.type.trim().slice(0, 255) || 'application/octet-stream',
  }
}

const createDocumentTransaction = async (
  request: Request,
  environment: Env,
  authenticatedUser: AuthenticatedUser,
  transactionConfiguration: DocumentTransactionConfiguration,
) => {
  const documentFileDetails = await readDocumentTransactionFile(
    request,
    transactionConfiguration,
  )
  const transactionDate = new Date().toISOString()
  const documentObjectKey = `documents/${crypto.randomUUID()}`

  try {
    await environment.DOCUMENT_STORAGE.put(
      documentObjectKey,
      documentFileDetails.file.stream(),
      {
        httpMetadata: {
          contentType: documentFileDetails.mimeType,
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
        message: `${transactionConfiguration.actionName} dosyası R2 arşivine kaydedilemedi.`,
        objectKey: documentObjectKey,
      }),
    )

    throw new WorkerApiError(
      500,
      'FILE_STORAGE_FAILED',
      'Dosya güvenli arşive kaydedilemedi.',
    )
  }

  let createdDocument: DocumentDatabaseRecord

  try {
    const completedDocumentDetails = {
      completedAt: transactionDate,
      createdAt: transactionDate,
      fileName: documentFileDetails.fileName,
      fileSize: documentFileDetails.file.size,
      mimeType: documentFileDetails.mimeType,
      objectKey: documentObjectKey,
    }

    createdDocument =
      transactionConfiguration.operation === 'timestamp'
        ? await insertTimestampDocument(
            environment.DATABASE,
            authenticatedUser.userId,
            {
              ...completedDocumentDetails,
              creditCost: transactionConfiguration.creditCost,
            },
          )
        : await insertSignatureDocument(
            environment.DATABASE,
            authenticatedUser.userId,
            completedDocumentDetails,
          )
  } catch (documentCreationError) {
    try {
      await environment.DOCUMENT_STORAGE.delete(documentObjectKey)
    } catch (fileCleanupError) {
      console.error(
        JSON.stringify({
          error:
            fileCleanupError instanceof Error
              ? fileCleanupError.message
              : String(fileCleanupError),
          message:
            'D1 kayıt hatasından sonra R2 dosyası temizlenemedi.',
          objectKey: documentObjectKey,
        }),
      )
    }

    if (
      transactionConfiguration.operation === 'timestamp' &&
      String(documentCreationError).includes('INSUFFICIENT_CREDITS')
    ) {
      throw new WorkerApiError(
        409,
        'INSUFFICIENT_CREDITS',
        'Zaman damgalama işlemi için yeterli kontörünüz bulunmuyor.',
      )
    }

    console.error(
      JSON.stringify({
        error:
          documentCreationError instanceof Error
            ? documentCreationError.message
            : String(documentCreationError),
        message: `${transactionConfiguration.actionName} D1 kaydı oluşturulamadı.`,
        objectKey: documentObjectKey,
      }),
    )

    throw new WorkerApiError(
      500,
      transactionConfiguration.transactionFailedErrorCode,
      `${transactionConfiguration.actionName} işlemi tamamlanamadı.`,
    )
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
  return { createdDocument, dashboardSummary, recentDocuments }
}

const createSignatureTransaction = async (
  request: Request,
  environment: Env,
  authenticatedUser: AuthenticatedUser,
) => {
  const signatureTransaction = await createDocumentTransaction(
    request,
    environment,
    authenticatedUser,
    signatureTransactionConfiguration,
  )
  const signatureTransactionResponse: SignatureTransactionResponse = {
    dashboardSummary: signatureTransaction.dashboardSummary,
    recentDocuments: signatureTransaction.recentDocuments,
    signedDocument: mapArchivedDocument(
      signatureTransaction.createdDocument,
    ),
  }

  return signatureTransactionResponse
}

const createTimestampTransaction = async (
  request: Request,
  environment: Env,
  authenticatedUser: AuthenticatedUser,
) => {
  const timestampTransaction = await createDocumentTransaction(
    request,
    environment,
    authenticatedUser,
    timestampTransactionConfiguration,
  )
  const timestampTransactionResponse: TimestampTransactionResponse = {
    dashboardSummary: timestampTransaction.dashboardSummary,
    recentDocuments: timestampTransaction.recentDocuments,
    timestampJob: mapTimestampJob(timestampTransaction.createdDocument),
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
    requestPathname === '/signature-transactions'
  ) {
    const signatureTransaction = await createSignatureTransaction(
      request,
      environment,
      authenticatedUser,
    )
    return createJsonResponse(signatureTransaction, 201, corsHeaders)
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
