export interface DashboardSummary {
  totalSignedDocuments: number
  archivedDocumentCount: number
  remainingCredits: number
  storageUsedMb: number
  storageLimitMb: number
}

export type DocumentOperation = 'signature' | 'timestamp'

export interface ArchivedDocument {
  id: number
  name: string
  createdAt: string
  operation: DocumentOperation
  sizeBytes: number
}
