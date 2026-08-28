<script lang="ts" setup>
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type {
  DocumentFileTypeFilter,
  DocumentHistoryFilters,
} from '../types/documentHistory.types'

const props = defineProps<{
  filters: DocumentHistoryFilters
  isLoading: boolean
}>()

const emit = defineEmits<{
  apply: [documentHistoryFilters: DocumentHistoryFilters]
  reset: []
}>()

const { t } = useI18n({ useScope: 'global' })
const filterForm = reactive<DocumentHistoryFilters>({ ...props.filters })

const fileTypeOptions: Array<{
  translationKey: string
  value: DocumentFileTypeFilter
}> = [
  { translationKey: 'documentHistory.fileTypes.pdf', value: 'pdf' },
  { translationKey: 'documentHistory.fileTypes.xml', value: 'xml' },
  { translationKey: 'documentHistory.fileTypes.word', value: 'word' },
  { translationKey: 'documentHistory.fileTypes.excel', value: 'excel' },
  { translationKey: 'documentHistory.fileTypes.eyp', value: 'eyp' },
  { translationKey: 'documentHistory.fileTypes.udf', value: 'udf' },
  { translationKey: 'documentHistory.fileTypes.office', value: 'office' },
  { translationKey: 'documentHistory.fileTypes.text', value: 'text' },
  { translationKey: 'documentHistory.fileTypes.image', value: 'image' },
]

const hasEnteredFilter = computed(() =>
  Object.values(filterForm).some((filterValue) => Boolean(filterValue)),
)

const handleFilterSubmit = () => {
  emit('apply', {
    ...filterForm,
    fileNameSearch: filterForm.fileNameSearch.trim(),
  })
}

const handleFiltersReset = () => {
  emit('reset')
}

watch(
  () => props.filters,
  (updatedFilters) => {
    Object.assign(filterForm, updatedFilters)
  },
  { deep: true },
)
</script>

<template>
  <form class="document-history-filters" @submit.prevent="handleFilterSubmit">
    <div class="document-history-filters__field">
      <label for="document-history-file-search">
        {{ t('documentHistory.filters.fileSearch') }}
      </label>
      <input
        id="document-history-file-search"
        v-model="filterForm.fileNameSearch"
        type="search"
        maxlength="100"
        :placeholder="t('documentHistory.filters.fileSearchPlaceholder')"
      />
    </div>

    <div class="document-history-filters__field">
      <label for="document-history-date">
        {{ t('documentHistory.filters.date') }}
      </label>
      <input
        id="document-history-date"
        v-model="filterForm.selectedDate"
        type="date"
      />
    </div>

    <div class="document-history-filters__field">
      <label for="document-history-file-type">
        {{ t('documentHistory.filters.fileType') }}
      </label>
      <select id="document-history-file-type" v-model="filterForm.fileType">
        <option value="">
          {{ t('documentHistory.filters.allFileTypes') }}
        </option>
        <option
          v-for="fileTypeOption in fileTypeOptions"
          :key="fileTypeOption.value"
          :value="fileTypeOption.value"
        >
          {{ t(fileTypeOption.translationKey) }}
        </option>
      </select>
    </div>

    <div class="document-history-filters__field">
      <label for="document-history-operation">
        {{ t('documentHistory.filters.operation') }}
      </label>
      <select
        id="document-history-operation"
        v-model="filterForm.operation"
      >
        <option value="">
          {{ t('documentHistory.filters.allOperations') }}
        </option>
        <option value="signature">
          {{ t('documentHistory.operations.signature') }}
        </option>
        <option value="timestamp">
          {{ t('documentHistory.operations.timestamp') }}
        </option>
      </select>
    </div>

    <div class="document-history-filters__actions">
      <button
        class="document-history-filters__reset-button"
        type="button"
        :disabled="isLoading || !hasEnteredFilter"
        @click="handleFiltersReset"
      >
        {{ t('documentHistory.filters.clear') }}
      </button>
      <button
        class="document-history-filters__submit-button"
        type="submit"
        :disabled="isLoading"
      >
        {{
          isLoading
            ? t('documentHistory.filters.filtering')
            : t('documentHistory.filters.apply')
        }}
      </button>
    </div>
  </form>
</template>

<style scoped src="./DocumentHistoryFilters.css"></style>
