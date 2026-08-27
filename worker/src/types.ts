export interface AuthenticatedUser {
  emailAddress: string
  firstName: string
  lastName: string
  userId: string
}

export interface UserProfile {
  avatarUrl: string | null
  email: string
  firstName: string
  id: string
  lastName: string
  phone: string
}

export interface UpdateProfilePayload {
  firstName: string
  lastName: string
  phone: string
}

export interface DashboardSummary {
  remainingCredits: number
  storageLimitMb: number
  storageUsedMb: number
  totalSignedDocuments: number
  totalTimestampedDocuments: number
}

export type DocumentOperation = 'signature' | 'timestamp'
type DocumentStatus = 'completed' | 'failed' | 'processing'
export type DraftFileStatus = 'processed' | 'uploaded'

export interface DraftFile {
  createdAt: string
  fileName: string
  fileSize: number
  id: number
  intendedOperation: DocumentOperation
  mimeType: string
  status: DraftFileStatus
}

export interface ArchivedDocument {
  createdAt: string
  id: number
  name: string
  operation: DocumentOperation
  sizeBytes: number
}

export interface TimestampJob {
  completedAt: string | null
  createdAt: string
  creditCost: number
  fileName: string
  fileSize: number
  id: number
  mimeType: string
  status: DocumentStatus
}

export interface TimestampTransactionResponse {
  dashboardSummary: DashboardSummary
  recentDocuments: ArchivedDocument[]
  timestampJob: TimestampJob
}

export interface SignatureTransactionResponse {
  dashboardSummary: DashboardSummary
  recentDocuments: ArchivedDocument[]
  signedDocument: ArchivedDocument
}

export interface ProfileDatabaseRecord {
  auth0_user_id: string
  avatar_url: string | null
  email: string
  first_name: string
  last_name: string
  phone: string
  remaining_credits: number
  storage_limit_bytes: number
}

export interface DocumentDatabaseRecord {
  auth0_user_id: string
  completed_at: string | null
  created_at: string
  credit_cost: number
  draft_file_id: number | null
  file_name: string
  file_size: number
  id: number
  mime_type: string
  object_key: string
  operation: DocumentOperation
  status: DocumentStatus
}

export interface DraftFileDatabaseRecord {
  auth0_user_id: string
  created_at: string
  file_name: string
  file_size: number
  id: number
  intended_operation: DocumentOperation
  mime_type: string
  object_key: string
  processed_at: string | null
  status: DraftFileStatus
}

export interface DashboardDatabaseRecord {
  remaining_credits: number
  signed_document_count: number
  storage_limit_bytes: number
  storage_used_bytes: number
  timestamped_document_count: number
}
