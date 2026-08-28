import { axiosInstance } from '@/api/axiosInstance'

import type { TimestampJob, TimestampTransactionResponse } from '../types/timestamp.types'

const fetchTimestampJobs = async () => {
  const { data: timestampJobs } = await axiosInstance.get<TimestampJob[]>('/timestampJobs', {
    params: {
      _order: 'desc',
      _sort: 'createdAt',
    },
  })

  return timestampJobs
}

const createTimestampTransaction = async (draftFileId: number) => {
  const { data: timestampTransactionResponse } = await axiosInstance.post<TimestampTransactionResponse>('/timestamp-transactions', {
    draftFileId,
  })

  return timestampTransactionResponse
}

export const timestampApi = {
  createTimestampTransaction,
  fetchTimestampJobs,
}
