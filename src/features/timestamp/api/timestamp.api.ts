import { axiosInstance } from '@/api/axiosInstance'

import type {
  TimestampJob,
  TimestampTransactionResponse,
} from '../types/timestamp.types'

const TIMESTAMP_UPLOAD_TIMEOUT_MILLISECONDS = 60_000

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
  timestampFile: File,
) => {
  const timestampFormData = new FormData()
  timestampFormData.append('file', timestampFile, timestampFile.name)

  const { data: timestampTransactionResponse } =
    await axiosInstance.post<TimestampTransactionResponse>(
      '/timestamp-transactions',
      timestampFormData,
      {
        timeout: TIMESTAMP_UPLOAD_TIMEOUT_MILLISECONDS,
      },
    )

  return timestampTransactionResponse
}

export const timestampApi = {
  createTimestampTransaction,
  fetchTimestampJobs,
}
