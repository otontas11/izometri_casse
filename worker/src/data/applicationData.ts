import { WorkerApiError } from '../http/apiResponse'
import type {
  ArchivedDocument,
  AuthenticatedUser,
  DashboardDatabaseRecord,
  DashboardSummary,
  DocumentDatabaseRecord,
  DocumentFileTypeFilter,
  DocumentHistoryCountDatabaseRecord,
  DocumentHistoryRequest,
  DocumentHistoryResponse,
  DocumentOperation,
  DraftFile,
  DraftFileDatabaseRecord,
  ProfileDatabaseRecord,
  TimestampJob,
  UpdateProfilePayload,
  UserProfile,
} from '../types'

const BYTES_PER_MEGABYTE = 1024 * 1024
const DEFAULT_REMAINING_CREDITS = 20
const DEFAULT_STORAGE_LIMIT_BYTES = 1024 * BYTES_PER_MEGABYTE
const documentFileTypeExtensions: Record<DocumentFileTypeFilter, string[]> = {
  excel: ['.xls', '.xlsx'],
  eyp: ['.eyp'],
  image: [
    '.avif',
    '.bmp',
    '.gif',
    '.heic',
    '.heif',
    '.ico',
    '.jpeg',
    '.jpg',
    '.png',
    '.svg',
    '.tif',
    '.tiff',
    '.webp',
  ],
  office: ['.docx', '.xlsx', '.pptx'],
  pdf: ['.pdf'],
  text: ['.txt'],
  udf: ['.udf'],
  word: ['.doc', '.docx'],
  xml: ['.xml', '.ubl'],
}

const mapProfileDatabaseRecord = (
  profileRecord: ProfileDatabaseRecord,
): UserProfile => ({
  avatarUrl: profileRecord.avatar_url,
  email: profileRecord.email,
  firstName: profileRecord.first_name,
  id: profileRecord.auth0_user_id,
  lastName: profileRecord.last_name,
  phone: profileRecord.phone,
})

export const mapArchivedDocument = (
  documentRecord: DocumentDatabaseRecord,
): ArchivedDocument => ({
  createdAt: documentRecord.created_at,
  id: documentRecord.id,
  name: documentRecord.file_name,
  operation: documentRecord.operation,
  sizeBytes: documentRecord.file_size,
})

export const mapTimestampJob = (
  documentRecord: DocumentDatabaseRecord,
): TimestampJob => ({
  completedAt: documentRecord.completed_at,
  createdAt: documentRecord.created_at,
  creditCost: documentRecord.credit_cost,
  fileName: documentRecord.file_name,
  fileSize: documentRecord.file_size,
  id: documentRecord.id,
  mimeType: documentRecord.mime_type,
  status: documentRecord.status,
})

export const mapDraftFile = (
  draftFileRecord: DraftFileDatabaseRecord,
): DraftFile => ({
  createdAt: draftFileRecord.created_at,
  fileName: draftFileRecord.file_name,
  fileSize: draftFileRecord.file_size,
  id: draftFileRecord.id,
  intendedOperation: draftFileRecord.intended_operation,
  mimeType: draftFileRecord.mime_type,
  status: draftFileRecord.status,
})

export const ensureAuthenticatedUserProfile = async (
  database: D1Database,
  authenticatedUser: AuthenticatedUser,
) => {
  const profileCreationDate = new Date().toISOString()

  await database
    .prepare(
      `INSERT OR IGNORE INTO profiles (
        auth0_user_id,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        remaining_credits,
        storage_limit_bytes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, '', NULL, ?, ?, ?, ?)`,
    )
    .bind(
      authenticatedUser.userId,
      authenticatedUser.firstName.slice(0, 50),
      authenticatedUser.lastName.slice(0, 50),
      authenticatedUser.emailAddress.slice(0, 254),
      DEFAULT_REMAINING_CREDITS,
      DEFAULT_STORAGE_LIMIT_BYTES,
      profileCreationDate,
      profileCreationDate,
    )
    .run()
}

