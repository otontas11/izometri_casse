<template>
  <section
    class="document-history-page"
    aria-labelledby="document-history-page-title"
  >
    <header class="document-history-page__header">
      <div>
        <p>{{ t('documentHistory.page.eyebrow') }}</p>
        <h1 id="document-history-page-title">
          {{ t('documentHistory.page.title') }}
        </h1>
        <span>{{ t('documentHistory.page.description') }}</span>
      </div>
    </header>

    <DocumentHistoryFilters
      :filters="selectedFilters"
      @change="handleFiltersChange"
      @reset="handleFiltersReset"
    />

    <DocumentHistoryTable
      :archived-documents="archivedDocuments"
      :deleting-document-id="deletingDocumentId"
      :downloading-document-id="downloadingDocumentId"
      :error-message="documentHistoryErrorMessage"
      :has-active-filters="hasActiveFilters"
      :is-loading="isDocumentHistoryLoading"
      :previewing-document-id="previewingDocumentId"
      :total-document-count="documentHistoryPagination.totalItems"
      @delete="handleDocumentDeleteRequest"
      @download="handleDocumentDownload"
      @preview="handleDocumentPreview"
      @retry="handleDocumentHistoryRetry"
      @send-email="handleDocumentEmailSend"
    />

    <DocumentHistoryPagination
      v-if="!documentHistoryErrorMessage"
      :current-page="documentHistoryPagination.currentPage"
      :is-loading="isDocumentHistoryLoading"
      :page-size="documentHistoryPagination.pageSize"
      :total-items="documentHistoryPagination.totalItems"
      :total-pages="documentHistoryPagination.totalPages"
      @change="handlePageChange"
    />

    <ArchivedDocumentPreviewDrawer
      :archived-document="selectedDocumentForPreview"
      :document-content="previewDocumentContent"
      :error-message="documentPreviewErrorMessage"
      :is-loading="isSelectedDocumentPreviewLoading"
      :is-open="isDocumentPreviewDrawerOpen"
      @close="handleDocumentPreviewDrawerClose"
      @download="handleDocumentDownload"
      @retry="handleDocumentPreview"
    />

    <ArchivedDocumentDeleteModal
      :archived-document="documentPendingDeletion"
      :error-message="documentDeleteErrorMessage"
      :is-deleting="isSelectedDocumentDeleting"
      :is-open="isDocumentDeleteModalOpen"
      @close="handleDocumentDeleteModalClose"
      @confirm="handleDocumentDeleteConfirm"
    />
  </section>
</template>

