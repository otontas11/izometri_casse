import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import { useDraftFilesStore } from '@/features/draft-files/stores/draftFiles.store'
import type { DraftFile } from '@/features/draft-files/types/draftFile.types'
import { translate } from '@/locales'
import type { ApiRequestStatus } from '@/types/api.types'

import { timestampApi } from '../api/timestamp.api'
import type {
  TimestampFileItem,
  TimestampJob,
} from '../types/timestamp.types'

type TimestampAction = 'deleting' | 'idle' | 'processing' | 'uploading'

const createSelectedTimestampFileItem = (
  selectedFile: File,
): TimestampFileItem => ({
  draftFileId: null,
  errorMessage: '',
  file: selectedFile,
  fileName: selectedFile.name,
  fileSize: selectedFile.size,
  id: crypto.randomUUID(),
  progressPercentage: 0,
  status: 'selected',
})

const createUploadedTimestampFileItem = (
  draftFile: DraftFile,
): TimestampFileItem => ({
  draftFileId: draftFile.id,
  errorMessage: '',
  file: null,
  fileName: draftFile.fileName,
  fileSize: draftFile.fileSize,
  id: `draft-${draftFile.id}`,
  progressPercentage: 100,
  status: 'uploaded',
})

export const useTimestampStore = defineStore('timestamp', () => {
  const dashboardStore = useDashboardStore()
  const draftFilesStore = useDraftFilesStore()
  const timestampJobs = ref<TimestampJob[]>([])
  const selectedTimestampFileItem = shallowRef<TimestampFileItem | null>(null)
  const timestampJobsLoadStatus = ref<ApiRequestStatus>('idle')
  const timestampAction = ref<TimestampAction>('idle')
  const timestampHistoryErrorMessage = ref('')
  const timestampActionErrorMessage = ref('')
  const timestampActionSuccessMessage = ref('')

  const isTimestampHistoryLoading = computed(
    () => timestampJobsLoadStatus.value === 'loading',
  )
  const isTimestampActionInProgress = computed(
    () => timestampAction.value !== 'idle',
  )
  const isTimestampSubmitting = computed(
    () => timestampAction.value === 'processing',
  )

  const selectNextUploadedTimestampFile = () => {
    const nextUploadedDraftFile =
      draftFilesStore.uploadedDraftFiles.timestamp[0]
    selectedTimestampFileItem.value = nextUploadedDraftFile
      ? createUploadedTimestampFileItem(nextUploadedDraftFile)
      : null
  }

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

  const loadUploadedTimestampFile = async () => {
    if (selectedTimestampFileItem.value) {
      return
    }

    try {
      await draftFilesStore.fetchUploadedDraftFiles('timestamp')

      if (!selectedTimestampFileItem.value) {
        selectNextUploadedTimestampFile()
      }
    } catch (requestError) {
      timestampActionErrorMessage.value = getApiErrorMessage(requestError)
    }
  }

  const selectTimestampFile = (timestampFile: File) => {
    if (isTimestampActionInProgress.value) {
      return
    }

    selectedTimestampFileItem.value =
      createSelectedTimestampFileItem(timestampFile)
    timestampActionErrorMessage.value = ''
    timestampActionSuccessMessage.value = ''
  }

  const removeSelectedTimestampFile = async () => {
    const selectedFileItem = selectedTimestampFileItem.value

    if (!selectedFileItem || isTimestampActionInProgress.value) {
      return false
    }

    if (selectedFileItem.draftFileId === null) {
      selectedTimestampFileItem.value = null
      timestampActionErrorMessage.value = ''
      timestampActionSuccessMessage.value = ''
      return true
    }

    timestampAction.value = 'deleting'
    selectedTimestampFileItem.value = {
      ...selectedFileItem,
      errorMessage: '',
      status: 'deleting',
    }

    try {
      await draftFilesStore.deleteDraftFile(
        selectedFileItem.draftFileId,
        'timestamp',
      )
      selectNextUploadedTimestampFile()
      timestampActionSuccessMessage.value = translate(
        'timestamp.feedback.draftDeleted',
      )
      timestampActionErrorMessage.value = ''
      await dashboardStore.fetchDashboardData()
      return true
    } catch (requestError) {
      const deletionErrorMessage = getApiErrorMessage(requestError)
      selectedTimestampFileItem.value = {
        ...selectedFileItem,
        errorMessage: deletionErrorMessage,
        status: 'uploaded',
      }
      timestampActionErrorMessage.value = deletionErrorMessage
      return false
    } finally {
      timestampAction.value = 'idle'
    }
  }

  const uploadSelectedTimestampFile = async () => {
    const selectedFileItem = selectedTimestampFileItem.value

    if (
      !selectedFileItem?.file ||
      !['selected', 'upload-error'].includes(selectedFileItem.status) ||
      isTimestampActionInProgress.value
    ) {
      timestampActionErrorMessage.value = translate(
        'timestamp.feedback.selectFileToUpload',
      )
      return false
    }

    timestampAction.value = 'uploading'
    timestampActionErrorMessage.value = ''
    timestampActionSuccessMessage.value = ''
    selectedTimestampFileItem.value = {
      ...selectedFileItem,
      errorMessage: '',
      progressPercentage: 0,
      status: 'uploading',
    }

    try {
      const uploadedDraftFile = await draftFilesStore.uploadDraftFile(
        selectedFileItem.file,
        'timestamp',
        (progressPercentage) => {
          if (!selectedTimestampFileItem.value) {
            return
          }

          selectedTimestampFileItem.value = {
            ...selectedTimestampFileItem.value,
            progressPercentage,
          }
        },
      )

      selectedTimestampFileItem.value =
        createUploadedTimestampFileItem(uploadedDraftFile)
      timestampActionSuccessMessage.value = translate(
        'timestamp.feedback.uploadSuccess',
        { fileName: uploadedDraftFile.fileName },
      )
      await dashboardStore.fetchDashboardData()
      return true
    } catch (requestError) {
      const uploadErrorMessage = getApiErrorMessage(requestError)
      selectedTimestampFileItem.value = {
        ...selectedFileItem,
        errorMessage: uploadErrorMessage,
        status: 'upload-error',
      }
      timestampActionErrorMessage.value = uploadErrorMessage
      return false
    } finally {
      timestampAction.value = 'idle'
    }
  }

  const reportInsufficientTimestampCredits = () => {
    if (isTimestampActionInProgress.value) {
      return
    }

    timestampActionErrorMessage.value = translate('errors.insufficientCredits')
    timestampActionSuccessMessage.value = ''
  }

  const submitSelectedTimestampDraft = async () => {
    const selectedFileItem = selectedTimestampFileItem.value

    if (
      !selectedFileItem?.draftFileId ||
      !['uploaded', 'process-error'].includes(selectedFileItem.status) ||
      isTimestampActionInProgress.value
    ) {
      timestampActionErrorMessage.value = translate(
        'timestamp.feedback.uploadFileBeforeTimestamping',
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

    timestampAction.value = 'processing'
    timestampActionErrorMessage.value = ''
    timestampActionSuccessMessage.value = ''
    selectedTimestampFileItem.value = {
      ...selectedFileItem,
      errorMessage: '',
      status: 'processing',
    }

    try {
      const timestampTransaction =
        await timestampApi.createTimestampTransaction(
          selectedFileItem.draftFileId,
        )

      dashboardStore.synchronizeDashboardData(
        timestampTransaction.dashboardSummary,
        timestampTransaction.recentDocuments,
      )
      timestampJobs.value.unshift(timestampTransaction.timestampJob)
      timestampHistoryErrorMessage.value = ''
      timestampJobsLoadStatus.value = 'success'
      draftFilesStore.removeProcessedDraftFile(
        selectedFileItem.draftFileId,
        'timestamp',
      )
      selectNextUploadedTimestampFile()
      timestampActionSuccessMessage.value = translate(
        'timestamp.feedback.success',
        { fileName: timestampTransaction.timestampJob.fileName },
      )
      return true
    } catch (requestError) {
      const processingErrorMessage = getApiErrorMessage(requestError)
      selectedTimestampFileItem.value = {
        ...selectedFileItem,
        errorMessage: processingErrorMessage,
        status: 'process-error',
      }
      timestampActionErrorMessage.value = processingErrorMessage
      return false
    } finally {
      timestampAction.value = 'idle'
    }
  }

  const clearTimestampActionFeedback = () => {
    timestampActionErrorMessage.value = ''
    timestampActionSuccessMessage.value = ''
  }

  return {
    clearTimestampActionFeedback,
    fetchTimestampJobs,
    isTimestampActionInProgress,
    isTimestampHistoryLoading,
    isTimestampSubmitting,
    loadUploadedTimestampFile,
    removeSelectedTimestampFile,
    reportInsufficientTimestampCredits,
    selectedTimestampFileItem,
    selectTimestampFile,
    submitSelectedTimestampDraft,
    timestampActionErrorMessage,
    timestampActionSuccessMessage,
    timestampHistoryErrorMessage,
    timestampJobs,
    timestampJobsLoadStatus,
    uploadSelectedTimestampFile,
  }
})
