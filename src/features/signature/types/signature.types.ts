import type {
  ArchivedDocument,
  DashboardSummary,
} from '@/features/dashboard/types/dashboard.types'

export interface SignatureTransactionResponse {
  dashboardSummary: DashboardSummary
  recentDocuments: ArchivedDocument[]
  signedDocument: ArchivedDocument
}

export type SignatureFileStatus =
  | 'selected'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'upload-error'
  | 'process-error'
  | 'deleting'

export interface SignatureFileItem {
  draftFileId: number | null
  errorMessage: string
  file: File | null
  fileName: string
  fileSize: number
  id: string
  progressPercentage: number
  status: SignatureFileStatus
}
