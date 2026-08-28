<template>
  <section aria-labelledby="timestamp-page-title" class="timestamp-page">
    <header class="timestamp-page__header">
      <div>
        <h1 id="timestamp-page-title">{{ t('timestamp.page.title') }}</h1>
        <p>{{ t('timestamp.page.description') }}</p>
      </div>

      <div class="timestamp-page__header-actions">
        <div
          :class="[
            'timestamp-page__transaction-summary',
            {
              'timestamp-page__transaction-summary--insufficient':
                !hasAvailableTimestampCredits,
            },
          ]"
        >
          <span aria-hidden="true">
            <AppIcon name="wallet" :size="21" />
          </span>
          <div>
            <small>{{ t('timestamp.page.transactionCost') }}</small>
            <strong>{{ t('timestamp.page.costPerFile') }}</strong>
            <small class="timestamp-page__available-credits">
              {{
                availableTimestampCredits === null
                  ? t('timestamp.page.balanceLoading')
                  : availableTimestampCredits > 0
                    ? t('timestamp.page.availableCredits', {
                        count: availableTimestampCredits,
                      })
                    : t('timestamp.page.noAvailableCredits')
              }}
            </small>
          </div>
        </div>
      </div>
    </header>

    <p
      v-if="timestampActionErrorMessage"
      class="timestamp-page__feedback timestamp-page__feedback--error"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      {{ timestampActionErrorMessage }}
    </p>

    <TimestampFileWorkspace
      :can-process="canStartTimestampTransaction"
      :file-validation-error-message="timestampFileValidationErrorMessage"
      :is-busy="isTimestampActionInProgress"
      :timestamp-files="timestampFiles"
      @add-files="handleTimestampFilesAdded"
      @remove-file="handleTimestampFileRemoval"
      @request-timestamp="handleTimestampRequest"
      @request-upload="handleTimestampUploadRequest"
    />

    <TimestampHistoryTable
      :error-message="timestampHistoryErrorMessage"
      :is-loading="isTimestampHistoryLoading"
      :timestamp-jobs="timestampJobs"
      @retry="handleTimestampHistoryRefresh"
    />

    <TimestampVerificationModal
      :is-open="isTimestampVerificationModalOpen"
      :is-submitting="isTimestampActionInProgress"
      @close="handleTimestampVerificationModalClose"
      @confirm="handleTimestampVerificationConfirm"
      @resend="handleTimestampVerificationCodeResend"
    />
  </section>
</template>

<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import { useToast } from '@/composables/useToast'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import TimestampFileWorkspace from '@/features/timestamp/components/TimestampFileWorkspace.vue'
import TimestampHistoryTable from '@/features/timestamp/components/TimestampHistoryTable.vue'
import TimestampVerificationModal from '@/features/timestamp/components/TimestampVerificationModal.vue'
import { useTimestampStore } from '@/features/timestamp/stores/timestamp.store'

const dashboardStore = useDashboardStore()
const timestampStore = useTimestampStore()
const { dashboardRequestStatus, dashboardSummary } =
  storeToRefs(dashboardStore)
const {
  canProcessTimestampFiles,
  isTimestampActionInProgress,
  isTimestampHistoryLoading,
  timestampActionErrorMessage,
  timestampActionSuccessMessage,
  timestampFiles,
  timestampFileValidationErrorMessage,
  timestampHistoryErrorMessage,
  timestampJobs,
  timestampJobsLoadStatus,
} = storeToRefs(timestampStore)
const { showErrorToast, showSuccessToast, showWarningToast } = useToast()
const { t } = useI18n({ useScope: 'global' })
const isTimestampVerificationModalOpen = ref(false)

const availableTimestampCredits = computed(
  () => dashboardSummary.value?.remainingCredits ?? null,
)
const hasAvailableTimestampCredits = computed(
  () =>
    availableTimestampCredits.value === null ||
    availableTimestampCredits.value > 0,
)
const canStartTimestampTransaction = computed(
  () =>
    canProcessTimestampFiles.value && hasAvailableTimestampCredits.value,
)

const handleTimestampFilesAdded = async (selectedTimestampFiles: File[]) => {
  const wereTimestampFilesAdded =
    timestampStore.addTimestampFiles(selectedTimestampFiles)

  if (!wereTimestampFilesAdded) {
    return
  }

  await handleTimestampUploadRequest()
}

const handleTimestampFileRemoval = (timestampFileId: string) => {
  void timestampStore.removeTimestampFile(timestampFileId)
}

const handleTimestampUploadRequest = async () => {
  const areTimestampFilesUploaded = await timestampStore.uploadTimestampFiles()

  if (areTimestampFilesUploaded) {
    showSuccessToast(timestampActionSuccessMessage.value)
    return
  }

  showErrorToast(
    timestampActionErrorMessage.value ||
      t('timestamp.feedback.uploadFailure', {
        failedCount: 1,
        uploadedCount: 0,
      }),
  )
}

const handleTimestampRequest = () => {
  timestampStore.clearTimestampActionFeedback()

  if (!hasAvailableTimestampCredits.value) {
    timestampStore.reportInsufficientTimestampCredits()
    showWarningToast(timestampActionErrorMessage.value)
    return
  }

  isTimestampVerificationModalOpen.value = true
}

const handleTimestampVerificationModalClose = () => {
  if (!isTimestampActionInProgress.value) {
    isTimestampVerificationModalOpen.value = false
  }
}

const handleTimestampVerificationConfirm = async () => {
  if (isTimestampActionInProgress.value) {
    return
  }

  const areTimestampsCreated = await timestampStore.processTimestampFiles()
  isTimestampVerificationModalOpen.value = false

  if (areTimestampsCreated) {
    showSuccessToast(timestampActionSuccessMessage.value)
    return
  }

  showErrorToast(
    timestampActionErrorMessage.value ||
      t('timestamp.feedback.transactionFailed'),
  )
}

const handleTimestampVerificationCodeResend = () => {
  showSuccessToast(t('timestamp.verification.codeResent'))
}

const handleTimestampHistoryRefresh = () => {
  void timestampStore.fetchTimestampJobs()
}

onMounted(async () => {
  if (dashboardRequestStatus.value === 'idle') {
    void dashboardStore.fetchDashboardData()
  }

  if (timestampJobsLoadStatus.value === 'idle') {
    void timestampStore.fetchTimestampJobs()
  }

  const hasSelectedTimestampFiles = timestampFiles.value.some(
    ({ status }) => status === 'selected',
  )

  if (hasSelectedTimestampFiles) {
    await handleTimestampUploadRequest()
  }

  await timestampStore.loadUploadedTimestampFiles()
})
</script>

<style scoped src="./TimestampPage.css"></style>
