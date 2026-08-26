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

export interface CreateTimestampTransactionPayload {
  fileName: string
  fileSize: number
  mimeType: string
}

export interface TimestampTransactionResponse {
  dashboardSummary: DashboardSummary
  recentDocuments: ArchivedDocument[]
  timestampJob: TimestampJob
}
