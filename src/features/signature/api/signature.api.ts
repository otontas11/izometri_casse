import { axiosInstance } from '@/api/axiosInstance'

import type { SignatureTransactionResponse } from '../types/signature.types'

const createSignatureTransaction = async (
  draftFileId: number,
) => {
  const { data: signatureTransactionResponse } =
    await axiosInstance.post<SignatureTransactionResponse>(
      '/signature-transactions',
      { draftFileId },
    )

  return signatureTransactionResponse
}

export const signatureApi = {
  createSignatureTransaction,
}
