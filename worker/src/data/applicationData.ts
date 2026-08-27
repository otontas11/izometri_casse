import { WorkerApiError } from '../http/apiResponse'
import type {
  ArchivedDocument,
  AuthenticatedUser,
  DashboardDatabaseRecord,
  DashboardSummary,
  DocumentDatabaseRecord,
  ProfileDatabaseRecord,
  TimestampJob,
  UpdateProfilePayload,
  UserProfile,
} from '../types'

const BYTES_PER_MEGABYTE = 1024 * 1024
const DEFAULT_REMAINING_CREDITS = 20
const DEFAULT_STORAGE_LIMIT_BYTES = 1024 * BYTES_PER_MEGABYTE

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

const mapArchivedDocument = (
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
        COUNT(documents.id) AS archived_document_count,
        COALESCE(SUM(documents.file_size), 0) AS storage_used_bytes,
        COALESCE(
          SUM(CASE WHEN documents.operation = 'signature' THEN 1 ELSE 0 END),
          0
        ) AS signed_document_count
      FROM profiles
      LEFT JOIN documents
        ON documents.auth0_user_id = profiles.auth0_user_id
      WHERE profiles.auth0_user_id = ?
      GROUP BY
        profiles.auth0_user_id,
        profiles.remaining_credits,
        profiles.storage_limit_bytes`,
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
    archivedDocumentCount: dashboardRecord.archived_document_count,
    remainingCredits: dashboardRecord.remaining_credits,
    storageLimitMb: Number(
      (dashboardRecord.storage_limit_bytes / BYTES_PER_MEGABYTE).toFixed(2),
    ),
    storageUsedMb: Number(
      (dashboardRecord.storage_used_bytes / BYTES_PER_MEGABYTE).toFixed(2),
    ),
    totalSignedDocuments: dashboardRecord.signed_document_count,
  }
}

export const fetchRecentDocuments = async (
  database: D1Database,
  authenticatedUserId: string,
  documentLimit: number,
) => {
  const { results: documentRecords } = await database
    .prepare(
      `SELECT *
      FROM documents
      WHERE auth0_user_id = ?
      ORDER BY created_at DESC
      LIMIT ?`,
    )
    .bind(authenticatedUserId, documentLimit)
    .all<DocumentDatabaseRecord>()

  return documentRecords.map(mapArchivedDocument)
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

export const insertTimestampDocument = async (
  database: D1Database,
  authenticatedUserId: string,
  timestampDocumentDetails: {
    completedAt: string
    createdAt: string
    creditCost: number
    fileName: string
    fileSize: number
    mimeType: string
    objectKey: string
  },
) => {
  const documentInsertResult = await database
    .prepare(
      `INSERT INTO documents (
        auth0_user_id,
        object_key,
        file_name,
        file_size,
        mime_type,
        operation,
        status,
        credit_cost,
        created_at,
        completed_at
      ) VALUES (?, ?, ?, ?, ?, 'timestamp', 'completed', ?, ?, ?)`,
    )
    .bind(
      authenticatedUserId,
      timestampDocumentDetails.objectKey,
      timestampDocumentDetails.fileName,
      timestampDocumentDetails.fileSize,
      timestampDocumentDetails.mimeType,
      timestampDocumentDetails.creditCost,
      timestampDocumentDetails.createdAt,
      timestampDocumentDetails.completedAt,
    )
    .run()

  return {
    auth0_user_id: authenticatedUserId,
    completed_at: timestampDocumentDetails.completedAt,
    created_at: timestampDocumentDetails.createdAt,
    credit_cost: timestampDocumentDetails.creditCost,
    file_name: timestampDocumentDetails.fileName,
    file_size: timestampDocumentDetails.fileSize,
    id: documentInsertResult.meta.last_row_id,
    mime_type: timestampDocumentDetails.mimeType,
    object_key: timestampDocumentDetails.objectKey,
    operation: 'timestamp',
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
