<template>
  <section
    class="timestamp-file-workspace"
    aria-labelledby="timestamp-file-workspace-title"
  >
    <div
      :class="[
        'timestamp-file-workspace__drop-area',
        {
          'timestamp-file-workspace__drop-area--dragging': isFileDraggedOver,
          'timestamp-file-workspace__drop-area--disabled': isBusy,
        },
      ]"
      role="button"
      :tabindex="isBusy ? -1 : 0"
      :aria-disabled="isBusy"
      :aria-describedby="timestampFileInputDescriptionIds"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
      @keydown.space.prevent="openFilePicker"
      @dragenter.prevent="handleFileDragOver"
      @dragover.prevent="handleFileDragOver"
      @dragleave.prevent="handleFileDragLeave"
      @drop.prevent="handleFileDrop"
    >
      <input
        id="timestamp-file-workspace-input"
        ref="fileInputElement"
        class="visually-hidden"
        type="file"
        multiple
        tabindex="-1"
        :accept="DRAFT_FILE_INPUT_ACCEPT"
        :disabled="isBusy"
        :aria-label="t('timestamp.workspace.inputAriaLabel')"
        :aria-describedby="timestampFileInputDescriptionIds"
        :aria-invalid="fileValidationErrorMessage ? 'true' : undefined"
        @change="handleFileInputChange"
      />

      <span class="timestamp-file-workspace__upload-icon" aria-hidden="true">
        <AppIcon name="upload" :size="30" />
      </span>
      <span class="timestamp-file-workspace__upload-eyebrow">
        {{ t('timestamp.workspace.uploadEyebrow') }}
      </span>
      <h2 id="timestamp-file-workspace-title">
        {{ t('timestamp.workspace.uploadTitle') }}
      </h2>
      <p>{{ t('timestamp.workspace.uploadDescription') }}</p>
      <span class="timestamp-file-workspace__select-action">
        <AppIcon name="document" :size="18" />
        {{ t('timestamp.workspace.selectFromDevice') }}
      </span>
      <small id="timestamp-file-workspace-requirements">
        {{
          t('timestamp.workspace.requirements', {
            maximumSize: maximumFileSizeLabel,
          })
        }}
      </small>
    </div>

    <p
      v-if="fileValidationErrorMessage"
      id="timestamp-file-workspace-validation-error"
      class="timestamp-file-workspace__validation-message"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      {{ fileValidationErrorMessage }}
    </p>

    <section
      v-if="timestampFiles.length > 0"
      class="timestamp-file-workspace__file-list-section"
      aria-labelledby="timestamp-file-workspace-list-title"
    >
      <header class="timestamp-file-workspace__file-list-header">
        <div>
          <span>{{ t('timestamp.workspace.listEyebrow') }}</span>
          <h2 id="timestamp-file-workspace-list-title">
            {{ t('timestamp.workspace.listTitle') }}
          </h2>
        </div>
        <strong>
          {{
            t('timestamp.workspace.selectedFileCount', {
              count: timestampFiles.length,
            })
          }}
        </strong>
      </header>

      <ul class="timestamp-file-workspace__file-list">
        <li
          v-for="timestampFileItem in timestampFiles"
          :key="timestampFileItem.id"
          :class="[
            'timestamp-file-workspace__file-card',
            `timestamp-file-workspace__file-card--${timestampFileItem.status}`,
          ]"
        >
          <div class="timestamp-file-workspace__file-card-header">
            <span
              class="timestamp-file-workspace__file-type-icon"
              aria-hidden="true"
            >
              <AppIcon name="document" :size="21" />
            </span>

            <div class="timestamp-file-workspace__file-information">
              <strong :title="timestampFileItem.fileName">
                {{ timestampFileItem.fileName }}
              </strong>
              <small>{{ formatFileSize(timestampFileItem.fileSize) }}</small>
            </div>

            <span
              :class="[
                'timestamp-file-workspace__status-badge',
                `timestamp-file-workspace__status-badge--${timestampFileItem.status}`,
              ]"
            >
              {{ getTimestampFileStatusLabel(timestampFileItem.status) }}
            </span>

            <button
              type="button"
              :disabled="isBusy"
              :aria-label="
                t('timestamp.workspace.removeAriaLabel', {
                  fileName: timestampFileItem.fileName,
                })
              "
              @click="emit('remove-file', timestampFileItem.id)"
            >
              <AppIcon name="trash" :size="18" />
            </button>
          </div>

          <div class="timestamp-file-workspace__progress-information">
            <span>
              {{ getTimestampFileStatusLabel(timestampFileItem.status) }}
            </span>
            <strong>{{ timestampFileItem.progressPercentage }}%</strong>
          </div>
          <div
            class="timestamp-file-workspace__progress-track"
            role="progressbar"
            :aria-label="
              t('timestamp.workspace.progressAriaLabel', {
                fileName: timestampFileItem.fileName,
              })
            "
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="timestampFileItem.progressPercentage"
          >
            <span
              :style="{
                width: `${timestampFileItem.progressPercentage}%`,
              }"
            ></span>
          </div>

          <p
            v-if="timestampFileItem.errorMessage"
            class="timestamp-file-workspace__file-error"
            role="alert"
          >
            {{ timestampFileItem.errorMessage }}
          </p>
        </li>
      </ul>
    </section>

    <div class="timestamp-file-workspace__actions">
      <button
        class="timestamp-file-workspace__upload-button"
        type="button"
        :disabled="!canUpload || isBusy"
        :aria-busy="isBusy"
        @click="emit('request-upload')"
      >
        <AppIcon name="upload" :size="21" />
        {{ t('timestamp.workspace.uploadFiles') }}
      </button>

      <button
        class="timestamp-file-workspace__submit-button"
        type="button"
        :disabled="!canProcess || isBusy"
        :aria-busy="isBusy"
        @click="emit('request-timestamp')"
      >
        <AppIcon name="timestamp" :size="21" />
        {{ t('timestamp.workspace.timestampFiles') }}
      </button>
    </div>
  </section>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import {
  DRAFT_FILE_INPUT_ACCEPT,
  MAX_DRAFT_FILE_SIZE_BYTES,
} from '@/features/draft-files/utils/draftFileValidation'
import type {
  TimestampFileItem,
  TimestampFileStatus,
} from '@/features/timestamp/types/timestamp.types'
import { formatFileSize } from '@/utils/formatters'

