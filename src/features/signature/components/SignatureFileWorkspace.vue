<template>
  <section
    class="signature-file-workspace"
    aria-labelledby="signature-file-workspace-title"
  >
    <div
      :class="[
        'signature-file-workspace__drop-area',
        {
          'signature-file-workspace__drop-area--dragging':
            isFileDraggedOver,
          'signature-file-workspace__drop-area--disabled': isBusy,
        },
      ]"
      role="button"
      :tabindex="isBusy ? -1 : 0"
      :aria-disabled="isBusy"
      :aria-describedby="signatureFileInputDescriptionIds"
      @click="openFilePicker"
      @keydown.enter.prevent="openFilePicker"
      @keydown.space.prevent="openFilePicker"
      @dragenter.prevent="handleFileDragOver"
      @dragover.prevent="handleFileDragOver"
      @dragleave.prevent="handleFileDragLeave"
      @drop.prevent="handleFileDrop"
    >
      <input
        id="signature-file-workspace-input"
        ref="fileInputElement"
        class="visually-hidden"
        type="file"
        multiple
        tabindex="-1"
        :accept="DRAFT_FILE_INPUT_ACCEPT"
        :disabled="isBusy"
        :aria-label="t('signature.workspace.inputAriaLabel')"
        :aria-describedby="signatureFileInputDescriptionIds"
        :aria-invalid="fileValidationErrorMessage ? 'true' : undefined"
        @change="handleFileInputChange"
      />

      <span class="signature-file-workspace__upload-icon" aria-hidden="true">
        <AppIcon name="upload" :size="30" />
      </span>
      <span class="signature-file-workspace__upload-eyebrow">
        {{ t('signature.workspace.uploadEyebrow') }}
      </span>
      <h2 id="signature-file-workspace-title">
        {{ t('signature.workspace.uploadTitle') }}
      </h2>
      <p>{{ t('signature.workspace.uploadDescription') }}</p>
      <span class="signature-file-workspace__select-action">
        <AppIcon name="document" :size="18" />
        {{ t('signature.workspace.selectFromDevice') }}
      </span>
      <small id="signature-file-workspace-requirements">
        {{
          t('signature.workspace.requirements', {
            maximumSize: maximumFileSizeLabel,
          })
        }}
      </small>
    </div>

    <p
      v-if="fileValidationErrorMessage"
      id="signature-file-workspace-validation-error"
      class="signature-file-workspace__validation-message"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      {{ fileValidationErrorMessage }}
    </p>

    <section
      v-if="signatureFiles.length > 0"
      class="signature-file-workspace__file-list-section"
      aria-labelledby="signature-file-workspace-list-title"
    >
      <header class="signature-file-workspace__file-list-header">
        <div>
          <span>{{ t('signature.workspace.listEyebrow') }}</span>
          <h2 id="signature-file-workspace-list-title">
            {{ t('signature.workspace.listTitle') }}
          </h2>
        </div>
        <strong>
          {{
            t('signature.workspace.selectedFileCount', {
              count: signatureFiles.length,
            })
          }}
        </strong>
      </header>

      <ul class="signature-file-workspace__file-list">
        <li
          v-for="signatureFileItem in signatureFiles"
          :key="signatureFileItem.id"
          :class="[
            'signature-file-workspace__file-card',
            `signature-file-workspace__file-card--${signatureFileItem.status}`,
          ]"
        >
          <div class="signature-file-workspace__file-card-header">
            <span
              class="signature-file-workspace__file-type-icon"
              aria-hidden="true"
            >
              <AppIcon name="document" :size="21" />
            </span>

            <div class="signature-file-workspace__file-information">
              <strong :title="signatureFileItem.fileName">
                {{ signatureFileItem.fileName }}
              </strong>
              <small>{{ formatFileSize(signatureFileItem.fileSize) }}</small>
            </div>

            <span
              :class="[
                'signature-file-workspace__status-badge',
                `signature-file-workspace__status-badge--${signatureFileItem.status}`,
              ]"
            >
              {{ getSignatureFileStatusLabel(signatureFileItem.status) }}
            </span>

            <button
              type="button"
              :disabled="isBusy"
              :aria-label="
                t('signature.workspace.removeAriaLabel', {
                  fileName: signatureFileItem.fileName,
                })
              "
              @click="emit('remove-file', signatureFileItem.id)"
            >
              <AppIcon name="trash" :size="18" />
            </button>
          </div>

          <div class="signature-file-workspace__progress-information">
            <span>
              {{ getSignatureFileStatusLabel(signatureFileItem.status) }}
            </span>
            <strong>{{ signatureFileItem.progressPercentage }}%</strong>
          </div>
          <div
            class="signature-file-workspace__progress-track"
            role="progressbar"
            :aria-label="
              t('signature.workspace.progressAriaLabel', {
                fileName: signatureFileItem.fileName,
              })
            "
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="signatureFileItem.progressPercentage"
          >
            <span
              :style="{
                width: `${signatureFileItem.progressPercentage}%`,
              }"
            ></span>
          </div>

          <p
            v-if="signatureFileItem.errorMessage"
            class="signature-file-workspace__file-error"
            role="alert"
          >
            {{ signatureFileItem.errorMessage }}
          </p>
        </li>
      </ul>
    </section>

    <div class="signature-file-workspace__actions">
      <button
        class="signature-file-workspace__upload-button"
        type="button"
        :disabled="!canUpload || isBusy"
        :aria-busy="isBusy"
        @click="emit('request-upload')"
      >
        <AppIcon name="upload" :size="21" />
        {{ t('signature.workspace.uploadFiles') }}
      </button>

      <button
        class="signature-file-workspace__submit-button"
        type="button"
        :disabled="!canProcess || isBusy"
        :aria-busy="isBusy"
        @click="emit('request-signature')"
      >
        <AppIcon name="signature" :size="21" />
        {{ t('signature.workspace.signFiles') }}
      </button>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import {
  DRAFT_FILE_INPUT_ACCEPT,
  MAX_DRAFT_FILE_SIZE_BYTES,
} from '@/features/draft-files/utils/draftFileValidation'
import type {
  SignatureFileItem,
  SignatureFileStatus,
} from '@/features/signature/types/signature.types'
import { formatFileSize } from '@/utils/formatters'