export const fetchUserProfile = async (
  database: D1Database,
  authenticatedUserId: string,
) => {
  const profileRecord = await database
    .prepare(
      `SELECT
        auth0_user_id,
        first_name,
        last_name,
        email,
        phone,
        avatar_url,
        remaining_credits,
        storage_limit_bytes
      FROM profiles
      WHERE auth0_user_id = ?`,
    )
    .bind(authenticatedUserId)
    .first<ProfileDatabaseRecord>()

  if (!profileRecord) {
    throw new WorkerApiError(
      404,
      'PROFILE_NOT_FOUND',
      'Kullanıcı profili bulunamadı.',
    )
  }

  return mapProfileDatabaseRecord(profileRecord)
}

export const updateUserProfile = async (
  database: D1Database,
  authenticatedUserId: string,
  profileUpdates: UpdateProfilePayload,
) => {
  await database
    .prepare(
      `UPDATE profiles
      SET first_name = ?, last_name = ?, phone = ?, updated_at = ?
      WHERE auth0_user_id = ?`,
    )
    .bind(
      profileUpdates.firstName,
      profileUpdates.lastName,
      profileUpdates.phone,
      new Date().toISOString(),
      authenticatedUserId,
    )
    .run()

  return fetchUserProfile(database, authenticatedUserId)
}

export const fetchDashboardSummary = async (
  database: D1Database,
  authenticatedUserId: string,
): Promise<DashboardSummary> => {
  const dashboardRecord = await database
    .prepare(
      `SELECT
        profiles.remaining_credits,
        profiles.storage_limit_bytes,
        (
          SELECT COUNT(*)
          FROM documents
          WHERE documents.auth0_user_id = profiles.auth0_user_id
            AND documents.operation = 'timestamp'
            AND documents.status = 'completed'
        ) AS timestamped_document_count,
        (
          SELECT COUNT(*)
          FROM documents
          WHERE documents.auth0_user_id = profiles.auth0_user_id
            AND documents.operation = 'signature'
            AND documents.status = 'completed'
        ) AS signed_document_count,
        (
          SELECT COALESCE(SUM(draft_files.file_size), 0)
          FROM draft_files
          WHERE draft_files.auth0_user_id = profiles.auth0_user_id
        ) + (
          SELECT COALESCE(SUM(documents.file_size), 0)
          FROM documents
          WHERE documents.auth0_user_id = profiles.auth0_user_id
            AND documents.draft_file_id IS NULL
        ) AS storage_used_bytes
      FROM profiles
      WHERE profiles.auth0_user_id = ?
      `,
    )
    .bind(authenticatedUserId)
    .first<DashboardDatabaseRecord>()

  if (!dashboardRecord) {
    throw new WorkerApiError(
      404,
      'DASHBOARD_NOT_FOUND',
      'Dashboard bilgileri bulunamadı.',
    )
  }

  return {
    remainingCredits: dashboardRecord.remaining_credits,
    storageLimitMb: Number(
      (dashboardRecord.storage_limit_bytes / BYTES_PER_MEGABYTE).toFixed(2),
    ),
    storageUsedMb: Number(
      (dashboardRecord.storage_used_bytes / BYTES_PER_MEGABYTE).toFixed(2),
    ),
    totalSignedDocuments: dashboardRecord.signed_document_count,
    totalTimestampedDocuments:
      dashboardRecord.timestamped_document_count,
  }
}

export const fetchRecentDocuments = async (
  database: D1Database,
  authenticatedUserId: string,
  documentLimit: number,
  documentOperation?: DocumentOperation,
) => {
  const recentDocumentsStatement = documentOperation
    ? database
        .prepare(
          `SELECT *
          FROM documents
          WHERE auth0_user_id = ? AND operation = ?
          ORDER BY created_at DESC
          LIMIT ?`,
        )
        .bind(authenticatedUserId, documentOperation, documentLimit)
    : database
        .prepare(
          `SELECT *
          FROM documents
          WHERE auth0_user_id = ?
          ORDER BY created_at DESC
          LIMIT ?`,
        )
        .bind(authenticatedUserId, documentLimit)
  const { results: documentRecords } =
    await recentDocumentsStatement.all<DocumentDatabaseRecord>()

  return documentRecords.map(mapArchivedDocument)
}