const props = defineProps<{
  canProcess: boolean
  canUpload: boolean
  fileValidationErrorMessage: string
  isBusy: boolean
  timestampFiles: TimestampFileItem[]
}>()

const emit = defineEmits<{
  'add-files': [timestampFiles: File[]]
  'remove-file': [timestampFileId: string]
  'request-timestamp': []
  'request-upload': []
}>()

const { t } = useI18n({ useScope: 'global' })
const fileInputElement = ref<HTMLInputElement | null>(null)
const isFileDraggedOver = ref(false)

const maximumFileSizeLabel = computed(() =>
  formatFileSize(MAX_DRAFT_FILE_SIZE_BYTES),
)
const timestampFileInputDescriptionIds = computed(() =>
  [
    'timestamp-file-workspace-requirements',
    props.fileValidationErrorMessage
      ? 'timestamp-file-workspace-validation-error'
      : '',
  ]
    .filter(Boolean)
    .join(' '),
)

const openFilePicker = () => {
  if (!props.isBusy) {
    fileInputElement.value?.click()
  }
}

const addTimestampFiles = (timestampFiles: FileList | null) => {
  if (!timestampFiles?.length) {
    return
  }

  emit('add-files', Array.from(timestampFiles))
}

const handleFileInputChange = (inputEvent: Event) => {
  const fileInput = inputEvent.target as HTMLInputElement
  addTimestampFiles(fileInput.files)
  fileInput.value = ''
}

const handleFileDragOver = () => {
  if (!props.isBusy) {
    isFileDraggedOver.value = true
  }
}

const handleFileDragLeave = () => {
  isFileDraggedOver.value = false
}

const handleFileDrop = (dropEvent: DragEvent) => {
  isFileDraggedOver.value = false

  if (!props.isBusy) {
    addTimestampFiles(dropEvent.dataTransfer?.files ?? null)
  }
}

const getTimestampFileStatusLabel = (fileStatus: TimestampFileStatus) =>
  t(`timestamp.workspace.status.${fileStatus}`)
</script>

<style scoped src="./TimestampFileWorkspace.css"></style>
