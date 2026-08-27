import type {
  ArchivedDocument,
  DashboardSummary,
} from '@/features/dashboard/types/dashboard.types'

export interface SignatureTransactionResponse {
  dashboardSummary: DashboardSummary
  recentDocuments: ArchivedDocument[]
  signedDocument: ArchivedDocument
}

export type SignatureFileUploadStatus =
  | 'pending'
  | 'uploading'
  | 'completed'
  | 'error'

export interface SignatureFileItem {
  errorMessage: string
  file: File
  id: string
  progressPercentage: number
  status: SignatureFileUploadStatus
}
