<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'
import {
  MAX_TIMESTAMP_FILE_SIZE_BYTES,
  validateTimestampFile,
} from '@/features/timestamp/utils/timestampFileValidation'
import { formatFileSize } from '@/utils/formatters'

const props = withDefaults(
  defineProps<{
    isDisabled?: boolean
    selectedFile: File | null
  }>(),
  {
    isDisabled: false,
  },
)

const emit = defineEmits<{
  'request-timestamp': []
  'select-file': [timestampFile: File | null]
}>()

const fileInputElement = ref<HTMLInputElement | null>(null)
const isFileDraggedOver = ref(false)
const fileValidationErrorMessage = ref('')

const maximumFileSizeLabel = formatFileSize(MAX_TIMESTAMP_FILE_SIZE_BYTES)
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
  const selectedFileName = props.selectedFile?.name ?? ''
  const fileExtension = selectedFileName.split('.').pop()

  if (!fileExtension || fileExtension === selectedFileName) {
    return 'Dosya'
  }

  return `${fileExtension.toLocaleUpperCase('tr-TR')} dosyası`
})

const openFilePicker = () => {
  if (!props.isDisabled) {
    fileInputElement.value?.click()
  }
}

const validateAndSelectFile = (timestampFile: File) => {
  const validationResult = validateTimestampFile(timestampFile)

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
  if (!props.isDisabled) {
    isFileDraggedOver.value = true
  }
}

const handleFileDragLeave = () => {
  isFileDraggedOver.value = false
}

const handleFileDrop = (dropEvent: DragEvent) => {
  isFileDraggedOver.value = false

  if (props.isDisabled) {
    return
  }

  const droppedFiles = dropEvent.dataTransfer?.files

  if (!droppedFiles?.length) {
    return
  }

  if (droppedFiles.length > 1) {
    fileValidationErrorMessage.value =
      'Tek seferde yalnızca bir dosya seçebilirsiniz.'
    return
  }

  const timestampFile = droppedFiles.item(0)

  if (timestampFile) {
    validateAndSelectFile(timestampFile)
  }
}

const handleSelectedFileRemove = () => {
  fileValidationErrorMessage.value = ''
  emit('select-file', null)
}

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
          'timestamp-file-upload-zone__drop-area--disabled': isDisabled,
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
        :disabled="isDisabled"
        aria-label="Zaman damgalanacak dosyayı seçin"
        :aria-describedby="timestampFileInputDescriptionIds"
        :aria-invalid="fileValidationErrorMessage ? 'true' : undefined"
        @change="handleFileInputChange"
      />

      <span class="timestamp-file-upload-zone__upload-icon" aria-hidden="true">
        <AppIcon name="upload" :size="30" />
      </span>

      <div class="timestamp-file-upload-zone__introduction">
        <span>Dosya seçimi</span>
        <h2 id="timestamp-file-upload-zone-title">
          Dosyanızı güvenli alana bırakın
        </h2>
        <p>
          Sürükleyip bırakabilir veya cihazınızdan seçebilirsiniz. İşlem öncesinde
          dosya bilgilerini tekrar kontrol edebilirsiniz.
        </p>
      </div>

      <button
        class="timestamp-file-upload-zone__select-button"
        type="button"
        :disabled="isDisabled"
        :aria-describedby="timestampFileInputDescriptionIds"
        @click="openFilePicker"
      >
        <AppIcon name="document" :size="18" />
        {{ selectedFile ? 'Başka dosya seç' : 'Cihazdan dosya seç' }}
      </button>

      <small id="timestamp-file-upload-zone-requirements">
        Tüm dosya türleri desteklenir · En fazla {{ maximumFileSizeLabel }}
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
      class="timestamp-file-upload-zone__selected-file"
      aria-label="Seçilen dosya"
    >
      <span class="timestamp-file-upload-zone__file-icon" aria-hidden="true">
        <AppIcon name="document" :size="22" />
      </span>

      <div class="timestamp-file-upload-zone__file-information">
        <span>İşleme hazır</span>
        <strong>{{ selectedFile.name }}</strong>
        <small>
          {{ selectedFileExtensionLabel }} · {{ formatFileSize(selectedFile.size) }}
        </small>
      </div>

      <button
        class="timestamp-file-upload-zone__remove-button"
        type="button"
        :disabled="isDisabled"
        :aria-label="`${selectedFile.name} dosyasını kaldır`"
        @click="handleSelectedFileRemove"
      >
        <AppIcon name="close" :size="18" />
      </button>

      <div class="timestamp-file-upload-zone__action">
        <span>İşlem maliyeti <strong>1 kontör</strong></span>
        <button
          type="button"
          :disabled="isDisabled"
          @click="emit('request-timestamp')"
        >
          Zaman damgalamaya devam et
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
