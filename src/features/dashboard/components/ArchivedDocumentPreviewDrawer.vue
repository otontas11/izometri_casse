<template>
  <Teleport to="body">
    <Transition name="archived-document-preview-drawer">
      <div
        v-if="isOpen && archivedDocument"
        class="archived-document-preview-drawer"
        @click.self="requestDrawerClose"
      >
        <aside
          ref="drawerPanelElement"
          class="archived-document-preview-drawer__panel"
          role="dialog"
          aria-modal="true"
          :aria-busy="isLoading"
          aria-labelledby="archived-document-preview-drawer-title"
        >
          <header class="archived-document-preview-drawer__header">
            <span aria-hidden="true">
              <AppIcon name="eye" :size="22" />
            </span>
            <div>
              <small>{{ t('dashboard.recentDocuments.previewEyebrow') }}</small>
              <h2 id="archived-document-preview-drawer-title">
                {{ archivedDocument.name }}
              </h2>
            </div>
            <button
              ref="closeButtonElement"
              type="button"
              :aria-label="t('dashboard.recentDocuments.previewCloseAriaLabel')"
              @click="requestDrawerClose"
            >
              <AppIcon name="close" :size="19" />
            </button>
          </header>

          <dl class="archived-document-preview-drawer__details">
            <div>
              <dt>{{ t('dashboard.recentDocuments.operation') }}</dt>
              <dd>
                {{
                  t(
                    documentOperationTranslationKeys[
                      archivedDocument.operation
                    ],
                  )
                }}
              </dd>
            </div>
            <div>
              <dt>{{ t('dashboard.recentDocuments.date') }}</dt>
              <dd>{{ formatDateTime(archivedDocument.createdAt) }}</dd>
            </div>
            <div>
              <dt>{{ t('dashboard.recentDocuments.size') }}</dt>
              <dd>{{ formatFileSize(archivedDocument.sizeBytes) }}</dd>
            </div>
          </dl>

          <div class="archived-document-preview-drawer__content">
            <div
              v-if="isLoading"
              class="archived-document-preview-drawer__loading-state"
              role="status"
            >
              <span aria-hidden="true"></span>
              <p>{{ t('dashboard.recentDocuments.previewLoading') }}</p>
            </div>

            <div
              v-else-if="displayedPreviewErrorMessage"
              class="archived-document-preview-drawer__error-state"
              role="alert"
            >
              <span aria-hidden="true">!</span>
              <h3>{{ t('dashboard.recentDocuments.previewErrorTitle') }}</h3>
              <p>{{ displayedPreviewErrorMessage }}</p>
              <button type="button" @click="handlePreviewRetry">
                <AppIcon name="refresh" :size="17" />
                {{ t('common.retry') }}
              </button>
            </div>

            <div
              v-else-if="documentPreviewMode === 'image' && documentObjectUrl"
              class="archived-document-preview-drawer__image-preview"
            >
              <img :src="documentObjectUrl" :alt="archivedDocument.name" />
            </div>

            <iframe
              v-else-if="documentPreviewMode === 'pdf' && documentObjectUrl"
              class="archived-document-preview-drawer__pdf-preview"
              :src="documentObjectUrl"
              :title="
                t('dashboard.recentDocuments.previewFrameTitle', {
                  fileName: archivedDocument.name,
                })
              "
            ></iframe>

            <div
              v-else-if="documentPreviewMode === 'text'"
              class="archived-document-preview-drawer__text-preview"
            >
              <p v-if="isTextPreviewTruncated">
                {{ t('dashboard.recentDocuments.previewTruncated') }}
              </p>
              <pre>{{ documentTextContent }}</pre>
            </div>

            <div
              v-else
              class="archived-document-preview-drawer__unsupported-state"
            >
              <span aria-hidden="true">
                <AppIcon name="document" :size="28" />
              </span>
              <h3>{{ t('dashboard.recentDocuments.previewUnsupportedTitle') }}</h3>
              <p>
                {{
                  t('dashboard.recentDocuments.previewUnsupportedDescription')
                }}
              </p>
              <button type="button" @click="handleDocumentDownload">
                <AppIcon name="download" :size="17" />
                {{ t('dashboard.recentDocuments.downloadTitle') }}
              </button>
            </div>
          </div>
        </aside>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import type {
  ArchivedDocument,
  DocumentOperation,
} from '@/features/dashboard/types/dashboard.types'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

