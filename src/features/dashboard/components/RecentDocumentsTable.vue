<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import type {
  ArchivedDocument,
  DocumentOperation,
} from '@/features/dashboard/types/dashboard.types'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

defineProps<{
  archivedDocuments: ArchivedDocument[]
  deletingDocumentId: number | null
  downloadingDocumentId: number | null
  previewingDocumentId: number | null
}>()

const emit = defineEmits<{
  delete: [archivedDocument: ArchivedDocument]
  download: [archivedDocument: ArchivedDocument]
  preview: [archivedDocument: ArchivedDocument]
  'send-email': [archivedDocument: ArchivedDocument]
}>()

const { t } = useI18n({ useScope: 'global' })
const openDocumentMenuId = ref<number | null>(null)

const documentOperationTranslationKeys: Record<DocumentOperation, string> = {
  signature: 'dashboard.recentDocuments.electronicSignature',
  timestamp: 'dashboard.recentDocuments.timestamp',
}

const handleDocumentDownload = (archivedDocument: ArchivedDocument) => {
  emit('download', archivedDocument)
}

const getDocumentMenuElementId = (documentId: number) =>
  `archived-document-menu-${documentId}`

const handleDocumentMenuToggle = (documentId: number) => {
  openDocumentMenuId.value =
    openDocumentMenuId.value === documentId ? null : documentId
}

