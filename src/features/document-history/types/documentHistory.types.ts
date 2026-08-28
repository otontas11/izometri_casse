import type { ArchivedDocument, DocumentOperation } from '@/features/dashboard/types/dashboard.types'

export const documentFileTypeFilters = ['pdf', 'xml', 'word', 'excel', 'eyp', 'udf', 'office', 'text', 'image'] as const

export type DocumentFileTypeFilter = (typeof documentFileTypeFilters)[number]

export interface DocumentHistoryFilters {
  fileNameSearch: string
  fileTypes: DocumentFileTypeFilter[]
  operations: DocumentOperation[]
  selectedDate: string
}

export interface DocumentHistoryRequest extends DocumentHistoryFilters {
  page: number
  pageSize: number
}

export interface DocumentHistoryPagination {
  currentPage: number
  pageSize: number
  totalItems: number
  totalPages: number
}

export interface DocumentHistoryResponse {
  items: ArchivedDocument[]
  pagination: DocumentHistoryPagination
}
