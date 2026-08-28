<template>
  <section class="dashboard-quick-actions-panel"
           :aria-label="t('dashboard.quickActions.ariaLabel')"
  >
    <div :class="[
           'dashboard-quick-actions-panel__drop-area',
           {
             'dashboard-quick-actions-panel__drop-area--dragging':
               isFileDraggedOver,
             'dashboard-quick-actions-panel__drop-area--disabled':
               isSignatureActionInProgress,
           },
         ]"
         role="button"
         :tabindex="isSignatureActionInProgress ? -1 : 0"
         :aria-disabled="isSignatureActionInProgress"
         :aria-describedby="dashboardDropAreaDescriptionIds"
         @click="handleFilePickerOpen"
         @keydown.enter.prevent="handleFilePickerOpen"
         @keydown.space.prevent="handleFilePickerOpen"
         @dragenter.prevent="handleFileDragOver"
         @dragover.prevent="handleFileDragOver"
         @dragleave.prevent="handleFileDragLeave"
         @drop.prevent="handleFileDrop"
    >
      <input id="dashboard-quick-actions-panel-input"
             ref="dashboardFileInputElement"
             class="visually-hidden"
             type="file"
             multiple
             tabindex="-1"
             :accept="DRAFT_FILE_INPUT_ACCEPT"
             :disabled="isSignatureActionInProgress"
             :aria-label="t('signature.workspace.inputAriaLabel')"
             :aria-describedby="dashboardDropAreaDescriptionIds"
             :aria-invalid="shouldShowValidationMessage ? 'true' : undefined"
             @change="handleFileInputChange"
      />

      <span class="dashboard-quick-actions-panel__upload-icon"
            aria-hidden="true"
      >
        <AppIcon name="upload" :size="30" />
      </span>
      <span class="dashboard-quick-actions-panel__eyebrow">
        {{ t('dashboard.quickActions.fastestAction') }}
      </span>
      <h2>{{ t('dashboard.quickActions.title') }}</h2>
      <p>{{ t('dashboard.quickActions.description') }}</p>
      <span class="dashboard-quick-actions-panel__select-action">
        <AppIcon name="document" :size="18" />
        {{ t('signature.workspace.selectFromDevice') }}
      </span>
      <small id="dashboard-quick-actions-panel-requirements">
        {{
          t('signature.workspace.requirements', {
            maximumSize: maximumFileSizeLabel,
          })
        }}
      </small>
    </div>

    <p v-if="shouldShowValidationMessage"
       id="dashboard-quick-actions-panel-validation-error"
       class="dashboard-quick-actions-panel__validation-message"
       role="alert"
    >
      <span aria-hidden="true">!</span>
      {{ signatureFileValidationErrorMessage }}
    </p>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import {
  DRAFT_FILE_INPUT_ACCEPT,
  MAX_DRAFT_FILE_SIZE_BYTES,
} from '@/features/draft-files/utils/draftFileValidation'
import { useSignatureStore } from '@/features/signature/stores/signature.store'
import { formatFileSize } from '@/utils/formatters'

const router = useRouter()
const signatureStore = useSignatureStore()
const { isSignatureActionInProgress, signatureFileValidationErrorMessage } =
  storeToRefs(signatureStore)
const { t } = useI18n({ useScope: 'global' })

const dashboardFileInputElement = ref<HTMLInputElement | null>(null)
const isFileDraggedOver = ref(false)
const hasAttemptedFileSelection = ref(false)

const maximumFileSizeLabel = computed(() =>
  formatFileSize(MAX_DRAFT_FILE_SIZE_BYTES),
)
const shouldShowValidationMessage = computed(
  () =>
    hasAttemptedFileSelection.value &&
    Boolean(signatureFileValidationErrorMessage.value),
)
const dashboardDropAreaDescriptionIds = computed(() =>
  [
    'dashboard-quick-actions-panel-requirements',
    shouldShowValidationMessage.value
      ? 'dashboard-quick-actions-panel-validation-error'
      : '',
  ]
    .filter(Boolean)
    .join(' '),
)

