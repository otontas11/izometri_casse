import { axiosInstance } from '@/api/axiosInstance'

import type { ArchivedDocument, ArchivedDocumentDeletionResponse, DashboardSummary } from '../types/dashboard.types'

const fetchDashboardSummary = async () => {
  const { data: dashboardSummary } = await axiosInstance.get<DashboardSummary>('/dashboard')

  return dashboardSummary
}

const fetchRecentDocuments = async (documentLimit = 5) => {
  const { data: recentDocuments } = await axiosInstance.get<ArchivedDocument[]>('/documents', {
    params: {
      _limit: documentLimit,
      _order: 'desc',
      _sort: 'createdAt',
    },
  })

  return recentDocuments
}

const fetchArchivedDocumentContent = async (documentId: number) => {
  const { data: documentContent } = await axiosInstance.get<Blob>(`/documents/${documentId}/download`, {
    responseType: 'blob',
    timeout: 60_000,
  })

  return documentContent
}

const deleteArchivedDocument = async (documentId: number) => {
  const { data: archivedDocumentDeletionResponse } = await axiosInstance.delete<ArchivedDocumentDeletionResponse>(
    `/documents/${documentId}`
  )

  return archivedDocumentDeletionResponse
}

export const dashboardApi = {
  deleteArchivedDocument,
  fetchArchivedDocumentContent,
  fetchDashboardSummary,
  fetchRecentDocuments,
}
