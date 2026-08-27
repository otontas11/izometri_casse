<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import { useToast } from '@/composables/useToast'
import SignatureFileWorkspace from '@/features/signature/components/SignatureFileWorkspace.vue'
import { useSignatureStore } from '@/features/signature/stores/signature.store'

const signatureStore = useSignatureStore()
const {
  canSubmitSignatureFiles,
  isSignatureSubmitting,
  signatureFiles,
  signatureFileValidationErrorMessage,
  signatureSubmissionErrorMessage,
  signatureSubmissionSuccessMessage,
} = storeToRefs(signatureStore)
const { showErrorToast, showSuccessToast } = useToast()
const { t } = useI18n({ useScope: 'global' })

const handleSignatureFilesAdded = (signatureFiles: File[]) => {
  signatureStore.addSignatureFiles(signatureFiles)
}

const handleSignatureFileRemoval = (signatureFileId: string) => {
  signatureStore.removeSignatureFile(signatureFileId)
}

const handleSignaturePageClear = () => {
  signatureStore.clearSignaturePage()
}

const handleSignatureRequest = async () => {
  const areSignaturesCreated = await signatureStore.submitSignatureFiles()

  if (areSignaturesCreated) {
    showSuccessToast(signatureSubmissionSuccessMessage.value)
    return
  }

  showErrorToast(
    signatureSubmissionErrorMessage.value ||
      t('signature.feedback.transactionFailed'),
  )
}
</script>

<template>
  <section class="signature-page" aria-labelledby="signature-page-title">
    <header class="signature-page__header">
      <div>
        <span class="signature-page__eyebrow">
          {{ t('signature.page.eyebrow') }}
        </span>
        <h1 id="signature-page-title">{{ t('signature.page.title') }}</h1>
        <p>{{ t('signature.page.description') }}</p>
      </div>

      <button
        class="signature-page__clear-button"
        type="button"
        :disabled="isSignatureSubmitting"
        @click="handleSignaturePageClear"
      >
        <AppIcon name="refresh" :size="18" />
        {{ t('signature.page.clear') }}
      </button>
    </header>

    <aside class="signature-page__simulation-notice">
      <span aria-hidden="true">
        <AppIcon name="signature" :size="21" />
      </span>
      <div>
        <strong>{{ t('signature.page.simulationTitle') }}</strong>
        <p>{{ t('signature.page.simulationDescription') }}</p>
      </div>
    </aside>

    <p
      v-if="signatureSubmissionSuccessMessage"
      class="signature-page__feedback signature-page__feedback--success"
      role="status"
    >
      <span aria-hidden="true">✓</span>
      {{ signatureSubmissionSuccessMessage }}
    </p>

    <p
      v-if="signatureSubmissionErrorMessage"
      class="signature-page__feedback signature-page__feedback--error"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      {{ signatureSubmissionErrorMessage }}
    </p>

    <SignatureFileWorkspace
      :can-submit="canSubmitSignatureFiles"
      :file-validation-error-message="signatureFileValidationErrorMessage"
      :is-submitting="isSignatureSubmitting"
      :signature-files="signatureFiles"
      @add-files="handleSignatureFilesAdded"
      @remove-file="handleSignatureFileRemoval"
      @request-signature="handleSignatureRequest"
    />
  </section>
</template>

<style scoped src="./SignaturePage.css"></style>
