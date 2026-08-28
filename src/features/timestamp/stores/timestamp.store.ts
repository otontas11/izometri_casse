import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import { useDraftFilesStore } from '@/features/draft-files/stores/draftFiles.store'
import type { DraftFile } from '@/features/draft-files/types/draftFile.types'
import { validateDraftFile } from '@/features/draft-files/utils/draftFileValidation'
import { translate } from '@/locales'
import type { ApiRequestStatus } from '@/types/api.types'

import { timestampApi } from '../api/timestamp.api'
import type {
  TimestampFileItem,
  TimestampJob,
} from '../types/timestamp.types'

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
  const timestampFiles = shallowRef<TimestampFileItem[]>([])
  const timestampJobs = shallowRef<TimestampJob[]>([])
  const timestampFileValidationErrorMessage = ref('')
  const timestampActionStatus = ref<ApiRequestStatus>('idle')
  const timestampActionErrorMessage = ref('')
  const timestampActionSuccessMessage = ref('')
  const timestampJobsLoadStatus = ref<ApiRequestStatus>('idle')
  const timestampHistoryErrorMessage = ref('')

  const isTimestampActionInProgress = computed(
    () => timestampActionStatus.value === 'loading',
  )
  const isTimestampHistoryLoading = computed(
    () => timestampJobsLoadStatus.value === 'loading',
  )
  const canProcessTimestampFiles = computed(() =>
    timestampFiles.value.some(
      ({ status }) => status === 'uploaded' || status === 'process-error',
    ),
  )

  const clearTimestampActionFeedback = () => {
    timestampActionStatus.value = 'idle'
    timestampActionErrorMessage.value = ''
    timestampActionSuccessMessage.value = ''
  }

  const updateTimestampFileItem = (
    timestampFileId: string,
    updatedFields: Partial<TimestampFileItem>,
  ) => {
    timestampFiles.value = timestampFiles.value.map((timestampFileItem) =>
      timestampFileItem.id === timestampFileId
        ? { ...timestampFileItem, ...updatedFields }
        : timestampFileItem,
    )
  }

  const addRecentTimestampJob = (timestampJob: TimestampJob) => {
    timestampJobs.value = [
      timestampJob,
      ...timestampJobs.value.filter(({ id }) => id !== timestampJob.id),
    ]
    timestampJobsLoadStatus.value = 'success'
    timestampHistoryErrorMessage.value = ''
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

  const loadUploadedTimestampFiles = async () => {
    try {
      const uploadedDraftFiles =
        await draftFilesStore.fetchUploadedDraftFiles('timestamp')
      const existingDraftFileIds = new Set(
        timestampFiles.value
          .map(({ draftFileId }) => draftFileId)
          .filter((draftFileId): draftFileId is number => draftFileId !== null),
      )
      const restoredTimestampFiles = uploadedDraftFiles
        .filter(({ id }) => !existingDraftFileIds.has(id))
        .map(createUploadedTimestampFileItem)

      timestampFiles.value = [
        ...timestampFiles.value,
        ...restoredTimestampFiles,
      ]
    } catch (requestError) {
      timestampActionStatus.value = 'error'
      timestampActionErrorMessage.value = getApiErrorMessage(requestError)
    }
  }

  const addTimestampFiles = (newTimestampFiles: File[]) => {
    if (isTimestampActionInProgress.value) {
      return false
    }

    const validTimestampFiles: File[] = []
    const validationErrorMessages: string[] = []

    newTimestampFiles.forEach((timestampFile) => {
      const validationResult = validateDraftFile(timestampFile)

      if (validationResult.isValid) {
        validTimestampFiles.push(timestampFile)
        return
      }

      validationErrorMessages.push(
        translate('timestamp.validation.fileError', {
          fileName: timestampFile.name,
          message: validationResult.errorMessage,
        }),
      )
    })

    if (validTimestampFiles.length > 0) {
      timestampFiles.value = [
        ...timestampFiles.value,
        ...validTimestampFiles.map(createSelectedTimestampFileItem),
      ]
      clearTimestampActionFeedback()
    }

    timestampFileValidationErrorMessage.value =
      validationErrorMessages.join(' ')

    return validTimestampFiles.length > 0
  }

  const removeTimestampFile = async (timestampFileId: string) => {
    if (isTimestampActionInProgress.value) {
      return false
    }

    const timestampFileItem = timestampFiles.value.find(
      ({ id }) => id === timestampFileId,
    )

    if (!timestampFileItem) {
      return false
    }

    if (timestampFileItem.draftFileId === null) {
      timestampFiles.value = timestampFiles.value.filter(
        ({ id }) => id !== timestampFileId,
      )
      timestampFileValidationErrorMessage.value = ''
      clearTimestampActionFeedback()
      return true
    }

    timestampActionStatus.value = 'loading'
    updateTimestampFileItem(timestampFileId, {
      errorMessage: '',
      status: 'deleting',
    })

    try {
      await draftFilesStore.deleteDraftFile(
        timestampFileItem.draftFileId,
        'timestamp',
      )
      timestampFiles.value = timestampFiles.value.filter(
        ({ id }) => id !== timestampFileId,
      )
      timestampActionStatus.value = 'success'
      timestampActionSuccessMessage.value = translate(
        'timestamp.feedback.draftDeleted',
      )
      await dashboardStore.fetchDashboardData()
      return true
    } catch (requestError) {
      const deletionErrorMessage = getApiErrorMessage(requestError)
      updateTimestampFileItem(timestampFileId, {
        errorMessage: deletionErrorMessage,
        status: 'uploaded',
      })
      timestampActionStatus.value = 'error'
      timestampActionErrorMessage.value = deletionErrorMessage
      return false
    }
  }

  const uploadTimestampFiles = async () => {
    if (isTimestampActionInProgress.value) {
      return false
    }

    const timestampFilesToUpload = timestampFiles.value.filter(
      ({ status }) => status === 'selected' || status === 'upload-error',
    )

    if (timestampFilesToUpload.length === 0) {
      timestampActionStatus.value = 'error'
      timestampActionErrorMessage.value = translate(
        'timestamp.feedback.selectFilesToUpload',
      )
      return false
    }

    timestampActionStatus.value = 'loading'
    timestampActionErrorMessage.value = ''
    timestampActionSuccessMessage.value = ''
    let uploadedFileCount = 0
    let failedFileCount = 0

    for (const timestampFileItem of timestampFilesToUpload) {
      if (!timestampFileItem.file) {
        continue
      }

      updateTimestampFileItem(timestampFileItem.id, {
        errorMessage: '',
        progressPercentage: 0,
        status: 'uploading',
      })

      try {
        const uploadedDraftFile = await draftFilesStore.uploadDraftFile(
          timestampFileItem.file,
          'timestamp',
          (progressPercentage) => {
            updateTimestampFileItem(timestampFileItem.id, {
              progressPercentage,
            })
          },
        )

        updateTimestampFileItem(timestampFileItem.id, {
          draftFileId: uploadedDraftFile.id,
          errorMessage: '',
          file: null,
          fileName: uploadedDraftFile.fileName,
          fileSize: uploadedDraftFile.fileSize,
          progressPercentage: 100,
          status: 'uploaded',
        })
        uploadedFileCount += 1
      } catch (requestError) {
        updateTimestampFileItem(timestampFileItem.id, {
          errorMessage: getApiErrorMessage(requestError),
          progressPercentage: 0,
          status: 'upload-error',
        })
        failedFileCount += 1
      }
    }

    if (uploadedFileCount > 0) {
      await dashboardStore.fetchDashboardData()
    }

    if (failedFileCount > 0) {
      timestampActionStatus.value = 'error'
      timestampActionErrorMessage.value = translate(
        uploadedFileCount > 0
          ? 'timestamp.feedback.uploadPartialFailure'
          : 'timestamp.feedback.uploadFailure',
        {
          failedCount: failedFileCount,
          uploadedCount: uploadedFileCount,
        },
      )
      return false
    }

    timestampActionStatus.value = 'success'
    timestampActionSuccessMessage.value = translate(
      'timestamp.feedback.uploadSuccess',
      { count: uploadedFileCount },
    )
    return true
  }

  const reportInsufficientTimestampCredits = () => {
    if (isTimestampActionInProgress.value) {
      return
    }

    timestampActionStatus.value = 'error'
    timestampActionErrorMessage.value = translate('errors.insufficientCredits')
    timestampActionSuccessMessage.value = ''
  }

  const processTimestampFiles = async () => {
    if (isTimestampActionInProgress.value) {
      return false
    }

    const timestampFilesToProcess = timestampFiles.value.filter(
      ({ status }) => status === 'uploaded' || status === 'process-error',
    )

    if (timestampFilesToProcess.length === 0) {
      timestampActionStatus.value = 'error'
      timestampActionErrorMessage.value = translate(
        'timestamp.feedback.uploadFilesBeforeTimestamping',
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

    timestampActionStatus.value = 'loading'
    timestampActionErrorMessage.value = ''
    timestampActionSuccessMessage.value = ''
    let completedFileCount = 0
    let failedFileCount = 0

    for (const timestampFileItem of timestampFilesToProcess) {
      if (timestampFileItem.draftFileId === null) {
        continue
      }

      if (
        dashboardStore.dashboardSummary &&
        dashboardStore.dashboardSummary.remainingCredits < 1
      ) {
        updateTimestampFileItem(timestampFileItem.id, {
          errorMessage: translate('errors.insufficientCredits'),
          status: 'process-error',
        })
        failedFileCount += 1
        continue
      }

      updateTimestampFileItem(timestampFileItem.id, {
        errorMessage: '',
        progressPercentage: 100,
        status: 'processing',
      })

      try {
        const timestampTransaction =
          await timestampApi.createTimestampTransaction(
            timestampFileItem.draftFileId,
          )

        dashboardStore.synchronizeDashboardData(
          timestampTransaction.dashboardSummary,
          timestampTransaction.recentDocuments,
        )
        addRecentTimestampJob(timestampTransaction.timestampJob)
        draftFilesStore.removeProcessedDraftFile(
          timestampFileItem.draftFileId,
          'timestamp',
        )
        timestampFiles.value = timestampFiles.value.filter(
          ({ id }) => id !== timestampFileItem.id,
        )
        completedFileCount += 1
      } catch (requestError) {
        updateTimestampFileItem(timestampFileItem.id, {
          errorMessage: getApiErrorMessage(requestError),
          status: 'process-error',
        })
        failedFileCount += 1
      }
    }

    if (failedFileCount > 0) {
      timestampActionStatus.value = 'error'
      timestampActionErrorMessage.value =
        completedFileCount > 0
          ? translate('timestamp.feedback.partialFailure', {
              completedCount: completedFileCount,
              failedCount: failedFileCount,
            })
          : translate('timestamp.feedback.batchFailure', {
              count: failedFileCount,
            })
      return false
    }

    timestampActionStatus.value = 'success'
    timestampActionSuccessMessage.value = translate(
      'timestamp.feedback.batchSuccess',
      { count: completedFileCount },
    )
    return true
  }

  return {
    addTimestampFiles,
    canProcessTimestampFiles,
    clearTimestampActionFeedback,
    fetchTimestampJobs,
    isTimestampActionInProgress,
    isTimestampHistoryLoading,
    loadUploadedTimestampFiles,
    processTimestampFiles,
    removeTimestampFile,
    reportInsufficientTimestampCredits,
    timestampActionErrorMessage,
    timestampActionStatus,
    timestampActionSuccessMessage,
    timestampFiles,
    timestampFileValidationErrorMessage,
    timestampHistoryErrorMessage,
    timestampJobs,
    timestampJobsLoadStatus,
    uploadTimestampFiles,
  }
})
