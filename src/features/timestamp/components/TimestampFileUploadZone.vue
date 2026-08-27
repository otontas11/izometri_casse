<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import {
  DRAFT_FILE_INPUT_ACCEPT,
  MAX_DRAFT_FILE_SIZE_BYTES,
  validateDraftFile,
} from '@/features/draft-files/utils/draftFileValidation'
import type {
  TimestampFileItem,
  TimestampFileStatus,
} from '@/features/timestamp/types/timestamp.types'
import { getApplicationLocaleCode } from '@/locales'
import { formatFileSize } from '@/utils/formatters'

const props = withDefaults(
  defineProps<{
    isDisabled?: boolean
    selectedFile: TimestampFileItem | null
  }>(),
  {
    isDisabled: false,
  },
)

const emit = defineEmits<{
  'request-timestamp': []
  'request-upload': []
  'remove-file': []
  'select-file': [timestampFile: File]
}>()

const { t } = useI18n({ useScope: 'global' })
const fileInputElement = ref<HTMLInputElement | null>(null)
const isFileDraggedOver = ref(false)
const fileValidationErrorMessage = ref('')

const maximumFileSizeLabel = computed(() =>
  formatFileSize(MAX_DRAFT_FILE_SIZE_BYTES),
)
const timestampFileInputDescriptionIds = computed(() =>
  [
    'timestamp-file-upload-zone-requirements',
    fileValidationErrorMessage.value
      ? 'timestamp-file-upload-zone-validation-error'
      : '',
  ]
    .filter(Boolean)
    .join(' '),
)
const selectedFileExtensionLabel = computed(() => {
  const selectedFileName = props.selectedFile?.fileName ?? ''
  const fileExtension = selectedFileName.split('.').pop()

  if (!fileExtension || fileExtension === selectedFileName) {
    return t('timestamp.upload.fileFallback')
  }

  return t('timestamp.upload.fileExtension', {
    extension: fileExtension.toLocaleUpperCase(getApplicationLocaleCode()),
  })
})
const canSelectNewFile = computed(
  () => !props.selectedFile || props.selectedFile.draftFileId === null,
)
const shouldUploadSelectedFile = computed(() =>
  ['selected', 'uploading', 'upload-error'].includes(
    props.selectedFile?.status ?? '',
  ),
)

const openFilePicker = () => {
  if (!props.isDisabled && canSelectNewFile.value) {
    fileInputElement.value?.click()
  }
}

const validateAndSelectFile = (timestampFile: File) => {
  const validationResult = validateDraftFile(timestampFile)

  if (!validationResult.isValid) {
    fileValidationErrorMessage.value = validationResult.errorMessage
    return
  }

  fileValidationErrorMessage.value = ''
  emit('select-file', timestampFile)
}

const handleFileInputChange = (inputEvent: Event) => {
  const fileInput = inputEvent.target as HTMLInputElement
  const timestampFile = fileInput.files?.item(0)

  if (timestampFile) {
    validateAndSelectFile(timestampFile)
  }

  fileInput.value = ''
}

const handleFileDragOver = () => {
  if (!props.isDisabled && canSelectNewFile.value) {
    isFileDraggedOver.value = true
  }
}

const handleFileDragLeave = () => {
  isFileDraggedOver.value = false
}

const handleFileDrop = (dropEvent: DragEvent) => {
  isFileDraggedOver.value = false

  if (props.isDisabled || !canSelectNewFile.value) {
    return
  }

  const droppedFiles = dropEvent.dataTransfer?.files

  if (!droppedFiles?.length) {
    return
  }

  if (droppedFiles.length > 1) {
    fileValidationErrorMessage.value = t('timestamp.upload.multipleFilesError')
    return
  }

  const timestampFile = droppedFiles.item(0)

  if (timestampFile) {
    validateAndSelectFile(timestampFile)
  }
}

const handleSelectedFileRemove = () => {
  fileValidationErrorMessage.value = ''
  emit('remove-file')
}

