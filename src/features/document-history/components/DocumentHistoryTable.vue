<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import type {
  ArchivedDocument,
  DocumentOperation,
} from '@/features/dashboard/types/dashboard.types'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

defineProps<{
  archivedDocuments: ArchivedDocument[]
  errorMessage: string
  hasActiveFilters: boolean
  isLoading: boolean
  totalDocumentCount: number
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n({ useScope: 'global' })
const documentOperationTranslationKeys: Record<DocumentOperation, string> = {
  signature: 'documentHistory.operations.signature',
  timestamp: 'documentHistory.operations.timestamp',
}
</script>

<template>
  <section
    class="document-history-table"
    aria-labelledby="document-history-table-title"
    :aria-busy="isLoading"
  >
    <header class="document-history-table__header">
      <div>
        <span>{{ t('documentHistory.table.eyebrow') }}</span>
        <h2 id="document-history-table-title">
          {{ t('documentHistory.table.title') }}
        </h2>
      </div>
      <strong>
        {{
          t('documentHistory.table.recordCount', {
            count: totalDocumentCount,
          })
        }}
      </strong>
    </header>

    <div
      v-if="isLoading"
      class="document-history-table__loading-state"
      role="status"
      :aria-label="t('documentHistory.table.loading')"
    >
      <span v-for="skeletonIndex in 5" :key="skeletonIndex"></span>
    </div>

    <div
      v-else-if="errorMessage"
      class="document-history-table__error-state"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      <h3>{{ t('documentHistory.table.errorTitle') }}</h3>
      <p>{{ errorMessage }}</p>
      <button type="button" @click="emit('retry')">
        <AppIcon name="refresh" :size="17" />
        {{ t('common.retry') }}
      </button>
    </div>

    <table
      v-else-if="archivedDocuments.length"
      class="document-history-table__content"
    >
      <caption class="visually-hidden">
        {{ t('documentHistory.table.caption') }}
      </caption>
      <thead>
        <tr class="document-history-table__column-headings">
          <th scope="col">{{ t('documentHistory.table.document') }}</th>
          <th scope="col">{{ t('documentHistory.table.operation') }}</th>
          <th scope="col">{{ t('documentHistory.table.date') }}</th>
          <th scope="col">{{ t('documentHistory.table.size') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="archivedDocument in archivedDocuments"
          :key="archivedDocument.id"
          class="document-history-table__row"
        >
          <td
            class="document-history-table__file"
            :data-label="t('documentHistory.table.document')"
          >
            <span aria-hidden="true">
              <AppIcon name="document" :size="20" />
            </span>
            <div>
              <strong :title="archivedDocument.name">
                {{ archivedDocument.name }}
              </strong>
              <small>
                #IZ-{{ String(archivedDocument.id).padStart(4, '0') }}
              </small>
            </div>
          </td>
          <td
            class="document-history-table__operation-cell"
            :data-label="t('documentHistory.table.operation')"
          >
            <span
              :class="[
                'document-history-table__operation',
                `document-history-table__operation--${archivedDocument.operation}`,
              ]"
            >
              {{ t(documentOperationTranslationKeys[archivedDocument.operation]) }}
            </span>
          </td>
          <td
            class="document-history-table__date-cell"
            :data-label="t('documentHistory.table.date')"
          >
            <time :datetime="archivedDocument.createdAt">
              {{ formatDateTime(archivedDocument.createdAt) }}
            </time>
          </td>
          <td
            class="document-history-table__size-cell"
            :data-label="t('documentHistory.table.size')"
          >
            {{ formatFileSize(archivedDocument.sizeBytes) }}
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="document-history-table__empty-state">
      <span aria-hidden="true">
        <AppIcon name="archive" :size="27" />
      </span>
      <h3>
        {{
          hasActiveFilters
            ? t('documentHistory.table.filteredEmptyTitle')
            : t('documentHistory.table.emptyTitle')
        }}
      </h3>
      <p>
        {{
          hasActiveFilters
            ? t('documentHistory.table.filteredEmptyDescription')
            : t('documentHistory.table.emptyDescription')
        }}
      </p>
    </div>
  </section>
</template>

<style scoped src="./DocumentHistoryTable.css"></style>
