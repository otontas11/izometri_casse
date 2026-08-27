import { axiosInstance } from '@/api/axiosInstance'

import type { SignatureTransactionResponse } from '../types/signature.types'

const SIGNATURE_UPLOAD_TIMEOUT_MILLISECONDS = 60_000

const createSignatureTransaction = async (
  signatureFile: File,
  updateUploadProgress: (progressPercentage: number) => void,
) => {
  const signatureFormData = new FormData()
  signatureFormData.append('file', signatureFile, signatureFile.name)

  const { data: signatureTransactionResponse } =
    await axiosInstance.post<SignatureTransactionResponse>(
      '/signature-transactions',
      signatureFormData,
      {
        onUploadProgress: (uploadProgressEvent) => {
          if (!uploadProgressEvent.total) {
            return
          }

          const progressPercentage = Math.round(
            (uploadProgressEvent.loaded / uploadProgressEvent.total) * 100,
          )

          updateUploadProgress(Math.min(progressPercentage, 100))
        },
        timeout: SIGNATURE_UPLOAD_TIMEOUT_MILLISECONDS,
      },
    )

  return signatureTransactionResponse
}

export const signatureApi = {
  createSignatureTransaction,
}