<script lang="ts" setup>
import { computed, ref, shallowRef, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

import { useToast } from '@/composables/useToast'
import ArchivedDocumentDeleteModal from '@/features/dashboard/components/ArchivedDocumentDeleteModal.vue'
import ArchivedDocumentPreviewDrawer from '@/features/dashboard/components/ArchivedDocumentPreviewDrawer.vue'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import type {
  ArchivedDocument,
  DocumentOperation,
} from '@/features/dashboard/types/dashboard.types'
import DocumentHistoryFilters from '@/features/document-history/components/DocumentHistoryFilters.vue'
import DocumentHistoryPagination from '@/features/document-history/components/DocumentHistoryPagination.vue'
import DocumentHistoryTable from '@/features/document-history/components/DocumentHistoryTable.vue'
import { useDocumentHistoryStore } from '@/features/document-history/stores/documentHistory.store'
import {
  documentFileTypeFilters,
  type DocumentFileTypeFilter,
  type DocumentHistoryFilters as DocumentHistoryFilterValues,
  type DocumentHistoryRequest,
} from '@/features/document-history/types/documentHistory.types'

const DOCUMENT_HISTORY_PAGE_SIZE = 10
const selectedDatePattern = /^\d{4}-\d{2}-\d{2}$/
const validDocumentFileTypes = new Set<DocumentFileTypeFilter>(
  documentFileTypeFilters,
)
const validDocumentOperations = new Set<DocumentOperation>([
  'signature',
  'timestamp',
])

const dashboardStore = useDashboardStore()
const documentHistoryStore = useDocumentHistoryStore()
const {
  deletingDocumentId,
  documentDeleteErrorMessage,
  documentDownloadErrorMessage,
  documentPreviewErrorMessage,
  downloadingDocumentId,
  previewingDocumentId,
} = storeToRefs(dashboardStore)
const {
  archivedDocuments,
  documentHistoryErrorMessage,
  documentHistoryPagination,
  isDocumentHistoryLoading,
} = storeToRefs(documentHistoryStore)
const route = useRoute()
const router = useRouter()
const { user: authenticatedUser } = useAuth0()
const { showErrorToast, showSuccessToast } = useToast()
const { t } = useI18n({ useScope: 'global' })
const selectedFilters = ref<DocumentHistoryFilterValues>(
  createEmptyDocumentHistoryFilters(),
)
const selectedDocumentForPreview = ref<ArchivedDocument | null>(null)
const documentPendingDeletion = ref<ArchivedDocument | null>(null)
const previewDocumentContent = shallowRef<Blob | null>(null)

function createEmptyDocumentHistoryFilters(): DocumentHistoryFilterValues {
  return {
    fileNameSearch: '',
    fileTypes: [],
    operations: [],
    selectedDate: '',
  }
}

const getRouteQueryText = (routeQueryValue: unknown) =>
  typeof routeQueryValue === 'string' ? routeQueryValue : ''

const getRoutePageNumber = (routeQueryValue: unknown) => {
  const requestedPageNumber = Number(getRouteQueryText(routeQueryValue))

  return Number.isSafeInteger(requestedPageNumber) && requestedPageNumber > 0
    ? requestedPageNumber
    : 1
}

const getRouteFilterValues = (
  routeQueryValue: unknown,
  legacyRouteQueryValue: unknown,
) => {
  const requestedFilterValues =
    getRouteQueryText(routeQueryValue) ||
    getRouteQueryText(legacyRouteQueryValue)

  return [
    ...new Set(
      requestedFilterValues
        .split(',')
        .map((requestedFilterValue) => requestedFilterValue.trim())
        .filter(Boolean),
    ),
  ]
}

const getRouteDocumentOperations = (
  routeQueryValue: unknown,
  legacyRouteQueryValue: unknown,
): DocumentOperation[] =>
  getRouteFilterValues(routeQueryValue, legacyRouteQueryValue).filter(
    (requestedOperation): requestedOperation is DocumentOperation =>
      validDocumentOperations.has(requestedOperation as DocumentOperation),
  )

const getRouteDocumentFileTypes = (
  routeQueryValue: unknown,
  legacyRouteQueryValue: unknown,
): DocumentFileTypeFilter[] =>
  getRouteFilterValues(routeQueryValue, legacyRouteQueryValue).filter(
    (requestedFileType): requestedFileType is DocumentFileTypeFilter =>
      validDocumentFileTypes.has(
        requestedFileType as DocumentFileTypeFilter,
      ),
  )

const getRouteSelectedDate = (routeQueryValue: unknown) => {
  const requestedDate = getRouteQueryText(routeQueryValue)
  const [requestedYear, requestedMonth, requestedDay] = requestedDate
    .split('-')
    .map(Number)
  const parsedDate = new Date(
    requestedYear,
    requestedMonth - 1,
    requestedDay,
  )
  const isExactCalendarDate =
    parsedDate.getFullYear() === requestedYear &&
    parsedDate.getMonth() === requestedMonth - 1 &&
    parsedDate.getDate() === requestedDay

  return selectedDatePattern.test(requestedDate) && isExactCalendarDate
    ? requestedDate
    : ''
}

const createDocumentHistoryRequestFromRoute = (): DocumentHistoryRequest => ({
  fileNameSearch: getRouteQueryText(route.query.search).slice(0, 100),
  fileTypes: getRouteDocumentFileTypes(
    route.query.fileTypes,
    route.query.fileType,
  ),
  operations: getRouteDocumentOperations(
    route.query.operations,
    route.query.operation,
  ),
  page: getRoutePageNumber(route.query.page),
  pageSize: DOCUMENT_HISTORY_PAGE_SIZE,
  selectedDate: getRouteSelectedDate(route.query.date),
})

const createDocumentHistoryRouteQuery = (
  documentHistoryFilters: DocumentHistoryFilterValues,
  pageNumber: number,
) => ({
  ...(documentHistoryFilters.fileNameSearch
    ? { search: documentHistoryFilters.fileNameSearch }
    : {}),
  ...(documentHistoryFilters.selectedDate
    ? { date: documentHistoryFilters.selectedDate }
    : {}),
  ...(documentHistoryFilters.fileTypes.length > 0
    ? { fileTypes: documentHistoryFilters.fileTypes.join(',') }
    : {}),
  ...(documentHistoryFilters.operations.length > 0
    ? { operations: documentHistoryFilters.operations.join(',') }
    : {}),
  ...(pageNumber > 1 ? { page: String(pageNumber) } : {}),
})

const hasActiveFilters = computed(
  () =>
    Boolean(selectedFilters.value.fileNameSearch) ||
    Boolean(selectedFilters.value.selectedDate) ||
    selectedFilters.value.fileTypes.length > 0 ||
    selectedFilters.value.operations.length > 0,
)

const authenticatedUserEmailAddress = computed(() => {
  const auth0EmailAddress = authenticatedUser.value?.email

  return typeof auth0EmailAddress === 'string' && auth0EmailAddress.trim()
    ? auth0EmailAddress.trim()
    : t('dashboard.recentDocuments.registeredEmailAddress')
})

const isDocumentPreviewDrawerOpen = computed(
  () => selectedDocumentForPreview.value !== null,
)

const isDocumentDeleteModalOpen = computed(
  () => documentPendingDeletion.value !== null,
)

const isSelectedDocumentDeleting = computed(
  () =>
    documentPendingDeletion.value !== null &&
    deletingDocumentId.value === documentPendingDeletion.value.id,
)

const isSelectedDocumentPreviewLoading = computed(
  () =>
    selectedDocumentForPreview.value !== null &&
    previewingDocumentId.value === selectedDocumentForPreview.value.id,
)

const fetchSelectedDocumentHistory = async () => {
  const documentHistoryRequest = createDocumentHistoryRequestFromRoute()
  selectedFilters.value = {
    fileNameSearch: documentHistoryRequest.fileNameSearch,
    fileTypes: [...documentHistoryRequest.fileTypes],
    operations: [...documentHistoryRequest.operations],
    selectedDate: documentHistoryRequest.selectedDate,
  }
  await documentHistoryStore.fetchDocumentHistory(documentHistoryRequest)
}

const handleFiltersChange = async (
  documentHistoryFilters: DocumentHistoryFilterValues,
) => {
  const nextRouteQuery = createDocumentHistoryRouteQuery(
    documentHistoryFilters,
    1,
  )
  const nextRoute = router.resolve({
    name: 'document-history',
    query: nextRouteQuery,
  })

  if (nextRoute.fullPath === route.fullPath) {
    return
  }

  await router.replace(nextRoute)
}

const handleFiltersReset = async () => {
  await handleFiltersChange(createEmptyDocumentHistoryFilters())
}

const handlePageChange = async (pageNumber: number) => {
  await router.push({
    name: 'document-history',
    query: createDocumentHistoryRouteQuery(selectedFilters.value, pageNumber),
  })
}

const handleDocumentHistoryRetry = () => {
  void fetchSelectedDocumentHistory()
}

const saveDocumentContent = (
  documentContent: Blob,
  documentFileName: string,
) => {
  const documentObjectUrl = URL.createObjectURL(documentContent)
  const documentDownloadLink = document.createElement('a')
  documentDownloadLink.href = documentObjectUrl
  documentDownloadLink.download = documentFileName
  document.body.append(documentDownloadLink)
  documentDownloadLink.click()
  documentDownloadLink.remove()
  window.setTimeout(() => URL.revokeObjectURL(documentObjectUrl), 0)
}

const handleDocumentDownload = async (archivedDocument: ArchivedDocument) => {
  const documentContent = await dashboardStore.downloadArchivedDocument(
    archivedDocument.id,
  )

  if (!documentContent) {
    showErrorToast(
      documentDownloadErrorMessage.value ||
        t('dashboard.recentDocuments.downloadFailed'),
    )
    return
  }

  saveDocumentContent(documentContent, archivedDocument.name)
  showSuccessToast(
    t('dashboard.recentDocuments.downloadRequested', {
      fileName: archivedDocument.name,
    }),
  )
}

const handleDocumentPreview = async (archivedDocument: ArchivedDocument) => {
  selectedDocumentForPreview.value = archivedDocument
  previewDocumentContent.value = null

  const documentContent = await dashboardStore.previewArchivedDocument(
    archivedDocument.id,
  )

  if (
    selectedDocumentForPreview.value?.id !== archivedDocument.id ||
    !documentContent
  ) {
    return
  }

  previewDocumentContent.value = documentContent
}

const handleDocumentPreviewDrawerClose = () => {
  selectedDocumentForPreview.value = null
  previewDocumentContent.value = null
}

const handleDocumentEmailSend = (archivedDocument: ArchivedDocument) => {
  showSuccessToast(
    t('dashboard.recentDocuments.emailSentSimulation', {
      emailAddress: authenticatedUserEmailAddress.value,
      fileName: archivedDocument.name,
    }),
  )
}

const handleDocumentDeleteRequest = (archivedDocument: ArchivedDocument) => {
  dashboardStore.clearDocumentDeleteError()
  documentPendingDeletion.value = archivedDocument
}

const handleDocumentDeleteModalClose = () => {
  if (isSelectedDocumentDeleting.value) {
    return
  }

  dashboardStore.clearDocumentDeleteError()
  documentPendingDeletion.value = null
}

const refreshDocumentHistoryAfterDeletion = async (
  wasOnlyDocumentOnCurrentPage: boolean,
) => {
  const currentPageNumber = documentHistoryPagination.value.currentPage

  if (wasOnlyDocumentOnCurrentPage && currentPageNumber > 1) {
    await router.replace({
      name: 'document-history',
      query: createDocumentHistoryRouteQuery(
        selectedFilters.value,
        currentPageNumber - 1,
      ),
    })
    return
  }

  await fetchSelectedDocumentHistory()
}

const handleDocumentDeleteConfirm = async () => {
  const archivedDocument = documentPendingDeletion.value

  if (!archivedDocument || isSelectedDocumentDeleting.value) {
    return
  }

  const wasOnlyDocumentOnCurrentPage = archivedDocuments.value.length === 1
  const isDocumentDeleted = await dashboardStore.deleteArchivedDocument(
    archivedDocument.id,
  )

  if (!isDocumentDeleted) {
    return
  }

  documentPendingDeletion.value = null

  if (selectedDocumentForPreview.value?.id === archivedDocument.id) {
    handleDocumentPreviewDrawerClose()
  }

  await refreshDocumentHistoryAfterDeletion(wasOnlyDocumentOnCurrentPage)
  showSuccessToast(
    t('dashboard.recentDocuments.deleteSucceeded', {
      fileName: archivedDocument.name,
    }),
  )
}

watch(
  () => route.fullPath,
  () => {
    void fetchSelectedDocumentHistory()
  },
  { immediate: true },
)
</script>

<style scoped src="./DocumentHistoryPage.css"></style>
