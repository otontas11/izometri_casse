import {
  createCompletedDocumentFromDraft,
  deleteOwnedDocumentRecord,
  deleteUploadedDraftFileRecord,
  fetchDashboardSummary,
  fetchOwnedDocument,
  fetchProcessableDraftFile,
  fetchRecentDocuments,
  fetchTimestampJobs,
  fetchUploadedDraftFiles,
  fetchUserProfile,
  insertUploadedDraftFile,
  mapArchivedDocument,
  mapTimestampJob,
  updateUserProfile,
} from '../data/applicationData'
import {
  createEmptyResponse,
  createJsonResponse,
  WorkerApiError,
} from '../http/apiResponse'
import type {
  ArchivedDocumentDeletionResponse,
  AuthenticatedUser,
  DocumentDatabaseRecord,
  DocumentOperation,
  SignatureTransactionResponse,
  TimestampTransactionResponse,
  UpdateProfilePayload,
} from '../types'

const MAX_DOCUMENT_FILE_SIZE_BYTES = 25 * 1024 * 1024
const DOCUMENT_TRANSACTION_CREDIT_COST = 1
const RECENT_DOCUMENT_LIMIT = 5
const PROFILE_NAME_MINIMUM_LENGTH = 2
const PROFILE_NAME_MAXIMUM_LENGTH = 50
const profileNamePattern = /^[\p{L}\p{M}]+(?:[ '\-’][\p{L}\p{M}]+)*$/u
const normalizedPhonePattern = /^\+?[1-9]\d{9,14}$/
const supportedDraftFileExtensions = new Set([
  '.avif',
  '.bmp',
  '.doc',
  '.docx',
  '.gif',
  '.heic',
  '.heif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.svg',
  '.tif',
  '.tiff',
  '.ubl',
  '.webp',
  '.xml',
])

interface DocumentTransactionConfiguration {
  actionName: string
  invalidTransactionErrorCode: string
  operation: DocumentOperation
  transactionFailedErrorCode: string
}

const signatureTransactionConfiguration = {
  actionName: 'İmzalama',
  invalidTransactionErrorCode: 'INVALID_SIGNATURE_TRANSACTION',
  operation: 'signature',
  transactionFailedErrorCode: 'SIGNATURE_TRANSACTION_FAILED',
} satisfies DocumentTransactionConfiguration

const timestampTransactionConfiguration = {
  actionName: 'Zaman damgalama',
  invalidTransactionErrorCode: 'INVALID_TIMESTAMP_TRANSACTION',
  operation: 'timestamp',
  transactionFailedErrorCode: 'TIMESTAMP_TRANSACTION_FAILED',
} satisfies DocumentTransactionConfiguration

const getNormalizedPathname = (pathname: string) =>
  pathname.replace(/\/+$/, '') || '/'

const getFileExtension = (fileName: string) => {
  const extensionSeparatorIndex = fileName.lastIndexOf('.')

  return extensionSeparatorIndex >= 0
    ? fileName.slice(extensionSeparatorIndex).toLowerCase()
    : ''
}

const isDocumentOperation = (
  operationCandidate: unknown,
): operationCandidate is DocumentOperation =>
  operationCandidate === 'signature' || operationCandidate === 'timestamp'

const getDocumentLimit = (requestUrl: URL) => {
  const requestedLimit = Number.parseInt(
    requestUrl.searchParams.get('_limit') ?? '',
    10,
  )

  return Number.isSafeInteger(requestedLimit)
    ? Math.min(50, Math.max(1, requestedLimit))
    : RECENT_DOCUMENT_LIMIT
}

const getOptionalDocumentOperation = (requestUrl: URL) => {
  const requestedDocumentOperation = requestUrl.searchParams.get('operation')

  if (requestedDocumentOperation === null) {
    return undefined
  }

  if (!isDocumentOperation(requestedDocumentOperation)) {
    throw new WorkerApiError(
      422,
      'INVALID_DOCUMENT_OPERATION',
      'Belgeler için geçerli bir işlem seçin.',
    )
  }

  return requestedDocumentOperation
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

const readDraftFileUpload = async (request: Request) => {
  if (!request.headers.get('Content-Type')?.includes('multipart/form-data')) {
    throw new WorkerApiError(
      415,
      'UNSUPPORTED_MEDIA_TYPE',
      'Dosya multipart/form-data biçiminde gönderilmelidir.',
    )
  }

  let draftFileFormData: FormData

  try {
    draftFileFormData = await request.formData()
  } catch {
    throw new WorkerApiError(
      400,
      'INVALID_DRAFT_FILE_UPLOAD',
      'Yüklenecek dosya okunamadı.',
    )
  }

  const draftFile = draftFileFormData.get('file')
  const intendedOperation = draftFileFormData.get('intendedOperation')

  if (!(draftFile instanceof File) || draftFile.size === 0) {
    throw new WorkerApiError(
      400,
      'INVALID_DRAFT_FILE_UPLOAD',
      'Yüklemek için geçerli bir dosya gönderin.',
    )
  }

  if (!isDocumentOperation(intendedOperation)) {
    throw new WorkerApiError(
      422,
      'INVALID_DRAFT_FILE_OPERATION',
      'Dosyanın kullanılacağı işlem geçersiz.',
    )
  }

  if (draftFile.size > MAX_DOCUMENT_FILE_SIZE_BYTES) {
    throw new WorkerApiError(
      413,
      'DRAFT_FILE_TOO_LARGE',
      'Dosya boyutu 25 MB sınırını aşamaz.',
    )
  }

  const safeFileName =
    draftFile.name.split(/[\\/]/).pop()?.trim().slice(0, 255) ?? ''

  if (!safeFileName) {
    throw new WorkerApiError(
      400,
      'INVALID_DRAFT_FILE_UPLOAD',
      'Dosya adı geçersiz.',
    )
  }

  if (!supportedDraftFileExtensions.has(getFileExtension(safeFileName))) {
    throw new WorkerApiError(
      415,
      'UNSUPPORTED_DRAFT_FILE_TYPE',
      'Yalnızca PDF, Word, XML, UBL ve görsel dosyalarına izin verilir.',
    )
  }

  return {
    file: draftFile,
    fileName: safeFileName,
    intendedOperation,
    mimeType:
      draftFile.type.trim().slice(0, 255) || 'application/octet-stream',
  }
}

const uploadDraftFile = async (
  request: Request,
  environment: Env,
  authenticatedUser: AuthenticatedUser,
) => {
  const draftFileUpload = await readDraftFileUpload(request)
  const draftFileCreatedAt = new Date().toISOString()
  const draftFileObjectKey = `draft-files/${crypto.randomUUID()}`

  try {
    await environment.DOCUMENT_STORAGE.put(
      draftFileObjectKey,
      draftFileUpload.file.stream(),
      {
        httpMetadata: {
          contentType: draftFileUpload.mimeType,
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
        message: 'Taslak dosya R2 arşivine kaydedilemedi.',
        objectKey: draftFileObjectKey,
      }),
    )

    throw new WorkerApiError(
      500,
      'DRAFT_FILE_STORAGE_FAILED',
      'Dosya güvenli alana yüklenemedi.',
    )
  }

  try {
    return await insertUploadedDraftFile(
      environment.DATABASE,
      authenticatedUser.userId,
      {
        createdAt: draftFileCreatedAt,
        fileName: draftFileUpload.fileName,
        fileSize: draftFileUpload.file.size,
        intendedOperation: draftFileUpload.intendedOperation,
        mimeType: draftFileUpload.mimeType,
        objectKey: draftFileObjectKey,
      },
    )
  } catch (draftFileCreationError) {
    try {
      await environment.DOCUMENT_STORAGE.delete(draftFileObjectKey)
    } catch (fileCleanupError) {
      console.error(
        JSON.stringify({
          error:
            fileCleanupError instanceof Error
              ? fileCleanupError.message
              : String(fileCleanupError),
          message: 'D1 kayıt hatasından sonra R2 taslağı temizlenemedi.',
          objectKey: draftFileObjectKey,
        }),
      )
    }

    console.error(
      JSON.stringify({
        error:
          draftFileCreationError instanceof Error
            ? draftFileCreationError.message
            : String(draftFileCreationError),
        message: 'Taslak dosyanın D1 kaydı oluşturulamadı.',
        objectKey: draftFileObjectKey,
      }),
    )

    throw new WorkerApiError(
      500,
      'DRAFT_FILE_UPLOAD_FAILED',
      'Dosya yükleme işlemi tamamlanamadı.',
    )
  }
}

const readDraftFileId = async (
  request: Request,
  transactionConfiguration: DocumentTransactionConfiguration,
) => {
  let requestPayload: unknown

  try {
    requestPayload = await request.json()
  } catch {
    throw new WorkerApiError(
      400,
      transactionConfiguration.invalidTransactionErrorCode,
      `${transactionConfiguration.actionName} için gönderilen bilgiler geçersiz.`,
    )
  }

  const draftFileId =
    requestPayload && typeof requestPayload === 'object'
      ? (requestPayload as Record<string, unknown>).draftFileId
      : null

  if (
    typeof draftFileId !== 'number' ||
    !Number.isSafeInteger(draftFileId) ||
    draftFileId < 1
  ) {
    throw new WorkerApiError(
      422,
      transactionConfiguration.invalidTransactionErrorCode,
      `${transactionConfiguration.actionName} için geçerli bir taslak dosya seçin.`,
    )
  }

  return draftFileId
}

const createDocumentTransaction = async (
  request: Request,
  environment: Env,
  authenticatedUser: AuthenticatedUser,
  transactionConfiguration: DocumentTransactionConfiguration,
) => {
  const draftFileId = await readDraftFileId(request, transactionConfiguration)
  const draftFileRecord = await fetchProcessableDraftFile(
    environment.DATABASE,
    authenticatedUser.userId,
    draftFileId,
    transactionConfiguration.operation,
  )
  const storedDraftFile = await environment.DOCUMENT_STORAGE.head(
    draftFileRecord.object_key,
  )

  if (!storedDraftFile) {
    throw new WorkerApiError(
      409,
      'DRAFT_FILE_CONTENT_NOT_FOUND',
      'Taslak dosyanın içeriği güvenli arşivde bulunamadı.',
    )
  }

  let createdDocument: DocumentDatabaseRecord

  try {
    createdDocument = await createCompletedDocumentFromDraft(
      environment.DATABASE,
      authenticatedUser.userId,
      draftFileRecord,
      DOCUMENT_TRANSACTION_CREDIT_COST,
    )
  } catch (documentCreationError) {
    if (documentCreationError instanceof WorkerApiError) {
      throw documentCreationError
    }

    const databaseErrorMessage = String(documentCreationError)

    if (databaseErrorMessage.includes('INSUFFICIENT_CREDITS')) {
      throw new WorkerApiError(
        409,
        'INSUFFICIENT_CREDITS',
        'Bu işlem için yeterli kontörünüz bulunmuyor.',
      )
    }

    if (databaseErrorMessage.includes('DRAFT_FILE_NOT_AVAILABLE')) {
      throw new WorkerApiError(
        409,
        'DRAFT_FILE_NOT_AVAILABLE',
        'Taslak dosya bulunamadı veya daha önce işlenmiş.',
      )
    }

    if (
      databaseErrorMessage.includes('documents.draft_file_id') ||
      databaseErrorMessage.includes('documents.object_key')
    ) {
      throw new WorkerApiError(
        409,
        'DRAFT_FILE_ALREADY_PROCESSED',
        'Bu taslak dosya daha önce işlenmiş.',
      )
    }

    console.error(
      JSON.stringify({
        draftFileId,
        error:
          documentCreationError instanceof Error
            ? documentCreationError.message
            : databaseErrorMessage,
        message: `${transactionConfiguration.actionName} D1 kaydı oluşturulamadı.`,
      }),
    )

    throw new WorkerApiError(
      500,
      transactionConfiguration.transactionFailedErrorCode,
      `${transactionConfiguration.actionName} işlemi tamamlanamadı.`,
    )
  }

  const [dashboardSummary, recentDocuments] = await Promise.all([
    fetchDashboardSummary(environment.DATABASE, authenticatedUser.userId),
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
    signedDocument: mapArchivedDocument(signatureTransaction.createdDocument),
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

const deleteDraftFile = async (
  environment: Env,
  authenticatedUserId: string,
  draftFileId: number,
) => {
  const deletedDraftFile = await deleteUploadedDraftFileRecord(
    environment.DATABASE,
    authenticatedUserId,
    draftFileId,
  )

  try {
    await environment.DOCUMENT_STORAGE.delete(deletedDraftFile.object_key)
  } catch (fileDeleteError) {
    console.error(
      JSON.stringify({
        draftFileId,
        error:
          fileDeleteError instanceof Error
            ? fileDeleteError.message
            : String(fileDeleteError),
        message: 'Silinen D1 taslağının R2 içeriği temizlenemedi.',
        objectKey: deletedDraftFile.object_key,
      }),
    )
  }
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

const deleteArchivedDocument = async (
  environment: Env,
  authenticatedUserId: string,
  documentId: number,
) => {
  const deletedDocument = await deleteOwnedDocumentRecord(
    environment.DATABASE,
    authenticatedUserId,
    documentId,
  )

  try {
    await environment.DOCUMENT_STORAGE.delete(deletedDocument.object_key)
  } catch (fileDeleteError) {
    console.error(
      JSON.stringify({
        documentId,
        error:
          fileDeleteError instanceof Error
            ? fileDeleteError.message
            : String(fileDeleteError),
        message: 'Silinen D1 belgesinin R2 içeriği temizlenemedi.',
        objectKey: deletedDocument.object_key,
      }),
    )
  }

  const [dashboardSummary, recentDocuments] = await Promise.all([
    fetchDashboardSummary(environment.DATABASE, authenticatedUserId),
    fetchRecentDocuments(
      environment.DATABASE,
      authenticatedUserId,
      RECENT_DOCUMENT_LIMIT,
    ),
  ])
  const archivedDocumentDeletionResponse: ArchivedDocumentDeletionResponse = {
    dashboardSummary,
    recentDocuments,
  }

  return archivedDocumentDeletionResponse
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
      getOptionalDocumentOperation(requestUrl),
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

  if (request.method === 'POST' && requestPathname === '/draft-files') {
    const uploadedDraftFile = await uploadDraftFile(
      request,
      environment,
      authenticatedUser,
    )
    return createJsonResponse(uploadedDraftFile, 201, corsHeaders)
  }

  if (request.method === 'GET' && requestPathname === '/draft-files') {
    const intendedOperation = requestUrl.searchParams.get('operation')

    if (!isDocumentOperation(intendedOperation)) {
      throw new WorkerApiError(
        422,
        'INVALID_DRAFT_FILE_OPERATION',
        'Taslak dosyalar için geçerli bir işlem seçin.',
      )
    }

    const uploadedDraftFiles = await fetchUploadedDraftFiles(
      environment.DATABASE,
      authenticatedUser.userId,
      intendedOperation,
    )
    return createJsonResponse(uploadedDraftFiles, 200, corsHeaders)
  }

  const draftFilePathMatch = requestPathname.match(/^\/draft-files\/(\d+)$/)

  if (request.method === 'DELETE' && draftFilePathMatch?.[1]) {
    await deleteDraftFile(
      environment,
      authenticatedUser.userId,
      Number.parseInt(draftFilePathMatch[1], 10),
    )
    return createEmptyResponse(204, corsHeaders)
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

  const documentPathMatch = requestPathname.match(/^\/documents\/(\d+)$/)

  if (request.method === 'DELETE' && documentPathMatch?.[1]) {
    const archivedDocumentDeletionResponse = await deleteArchivedDocument(
      environment,
      authenticatedUser.userId,
      Number.parseInt(documentPathMatch[1], 10),
    )
    return createJsonResponse(
      archivedDocumentDeletionResponse,
      200,
      corsHeaders,
    )
  }

  throw new WorkerApiError(
    404,
    'ENDPOINT_NOT_FOUND',
    'İstenen API endpoint’i bulunamadı.',
  )
}
