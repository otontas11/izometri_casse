import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import type { ApiRequestStatus } from '@/types/api.types'

import { dashboardApi } from '../api/dashboard.api'
import type {
  ArchivedDocument,
  DashboardSummary,
} from '../types/dashboard.types'

export const useDashboardStore = defineStore('dashboard', () => {
  const dashboardSummary = ref<DashboardSummary | null>(null)
  const recentDocuments = ref<ArchivedDocument[]>([])
  const dashboardRequestStatus = ref<ApiRequestStatus>('idle')
  const dashboardErrorMessage = ref('')
  const downloadingDocumentId = ref<number | null>(null)
  const documentDownloadErrorMessage = ref('')
  const previewingDocumentId = ref<number | null>(null)
  const documentPreviewErrorMessage = ref('')
  const deletingDocumentId = ref<number | null>(null)
  const documentDeleteErrorMessage = ref('')

  const isDashboardLoading = computed(
    () => dashboardRequestStatus.value === 'loading',
  )

  const fetchDashboardData = async () => {
    if (isDashboardLoading.value) {
      return
    }

    dashboardRequestStatus.value = 'loading'
    dashboardErrorMessage.value = ''

    try {
      const [dashboardSummaryResponse, recentDocumentsResponse] =
        await Promise.all([
          dashboardApi.fetchDashboardSummary(),
          dashboardApi.fetchRecentDocuments(),
        ])

      dashboardSummary.value = dashboardSummaryResponse
      recentDocuments.value = recentDocumentsResponse
      dashboardRequestStatus.value = 'success'
    } catch (requestError) {
      dashboardRequestStatus.value = 'error'
      dashboardErrorMessage.value = getApiErrorMessage(requestError)
    }
  }

  const downloadArchivedDocument = async (documentId: number) => {
    if (downloadingDocumentId.value !== null) {
      return null
    }

    downloadingDocumentId.value = documentId
    documentDownloadErrorMessage.value = ''

    try {
      return await dashboardApi.fetchArchivedDocumentContent(documentId)
    } catch (requestError) {
      documentDownloadErrorMessage.value = getApiErrorMessage(requestError)
      return null
    } finally {
      downloadingDocumentId.value = null
    }
  }

  const previewArchivedDocument = async (documentId: number) => {
    if (previewingDocumentId.value !== null) {
      return null
    }

    previewingDocumentId.value = documentId
    documentPreviewErrorMessage.value = ''

    try {
      return await dashboardApi.fetchArchivedDocumentContent(documentId)
    } catch (requestError) {
      documentPreviewErrorMessage.value = getApiErrorMessage(requestError)
      return null
    } finally {
      previewingDocumentId.value = null
    }
  }

  const synchronizeDashboardData = (
    updatedDashboardSummary: DashboardSummary,
    updatedRecentDocuments: ArchivedDocument[],
  ) => {
    dashboardSummary.value = updatedDashboardSummary
    recentDocuments.value = updatedRecentDocuments
    dashboardRequestStatus.value = 'success'
    dashboardErrorMessage.value = ''
  }

  const deleteArchivedDocument = async (documentId: number) => {
    if (deletingDocumentId.value !== null) {
      return false
    }

    deletingDocumentId.value = documentId
    documentDeleteErrorMessage.value = ''

    try {
      const archivedDocumentDeletionResponse =
        await dashboardApi.deleteArchivedDocument(documentId)

      synchronizeDashboardData(
        archivedDocumentDeletionResponse.dashboardSummary,
        archivedDocumentDeletionResponse.recentDocuments,
      )
      return true
    } catch (requestError) {
      documentDeleteErrorMessage.value = getApiErrorMessage(requestError)
      return false
    } finally {
      deletingDocumentId.value = null
    }
  }

  return {
    dashboardErrorMessage,
    dashboardRequestStatus,
    dashboardSummary,
    deleteArchivedDocument,
    deletingDocumentId,
    documentDeleteErrorMessage,
    documentDownloadErrorMessage,
    documentPreviewErrorMessage,
    downloadArchivedDocument,
    downloadingDocumentId,
    fetchDashboardData,
    isDashboardLoading,
    previewArchivedDocument,
    previewingDocumentId,
    recentDocuments,
    synchronizeDashboardData,
  }
})