const handleDocumentPreview = (archivedDocument: ArchivedDocument) => {
  emit('preview', archivedDocument)
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
    !pointerTarget.closest('[data-document-menu]')
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

<template>
  <section
    class="recent-documents-table"
    aria-labelledby="recent-documents-title"
  >
    <header class="recent-documents-table__heading">
      <div>
        <p>{{ t('dashboard.recentDocuments.eyebrow') }}</p>
        <h2 id="recent-documents-title">
          {{ t('dashboard.recentDocuments.title') }}
        </h2>
      </div>
      <span>
        {{
          t('dashboard.recentDocuments.recordCount', {
            count: archivedDocuments.length,
          })
        }}
      </span>
    </header>

    <table
      v-if="archivedDocuments.length"
      class="recent-documents-table__content"
    >
      <caption class="visually-hidden">
        {{ t('dashboard.recentDocuments.title') }}
      </caption>
      <thead>
        <tr class="recent-documents-table__column-headings">
          <th scope="col">{{ t('dashboard.recentDocuments.document') }}</th>
          <th scope="col">{{ t('dashboard.recentDocuments.operation') }}</th>
          <th scope="col">{{ t('dashboard.recentDocuments.date') }}</th>
          <th scope="col">{{ t('dashboard.recentDocuments.size') }}</th>
          <th scope="col">{{ t('dashboard.recentDocuments.actions') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="archivedDocument in archivedDocuments"
          :key="archivedDocument.id"
          class="recent-documents-table__row"
        >
          <td
            class="recent-documents-table__file"
            :data-label="t('dashboard.recentDocuments.document')"
          >
            <span aria-hidden="true">
              <AppIcon name="document" :size="20" />
            </span>
            <div>
              <strong>{{ archivedDocument.name }}</strong>
              <small>
                #IZ-{{ String(archivedDocument.id).padStart(4, '0') }}
              </small>
            </div>
          </td>
          <td
            class="recent-documents-table__operation-cell"
            :data-label="t('dashboard.recentDocuments.operation')"
          >
            <span
              :class="[
                'recent-documents-table__operation',
                `recent-documents-table__operation--${archivedDocument.operation}`,
              ]"
            >
              {{ t(documentOperationTranslationKeys[archivedDocument.operation]) }}
            </span>
          </td>
          <td
            class="recent-documents-table__date-cell"
            :data-label="t('dashboard.recentDocuments.date')"
          >
            <time :datetime="archivedDocument.createdAt">
              {{ formatDateTime(archivedDocument.createdAt) }}
            </time>
          </td>
          <td
            class="recent-documents-table__size-cell"
            :data-label="t('dashboard.recentDocuments.size')"
          >
            {{ formatFileSize(archivedDocument.sizeBytes) }}
          </td>
          <td
            class="recent-documents-table__actions"
            :data-label="t('dashboard.recentDocuments.actions')"
          >
            <button
              type="button"
              class="recent-documents-table__preview-button"
              :disabled="
                previewingDocumentId !== null || deletingDocumentId !== null
              "
              :aria-busy="previewingDocumentId === archivedDocument.id"
              :aria-label="
                t('dashboard.recentDocuments.previewAriaLabel', {
                  fileName: archivedDocument.name,
                })
              "
              :title="t('dashboard.recentDocuments.previewTitle')"
              @click="handleDocumentPreview(archivedDocument)"
            >
              <AppIcon name="eye" :size="17" />
            </button>
            <button
              type="button"
              class="recent-documents-table__download-button"
              :disabled="
                downloadingDocumentId !== null || deletingDocumentId !== null
              "
              :aria-busy="downloadingDocumentId === archivedDocument.id"
              :aria-label="
                t('dashboard.recentDocuments.downloadAriaLabel', {
                  fileName: archivedDocument.name,
                })
              "
              :title="t('dashboard.recentDocuments.downloadTitle')"
              @click="handleDocumentDownload(archivedDocument)"
            >
              <AppIcon name="download" :size="18" />
            </button>

            <div
              class="recent-documents-table__action-menu"
              data-document-menu
            >
              <button
                type="button"
                class="recent-documents-table__menu-button"
                :disabled="deletingDocumentId !== null"
                aria-haspopup="menu"
                :aria-expanded="openDocumentMenuId === archivedDocument.id"
                :aria-controls="getDocumentMenuElementId(archivedDocument.id)"
                :aria-label="
                  t('dashboard.recentDocuments.menuAriaLabel', {
                    fileName: archivedDocument.name,
                  })
                "
                @click="handleDocumentMenuToggle(archivedDocument.id)"
              >
                <AppIcon name="more-horizontal" :size="19" />
              </button>

              <div
                v-if="openDocumentMenuId === archivedDocument.id"
                :id="getDocumentMenuElementId(archivedDocument.id)"
                class="recent-documents-table__menu"
                role="menu"
              >
                <button
                  type="button"
                  role="menuitem"
                  @click="handleDocumentEmailSend(archivedDocument)"
                >
                  <AppIcon name="mail" :size="17" />
                  <span>{{ t('dashboard.recentDocuments.sendByEmail') }}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  class="recent-documents-table__delete-menu-button"
                  :disabled="deletingDocumentId !== null"
                  @click="handleDocumentDelete(archivedDocument)"
                >
                  <AppIcon name="trash" :size="17" />
                  <span>
                    {{ t('dashboard.recentDocuments.deleteDocument') }}
                  </span>
                </button>
              </div>
            </div>
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else class="recent-documents-table__empty-state">
      <span aria-hidden="true">
        <AppIcon name="archive" :size="26" />
      </span>
      <h3>{{ t('dashboard.recentDocuments.emptyTitle') }}</h3>
      <p>{{ t('dashboard.recentDocuments.emptyDescription') }}</p>
      <RouterLink :to="{ name: 'signature' }">
        {{ t('dashboard.recentDocuments.createFirst') }}
      </RouterLink>
    </div>
  </section>
</template>

<style scoped>
.recent-documents-table {
  position: relative;
  overflow: visible;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.recent-documents-table__heading {
  display: flex;
  gap: 1rem;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1.4rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.recent-documents-table__heading p,
.recent-documents-table__heading h2,
.recent-documents-table__empty-state h3,
.recent-documents-table__empty-state p {
  margin: 0;
}

.recent-documents-table__heading p {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.recent-documents-table__heading h2 {
  margin-top: 0.35rem;
  color: var(--color-brand-950);
  font-size: 1.2rem;
  letter-spacing: -0.025em;
}

.recent-documents-table__heading > span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
}

.recent-documents-table__content {
  width: 100%;
  border-collapse: collapse;
}

.recent-documents-table__content > thead,
.recent-documents-table__content > tbody {
  display: block;
}

.recent-documents-table__column-headings,
.recent-documents-table__row {
  display: grid;
  grid-template-columns: minmax(15rem, 2fr) minmax(8rem, 0.8fr) minmax(10rem, 1fr) minmax(5rem, 0.55fr) 7rem;
  gap: 1rem;
  align-items: center;
  padding-inline: 1.5rem;
}

.recent-documents-table__column-headings > th,
.recent-documents-table__row > td {
  min-width: 0;
  padding: 0;
  text-align: left;
}

.recent-documents-table__column-headings > th {
  font-weight: inherit;
}

.recent-documents-table__column-headings {
  min-height: 2.8rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: var(--color-surface-canvas);
}

.recent-documents-table__row {
  min-height: 5.25rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.recent-documents-table__row + .recent-documents-table__row {
  border-top: 1px solid var(--color-border);
}

.recent-documents-table__action-menu {
  position: relative;
  flex: 0 0 auto;
}

.recent-documents-table__menu-button {
  display: grid;
  width: 2rem;
  height: 2rem;
  padding: 0;
  place-items: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 0.5rem;
}

.recent-documents-table__menu-button :deep(.app-icon) {
  stroke-width: 3.4;
}

.recent-documents-table__menu-button:hover:not(:disabled),
.recent-documents-table__menu-button[aria-expanded='true'] {
  color: var(--color-brand-950);
  background: var(--color-surface-subtle);
}

.recent-documents-table__menu-button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.recent-documents-table__menu {
  position: absolute;
  bottom: calc(100% + 0.4rem);
  right: 0;
  z-index: 20;
  display: grid;
  width: 12rem;
  padding: 0.4rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 0.75rem;
  box-shadow: var(--shadow-md);
}

.recent-documents-table__menu > button {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  width: 100%;
  min-height: 2.35rem;
  padding: 0.55rem 0.65rem;
  color: var(--color-brand-950);
  font: inherit;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 0.5rem;
}

.recent-documents-table__menu > button:hover:not(:disabled) {
  background: var(--color-surface-subtle);
}

.recent-documents-table__menu > button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.recent-documents-table__menu > .recent-documents-table__delete-menu-button {
  color: var(--color-danger);
}

.recent-documents-table__file {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  min-width: 0;
}

.recent-documents-table__file > span {
  display: grid;
  flex: 0 0 auto;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: 0.75rem;
}

.recent-documents-table__file > div {
  display: grid;
  min-width: 0;
  gap: 0.2rem;
}

.recent-documents-table__file strong {
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.recent-documents-table__file small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.recent-documents-table__operation {
  display: inline-flex;
  width: fit-content;
  padding: 0.38rem 0.55rem;
  font-size: var(--font-size-small);
  font-weight: 800;
  border-radius: 999px;
}

.recent-documents-table__operation--timestamp {
  color: var(--color-success);
  background: var(--color-accent-100);
}

.recent-documents-table__operation--signature {
  color: #6141c0;
  background: #f0ebff;
}

.recent-documents-table__actions {
  display: flex;
  gap: 0.35rem;
  justify-content: flex-end;
}

.recent-documents-table__actions > button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  padding: 0;
  color: var(--color-text-secondary);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  background: transparent;
  border: 0;
  border-radius: 0.5rem;
}

.recent-documents-table__actions > button:hover:not(:disabled) {
  color: var(--color-brand-950);
  background: var(--color-surface-subtle);
}

.recent-documents-table__actions > button:disabled {
  cursor: not-allowed;
  opacity: 0.35;
}

.recent-documents-table__empty-state {
  display: grid;
  justify-items: center;
  padding: 3rem 1.5rem;
  text-align: center;
}

.recent-documents-table__empty-state > span {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: 1rem;
}

.recent-documents-table__empty-state h3 {
  margin-top: 1rem;
  color: var(--color-brand-950);
  font-size: 1rem;
}

.recent-documents-table__empty-state p {
  max-width: 28rem;
  margin-top: 0.5rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.6;
}

.recent-documents-table__empty-state a {
  margin-top: 1.25rem;
  padding: 0.65rem 0.85rem;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  font-weight: 800;
  text-decoration: none;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
}

@media (max-width: 79.99rem) {
  .recent-documents-table__column-headings,
  .recent-documents-table__row {
    grid-template-columns: minmax(13rem, 1.7fr) minmax(7rem, 0.8fr) minmax(9rem, 1fr) 7rem;
  }

  .recent-documents-table__column-headings > th:nth-child(4),
  .recent-documents-table__size-cell {
    display: none;
  }
}

@media (max-width: 47.99rem) {
  .recent-documents-table__heading {
    align-items: start;
  }

  .recent-documents-table__heading > span,
  .recent-documents-table__column-headings {
    display: none;
  }

  .recent-documents-table__row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 0.85rem 1rem;
    padding-block: 1.1rem;
  }

  .recent-documents-table__file {
    grid-column: 1 / -1;
  }

  .recent-documents-table__date-cell,
  .recent-documents-table__size-cell {
    display: block;
    grid-column: 1;
    font-size: var(--font-size-small);
  }

  .recent-documents-table__date-cell::before,
  .recent-documents-table__size-cell::before {
    margin-right: 0.35rem;
    color: var(--color-brand-950);
    content: attr(data-label) ':';
    font-weight: 800;
  }

  .recent-documents-table__operation-cell {
    grid-column: 1;
  }

  .recent-documents-table__actions {
    grid-row: 2 / span 3;
    grid-column: 2;
    align-self: center;
  }
}
</style>