type ArchivedDocumentPreviewMode = 'image' | 'pdf' | 'text' | 'unsupported'

const MAXIMUM_TEXT_PREVIEW_CHARACTER_COUNT = 200_000

const props = withDefaults(
  defineProps<{
    archivedDocument: ArchivedDocument | null
    documentContent: Blob | null
    errorMessage?: string
    isLoading: boolean
    isOpen: boolean
  }>(),
  {
    errorMessage: '',
  },
)

const emit = defineEmits<{
  close: []
  download: [archivedDocument: ArchivedDocument]
  retry: [archivedDocument: ArchivedDocument]
}>()

const { t } = useI18n({ useScope: 'global' })
const drawerPanelElement = ref<HTMLElement | null>(null)
const closeButtonElement = ref<HTMLButtonElement | null>(null)
const documentObjectUrl = ref('')
const documentTextContent = ref('')
const documentTextErrorMessage = ref('')
const isTextPreviewTruncated = ref(false)
let previouslyFocusedElement: HTMLElement | null = null
let previousBodyOverflowValue = ''
let isBodyScrollLockedByDrawer = false

const documentOperationTranslationKeys: Record<DocumentOperation, string> = {
  signature: 'dashboard.recentDocuments.electronicSignature',
  timestamp: 'dashboard.recentDocuments.timestamp',
}

const getFileExtension = (fileName: string) => {
  const extensionSeparatorIndex = fileName.lastIndexOf('.')

  return extensionSeparatorIndex >= 0
    ? fileName.slice(extensionSeparatorIndex).toLowerCase()
    : ''
}

const getDocumentPreviewMode = (
  documentContent: Blob,
  documentFileName: string,
): ArchivedDocumentPreviewMode => {
  const normalizedMimeType = documentContent.type.toLowerCase()
  const fileExtension = getFileExtension(documentFileName)

  if (normalizedMimeType.startsWith('image/')) {
    return 'image'
  }

  if (normalizedMimeType.includes('pdf')) {
    return 'pdf'
  }

  if (
    normalizedMimeType.startsWith('text/') ||
    normalizedMimeType.includes('xml')
  ) {
    return 'text'
  }

  if (normalizedMimeType === 'application/octet-stream') {
    if (fileExtension === '.pdf') {
      return 'pdf'
    }

    if (fileExtension === '.xml' || fileExtension === '.ubl') {
      return 'text'
    }
  }

  return 'unsupported'
}

const documentPreviewMode = computed<ArchivedDocumentPreviewMode>(() => {
  if (!props.documentContent || !props.archivedDocument) {
    return 'unsupported'
  }

  return getDocumentPreviewMode(
    props.documentContent,
    props.archivedDocument.name,
  )
})

const displayedPreviewErrorMessage = computed(
  () => props.errorMessage || documentTextErrorMessage.value,
)

const revokeDocumentObjectUrl = () => {
  if (!documentObjectUrl.value) {
    return
  }

  URL.revokeObjectURL(documentObjectUrl.value)
  documentObjectUrl.value = ''
}

const resetDocumentPreviewContent = () => {
  revokeDocumentObjectUrl()
  documentTextContent.value = ''
  documentTextErrorMessage.value = ''
  isTextPreviewTruncated.value = false
}

const prepareDocumentPreviewContent = async (
  documentContent: Blob | null,
) => {
  resetDocumentPreviewContent()

  if (!documentContent || !props.archivedDocument) {
    return
  }

  const selectedPreviewMode = getDocumentPreviewMode(
    documentContent,
    props.archivedDocument.name,
  )

  if (selectedPreviewMode === 'text') {
    try {
      const completeDocumentText = await documentContent.text()

      if (props.documentContent !== documentContent) {
        return
      }

      documentTextContent.value = completeDocumentText.slice(
        0,
        MAXIMUM_TEXT_PREVIEW_CHARACTER_COUNT,
      )
      isTextPreviewTruncated.value =
        completeDocumentText.length > MAXIMUM_TEXT_PREVIEW_CHARACTER_COUNT
    } catch {
      documentTextErrorMessage.value = t(
        'dashboard.recentDocuments.previewFailed',
      )
    }
    return
  }

  if (selectedPreviewMode === 'image' || selectedPreviewMode === 'pdf') {
    documentObjectUrl.value = URL.createObjectURL(documentContent)
  }
}

