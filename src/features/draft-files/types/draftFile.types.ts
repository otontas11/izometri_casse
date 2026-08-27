export type DraftFileOperation = 'signature' | 'timestamp'
export type DraftFileStatus = 'processed' | 'uploaded'

export interface DraftFile {
  createdAt: string
  fileName: string
  fileSize: number
  id: number
  intendedOperation: DraftFileOperation
  mimeType: string
  status: DraftFileStatus
}

export type DraftFileUploadProgressHandler = (
  progressPercentage: number,
) => void