export const fetchDocumentHistory = async (
  database: D1Database,
  authenticatedUserId: string,
  documentHistoryRequest: DocumentHistoryRequest,
): Promise<DocumentHistoryResponse> => {
  const documentConditions = [
    'auth0_user_id = ?',
    "status = 'completed'",
  ]
  const conditionBindings: unknown[] = [authenticatedUserId]

  if (documentHistoryRequest.fileNameSearch) {
    documentConditions.push('INSTR(LOWER(file_name), LOWER(?)) > 0')
    conditionBindings.push(documentHistoryRequest.fileNameSearch)
  }

  if (documentHistoryRequest.createdFrom) {
    documentConditions.push('created_at >= ?')
    conditionBindings.push(documentHistoryRequest.createdFrom)
  }

  if (documentHistoryRequest.createdBefore) {
    documentConditions.push('created_at < ?')
    conditionBindings.push(documentHistoryRequest.createdBefore)
  }

  if (documentHistoryRequest.operation) {
    documentConditions.push('operation = ?')
    conditionBindings.push(documentHistoryRequest.operation)
  }

  if (documentHistoryRequest.fileType) {
    const fileTypeExtensions =
      documentFileTypeExtensions[documentHistoryRequest.fileType]
    const fileTypeConditions = fileTypeExtensions.map(
      () => 'LOWER(file_name) LIKE ?',
    )

    documentConditions.push(`(${fileTypeConditions.join(' OR ')})`)
    conditionBindings.push(
      ...fileTypeExtensions.map((fileExtension) => `%${fileExtension}`),
    )
  }

  const documentConditionsSql = documentConditions.join(' AND ')
  const documentOffset =
    (documentHistoryRequest.page - 1) * documentHistoryRequest.pageSize
  const documentCountStatement = database
    .prepare(
      `SELECT COUNT(*) AS total_count
      FROM documents
      WHERE ${documentConditionsSql}`,
    )
    .bind(...conditionBindings)
  const documentRecordsStatement = database
    .prepare(
      `SELECT *
      FROM documents
      WHERE ${documentConditionsSql}
      ORDER BY created_at DESC, id DESC
      LIMIT ? OFFSET ?`,
    )
    .bind(
      ...conditionBindings,
      documentHistoryRequest.pageSize,
      documentOffset,
    )
  const [documentCountRecord, documentRecordsResult] = await Promise.all([
    documentCountStatement.first<DocumentHistoryCountDatabaseRecord>(),
    documentRecordsStatement.all<DocumentDatabaseRecord>(),
  ])
  const totalDocumentCount = Number(documentCountRecord?.total_count ?? 0)

  return {
    items: documentRecordsResult.results.map(mapArchivedDocument),
    pagination: {
      currentPage: documentHistoryRequest.page,
      pageSize: documentHistoryRequest.pageSize,
      totalItems: totalDocumentCount,
      totalPages: Math.ceil(
        totalDocumentCount / documentHistoryRequest.pageSize,
      ),
    },
  }
}

export const fetchTimestampJobs = async (
  database: D1Database,
  authenticatedUserId: string,
) => {
  const { results: timestampDocumentRecords } = await database
    .prepare(
      `SELECT *
      FROM documents
      WHERE auth0_user_id = ? AND operation = 'timestamp'
      ORDER BY created_at DESC`,
    )
    .bind(authenticatedUserId)
    .all<DocumentDatabaseRecord>()

  return timestampDocumentRecords.map(mapTimestampJob)
}

interface UploadedDraftFileDetails {
  createdAt: string
  fileName: string
  fileSize: number
  intendedOperation: DocumentOperation
  mimeType: string
  objectKey: string
}

