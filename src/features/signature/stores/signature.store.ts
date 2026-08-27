import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import { translate } from '@/locales'
import type { ApiRequestStatus } from '@/types/api.types'

import { signatureApi } from '../api/signature.api'
import type { SignatureFileItem } from '../types/signature.types'
import { validateSignatureFile } from '../utils/signatureFileValidation'

const createSignatureFileItem = (signatureFile: File): SignatureFileItem => ({
  errorMessage: '',
  file: signatureFile,
  id: crypto.randomUUID(),
  progressPercentage: 0,
  status: 'pending',
})

export const useSignatureStore = defineStore('signature', () => {
  const dashboardStore = useDashboardStore()
  const signatureFiles = shallowRef<SignatureFileItem[]>([])
  const signatureFileValidationErrorMessage = ref('')
  const signatureSubmissionStatus = ref<ApiRequestStatus>('idle')
  const signatureSubmissionErrorMessage = ref('')
  const signatureSubmissionSuccessMessage = ref('')

  const isSignatureSubmitting = computed(
    () => signatureSubmissionStatus.value === 'loading',
  )
  const canSubmitSignatureFiles = computed(() =>
    signatureFiles.value.some(
      ({ status }) => status === 'pending' || status === 'error',
    ),
  )

  const clearSubmissionFeedback = () => {
    signatureSubmissionStatus.value = 'idle'
    signatureSubmissionErrorMessage.value = ''
    signatureSubmissionSuccessMessage.value = ''
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

  const addSignatureFiles = (newSignatureFiles: File[]) => {
    if (isSignatureSubmitting.value) {
      return
    }

    const validSignatureFiles: File[] = []
    const validationErrorMessages: string[] = []

    newSignatureFiles.forEach((signatureFile) => {
      const validationResult = validateSignatureFile(signatureFile)

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
        ...validSignatureFiles.map(createSignatureFileItem),
      ]
      clearSubmissionFeedback()
    }

    signatureFileValidationErrorMessage.value =
      validationErrorMessages.join(' ')
  }

  const removeSignatureFile = (signatureFileId: string) => {
    if (isSignatureSubmitting.value) {
      return
    }

    signatureFiles.value = signatureFiles.value.filter(
      ({ id }) => id !== signatureFileId,
    )
    signatureFileValidationErrorMessage.value = ''
    clearSubmissionFeedback()
  }

  const clearSignaturePage = () => {
    if (isSignatureSubmitting.value) {
      return
    }

    signatureFiles.value = []
    signatureFileValidationErrorMessage.value = ''
    clearSubmissionFeedback()
  }

  const reportInsufficientSignatureCredits = () => {
    if (isSignatureSubmitting.value) {
      return
    }

    signatureSubmissionStatus.value = 'error'
    signatureSubmissionErrorMessage.value = translate(
      'errors.insufficientCredits',
    )
    signatureSubmissionSuccessMessage.value = ''
  }

  const submitSignatureFiles = async () => {
    if (isSignatureSubmitting.value) {
      return false
    }

    const signatureFilesToSubmit = signatureFiles.value.filter(
      ({ status }) => status === 'pending' || status === 'error',
    )

    if (signatureFilesToSubmit.length === 0) {
      signatureSubmissionStatus.value = 'error'
      signatureSubmissionErrorMessage.value = translate(
        'signature.feedback.selectFiles',
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

    signatureSubmissionStatus.value = 'loading'
    signatureFileValidationErrorMessage.value = ''
    signatureSubmissionErrorMessage.value = ''
    signatureSubmissionSuccessMessage.value = ''

    let completedFileCount = 0
    let failedFileCount = 0

    for (const signatureFileItem of signatureFilesToSubmit) {
      if (
        dashboardStore.dashboardSummary &&
        dashboardStore.dashboardSummary.remainingCredits < 1
      ) {
        updateSignatureFileItem(signatureFileItem.id, {
          errorMessage: translate('errors.insufficientCredits'),
          progressPercentage: 0,
          status: 'error',
        })
        failedFileCount += 1
        continue
      }

      updateSignatureFileItem(signatureFileItem.id, {
        errorMessage: '',
        progressPercentage: 0,
        status: 'uploading',
      })

      try {
        const signatureTransaction =
          await signatureApi.createSignatureTransaction(
            signatureFileItem.file,
            (progressPercentage) => {
              updateSignatureFileItem(signatureFileItem.id, {
                progressPercentage,
              })
            },
          )

        dashboardStore.synchronizeDashboardData(
          signatureTransaction.dashboardSummary,
          signatureTransaction.recentDocuments,
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
          status: 'error',
        })
        failedFileCount += 1
      }
    }

    if (failedFileCount > 0) {
      signatureSubmissionStatus.value = 'error'
      signatureSubmissionErrorMessage.value =
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

    signatureSubmissionStatus.value = 'success'
    signatureSubmissionSuccessMessage.value = translate(
      'signature.feedback.batchSuccess',
      { count: completedFileCount },
    )

    return true
  }

  return {
    addSignatureFiles,
    canSubmitSignatureFiles,
    clearSignaturePage,
    isSignatureSubmitting,
    removeSignatureFile,
    reportInsufficientSignatureCredits,
    signatureFiles,
    signatureFileValidationErrorMessage,
    signatureSubmissionErrorMessage,
    signatureSubmissionStatus,
    signatureSubmissionSuccessMessage,
    submitSignatureFiles,
  }
})
