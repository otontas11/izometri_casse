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

export type CreateTimestampJobPayload = Omit<TimestampJob, 'id'>
