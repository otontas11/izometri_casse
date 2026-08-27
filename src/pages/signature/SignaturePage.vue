<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import { useToast } from '@/composables/useToast'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import SignatureFileWorkspace from '@/features/signature/components/SignatureFileWorkspace.vue'
import { useSignatureStore } from '@/features/signature/stores/signature.store'

const dashboardStore = useDashboardStore()
const signatureStore = useSignatureStore()
const { dashboardRequestStatus, dashboardSummary } =
  storeToRefs(dashboardStore)
const {
  canSubmitSignatureFiles,
  isSignatureSubmitting,
  signatureFiles,
  signatureFileValidationErrorMessage,
  signatureSubmissionErrorMessage,
  signatureSubmissionSuccessMessage,
} = storeToRefs(signatureStore)
const { showErrorToast, showSuccessToast, showWarningToast } = useToast()
const { t } = useI18n({ useScope: 'global' })

const availableSignatureCredits = computed(
  () => dashboardSummary.value?.remainingCredits ?? null,
)
const hasAvailableSignatureCredits = computed(
  () =>
    availableSignatureCredits.value === null ||
    availableSignatureCredits.value > 0,
)
const canStartSignatureTransaction = computed(
  () =>
    canSubmitSignatureFiles.value &&
    hasAvailableSignatureCredits.value,
)

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
  if (!hasAvailableSignatureCredits.value) {
    signatureStore.reportInsufficientSignatureCredits()
    showWarningToast(signatureSubmissionErrorMessage.value)
    return
  }

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

onMounted(() => {
  if (dashboardRequestStatus.value === 'idle') {
    void dashboardStore.fetchDashboardData()
  }
})
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

      <div class="signature-page__header-actions">
        <div
          :class="[
            'signature-page__transaction-summary',
            {
              'signature-page__transaction-summary--insufficient':
                !hasAvailableSignatureCredits,
            },
          ]"
        >
          <span aria-hidden="true">
            <AppIcon name="wallet" :size="21" />
          </span>
          <div>
            <small>{{ t('signature.page.transactionCost') }}</small>
            <strong>{{ t('signature.page.costPerFile') }}</strong>
            <small class="signature-page__available-credits">
              {{
                availableSignatureCredits === null
                  ? t('signature.page.balanceLoading')
                  : availableSignatureCredits > 0
                    ? t('signature.page.availableCredits', {
                        count: availableSignatureCredits,
                      })
                    : t('signature.page.noAvailableCredits')
              }}
            </small>
          </div>
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
      </div>
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
      :can-submit="canStartSignatureTransaction"
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
