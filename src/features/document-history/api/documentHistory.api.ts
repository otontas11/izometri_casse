import { axiosInstance } from '@/api/axiosInstance'

import type {
  DocumentHistoryRequest,
  DocumentHistoryResponse,
} from '../types/documentHistory.types'

const getSelectedDateBoundaries = (selectedDate: string) => {
  if (!selectedDate) {
    return { createdBefore: undefined, createdFrom: undefined }
  }

  const [selectedYear, selectedMonth, selectedDay] = selectedDate
    .split('-')
    .map(Number)
  const selectedDateStart = new Date(
    selectedYear,
    selectedMonth - 1,
    selectedDay,
  )
  const followingDateStart = new Date(
    selectedYear,
    selectedMonth - 1,
    selectedDay + 1,
  )

  return {
    createdBefore: followingDateStart.toISOString(),
    createdFrom: selectedDateStart.toISOString(),
  }
}

const fetchDocumentHistory = async (
  documentHistoryRequest: DocumentHistoryRequest,
) => {
  const selectedDateBoundaries = getSelectedDateBoundaries(
    documentHistoryRequest.selectedDate,
  )
  const { data: documentHistoryResponse } =
    await axiosInstance.get<DocumentHistoryResponse>('/document-history', {
      params: {
        ...selectedDateBoundaries,
        fileTypes:
          documentHistoryRequest.fileTypes.join(',') || undefined,
        operations:
          documentHistoryRequest.operations.join(',') || undefined,
        page: documentHistoryRequest.page,
        pageSize: documentHistoryRequest.pageSize,
        search: documentHistoryRequest.fileNameSearch.trim() || undefined,
      },
    })

  return documentHistoryResponse
}

export const documentHistoryApi = {
  fetchDocumentHistory,
}