const handleSelectedFileAction = () => {
  if (shouldUploadSelectedFile.value) {
    emit('request-upload')
    return
  }

  emit('request-timestamp')
}

const getFileStatusLabel = (fileStatus: TimestampFileStatus) =>
  t(`timestamp.upload.status.${fileStatus}`)

watch(
  () => props.selectedFile,
  (selectedFile) => {
    if (!selectedFile) {
      fileValidationErrorMessage.value = ''
    }
  },
)
</script>

<template>
  <section
    class="timestamp-file-upload-zone"
    aria-labelledby="timestamp-file-upload-zone-title"
  >
    <div
      :class="[
        'timestamp-file-upload-zone__drop-area',
        {
          'timestamp-file-upload-zone__drop-area--dragging': isFileDraggedOver,
          'timestamp-file-upload-zone__drop-area--disabled':
            isDisabled || !canSelectNewFile,
        },
      ]"
      @dragenter.prevent="handleFileDragOver"
      @dragover.prevent="handleFileDragOver"
      @dragleave.prevent="handleFileDragLeave"
      @drop.prevent="handleFileDrop"
    >
      <input
        id="timestamp-file-upload-zone-input"
        ref="fileInputElement"
        class="visually-hidden"
        type="file"
        tabindex="-1"
        :accept="DRAFT_FILE_INPUT_ACCEPT"
        :disabled="isDisabled || !canSelectNewFile"
        :aria-label="t('timestamp.upload.inputAriaLabel')"
        :aria-describedby="timestampFileInputDescriptionIds"
        :aria-invalid="fileValidationErrorMessage ? 'true' : undefined"
        @change="handleFileInputChange"
      />

      <span class="timestamp-file-upload-zone__upload-icon" aria-hidden="true">
        <AppIcon name="upload" :size="30" />
      </span>

      <div class="timestamp-file-upload-zone__introduction">
        <span>{{ t('timestamp.upload.eyebrow') }}</span>
        <h2 id="timestamp-file-upload-zone-title">
          {{ t('timestamp.upload.title') }}
        </h2>
        <p>{{ t('timestamp.upload.description') }}</p>
      </div>

      <button
        class="timestamp-file-upload-zone__select-button"
        type="button"
        :disabled="isDisabled || !canSelectNewFile"
        :aria-describedby="timestampFileInputDescriptionIds"
        @click="openFilePicker"
      >
        <AppIcon name="document" :size="18" />
        {{
          selectedFile && !canSelectNewFile
            ? t('timestamp.upload.draftStored')
            : selectedFile
              ? t('timestamp.upload.selectAnother')
              : t('timestamp.upload.selectFromDevice')
        }}
      </button>

      <small id="timestamp-file-upload-zone-requirements">
        {{
          t('timestamp.upload.requirements', {
            maximumSize: maximumFileSizeLabel,
          })
        }}
      </small>
    </div>

    <p
      v-if="fileValidationErrorMessage"
      id="timestamp-file-upload-zone-validation-error"
      class="timestamp-file-upload-zone__validation-message"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      {{ fileValidationErrorMessage }}
    </p>

    <article
      v-if="selectedFile"
      :class="[
        'timestamp-file-upload-zone__selected-file',
        `timestamp-file-upload-zone__selected-file--${selectedFile.status}`,
      ]"
      :aria-label="t('timestamp.upload.selectedFileAriaLabel')"
    >
      <span class="timestamp-file-upload-zone__file-icon" aria-hidden="true">
        <AppIcon name="document" :size="22" />
      </span>

      <div class="timestamp-file-upload-zone__file-information">
        <span>{{ getFileStatusLabel(selectedFile.status) }}</span>
        <strong>{{ selectedFile.fileName }}</strong>
        <small>
          {{ selectedFileExtensionLabel }} · {{ formatFileSize(selectedFile.fileSize) }}
        </small>
      </div>

      <button
        class="timestamp-file-upload-zone__remove-button"
        type="button"
        :disabled="isDisabled"
        :aria-label="
          t('timestamp.upload.removeAriaLabel', {
            fileName: selectedFile.fileName,
          })
        "
        @click="handleSelectedFileRemove"
      >
        <AppIcon name="close" :size="18" />
      </button>

      <div class="timestamp-file-upload-zone__progress">
        <div
          class="timestamp-file-upload-zone__progress-track"
          role="progressbar"
          :aria-label="
            t('timestamp.upload.progressAriaLabel', {
              fileName: selectedFile.fileName,
            })
          "
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-valuenow="selectedFile.progressPercentage"
        >
          <span
            :style="{ width: `${selectedFile.progressPercentage}%` }"
          ></span>
        </div>
        <strong>{{ selectedFile.progressPercentage }}%</strong>
      </div>

      <p
        v-if="selectedFile.errorMessage"
        class="timestamp-file-upload-zone__file-error"
        role="alert"
      >
        {{ selectedFile.errorMessage }}
      </p>

      <div class="timestamp-file-upload-zone__action">
        <span>
          {{
            shouldUploadSelectedFile
              ? t('timestamp.upload.uploadCost')
              : t('timestamp.upload.transactionCost')
          }}
          <strong>
            {{
              shouldUploadSelectedFile
                ? t('timestamp.upload.free')
                : t('timestamp.upload.oneCredit')
            }}
          </strong>
        </span>
        <button
          type="button"
          :disabled="isDisabled"
          @click="handleSelectedFileAction"
        >
          {{
            shouldUploadSelectedFile
              ? t('timestamp.upload.uploadFile')
              : t('timestamp.upload.continue')
          }}
          <AppIcon name="arrow-right" :size="18" />
        </button>
      </div>
    </article>
  </section>