const requestDrawerClose = () => {
  emit('close')
}

const handleDocumentDownload = () => {
  if (props.archivedDocument) {
    emit('download', props.archivedDocument)
  }
}

const handlePreviewRetry = () => {
  if (props.archivedDocument) {
    emit('retry', props.archivedDocument)
  }
}

const handleDocumentKeydown = (keyboardEvent: KeyboardEvent) => {
  if (!props.isOpen) {
    return
  }

  if (keyboardEvent.key === 'Escape') {
    keyboardEvent.preventDefault()
    requestDrawerClose()
    return
  }

  if (keyboardEvent.key !== 'Tab') {
    return
  }

  const focusableElements = Array.from(
    drawerPanelElement.value?.querySelectorAll<HTMLElement>(
      'button:not(:disabled), iframe, [href], [tabindex]:not([tabindex="-1"])',
    ) ?? [],
  )

  if (focusableElements.length === 0) {
    keyboardEvent.preventDefault()
    return
  }

  const firstFocusableElement = focusableElements[0]
  const lastFocusableElement = focusableElements[focusableElements.length - 1]
  const activeElement = document.activeElement

  if (
    keyboardEvent.shiftKey &&
    (activeElement === firstFocusableElement ||
      !drawerPanelElement.value?.contains(activeElement))
  ) {
    keyboardEvent.preventDefault()
    lastFocusableElement?.focus()
  } else if (
    !keyboardEvent.shiftKey &&
    activeElement === lastFocusableElement
  ) {
    keyboardEvent.preventDefault()
    firstFocusableElement?.focus()
  }
}

watch(
  () => props.documentContent,
  (documentContent) => {
    void prepareDocumentPreviewContent(documentContent)
  },
  { immediate: true },
)

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (isOpen) {
      previouslyFocusedElement =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
      previousBodyOverflowValue = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      isBodyScrollLockedByDrawer = true

      await nextTick()
      closeButtonElement.value?.focus()
      return
    }

    if (isBodyScrollLockedByDrawer) {
      document.body.style.overflow = previousBodyOverflowValue
      isBodyScrollLockedByDrawer = false
    }

    previouslyFocusedElement?.focus()
    previouslyFocusedElement = null
  },
)

onMounted(() => document.addEventListener('keydown', handleDocumentKeydown))

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleDocumentKeydown)
  revokeDocumentObjectUrl()

  if (isBodyScrollLockedByDrawer) {
    document.body.style.overflow = previousBodyOverflowValue
  }
})
</script>

<style scoped>
.archived-document-preview-drawer {
  position: fixed;
  inset: 0;
  z-index: 130;
  display: flex;
  justify-content: flex-end;
  background: color-mix(in srgb, var(--color-brand-950) 52%, transparent);
  backdrop-filter: blur(4px);
}

.archived-document-preview-drawer__panel {
  display: grid;
  grid-template-rows: auto auto minmax(0, 1fr);
  width: min(100%, 48rem);
  height: 100vh;
  height: 100dvh;
  background: var(--color-surface-raised);
  box-shadow: -1.5rem 0 4rem
    color-mix(in srgb, var(--color-brand-950) 22%, transparent);
}

.archived-document-preview-drawer__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.85rem;
  align-items: center;
  padding: 1.15rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.archived-document-preview-drawer__header > span {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: var(--radius-sm);
}

.archived-document-preview-drawer__header small,
.archived-document-preview-drawer__header h2,
.archived-document-preview-drawer__details,
.archived-document-preview-drawer__details dt,
.archived-document-preview-drawer__details dd,
.archived-document-preview-drawer__loading-state p,
.archived-document-preview-drawer__error-state h3,
.archived-document-preview-drawer__error-state p,
.archived-document-preview-drawer__unsupported-state h3,
.archived-document-preview-drawer__unsupported-state p,
.archived-document-preview-drawer__text-preview p,
.archived-document-preview-drawer__text-preview pre {
  margin: 0;
}

.archived-document-preview-drawer__header small {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.09em;
  text-transform: uppercase;
}

