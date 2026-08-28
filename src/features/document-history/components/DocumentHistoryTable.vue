<template>
  <section class="document-history-table"
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

    <div v-if="isLoading"
         class="document-history-table__loading-state"
         role="status"
         :aria-label="t('documentHistory.table.loading')"
    >
      <span v-for="skeletonIndex in 5" :key="skeletonIndex"></span>
    </div>

    <div v-else-if="errorMessage"
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

    <table v-else-if="archivedDocuments.length"
           class="document-history-table__content"
    >
      <caption class="visually-hidden">
        {{
          t('documentHistory.table.caption')
        }}
      </caption>
      <thead>
        <tr class="document-history-table__column-headings">
          <th scope="col">{{ t('documentHistory.table.document') }}</th>
          <th scope="col">{{ t('documentHistory.table.operation') }}</th>
          <th scope="col">{{ t('documentHistory.table.date') }}</th>
          <th scope="col">{{ t('documentHistory.table.size') }}</th>
          <th scope="col">{{ t('documentHistory.table.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="archivedDocument in archivedDocuments"
            :key="archivedDocument.id"
            class="document-history-table__row"
        >
          <td class="document-history-table__file"
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
          <td class="document-history-table__operation-cell"
              :data-label="t('documentHistory.table.operation')"
          >
            <span :class="[
              'document-history-table__operation',
              `document-history-table__operation--${archivedDocument.operation}`,
            ]"
            >
              {{
                t(documentOperationTranslationKeys[archivedDocument.operation])
              }}
            </span>
          </td>
          <td class="document-history-table__date-cell"
              :data-label="t('documentHistory.table.date')"
          >
            <time :datetime="archivedDocument.createdAt">
              {{ formatDateTime(archivedDocument.createdAt) }}
            </time>
          </td>
          <td class="document-history-table__size-cell"
              :data-label="t('documentHistory.table.size')"
          >
            {{ formatFileSize(archivedDocument.sizeBytes) }}
          </td>
          <td class="document-history-table__actions">
            <button type="button"
                    class="document-history-table__preview-button"
                    :disabled="
                      previewingDocumentId !== null || deletingDocumentId !== null
                    "
                    :aria-busy="previewingDocumentId === archivedDocument.id"
                    :aria-label="
                      t('documentHistory.table.previewAriaLabel', {
                        fileName: archivedDocument.name,
                      })
                    "
                    :title="t('documentHistory.table.previewTitle')"
                    @click="handleDocumentPreview(archivedDocument)"
            >
              <AppIcon name="eye" :size="17" />
            </button>

            <button type="button"
                    class="document-history-table__download-button"
                    :disabled="
                      downloadingDocumentId !== null || deletingDocumentId !== null
                    "
                    :aria-busy="downloadingDocumentId === archivedDocument.id"
                    :aria-label="
                      t('documentHistory.table.downloadAriaLabel', {
                        fileName: archivedDocument.name,
                      })
                    "
                    :title="t('documentHistory.table.downloadTitle')"
                    @click="handleDocumentDownload(archivedDocument)"
            >
              <AppIcon name="download" :size="18" />
            </button>

            <div class="document-history-table__action-menu"
                 data-document-history-menu
            >
              <button type="button"
                      class="document-history-table__menu-button"
                      :disabled="deletingDocumentId !== null"
                      aria-haspopup="menu"
                      :aria-expanded="openDocumentMenuId === archivedDocument.id"
                      :aria-controls="getDocumentMenuElementId(archivedDocument.id)"
                      :aria-label="
                        t('documentHistory.table.menuAriaLabel', {
                          fileName: archivedDocument.name,
                        })
                      "
                      @click="handleDocumentMenuToggle(archivedDocument.id)"
              >
                <AppIcon name="more-horizontal" :size="19" />
              </button>

              <div v-if="openDocumentMenuId === archivedDocument.id"
                   :id="getDocumentMenuElementId(archivedDocument.id)"
                   class="document-history-table__menu"
                   role="menu"
              >
                <button type="button"
                        role="menuitem"
                        @click="handleDocumentEmailSend(archivedDocument)"
                >
                  <AppIcon name="mail" :size="17" />
                  <span>{{ t('documentHistory.table.sendByEmail') }}</span>
                </button>
                <button type="button"
                        role="menuitem"
                        class="document-history-table__delete-menu-button"
                        :disabled="deletingDocumentId !== null"
                        @click="handleDocumentDelete(archivedDocument)"
                >
                  <AppIcon name="trash" :size="17" />
                  <span>{{ t('documentHistory.table.deleteDocument') }}</span>
                </button>
              </div>
            </div>
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

<script lang="ts" setup>
import { onBeforeUnmount, onMounted, ref } from 'vue'
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
  deletingDocumentId: number | null
  downloadingDocumentId: number | null
  previewingDocumentId: number | null
  totalDocumentCount: number
}>()

const emit = defineEmits<{
  delete: [archivedDocument: ArchivedDocument]
  download: [archivedDocument: ArchivedDocument]
  preview: [archivedDocument: ArchivedDocument]
  retry: []
  'send-email': [archivedDocument: ArchivedDocument]
}>()

const { t } = useI18n({ useScope: 'global' })
const openDocumentMenuId = ref<number | null>(null)
const documentOperationTranslationKeys: Record<DocumentOperation, string> = {
  signature: 'documentHistory.operations.signature',
  timestamp: 'documentHistory.operations.timestamp',
}

const getDocumentMenuElementId = (documentId: number) =>
  `document-history-menu-${documentId}`

const handleDocumentPreview = (archivedDocument: ArchivedDocument) => {
  emit('preview', archivedDocument)
}

const handleDocumentDownload = (archivedDocument: ArchivedDocument) => {
  emit('download', archivedDocument)
}

const handleDocumentMenuToggle = (documentId: number) => {
  openDocumentMenuId.value =
    openDocumentMenuId.value === documentId ? null : documentId
}

const handleDocumentEmailSend = (archivedDocument: ArchivedDocument) => {
  openDocumentMenuId.value = null
  emit('send-email', archivedDocument)
}

const handleDocumentDelete = (archivedDocument: ArchivedDocument) => {
  openDocumentMenuId.value = null
  emit('delete', archivedDocument)
}

const handleDocumentMenuOutsidePointerDown = (pointerEvent: PointerEvent) => {
  const pointerTarget = pointerEvent.target

  if (
    pointerTarget instanceof Element &&
    !pointerTarget.closest('[data-document-history-menu]')
  ) {
    openDocumentMenuId.value = null
  }
}

const handleDocumentMenuKeydown = (keyboardEvent: KeyboardEvent) => {
  if (keyboardEvent.key === 'Escape') {
    openDocumentMenuId.value = null
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handleDocumentMenuOutsidePointerDown)
  document.addEventListener('keydown', handleDocumentMenuKeydown)
})

onBeforeUnmount(() => {
  document.removeEventListener(
    'pointerdown',
    handleDocumentMenuOutsidePointerDown,
  )
  document.removeEventListener('keydown', handleDocumentMenuKeydown)
})
</script>

<style scoped src="./DocumentHistoryTable.css"></style>