</template>

<style scoped>
.timestamp-file-upload-zone {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.timestamp-file-upload-zone__drop-area {
  display: grid;
  min-height: 19rem;
  padding: clamp(1.5rem, 4vw, 3rem);
  place-items: center;
  align-content: center;
  text-align: center;
  background:
    radial-gradient(
      circle at 50% 0%,
      color-mix(in srgb, var(--color-primary-100) 65%, transparent),
      transparent 48%
    ),
    var(--color-surface-raised);
  border: 1.5px dashed var(--color-border);
  border-radius: var(--radius-lg);
  transition:
    background var(--transition-fast),
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.timestamp-file-upload-zone__drop-area--dragging {
  background: color-mix(
    in srgb,
    var(--color-accent-100) 72%,
    var(--color-surface-raised)
  );
  border-color: var(--color-accent-600);
  transform: translateY(-2px);
}

.timestamp-file-upload-zone__drop-area--disabled {
  cursor: wait;
  opacity: 0.68;
}

.timestamp-file-upload-zone__upload-icon {
  display: grid;
  width: 4.5rem;
  height: 4.5rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: 1.35rem;
  box-shadow: 0 0 0 0.5rem
    color-mix(in srgb, var(--color-primary-100) 42%, transparent);
}

.timestamp-file-upload-zone__introduction {
  max-width: 34rem;
  margin-top: 1.5rem;
}

.timestamp-file-upload-zone__introduction span,
.timestamp-file-upload-zone__introduction h2,
.timestamp-file-upload-zone__introduction p {
  margin: 0;
}

.timestamp-file-upload-zone__introduction span {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.timestamp-file-upload-zone__introduction h2 {
  margin-top: 0.5rem;
  color: var(--color-brand-950);
  font-size: clamp(1.25rem, 3vw, 1.65rem);
  line-height: 1.2;
  letter-spacing: -0.035em;
}

.timestamp-file-upload-zone__introduction p {
  margin-top: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.84rem;
  line-height: 1.7;
}

.timestamp-file-upload-zone__select-button,
.timestamp-file-upload-zone__action button {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  min-height: 2.85rem;
  padding: 0.7rem 1rem;
  color: var(--color-text-inverse);
  font-size: 0.76rem;
  font-weight: 500;
  cursor: pointer;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
  transition:
    background var(--transition-fast),
    transform var(--transition-fast);
}

.timestamp-file-upload-zone__select-button {
  margin-top: 1.35rem;
}

.timestamp-file-upload-zone__select-button:hover:not(:disabled),
.timestamp-file-upload-zone__action button:hover:not(:disabled) {
  background: var(--color-brand-800);
  transform: translateY(-1px);
}

.timestamp-file-upload-zone__select-button:disabled,
.timestamp-file-upload-zone__action button:disabled,
.timestamp-file-upload-zone__remove-button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.timestamp-file-upload-zone__drop-area > small {
  margin-top: 1rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.timestamp-file-upload-zone__validation-message {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  margin: 0;
  padding: 0.85rem 1rem;
  color: var(--color-danger);
  font-size: 0.76rem;
  font-weight: 500;
  background: color-mix(
    in srgb,
    var(--color-danger) 8%,
    var(--color-surface-raised)
  );
  border: 1px solid color-mix(in srgb, var(--color-danger) 25%, transparent);
  border-radius: var(--radius-sm);
}

.timestamp-file-upload-zone__validation-message span {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.timestamp-file-upload-zone__selected-file {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: 1.1rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.timestamp-file-upload-zone__file-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: var(--radius-sm);
}

.timestamp-file-upload-zone__file-information {
  display: grid;
  min-width: 0;
  gap: 0.22rem;
}

.timestamp-file-upload-zone__file-information span {
  color: var(--color-success);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.timestamp-file-upload-zone__file-information strong {
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 0.86rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timestamp-file-upload-zone__file-information small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.timestamp-file-upload-zone__remove-button {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: var(--color-surface-subtle);
  border-radius: 50%;
  transition:
    color var(--transition-fast),
    background var(--transition-fast);
}

.timestamp-file-upload-zone__remove-button:hover:not(:disabled) {
  color: var(--color-danger);
  background: color-mix(
    in srgb,
    var(--color-danger) 9%,
    var(--color-surface-raised)
  );
}

.timestamp-file-upload-zone__progress {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  grid-column: 1 / -1;
  gap: 0.75rem;
  align-items: center;
}

.timestamp-file-upload-zone__progress-track {
  height: 0.45rem;
  overflow: hidden;
  background: var(--color-surface-subtle);
  border-radius: 999px;
}

.timestamp-file-upload-zone__progress-track span {
  display: block;
  height: 100%;
  background: var(--color-success);
  border-radius: inherit;
  transition: width 180ms ease;
}

.timestamp-file-upload-zone__selected-file--uploading
  .timestamp-file-upload-zone__progress-track
  span,
.timestamp-file-upload-zone__selected-file--processing
  .timestamp-file-upload-zone__progress-track
  span {
  background: var(--color-primary-600);
}

.timestamp-file-upload-zone__selected-file--upload-error
  .timestamp-file-upload-zone__progress-track
  span,
.timestamp-file-upload-zone__selected-file--process-error
  .timestamp-file-upload-zone__progress-track
  span {
  background: var(--color-danger);
}

.timestamp-file-upload-zone__progress > strong {
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
}

.timestamp-file-upload-zone__file-error {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--color-danger);
  font-size: var(--font-size-small);
  font-weight: 500;
  line-height: 1.5;
}

.timestamp-file-upload-zone__action {
  display: flex;
  grid-column: 1 / -1;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.timestamp-file-upload-zone__action > span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.timestamp-file-upload-zone__action > span strong {
  color: var(--color-brand-950);
  font-weight: 500;
}

@media (max-width: 47.99rem) {
  .timestamp-file-upload-zone__drop-area {
    min-height: 17rem;
    padding: 1.5rem 1rem;
  }

  .timestamp-file-upload-zone__selected-file {
    grid-template-columns: auto minmax(0, 1fr) auto;
  }

  .timestamp-file-upload-zone__action {
    display: grid;
  }

  .timestamp-file-upload-zone__action button {
    width: 100%;
  }
}
</style>
