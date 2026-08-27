<template>
  <section aria-labelledby="signature-page-title" class="signature-page">
    <header class="signature-page__header">
      <div>
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
            <AppIcon :size="21" name="wallet"/>
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
      </div>
    </header>

    <p v-if="signatureActionErrorMessage"
       class="signature-page__feedback signature-page__feedback--error"
       role="alert">
      <span aria-hidden="true">!</span>
      {{ signatureActionErrorMessage }}
    </p>

    <SignatureFileWorkspace :can-process="canStartSignatureTransaction"
                            :can-upload="canUploadSignatureFiles"
                            :file-validation-error-message="signatureFileValidationErrorMessage"
                            :is-busy="isSignatureActionInProgress"
                            :signature-files="signatureFiles"
                            @add-files="handleSignatureFilesAdded"
                            @remove-file="handleSignatureFileRemoval"
                            @request-signature="handleSignatureRequest"
                            @request-upload="handleSignatureUploadRequest"
    />
  </section>
</template>

<script lang="ts" setup>
import {computed, onMounted} from 'vue'
import {storeToRefs} from 'pinia'
import {useI18n} from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import {useToast} from '@/composables/useToast'
import {useDashboardStore} from '@/features/dashboard/stores/dashboard.store'
import SignatureFileWorkspace from '@/features/signature/components/SignatureFileWorkspace.vue'
import {useSignatureStore} from '@/features/signature/stores/signature.store'

const dashboardStore = useDashboardStore()
const signatureStore = useSignatureStore()
const {dashboardRequestStatus, dashboardSummary} =
    storeToRefs(dashboardStore)
const {
  canProcessSignatureFiles,
  canUploadSignatureFiles,
  isSignatureActionInProgress,
  signatureActionErrorMessage,
  signatureActionSuccessMessage,
  signatureFiles,
  signatureFileValidationErrorMessage,
} = storeToRefs(signatureStore)
const {showErrorToast, showSuccessToast, showWarningToast} = useToast()
const {t} = useI18n({useScope: 'global'})

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
        canProcessSignatureFiles.value &&
        hasAvailableSignatureCredits.value,
)

const handleSignatureFilesAdded = (signatureFiles: File[]) => {
  signatureStore.addSignatureFiles(signatureFiles)
}

const handleSignatureFileRemoval = (signatureFileId: string) => {
  void signatureStore.removeSignatureFile(signatureFileId)
}

const handleSignatureUploadRequest = async () => {
  const areFilesUploaded = await signatureStore.uploadSignatureFiles()

  if (areFilesUploaded) {
    showSuccessToast(signatureActionSuccessMessage.value)
    return
  }

  showErrorToast(
      signatureActionErrorMessage.value ||
      t('signature.feedback.uploadFailure', {
        failedCount: 1,
        uploadedCount: 0,
      }),
  )
}

const handleSignatureRequest = async () => {
  if (!hasAvailableSignatureCredits.value) {
    signatureStore.reportInsufficientSignatureCredits()
    showWarningToast(signatureActionErrorMessage.value)
    return
  }

  const areSignaturesCreated = await signatureStore.processSignatureFiles()

  if (areSignaturesCreated) {
    showSuccessToast(signatureActionSuccessMessage.value)
    return
  }

  showErrorToast(
      signatureActionErrorMessage.value ||
      t('signature.feedback.transactionFailed'),
  )
}

onMounted(() => {
  if (dashboardRequestStatus.value === 'idle') {
    void dashboardStore.fetchDashboardData()
  }

  void signatureStore.loadUploadedSignatureFiles()
})
</script>

<style scoped src="./SignaturePage.css"></style>
