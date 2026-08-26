import { axiosInstance } from '@/api/axiosInstance'

import type {
  ArchivedDocument,
  DashboardSummary,
} from '../types/dashboard.types'

const fetchDashboardSummary = async () => {
  const { data: dashboardSummary } =
    await axiosInstance.get<DashboardSummary>('/dashboard')

  return dashboardSummary
}

const fetchRecentDocuments = async (documentLimit = 5) => {
  const { data: recentDocuments } = await axiosInstance.get<ArchivedDocument[]>(
    '/documents',
    {
      params: {
        _limit: documentLimit,
        _order: 'desc',
        _sort: 'createdAt',
      },
    },
  )

  return recentDocuments
}

export const dashboardApi = {
  fetchDashboardSummary,
  fetchRecentDocuments,
}
