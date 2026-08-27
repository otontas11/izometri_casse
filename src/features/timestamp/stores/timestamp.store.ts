import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage, toApiRequestError } from '@/api/apiError'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import { translate } from '@/locales'
import type { ApiRequestStatus } from '@/types/api.types'

import { timestampApi } from '../api/timestamp.api'
import type { TimestampJob } from '../types/timestamp.types'

const getTimestampSubmissionErrorMessage = (requestError: unknown) => {
  const normalizedApiError = toApiRequestError(requestError)

  if (normalizedApiError.statusCode === 404) {
    return translate('timestamp.feedback.endpointMissing')
  }

  return getApiErrorMessage(normalizedApiError)
}

export const useTimestampStore = defineStore('timestamp', () => {
  const dashboardStore = useDashboardStore()
  const timestampJobs = ref<TimestampJob[]>([])
  const selectedTimestampFile = shallowRef<File | null>(null)
  const timestampJobsLoadStatus = ref<ApiRequestStatus>('idle')
  const timestampSubmissionStatus = ref<ApiRequestStatus>('idle')
  const timestampHistoryErrorMessage = ref('')
  const timestampSubmissionErrorMessage = ref('')
  const timestampSubmissionSuccessMessage = ref('')

  const isTimestampHistoryLoading = computed(
    () => timestampJobsLoadStatus.value === 'loading',
  )
  const isTimestampSubmitting = computed(
    () => timestampSubmissionStatus.value === 'loading',
  )

  const fetchTimestampJobs = async () => {
    if (isTimestampHistoryLoading.value) {
      return
    }

    timestampJobsLoadStatus.value = 'loading'
    timestampHistoryErrorMessage.value = ''

    try {
      timestampJobs.value = await timestampApi.fetchTimestampJobs()
      timestampJobsLoadStatus.value = 'success'
    } catch (requestError) {
      timestampJobsLoadStatus.value = 'error'
      timestampHistoryErrorMessage.value = getApiErrorMessage(requestError)
    }
  }

  const selectTimestampFile = (timestampFile: File | null) => {
    selectedTimestampFile.value = timestampFile
    timestampSubmissionStatus.value = 'idle'
    timestampSubmissionErrorMessage.value = ''
    timestampSubmissionSuccessMessage.value = ''
  }

  const reportInsufficientTimestampCredits = () => {
    if (isTimestampSubmitting.value) {
      return
    }

    timestampSubmissionStatus.value = 'error'
    timestampSubmissionErrorMessage.value = translate(
      'timestamp.feedback.insufficientCredits',
    )
    timestampSubmissionSuccessMessage.value = ''
  }

  const submitSelectedTimestampFile = async () => {
    if (isTimestampSubmitting.value) {
      return false
    }

    if (!selectedTimestampFile.value) {
      timestampSubmissionStatus.value = 'error'
      timestampSubmissionErrorMessage.value = translate(
        'timestamp.feedback.selectFile',
      )

      return false
    }

    if (
      dashboardStore.dashboardSummary &&
      dashboardStore.dashboardSummary.remainingCredits < 1
    ) {
      reportInsufficientTimestampCredits()
      return false
    }

    timestampSubmissionStatus.value = 'loading'
    timestampSubmissionErrorMessage.value = ''
    timestampSubmissionSuccessMessage.value = ''

    const submittedTimestampFile = selectedTimestampFile.value

    try {
      const timestampTransaction =
        await timestampApi.createTimestampTransaction(submittedTimestampFile)

      dashboardStore.synchronizeDashboardData(
        timestampTransaction.dashboardSummary,
        timestampTransaction.recentDocuments,
      )
      timestampJobs.value.unshift(timestampTransaction.timestampJob)
      timestampHistoryErrorMessage.value = ''
      timestampJobsLoadStatus.value = 'success'
      selectedTimestampFile.value = null
      timestampSubmissionStatus.value = 'success'
      timestampSubmissionSuccessMessage.value = translate(
        'timestamp.feedback.success',
        { fileName: timestampTransaction.timestampJob.fileName },
      )

      return true
    } catch (requestError) {
      timestampSubmissionStatus.value = 'error'
      timestampSubmissionErrorMessage.value =
        getTimestampSubmissionErrorMessage(requestError)

      return false
    }
  }

  const clearTimestampSubmissionFeedback = () => {
    timestampSubmissionErrorMessage.value = ''
    timestampSubmissionSuccessMessage.value = ''

    if (timestampSubmissionStatus.value !== 'loading') {
      timestampSubmissionStatus.value = 'idle'
    }
  }

  return {
    clearTimestampSubmissionFeedback,
    fetchTimestampJobs,
    isTimestampHistoryLoading,
    isTimestampSubmitting,
    reportInsufficientTimestampCredits,
    selectedTimestampFile,
    selectTimestampFile,
    submitSelectedTimestampFile,
    timestampHistoryErrorMessage,
    timestampJobs,
    timestampJobsLoadStatus,
    timestampSubmissionErrorMessage,
    timestampSubmissionSuccessMessage,
  }
})
