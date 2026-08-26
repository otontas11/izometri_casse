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

  const isDashboardLoading = computed(
    () => dashboardRequestStatus.value === 'loading',
  )
  const isDashboardReady = computed(
    () => dashboardRequestStatus.value === 'success',
  )

  const fetchDashboardData = async () => {
    if (isDashboardLoading.value) {
      return
    }

    dashboardRequestStatus.value = 'loading'
    dashboardErrorMessage.value = ''

    try {
      const [dashboardSummaryResponse, recentDocumentsResponse] = await Promise.all([
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

  const clearDashboardError = () => {
    dashboardErrorMessage.value = ''
  }

  const downloadArchivedDocument = async (documentId: number) => {
    if (downloadingDocumentId.value !== null) {
      return null
    }

    downloadingDocumentId.value = documentId
    documentDownloadErrorMessage.value = ''

    try {
      return await dashboardApi.downloadArchivedDocument(documentId)
    } catch (requestError) {
      documentDownloadErrorMessage.value = getApiErrorMessage(requestError)
      return null
    } finally {
      downloadingDocumentId.value = null
    }
  }

  const synchronizeDashboardAfterTimestamp = (
    updatedDashboardSummary: DashboardSummary,
    updatedRecentDocuments: ArchivedDocument[],
  ) => {
    dashboardSummary.value = updatedDashboardSummary
    recentDocuments.value = updatedRecentDocuments
    dashboardRequestStatus.value = 'success'
    dashboardErrorMessage.value = ''
  }

  return {
    clearDashboardError,
    dashboardErrorMessage,
    dashboardRequestStatus,
    dashboardSummary,
    documentDownloadErrorMessage,
    downloadArchivedDocument,
    downloadingDocumentId,
    fetchDashboardData,
    isDashboardLoading,
    isDashboardReady,
    recentDocuments,
    synchronizeDashboardAfterTimestamp,
  }
})
