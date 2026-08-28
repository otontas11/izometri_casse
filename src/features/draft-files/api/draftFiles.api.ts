import { axiosInstance } from '@/api/axiosInstance'

import type { DraftFile, DraftFileOperation, DraftFileUploadProgressHandler } from '../types/draftFile.types'

const DRAFT_FILE_UPLOAD_TIMEOUT_MILLISECONDS = 60_000

const fetchUploadedDraftFiles = async (intendedOperation: DraftFileOperation) => {
  const { data: draftFiles } = await axiosInstance.get<DraftFile[]>('/draft-files', {
    params: { operation: intendedOperation },
  })

  return draftFiles
}

const uploadDraftFile = async (file: File, intendedOperation: DraftFileOperation, updateUploadProgress: DraftFileUploadProgressHandler) => {
  const draftFileFormData = new FormData()
  draftFileFormData.append('file', file, file.name)
  draftFileFormData.append('intendedOperation', intendedOperation)

  const { data: uploadedDraftFile } = await axiosInstance.post<DraftFile>('/draft-files', draftFileFormData, {
    onUploadProgress: uploadProgressEvent => {
      if (!uploadProgressEvent.total) {
        return
      }

      const progressPercentage = Math.round((uploadProgressEvent.loaded / uploadProgressEvent.total) * 100)
      updateUploadProgress(Math.min(progressPercentage, 100))
    },
    timeout: DRAFT_FILE_UPLOAD_TIMEOUT_MILLISECONDS,
  })

  return uploadedDraftFile
}

const deleteDraftFile = (draftFileId: number) => axiosInstance.delete(`/draft-files/${draftFileId}`)

export const draftFilesApi = {
  deleteDraftFile,
  fetchUploadedDraftFiles,
  uploadDraftFile,
}
