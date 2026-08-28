<script lang="ts" setup>
import { computed, onBeforeUnmount, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import BaseMultiSelect from '@/components/ui/BaseMultiSelect.vue'
import type { DocumentOperation } from '@/features/dashboard/types/dashboard.types'

import {
  documentFileTypeFilters,
  type DocumentFileTypeFilter,
  type DocumentHistoryFilters,
} from '../types/documentHistory.types'

const FILE_NAME_SEARCH_DEBOUNCE_MILLISECONDS = 500
const supportedDocumentFileTypes = new Set<DocumentFileTypeFilter>(
  documentFileTypeFilters,
)
const supportedDocumentOperations = new Set<DocumentOperation>([
  'signature',
  'timestamp',
])

const props = defineProps<{
  filters: DocumentHistoryFilters
}>()

const emit = defineEmits<{
  change: [documentHistoryFilters: DocumentHistoryFilters]
  reset: []
}>()

const { t } = useI18n({ useScope: 'global' })
const filterForm = reactive<DocumentHistoryFilters>({
  ...props.filters,
  fileTypes: [...props.filters.fileTypes],
  operations: [...props.filters.operations],
})
let fileNameSearchDebounceId: number | null = null

const fileTypeOptions = computed(() => [
  { label: t('documentHistory.fileTypes.pdf'), value: 'pdf' },
  { label: t('documentHistory.fileTypes.xml'), value: 'xml' },
  { label: t('documentHistory.fileTypes.word'), value: 'word' },
  { label: t('documentHistory.fileTypes.excel'), value: 'excel' },
  { label: t('documentHistory.fileTypes.eyp'), value: 'eyp' },
  { label: t('documentHistory.fileTypes.udf'), value: 'udf' },
  { label: t('documentHistory.fileTypes.office'), value: 'office' },
  { label: t('documentHistory.fileTypes.text'), value: 'text' },
  { label: t('documentHistory.fileTypes.image'), value: 'image' },
])
const operationOptions = computed(() => [
  {
    label: t('documentHistory.operations.signature'),
    value: 'signature',
  },
  {
    label: t('documentHistory.operations.timestamp'),
    value: 'timestamp',
  },
])
const hasEnteredFilter = computed(
  () =>
    Boolean(filterForm.fileNameSearch) ||
    Boolean(filterForm.selectedDate) ||
    filterForm.fileTypes.length > 0 ||
    filterForm.operations.length > 0,
)

const clearFileNameSearchDebounce = () => {
  if (fileNameSearchDebounceId === null) {
    return
  }

  window.clearTimeout(fileNameSearchDebounceId)
  fileNameSearchDebounceId = null
}

const emitFilterChange = () => {
  emit('change', {
    fileNameSearch: filterForm.fileNameSearch.trim(),
    fileTypes: [...filterForm.fileTypes],
    operations: [...filterForm.operations],
    selectedDate: filterForm.selectedDate,
  })
}

const handleFileNameSearchInput = () => {
  clearFileNameSearchDebounce()
  fileNameSearchDebounceId = window.setTimeout(() => {
    fileNameSearchDebounceId = null
    emitFilterChange()
  }, FILE_NAME_SEARCH_DEBOUNCE_MILLISECONDS)
}

const handleDateChange = () => {
  clearFileNameSearchDebounce()
  emitFilterChange()
}

const handleDateClear = () => {
  clearFileNameSearchDebounce()
  filterForm.selectedDate = ''
  emitFilterChange()
}

const handleFileTypeSelectionChange = (selectedValues: string[]) => {
  filterForm.fileTypes = selectedValues.filter(
    (selectedValue): selectedValue is DocumentFileTypeFilter =>
      supportedDocumentFileTypes.has(
        selectedValue as DocumentFileTypeFilter,
      ),
  )
}

const handleOperationSelectionChange = (selectedValues: string[]) => {
  filterForm.operations = selectedValues.filter(
    (selectedValue): selectedValue is DocumentOperation =>
      supportedDocumentOperations.has(selectedValue as DocumentOperation),
  )
}

const handleMultiSelectSelectionComplete = () => {
  clearFileNameSearchDebounce()
  emitFilterChange()
}

const handleFiltersReset = () => {
  clearFileNameSearchDebounce()
  emit('reset')
}

watch(
  () => props.filters,
  (updatedFilters) => {
    clearFileNameSearchDebounce()
    Object.assign(filterForm, {
      ...updatedFilters,
      fileTypes: [...updatedFilters.fileTypes],
      operations: [...updatedFilters.operations],
    })
  },
  { deep: true },
)

onBeforeUnmount(clearFileNameSearchDebounce)
</script>

<template>
  <section
    class="document-history-filters"
    :aria-label="t('documentHistory.filters.ariaLabel')"
  >
    <div class="document-history-filters__field">
      <label for="document-history-file-search">
        {{ t('documentHistory.filters.fileSearch') }}
      </label>
      <div class="document-history-filters__control">
        <AppIcon name="search" :size="18" />
        <input
          id="document-history-file-search"
          v-model="filterForm.fileNameSearch"
          type="search"
          maxlength="100"
          :placeholder="t('documentHistory.filters.fileSearchPlaceholder')"
          @input="handleFileNameSearchInput"
        />
      </div>
    </div>

    <div class="document-history-filters__field">
      <label for="document-history-date">
        {{ t('documentHistory.filters.date') }}
      </label>
      <div
        :class="[
          'document-history-filters__control',
          'document-history-filters__control--date',
          {
            'document-history-filters__control--date-selected':
              filterForm.selectedDate,
          },
        ]"
      >
        <span class="document-history-filters__date-icon" aria-hidden="true">
          <AppIcon name="calendar" :size="17" />
        </span>
        <input
          id="document-history-date"
          v-model="filterForm.selectedDate"
          type="date"
          @change="handleDateChange"
        />
        <button
          v-if="filterForm.selectedDate"
          class="document-history-filters__date-clear-button"
          type="button"
          :aria-label="t('documentHistory.filters.clearDateAriaLabel')"
          @click="handleDateClear"
        >
          <AppIcon name="close" :size="15" />
        </button>
      </div>
    </div>

    <BaseMultiSelect
      id="document-history-file-types"
      :clear-text="t('documentHistory.filters.clearSelections')"
      :label="t('documentHistory.filters.fileType')"
      :model-value="filterForm.fileTypes"
      :multiple-selection-text="
        t('documentHistory.filters.selectedCount', {
          count: filterForm.fileTypes.length,
        })
      "
      :options="fileTypeOptions"
      :placeholder="t('documentHistory.filters.allFileTypes')"
      @selection-complete="handleMultiSelectSelectionComplete"
      @update:model-value="handleFileTypeSelectionChange"
    />

    <BaseMultiSelect
      id="document-history-operations"
      :clear-text="t('documentHistory.filters.clearSelections')"
      :label="t('documentHistory.filters.operation')"
      :model-value="filterForm.operations"
      :multiple-selection-text="
        t('documentHistory.filters.selectedCount', {
          count: filterForm.operations.length,
        })
      "
      :options="operationOptions"
      :placeholder="t('documentHistory.filters.allOperations')"
      @selection-complete="handleMultiSelectSelectionComplete"
      @update:model-value="handleOperationSelectionChange"
    />

    <div class="document-history-filters__actions">
      <button
        class="document-history-filters__reset-button"
        type="button"
        :disabled="!hasEnteredFilter"
        @click="handleFiltersReset"
      >
        {{ t('documentHistory.filters.clear') }}
      </button>
    </div>
  </section>
</template>

<style scoped src="./DocumentHistoryFilters.css"></style>