const props = defineProps<{
  canProcess: boolean
  canUpload: boolean
  fileValidationErrorMessage: string
  isBusy: boolean
  signatureFiles: SignatureFileItem[]
}>()

const emit = defineEmits<{
  'add-files': [signatureFiles: File[]]
  'remove-file': [signatureFileId: string]
  'request-signature': []
  'request-upload': []
}>()

const { t } = useI18n({ useScope: 'global' })
const fileInputElement = ref<HTMLInputElement | null>(null)
const isFileDraggedOver = ref(false)

const maximumFileSizeLabel = computed(() =>
  formatFileSize(MAX_DRAFT_FILE_SIZE_BYTES),
)
const signatureFileInputDescriptionIds = computed(() =>
  [
    'signature-file-workspace-requirements',
    props.fileValidationErrorMessage
      ? 'signature-file-workspace-validation-error'
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

const addSignatureFiles = (signatureFiles: FileList | null) => {
  if (!signatureFiles?.length) {
    return
  }

  emit('add-files', Array.from(signatureFiles))
}

const handleFileInputChange = (inputEvent: Event) => {
  const fileInput = inputEvent.target as HTMLInputElement
  addSignatureFiles(fileInput.files)
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
    addSignatureFiles(dropEvent.dataTransfer?.files ?? null)
  }
}

const getSignatureFileStatusLabel = (fileStatus: SignatureFileStatus) =>
  t(`signature.workspace.status.${fileStatus}`)
</script>

<style scoped src="./SignatureFileWorkspace.css"></style>