export const insertUploadedDraftFile = async (
  database: D1Database,
  authenticatedUserId: string,
  draftFileDetails: UploadedDraftFileDetails,
) => {
  const draftFileInsertResult = await database
    .prepare(
      `INSERT INTO draft_files (
        auth0_user_id,
        object_key,
        file_name,
        file_size,
        mime_type,
        intended_operation,
        status,
        created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'uploaded', ?)`,
    )
    .bind(
      authenticatedUserId,
      draftFileDetails.objectKey,
      draftFileDetails.fileName,
      draftFileDetails.fileSize,
      draftFileDetails.mimeType,
      draftFileDetails.intendedOperation,
      draftFileDetails.createdAt,
    )
    .run()

  const createdDraftFileRecord = {
    auth0_user_id: authenticatedUserId,
    created_at: draftFileDetails.createdAt,
    file_name: draftFileDetails.fileName,
    file_size: draftFileDetails.fileSize,
    id: draftFileInsertResult.meta.last_row_id,
    intended_operation: draftFileDetails.intendedOperation,
    mime_type: draftFileDetails.mimeType,
    object_key: draftFileDetails.objectKey,
    processed_at: null,
    status: 'uploaded',
  } satisfies DraftFileDatabaseRecord

  return mapDraftFile(createdDraftFileRecord)
}

export const fetchUploadedDraftFiles = async (
  database: D1Database,
  authenticatedUserId: string,
  intendedOperation: DocumentOperation,
) => {
  const { results: draftFileRecords } = await database
    .prepare(
      `SELECT *
      FROM draft_files
      WHERE auth0_user_id = ?
        AND intended_operation = ?
        AND status = 'uploaded'
      ORDER BY created_at DESC`,
    )
    .bind(authenticatedUserId, intendedOperation)
    .all<DraftFileDatabaseRecord>()

  return draftFileRecords.map(mapDraftFile)
}

export const fetchProcessableDraftFile = async (
  database: D1Database,
  authenticatedUserId: string,
  draftFileId: number,
  intendedOperation: DocumentOperation,
) => {
  const draftFileRecord = await database
    .prepare(
      `SELECT *
      FROM draft_files
      WHERE id = ?
        AND auth0_user_id = ?
        AND intended_operation = ?
        AND status = 'uploaded'`,
    )
    .bind(draftFileId, authenticatedUserId, intendedOperation)
    .first<DraftFileDatabaseRecord>()

  if (!draftFileRecord) {
    throw new WorkerApiError(
      409,
      'DRAFT_FILE_NOT_AVAILABLE',
      'Taslak dosya bulunamadı veya daha önce işlenmiş.',
    )
  }

  return draftFileRecord
}

export const deleteUploadedDraftFileRecord = async (
  database: D1Database,
  authenticatedUserId: string,
  draftFileId: number,
) => {
  const draftFileRecord = await database
    .prepare(
      `SELECT *
      FROM draft_files
      WHERE id = ?
        AND auth0_user_id = ?
        AND status = 'uploaded'`,
    )
    .bind(draftFileId, authenticatedUserId)
    .first<DraftFileDatabaseRecord>()

  if (!draftFileRecord) {
    throw new WorkerApiError(
      404,
      'DRAFT_FILE_NOT_FOUND',
      'Silinecek taslak dosya bulunamadı.',
    )
  }

  const draftFileDeleteResult = await database
    .prepare(
      `DELETE FROM draft_files
      WHERE id = ?
        AND auth0_user_id = ?
        AND status = 'uploaded'`,
    )
    .bind(draftFileId, authenticatedUserId)
    .run()

  if (draftFileDeleteResult.meta.changes !== 1) {
    throw new WorkerApiError(
      409,
      'DRAFT_FILE_DELETE_CONFLICT',
      'Taslak dosya durumu değiştiği için silinemedi.',
    )
  }

  return draftFileRecord
}

