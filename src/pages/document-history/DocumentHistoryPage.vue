<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useRoute, useRouter } from 'vue-router'

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
import type { DocumentOperation } from '@/features/dashboard/types/dashboard.types'

const DOCUMENT_HISTORY_PAGE_SIZE = 10
const selectedDatePattern = /^\d{4}-\d{2}-\d{2}$/
const validDocumentFileTypes = new Set<DocumentFileTypeFilter>(
  documentFileTypeFilters,
)
const validDocumentOperations = new Set<DocumentOperation>([
  'signature',
  'timestamp',
])

const documentHistoryStore = useDocumentHistoryStore()
const {
  archivedDocuments,
  documentHistoryErrorMessage,
  documentHistoryPagination,
  isDocumentHistoryLoading,
} = storeToRefs(documentHistoryStore)
const route = useRoute()
const router = useRouter()
const { t } = useI18n({ useScope: 'global' })
const selectedFilters = ref<DocumentHistoryFilterValues>(
  createEmptyDocumentHistoryFilters(),
)

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

const fetchSelectedDocumentHistory = () => {
  const documentHistoryRequest = createDocumentHistoryRequestFromRoute()
  selectedFilters.value = {
    fileNameSearch: documentHistoryRequest.fileNameSearch,
    fileTypes: [...documentHistoryRequest.fileTypes],
    operations: [...documentHistoryRequest.operations],
    selectedDate: documentHistoryRequest.selectedDate,
  }
  void documentHistoryStore.fetchDocumentHistory(documentHistoryRequest)
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
  fetchSelectedDocumentHistory()
}

watch(() => route.fullPath, fetchSelectedDocumentHistory, { immediate: true })
</script>

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
      :error-message="documentHistoryErrorMessage"
      :has-active-filters="hasActiveFilters"
      :is-loading="isDocumentHistoryLoading"
      :total-document-count="documentHistoryPagination.totalItems"
      @retry="handleDocumentHistoryRetry"
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
  </section>
</template>

<style scoped src="./DocumentHistoryPage.css"></style>
