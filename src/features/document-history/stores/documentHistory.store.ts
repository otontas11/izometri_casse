import { computed, ref, shallowRef } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import type { ArchivedDocument } from '@/features/dashboard/types/dashboard.types'
import type { ApiRequestStatus } from '@/types/api.types'

import { documentHistoryApi } from '../api/documentHistory.api'
import type { DocumentHistoryPagination, DocumentHistoryRequest } from '../types/documentHistory.types'

const defaultDocumentHistoryPagination: DocumentHistoryPagination = {
  currentPage: 1,
  pageSize: 10,
  totalItems: 0,
  totalPages: 0,
}

export const useDocumentHistoryStore = defineStore('document-history', () => {
  const archivedDocuments = shallowRef<ArchivedDocument[]>([])
  const documentHistoryPagination = ref<DocumentHistoryPagination>({
    ...defaultDocumentHistoryPagination,
  })
  const documentHistoryRequestStatus = ref<ApiRequestStatus>('idle')
  const documentHistoryErrorMessage = ref('')
  let latestDocumentHistoryRequestId = 0

  const isDocumentHistoryLoading = computed(() => documentHistoryRequestStatus.value === 'loading')

  const fetchDocumentHistory = async (documentHistoryRequest: DocumentHistoryRequest) => {
    const currentDocumentHistoryRequestId = ++latestDocumentHistoryRequestId

    documentHistoryRequestStatus.value = 'loading'
    documentHistoryErrorMessage.value = ''

    try {
      const documentHistoryResponse = await documentHistoryApi.fetchDocumentHistory(documentHistoryRequest)

      if (currentDocumentHistoryRequestId !== latestDocumentHistoryRequestId) {
        return
      }

      archivedDocuments.value = documentHistoryResponse.items
      documentHistoryPagination.value = documentHistoryResponse.pagination
      documentHistoryRequestStatus.value = 'success'
    } catch (requestError) {
      if (currentDocumentHistoryRequestId !== latestDocumentHistoryRequestId) {
        return
      }

      documentHistoryRequestStatus.value = 'error'
      documentHistoryErrorMessage.value = getApiErrorMessage(requestError)
    }
  }

  return {
    archivedDocuments,
    documentHistoryErrorMessage,
    documentHistoryPagination,
    documentHistoryRequestStatus,
    fetchDocumentHistory,
    isDocumentHistoryLoading,
  }
})
