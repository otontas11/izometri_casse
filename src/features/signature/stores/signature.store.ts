import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import { useDraftFilesStore } from '@/features/draft-files/stores/draftFiles.store'
import type { DraftFile } from '@/features/draft-files/types/draftFile.types'
import { validateDraftFile } from '@/features/draft-files/utils/draftFileValidation'
import { translate } from '@/locales'
import type { ApiRequestStatus } from '@/types/api.types'

import { signatureApi } from '../api/signature.api'
import type { SignatureFileItem } from '../types/signature.types'

const createSelectedSignatureFileItem = (
  selectedFile: File,
): SignatureFileItem => ({
  draftFileId: null,
  errorMessage: '',
  file: selectedFile,
  fileName: selectedFile.name,
  fileSize: selectedFile.size,
  id: crypto.randomUUID(),
  progressPercentage: 0,
  status: 'selected',
})

const createUploadedSignatureFileItem = (
  draftFile: DraftFile,
): SignatureFileItem => ({
  draftFileId: draftFile.id,
  errorMessage: '',
  file: null,
  fileName: draftFile.fileName,
  fileSize: draftFile.fileSize,
  id: `draft-${draftFile.id}`,
  progressPercentage: 100,
  status: 'uploaded',
})

export const useSignatureStore = defineStore('signature', () => {
  const dashboardStore = useDashboardStore()
  const draftFilesStore = useDraftFilesStore()
  const signatureFiles = shallowRef<SignatureFileItem[]>([])
  const signatureFileValidationErrorMessage = ref('')
  const signatureActionStatus = ref<ApiRequestStatus>('idle')
  const signatureActionErrorMessage = ref('')
  const signatureActionSuccessMessage = ref('')

  const isSignatureActionInProgress = computed(
    () => signatureActionStatus.value === 'loading',
  )
  const canUploadSignatureFiles = computed(() =>
    signatureFiles.value.some(
      ({ status }) => status === 'selected' || status === 'upload-error',
    ),
  )
  const canProcessSignatureFiles = computed(() =>
    signatureFiles.value.some(
      ({ status }) => status === 'uploaded' || status === 'process-error',
    ),
  )

  const clearSignatureActionFeedback = () => {
    signatureActionStatus.value = 'idle'
    signatureActionErrorMessage.value = ''
    signatureActionSuccessMessage.value = ''
  }

  const updateSignatureFileItem = (
    signatureFileId: string,
    updatedFields: Partial<SignatureFileItem>,
  ) => {
    signatureFiles.value = signatureFiles.value.map((signatureFileItem) =>
      signatureFileItem.id === signatureFileId
        ? { ...signatureFileItem, ...updatedFields }
        : signatureFileItem,
    )
  }

  const loadUploadedSignatureFiles = async () => {
    try {
      const uploadedDraftFiles =
        await draftFilesStore.fetchUploadedDraftFiles('signature')
      const existingDraftFileIds = new Set(
        signatureFiles.value
          .map(({ draftFileId }) => draftFileId)
          .filter((draftFileId): draftFileId is number => draftFileId !== null),
      )
      const restoredSignatureFiles = uploadedDraftFiles
        .filter(({ id }) => !existingDraftFileIds.has(id))
        .map(createUploadedSignatureFileItem)

      signatureFiles.value = [
        ...signatureFiles.value,
        ...restoredSignatureFiles,
      ]
    } catch (requestError) {
      signatureActionStatus.value = 'error'
      signatureActionErrorMessage.value = getApiErrorMessage(requestError)
    }
  }

  const addSignatureFiles = (newSignatureFiles: File[]) => {
    if (isSignatureActionInProgress.value) {
      return false
    }

    const validSignatureFiles: File[] = []
    const validationErrorMessages: string[] = []

    newSignatureFiles.forEach((signatureFile) => {
      const validationResult = validateDraftFile(signatureFile)

      if (validationResult.isValid) {
        validSignatureFiles.push(signatureFile)
        return
      }

      validationErrorMessages.push(
        translate('signature.validation.fileError', {
          fileName: signatureFile.name,
          message: validationResult.errorMessage,
        }),
      )
    })

    if (validSignatureFiles.length > 0) {
      signatureFiles.value = [
        ...signatureFiles.value,
        ...validSignatureFiles.map(createSelectedSignatureFileItem),
      ]
      clearSignatureActionFeedback()
    }

    signatureFileValidationErrorMessage.value =
      validationErrorMessages.join(' ')

    return validSignatureFiles.length > 0
  }

  const removeSignatureFile = async (signatureFileId: string) => {
    if (isSignatureActionInProgress.value) {
      return false
    }

    const signatureFileItem = signatureFiles.value.find(
      ({ id }) => id === signatureFileId,
    )

    if (!signatureFileItem) {
      return false
    }

    if (
      signatureFileItem.draftFileId === null ||
      signatureFileItem.status === 'completed'
    ) {
      signatureFiles.value = signatureFiles.value.filter(
        ({ id }) => id !== signatureFileId,
      )
      signatureFileValidationErrorMessage.value = ''
      clearSignatureActionFeedback()
      return true
    }

    signatureActionStatus.value = 'loading'
    updateSignatureFileItem(signatureFileId, {
      errorMessage: '',
      status: 'deleting',
    })

    try {
      await draftFilesStore.deleteDraftFile(
        signatureFileItem.draftFileId,
        'signature',
      )
      signatureFiles.value = signatureFiles.value.filter(
        ({ id }) => id !== signatureFileId,
      )
      signatureActionStatus.value = 'success'
      signatureActionSuccessMessage.value = translate(
        'signature.feedback.draftDeleted',
      )
      await dashboardStore.fetchDashboardData()
      return true
    } catch (requestError) {
      const deletionErrorMessage = getApiErrorMessage(requestError)
      updateSignatureFileItem(signatureFileId, {
        errorMessage: deletionErrorMessage,
        status: 'uploaded',
      })
      signatureActionStatus.value = 'error'
      signatureActionErrorMessage.value = deletionErrorMessage
      return false
    }
  }

  const clearSignaturePage = async () => {
    if (isSignatureActionInProgress.value) {
      return false
    }

    const uploadedSignatureFiles = signatureFiles.value.filter(
      ({ draftFileId, status }) =>
        draftFileId !== null && status !== 'completed',
    )

    if (uploadedSignatureFiles.length === 0) {
      signatureFiles.value = []
      signatureFileValidationErrorMessage.value = ''
      clearSignatureActionFeedback()
      return true
    }

    signatureActionStatus.value = 'loading'
    signatureActionErrorMessage.value = ''
    signatureActionSuccessMessage.value = ''
    const draftFileIdsThatCouldNotBeDeleted = new Set<number>()

    for (const signatureFileItem of uploadedSignatureFiles) {
      if (signatureFileItem.draftFileId === null) {
        continue
      }

      updateSignatureFileItem(signatureFileItem.id, {
        errorMessage: '',
        status: 'deleting',
      })

      try {
        await draftFilesStore.deleteDraftFile(
          signatureFileItem.draftFileId,
          'signature',
        )
      } catch (requestError) {
        draftFileIdsThatCouldNotBeDeleted.add(signatureFileItem.draftFileId)
        updateSignatureFileItem(signatureFileItem.id, {
          errorMessage: getApiErrorMessage(requestError),
          status: 'uploaded',
        })
      }
    }

    signatureFiles.value = signatureFiles.value.filter(
      ({ draftFileId }) =>
        draftFileId !== null &&
        draftFileIdsThatCouldNotBeDeleted.has(draftFileId),
    )
    signatureFileValidationErrorMessage.value = ''
    await dashboardStore.fetchDashboardData()

    if (draftFileIdsThatCouldNotBeDeleted.size > 0) {
      signatureActionStatus.value = 'error'
      signatureActionErrorMessage.value = translate(
        'signature.feedback.clearFailure',
      )
      return false
    }

    clearSignatureActionFeedback()
    return true
  }

  const uploadSignatureFiles = async () => {
    if (isSignatureActionInProgress.value) {
      return false
    }

    const signatureFilesToUpload = signatureFiles.value.filter(
      ({ status }) => status === 'selected' || status === 'upload-error',
    )

    if (signatureFilesToUpload.length === 0) {
      signatureActionStatus.value = 'error'
      signatureActionErrorMessage.value = translate(
        'signature.feedback.selectFilesToUpload',
      )
      return false
    }

    signatureActionStatus.value = 'loading'
    signatureFileValidationErrorMessage.value = ''
    signatureActionErrorMessage.value = ''
    signatureActionSuccessMessage.value = ''
    let uploadedFileCount = 0
    let failedFileCount = 0

    for (const signatureFileItem of signatureFilesToUpload) {
      if (!signatureFileItem.file) {
        continue
      }

      updateSignatureFileItem(signatureFileItem.id, {
        errorMessage: '',
        progressPercentage: 0,
        status: 'uploading',
      })

      try {
        const uploadedDraftFile = await draftFilesStore.uploadDraftFile(
          signatureFileItem.file,
          'signature',
          (progressPercentage) => {
            updateSignatureFileItem(signatureFileItem.id, {
              progressPercentage,
            })
          },
        )

        updateSignatureFileItem(signatureFileItem.id, {
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
        updateSignatureFileItem(signatureFileItem.id, {
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
      signatureActionStatus.value = 'error'
      signatureActionErrorMessage.value = translate(
        uploadedFileCount > 0
          ? 'signature.feedback.uploadPartialFailure'
          : 'signature.feedback.uploadFailure',
        {
          failedCount: failedFileCount,
          uploadedCount: uploadedFileCount,
        },
      )
      return false
    }

    signatureActionStatus.value = 'success'
    signatureActionSuccessMessage.value = translate(
      'signature.feedback.uploadSuccess',
      { count: uploadedFileCount },
    )
    return true
  }

  const reportInsufficientSignatureCredits = () => {
    if (isSignatureActionInProgress.value) {
      return
    }

    signatureActionStatus.value = 'error'
    signatureActionErrorMessage.value = translate('errors.insufficientCredits')
    signatureActionSuccessMessage.value = ''
  }

  const processSignatureFiles = async () => {
    if (isSignatureActionInProgress.value) {
      return false
    }

    const signatureFilesToProcess = signatureFiles.value.filter(
      ({ status }) => status === 'uploaded' || status === 'process-error',
    )

    if (signatureFilesToProcess.length === 0) {
      signatureActionStatus.value = 'error'
      signatureActionErrorMessage.value = translate(
        'signature.feedback.uploadFilesBeforeSigning',
      )
      return false
    }

    if (
      dashboardStore.dashboardSummary &&
      dashboardStore.dashboardSummary.remainingCredits < 1
    ) {
      reportInsufficientSignatureCredits()
      return false
    }

    signatureActionStatus.value = 'loading'
    signatureActionErrorMessage.value = ''
    signatureActionSuccessMessage.value = ''
    let completedFileCount = 0
    let failedFileCount = 0

    for (const signatureFileItem of signatureFilesToProcess) {
      if (signatureFileItem.draftFileId === null) {
        continue
      }

      if (
        dashboardStore.dashboardSummary &&
        dashboardStore.dashboardSummary.remainingCredits < 1
      ) {
        updateSignatureFileItem(signatureFileItem.id, {
          errorMessage: translate('errors.insufficientCredits'),
          status: 'process-error',
        })
        failedFileCount += 1
        continue
      }

      updateSignatureFileItem(signatureFileItem.id, {
        errorMessage: '',
        progressPercentage: 100,
        status: 'processing',
      })

      try {
        const signatureTransaction =
          await signatureApi.createSignatureTransaction(
            signatureFileItem.draftFileId,
          )

        dashboardStore.synchronizeDashboardData(
          signatureTransaction.dashboardSummary,
          signatureTransaction.recentDocuments,
        )
        draftFilesStore.removeProcessedDraftFile(
          signatureFileItem.draftFileId,
          'signature',
        )
        updateSignatureFileItem(signatureFileItem.id, {
          errorMessage: '',
          progressPercentage: 100,
          status: 'completed',
        })
        completedFileCount += 1
      } catch (requestError) {
        updateSignatureFileItem(signatureFileItem.id, {
          errorMessage: getApiErrorMessage(requestError),
          status: 'process-error',
        })
        failedFileCount += 1
      }
    }

    if (failedFileCount > 0) {
      signatureActionStatus.value = 'error'
      signatureActionErrorMessage.value =
        completedFileCount > 0
          ? translate('signature.feedback.partialFailure', {
              completedCount: completedFileCount,
              failedCount: failedFileCount,
            })
          : translate('signature.feedback.batchFailure', {
              count: failedFileCount,
            })
      return false
    }

    signatureActionStatus.value = 'success'
    signatureActionSuccessMessage.value = translate(
      'signature.feedback.batchSuccess',
      { count: completedFileCount },
    )
    return true
  }

  return {
    addSignatureFiles,
    canProcessSignatureFiles,
    canUploadSignatureFiles,
    clearSignaturePage,
    isSignatureActionInProgress,
    loadUploadedSignatureFiles,
    processSignatureFiles,
    removeSignatureFile,
    reportInsufficientSignatureCredits,
    signatureActionErrorMessage,
    signatureActionSuccessMessage,
    signatureFiles,
    signatureFileValidationErrorMessage,
    uploadSignatureFiles,
  }
})
