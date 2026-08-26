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

  return {
    clearDashboardError,
    dashboardErrorMessage,
    dashboardRequestStatus,
    dashboardSummary,
    fetchDashboardData,
    isDashboardLoading,
    isDashboardReady,
    recentDocuments,
  }
})