export const createCompletedDocumentFromDraft = async (
  database: D1Database,
  authenticatedUserId: string,
  draftFileRecord: DraftFileDatabaseRecord,
  creditCost: number,
) => {
  const transactionDate = new Date().toISOString()
  const [documentInsertResult, draftFileUpdateResult] = await database.batch([
    database
      .prepare(
        `INSERT INTO documents (
          auth0_user_id,
          draft_file_id,
          object_key,
          file_name,
          file_size,
          mime_type,
          operation,
          status,
          credit_cost,
          created_at,
          completed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?)`,
      )
      .bind(
        authenticatedUserId,
        draftFileRecord.id,
        draftFileRecord.object_key,
        draftFileRecord.file_name,
        draftFileRecord.file_size,
        draftFileRecord.mime_type,
        draftFileRecord.intended_operation,
        creditCost,
        transactionDate,
        transactionDate,
      ),
    database
      .prepare(
        `UPDATE draft_files
        SET status = 'processed', processed_at = ?
        WHERE id = ?
          AND auth0_user_id = ?
          AND status = 'uploaded'`,
      )
      .bind(transactionDate, draftFileRecord.id, authenticatedUserId),
  ])

  if (draftFileUpdateResult.meta.changes !== 1) {
    throw new WorkerApiError(
      409,
      'DRAFT_FILE_PROCESSING_CONFLICT',
      'Taslak dosya durumu değiştiği için işlem tamamlanamadı.',
    )
  }

  return {
    auth0_user_id: authenticatedUserId,
    completed_at: transactionDate,
    created_at: transactionDate,
    credit_cost: creditCost,
    draft_file_id: draftFileRecord.id,
    file_name: draftFileRecord.file_name,
    file_size: draftFileRecord.file_size,
    id: documentInsertResult.meta.last_row_id,
    mime_type: draftFileRecord.mime_type,
    object_key: draftFileRecord.object_key,
    operation: draftFileRecord.intended_operation,
    status: 'completed',
  } satisfies DocumentDatabaseRecord
}

export const fetchOwnedDocument = async (
  database: D1Database,
  authenticatedUserId: string,
  documentId: number,
) => {
  const ownedDocument = await database
    .prepare('SELECT * FROM documents WHERE id = ? AND auth0_user_id = ?')
    .bind(documentId, authenticatedUserId)
    .first<DocumentDatabaseRecord>()

  if (!ownedDocument) {
    throw new WorkerApiError(
      404,
      'DOCUMENT_NOT_FOUND',
      'İstenen belge bulunamadı.',
    )
  }

  return ownedDocument
}

export const deleteOwnedDocumentRecord = async (
  database: D1Database,
  authenticatedUserId: string,
  documentId: number,
) => {
  const ownedDocument = await fetchOwnedDocument(
    database,
    authenticatedUserId,
    documentId,
  )
  const documentDeletionStatements = [
    database
      .prepare('DELETE FROM documents WHERE id = ? AND auth0_user_id = ?')
      .bind(documentId, authenticatedUserId),
  ]

  if (ownedDocument.draft_file_id !== null) {
    documentDeletionStatements.push(
      database
        .prepare(
          `DELETE FROM draft_files
          WHERE id = ?
            AND auth0_user_id = ?
            AND status = 'processed'`,
        )
        .bind(ownedDocument.draft_file_id, authenticatedUserId),
    )
  }

  const [documentDeleteResult, linkedDraftFileDeleteResult] =
    await database.batch(documentDeletionStatements)

  if (documentDeleteResult.meta.changes !== 1) {
    throw new WorkerApiError(
      409,
      'DOCUMENT_DELETE_CONFLICT',
      'Belge durumu değiştiği için silinemedi.',
    )
  }

  if (
    ownedDocument.draft_file_id !== null &&
    linkedDraftFileDeleteResult?.meta.changes !== 1
  ) {
    console.error(
      JSON.stringify({
        documentId,
        draftFileId: ownedDocument.draft_file_id,
        message: 'Silinen belgeye bağlı işlenmiş taslak bulunamadı.',
      }),
    )
  }

  return ownedDocument
}