.archived-document-preview-drawer__header h2 {
  margin-top: 0.25rem;
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 1rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archived-document-preview-drawer__header button {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: var(--color-surface-subtle);
  border-radius: 50%;
}

.archived-document-preview-drawer__details {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.75rem;
  padding: 0.9rem 1.25rem;
  background: var(--color-surface-canvas);
  border-bottom: 1px solid var(--color-border);
}

.archived-document-preview-drawer__details div {
  min-width: 0;
  padding: 0.7rem 0.8rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.archived-document-preview-drawer__details dt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.archived-document-preview-drawer__details dd {
  margin-top: 0.25rem;
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 0.76rem;
  font-weight: 800;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.archived-document-preview-drawer__content {
  min-height: 0;
  padding: 1.25rem;
  overflow: hidden;
  background: var(--color-surface-canvas);
}

.archived-document-preview-drawer__loading-state,
.archived-document-preview-drawer__error-state,
.archived-document-preview-drawer__unsupported-state {
  display: grid;
  height: 100%;
  min-height: 18rem;
  place-content: center;
  justify-items: center;
  padding: 2rem;
  text-align: center;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.archived-document-preview-drawer__loading-state > span {
  width: 2rem;
  height: 2rem;
  border: 3px solid var(--color-primary-100);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: archived-document-preview-drawer-spin 700ms linear infinite;
}

.archived-document-preview-drawer__loading-state p {
  margin-top: 0.85rem;
  color: var(--color-text-secondary);
  font-size: 0.8rem;
}

.archived-document-preview-drawer__error-state > span {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: var(--color-danger);
  font-weight: 800;
  background: color-mix(in srgb, var(--color-danger) 8%, transparent);
  border-radius: 50%;
}

.archived-document-preview-drawer__error-state h3,
.archived-document-preview-drawer__unsupported-state h3 {
  margin-top: 0.9rem;
  color: var(--color-brand-950);
  font-size: 1rem;
}

.archived-document-preview-drawer__error-state p,
.archived-document-preview-drawer__unsupported-state p {
  max-width: 26rem;
  margin-top: 0.45rem;
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  line-height: 1.6;
}

.archived-document-preview-drawer__error-state button,
.archived-document-preview-drawer__unsupported-state button {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 2.6rem;
  margin-top: 1rem;
  padding: 0.65rem 0.85rem;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  font-weight: 800;
  cursor: pointer;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
}

.archived-document-preview-drawer__image-preview,
.archived-document-preview-drawer__pdf-preview,
.archived-document-preview-drawer__text-preview {
  width: 100%;
  height: 100%;
  min-height: 18rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.archived-document-preview-drawer__image-preview {
  display: grid;
  padding: 1rem;
  overflow: auto;
  place-items: center;
}

.archived-document-preview-drawer__image-preview img {
  display: block;
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.archived-document-preview-drawer__pdf-preview {
  display: block;
}

.archived-document-preview-drawer__text-preview {
  display: grid;
  grid-template-rows: auto minmax(0, 1fr);
  overflow: hidden;
  color: #dbeafe;
  background: #102a43;
  border-color: #183f5c;
}

.archived-document-preview-drawer__text-preview > p {
  padding: 0.65rem 0.85rem;
  color: #fef3c7;
  font-size: var(--font-size-small);
  background: #78350f;
}

.archived-document-preview-drawer__text-preview pre {
  padding: 1rem;
  overflow: auto;
  font-family: var(--font-family-mono);
  font-size: 0.72rem;
  line-height: 1.65;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.archived-document-preview-drawer__unsupported-state > span {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: var(--radius-md);
}

.archived-document-preview-drawer-enter-active,
.archived-document-preview-drawer-leave-active {
  transition: opacity var(--transition-fast);
}

.archived-document-preview-drawer-enter-active
  .archived-document-preview-drawer__panel,
.archived-document-preview-drawer-leave-active
  .archived-document-preview-drawer__panel {
  transition: transform var(--transition-fast);
}

.archived-document-preview-drawer-enter-from,
.archived-document-preview-drawer-leave-to {
  opacity: 0;
}

.archived-document-preview-drawer-enter-from
  .archived-document-preview-drawer__panel,
.archived-document-preview-drawer-leave-to
  .archived-document-preview-drawer__panel {
  transform: translateX(100%);
}

@keyframes archived-document-preview-drawer-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 47.99rem) {
  .archived-document-preview-drawer__details {
    grid-template-columns: minmax(0, 1fr);
  }

  .archived-document-preview-drawer__content {
    padding: 0.75rem;
  }
}
</style>
