import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import type { ApiRequestStatus } from '@/types/api.types'

import { timestampApi } from '../api/timestamp.api'
import type { TimestampJob } from '../types/timestamp.types'

export const useTimestampStore = defineStore('timestamp', () => {
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

  const submitSelectedTimestampFile = async () => {
    if (isTimestampSubmitting.value) {
      return false
    }

    if (!selectedTimestampFile.value) {
      timestampSubmissionStatus.value = 'error'
      timestampSubmissionErrorMessage.value =
        'Zaman damgalama işlemine devam etmek için bir dosya seçin.'

      return false
    }

    timestampSubmissionStatus.value = 'loading'
    timestampSubmissionErrorMessage.value = ''
    timestampSubmissionSuccessMessage.value = ''

    const submittedTimestampFile = selectedTimestampFile.value
    const timestampSubmissionDate = new Date().toISOString()

    try {
      const createdTimestampJob = await timestampApi.createTimestampJob({
        completedAt: timestampSubmissionDate,
        createdAt: timestampSubmissionDate,
        creditCost: 1,
        fileName: submittedTimestampFile.name,
        fileSize: submittedTimestampFile.size,
        mimeType:
          submittedTimestampFile.type || 'application/octet-stream',
        status: 'completed',
      })

      timestampJobs.value.unshift(createdTimestampJob)
      selectedTimestampFile.value = null
      timestampSubmissionStatus.value = 'success'
      timestampSubmissionSuccessMessage.value =
        `${createdTimestampJob.fileName} başarıyla zaman damgalandı.`

      return true
    } catch (requestError) {
      timestampSubmissionStatus.value = 'error'
      timestampSubmissionErrorMessage.value = getApiErrorMessage(requestError)

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
    selectedTimestampFile,
    selectTimestampFile,
    submitSelectedTimestampFile,
    timestampHistoryErrorMessage,
    timestampJobs,
    timestampJobsLoadStatus,
    timestampSubmissionErrorMessage,
    timestampSubmissionStatus,
    timestampSubmissionSuccessMessage,
  }
})