const handleFilePickerOpen = () => {
  if (isSignatureActionInProgress.value) {
    return
  }

  hasAttemptedFileSelection.value = false
  dashboardFileInputElement.value?.click()
}

const handleSelectedSignatureFiles = async (
  selectedSignatureFiles: FileList | null,
) => {
  if (!selectedSignatureFiles?.length) {
    return
  }

  hasAttemptedFileSelection.value = true
  const hasAddedSignatureFiles = signatureStore.addSignatureFiles(
    Array.from(selectedSignatureFiles),
  )

  if (hasAddedSignatureFiles) {
    await router.push({ name: 'signature' })
  }
}

const handleFileInputChange = (inputEvent: Event) => {
  const fileInputElement = inputEvent.target

  if (!(fileInputElement instanceof HTMLInputElement)) {
    return
  }

  void handleSelectedSignatureFiles(fileInputElement.files)
  fileInputElement.value = ''
}

const handleFileDragOver = () => {
  if (!isSignatureActionInProgress.value) {
    isFileDraggedOver.value = true
  }
}

const handleFileDragLeave = () => {
  isFileDraggedOver.value = false
}

const handleFileDrop = (dropEvent: DragEvent) => {
  isFileDraggedOver.value = false

  if (!isSignatureActionInProgress.value) {
    void handleSelectedSignatureFiles(dropEvent.dataTransfer?.files ?? null)
  }
}
</script>

<style scoped>
.dashboard-quick-actions-panel {
  display: grid;
  gap: 1rem;
  width: 100%;
}

.dashboard-quick-actions-panel__drop-area {
  display: grid;
  min-height: 18rem;
  padding: clamp(1.5rem, 4vw, 2.5rem);
  place-items: center;
  align-content: center;
  color: var(--color-text-secondary);
  text-align: center;
  cursor: pointer;
  background: var(--color-surface-raised);
  border: 2px dashed #bdcbd7;
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  transition:
    background-color var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.dashboard-quick-actions-panel__drop-area:hover,
.dashboard-quick-actions-panel__drop-area:focus-visible,
.dashboard-quick-actions-panel__drop-area--dragging {
  background: #f8fbff;
  border-color: var(--color-primary-600);
  transform: translateY(-2px);
}

.dashboard-quick-actions-panel__drop-area--disabled {
  cursor: wait;
  opacity: 0.65;
  transform: none;
}

.dashboard-quick-actions-panel__upload-icon {
  display: grid;
  width: 4.25rem;
  height: 4.25rem;
  margin-bottom: 1.1rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: 1.25rem;
}

.dashboard-quick-actions-panel__eyebrow {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.dashboard-quick-actions-panel__drop-area h2,
.dashboard-quick-actions-panel__drop-area p {
  margin: 0;
}

.dashboard-quick-actions-panel__drop-area h2 {
  margin-top: 0.55rem;
  color: var(--color-brand-950);
  font-size: clamp(1.25rem, 3vw, 1.7rem);
  letter-spacing: -0.035em;
}

.dashboard-quick-actions-panel__drop-area p {
  max-width: 40rem;
  margin-top: 0.7rem;
  font-size: 0.85rem;
  line-height: 1.65;
}

.dashboard-quick-actions-panel__select-action {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  margin-top: 1.1rem;
  padding: 0.7rem 0.9rem;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  font-weight: 800;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
}

.dashboard-quick-actions-panel__drop-area > small {
  margin-top: 0.85rem;
  font-size: var(--font-size-small);
  font-weight: 600;
}

.dashboard-quick-actions-panel__validation-message {
  display: flex;
  gap: 0.55rem;
  align-items: flex-start;
  margin: 0;
  padding: 0.75rem 0.85rem;
  color: var(--color-danger);
  font-size: var(--font-size-small);
  font-weight: 700;
  line-height: 1.5;
  background: #fff0f1;
  border: 1px solid #f3c6cc;
  border-radius: var(--radius-sm);
}

.dashboard-quick-actions-panel__validation-message span {
  display: grid;
  flex: 0 0 auto;
  width: 1.45rem;
  height: 1.45rem;
  place-items: center;
  color: #fff;
  background: var(--color-danger);
  border-radius: 50%;
}
</style>
