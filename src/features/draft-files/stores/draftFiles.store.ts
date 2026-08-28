import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import type { ApiRequestStatus } from '@/types/api.types'

import { draftFilesApi } from '../api/draftFiles.api'
import type { DraftFile, DraftFileOperation, DraftFileUploadProgressHandler } from '../types/draftFile.types'

const createEmptyDraftFileCollection = (): Record<DraftFileOperation, DraftFile[]> => ({
  signature: [],
  timestamp: [],
})

const createInitialLoadStatuses = (): Record<DraftFileOperation, ApiRequestStatus> => ({
  signature: 'idle',
  timestamp: 'idle',
})

export const useDraftFilesStore = defineStore('draftFiles', () => {
  const uploadedDraftFiles = ref(createEmptyDraftFileCollection())
  const draftFilesLoadStatus = ref(createInitialLoadStatuses())
  const latestUploadedDraftFile = computed(() => {
    const allUploadedDraftFiles = [...uploadedDraftFiles.value.signature, ...uploadedDraftFiles.value.timestamp]

    return allUploadedDraftFiles.reduce<DraftFile | null>((latestDraftFile, uploadedDraftFile) => {
      if (!latestDraftFile) {
        return uploadedDraftFile
      }

      const latestDraftFileCreationTime = Date.parse(latestDraftFile.createdAt)
      const uploadedDraftFileCreationTime = Date.parse(uploadedDraftFile.createdAt)
      const isUploadedDraftFileNewer =
        uploadedDraftFileCreationTime > latestDraftFileCreationTime ||
        (uploadedDraftFileCreationTime === latestDraftFileCreationTime && uploadedDraftFile.id > latestDraftFile.id)

      return isUploadedDraftFileNewer ? uploadedDraftFile : latestDraftFile
    }, null)
  })

  const fetchUploadedDraftFiles = async (intendedOperation: DraftFileOperation) => {
    if (draftFilesLoadStatus.value[intendedOperation] === 'loading') {
      return uploadedDraftFiles.value[intendedOperation]
    }

    draftFilesLoadStatus.value[intendedOperation] = 'loading'

    try {
      const operationDraftFiles = await draftFilesApi.fetchUploadedDraftFiles(intendedOperation)
      uploadedDraftFiles.value[intendedOperation] = operationDraftFiles
      draftFilesLoadStatus.value[intendedOperation] = 'success'
      return operationDraftFiles
    } catch (requestError) {
      draftFilesLoadStatus.value[intendedOperation] = 'error'
      throw requestError
    }
  }

  const uploadDraftFile = async (
    file: File,
    intendedOperation: DraftFileOperation,
    updateUploadProgress: DraftFileUploadProgressHandler
  ) => {
    const uploadedDraftFile = await draftFilesApi.uploadDraftFile(file, intendedOperation, updateUploadProgress)

    uploadedDraftFiles.value[intendedOperation] = [
      uploadedDraftFile,
      ...uploadedDraftFiles.value[intendedOperation].filter(({ id }) => id !== uploadedDraftFile.id),
    ]

    return uploadedDraftFile
  }

  const deleteDraftFile = async (draftFileId: number, intendedOperation: DraftFileOperation) => {
    await draftFilesApi.deleteDraftFile(draftFileId)
    uploadedDraftFiles.value[intendedOperation] = uploadedDraftFiles.value[intendedOperation].filter(({ id }) => id !== draftFileId)
  }

  const removeProcessedDraftFile = (draftFileId: number, intendedOperation: DraftFileOperation) => {
    uploadedDraftFiles.value[intendedOperation] = uploadedDraftFiles.value[intendedOperation].filter(({ id }) => id !== draftFileId)
  }

  return {
    deleteDraftFile,
    fetchUploadedDraftFiles,
    latestUploadedDraftFile,
    removeProcessedDraftFile,
    uploadedDraftFiles,
    uploadDraftFile,
  }
})
