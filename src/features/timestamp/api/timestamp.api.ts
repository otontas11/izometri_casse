import { axiosInstance } from '@/api/axiosInstance'

import type {
  CreateTimestampJobPayload,
  TimestampJob,
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

const createTimestampJob = async (
  timestampJobPayload: CreateTimestampJobPayload,
) => {
  const { data: createdTimestampJob } = await axiosInstance.post<TimestampJob>(
    '/timestampJobs',
    timestampJobPayload,
  )

  return createdTimestampJob
}

export const timestampApi = {
  createTimestampJob,
  fetchTimestampJobs,
}
