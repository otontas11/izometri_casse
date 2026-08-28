<template>
  <nav
    v-if="totalItems > 0"
    class="document-history-pagination"
    :aria-label="t('documentHistory.pagination.ariaLabel')"
  >
    <p>
      {{
        t('documentHistory.pagination.summary', {
          firstRecord: firstVisibleRecordNumber,
          lastRecord: lastVisibleRecordNumber,
          totalRecords: totalItems,
        })
      }}
    </p>

    <div class="document-history-pagination__controls">
      <button
        type="button"
        :disabled="isLoading || currentPage <= 1"
        @click="handlePageChange(currentPage - 1)"
      >
        {{ t('documentHistory.pagination.previous') }}
      </button>

      <button
        v-for="pageNumber in visiblePageNumbers"
        :key="pageNumber"
        type="button"
        :class="{
          'document-history-pagination__page-button--active':
            pageNumber === currentPage,
        }"
        :aria-current="pageNumber === currentPage ? 'page' : undefined"
        :aria-label="
          t('documentHistory.pagination.pageAriaLabel', { page: pageNumber })
        "
        :disabled="isLoading"
        @click="handlePageChange(pageNumber)"
      >
        {{ pageNumber }}
      </button>

      <button
        type="button"
        :disabled="isLoading || currentPage >= totalPages"
        @click="handlePageChange(currentPage + 1)"
      >
        {{ t('documentHistory.pagination.next') }}
      </button>
    </div>
  </nav>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  currentPage: number
  isLoading: boolean
  pageSize: number
  totalItems: number
  totalPages: number
}>()

const emit = defineEmits<{
  change: [pageNumber: number]
}>()

const { t } = useI18n({ useScope: 'global' })

const visiblePageNumbers = computed(() => {
  const maximumVisiblePageCount = 5
  const lastPossibleStartPage = Math.max(
    1,
    props.totalPages - maximumVisiblePageCount + 1,
  )
  const firstVisiblePage = Math.max(
    1,
    Math.min(props.currentPage - 2, lastPossibleStartPage),
  )
  const visiblePageCount = Math.min(
    maximumVisiblePageCount,
    props.totalPages,
  )

  return Array.from(
    { length: visiblePageCount },
    (_, pageIndex) => firstVisiblePage + pageIndex,
  )
})

const firstVisibleRecordNumber = computed(() =>
  props.totalItems === 0
    ? 0
    : (props.currentPage - 1) * props.pageSize + 1,
)
const lastVisibleRecordNumber = computed(() =>
  Math.min(props.currentPage * props.pageSize, props.totalItems),
)

const handlePageChange = (pageNumber: number) => {
  if (
    props.isLoading ||
    pageNumber < 1 ||
    pageNumber > props.totalPages ||
    pageNumber === props.currentPage
  ) {
    return
  }

  emit('change', pageNumber)
}
</script>

<style scoped src="./DocumentHistoryPagination.css"></style>
