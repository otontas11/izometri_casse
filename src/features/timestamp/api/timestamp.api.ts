import { axiosInstance } from '@/api/axiosInstance'

import type {
  CreateTimestampTransactionPayload,
  TimestampJob,
  TimestampTransactionResponse,
} from '../types/timestamp.types'

const fetchTimestampJobs = async () => {
  const { data: timestampJobs } = await axiosInstance.get<TimestampJob[]>(
    '/timestampJobs',
    {
      params: {
        _order: 'desc',
        _sort: 'createdAt',
      },
    },
  )

  return timestampJobs
}

const createTimestampTransaction = async (
  timestampTransactionPayload: CreateTimestampTransactionPayload,
) => {
  const { data: timestampTransactionResponse } =
    await axiosInstance.post<TimestampTransactionResponse>(
      '/timestamp-transactions',
      timestampTransactionPayload,
    )

  return timestampTransactionResponse
}

export const timestampApi = {
  createTimestampTransaction,
  fetchTimestampJobs,
}
