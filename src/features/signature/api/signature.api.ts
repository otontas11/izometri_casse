import { axiosInstance } from '@/api/axiosInstance'
import type { ArchivedDocument } from '@/features/dashboard/types/dashboard.types'

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

const fetchRecentSignedDocuments = async (documentLimit: number) => {
  const { data: recentSignedDocuments } =
    await axiosInstance.get<ArchivedDocument[]>('/documents', {
      params: {
        _limit: documentLimit,
        _order: 'desc',
        _sort: 'createdAt',
        operation: 'signature',
      },
    })

  return recentSignedDocuments.filter(
    ({ operation }) => operation === 'signature',
  )
}

export const signatureApi = {
  createSignatureTransaction,
  fetchRecentSignedDocuments,
}
