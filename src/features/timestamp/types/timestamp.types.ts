import type {
  ArchivedDocument,
  DashboardSummary,
} from '@/features/dashboard/types/dashboard.types'

export type TimestampJobStatus = 'completed' | 'failed' | 'processing'

export interface TimestampJob {
  id: number
  fileName: string
  fileSize: number
  mimeType: string
  status: TimestampJobStatus
  creditCost: number
  createdAt: string
  completedAt: string | null
}

export interface TimestampTransactionResponse {
  dashboardSummary: DashboardSummary
  recentDocuments: ArchivedDocument[]
  timestampJob: TimestampJob
}

export type TimestampFileStatus =
  | 'selected'
  | 'uploading'
  | 'uploaded'
  | 'processing'
  | 'upload-error'
  | 'process-error'
  | 'deleting'

export interface TimestampFileItem {
  draftFileId: number | null
  errorMessage: string
  file: File | null
  fileName: string
  fileSize: number
  id: string
  progressPercentage: number
  status: TimestampFileStatus
}
