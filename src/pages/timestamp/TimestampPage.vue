<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import { useToast } from '@/composables/useToast'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'
import TimestampConfirmationModal from '@/features/timestamp/components/TimestampConfirmationModal.vue'
import TimestampFileUploadZone from '@/features/timestamp/components/TimestampFileUploadZone.vue'
import TimestampHistoryTable from '@/features/timestamp/components/TimestampHistoryTable.vue'
import { useTimestampStore } from '@/features/timestamp/stores/timestamp.store'
import { MAX_TIMESTAMP_FILE_SIZE_BYTES } from '@/features/timestamp/utils/timestampFileValidation'
import { formatFileSize } from '@/utils/formatters'

const dashboardStore = useDashboardStore()
const timestampStore = useTimestampStore()
const { dashboardSummary } = storeToRefs(dashboardStore)
const {
  isTimestampHistoryLoading,
  isTimestampSubmitting,
  selectedTimestampFile,
  timestampHistoryErrorMessage,
  timestampJobs,
  timestampJobsLoadStatus,
  timestampSubmissionErrorMessage,
  timestampSubmissionSuccessMessage,
} = storeToRefs(timestampStore)
const { showErrorToast, showSuccessToast, showWarningToast } = useToast()
const { t } = useI18n({ useScope: 'global' })

const isConfirmationModalOpen = ref(false)
const maximumTimestampFileSizeLabel = computed(() =>
  formatFileSize(MAX_TIMESTAMP_FILE_SIZE_BYTES),
)
const availableTimestampCredits = computed(
  () => dashboardSummary.value?.remainingCredits ?? null,
)
const hasAvailableTimestampCredits = computed(
  () =>
    availableTimestampCredits.value === null ||
    availableTimestampCredits.value > 0,
)

const handleTimestampFileSelection = (timestampFile: File | null) => {
  timestampStore.selectTimestampFile(timestampFile)
}

const handleTimestampConfirmationRequest = () => {
  if (!selectedTimestampFile.value) {
    return
  }

  timestampStore.clearTimestampSubmissionFeedback()

  if (!hasAvailableTimestampCredits.value) {
    timestampStore.reportInsufficientTimestampCredits()
    showWarningToast(timestampSubmissionErrorMessage.value)
    return
  }

  isConfirmationModalOpen.value = true
}

const handleConfirmationModalClose = () => {
  if (!isTimestampSubmitting.value) {
    isConfirmationModalOpen.value = false
  }
}

const handleTimestampSubmission = async () => {
  const isTimestampCreated = await timestampStore.submitSelectedTimestampFile()

  if (isTimestampCreated) {
    isConfirmationModalOpen.value = false
    showSuccessToast(timestampSubmissionSuccessMessage.value)
    return
  }

  showErrorToast(timestampSubmissionErrorMessage.value)
}

const handleTimestampHistoryRefresh = () => {
  void timestampStore.fetchTimestampJobs()
}

onMounted(() => {
  if (timestampJobsLoadStatus.value === 'idle') {
    void timestampStore.fetchTimestampJobs()
  }
})
</script>

<template>
  <section class="timestamp-page" aria-labelledby="timestamp-page-title">
    <header class="timestamp-page__header">
      <div>
        <span class="timestamp-page__eyebrow">{{ t('timestamp.page.eyebrow') }}</span>
        <h1 id="timestamp-page-title">{{ t('timestamp.page.title') }}</h1>
        <p>{{ t('timestamp.page.description') }}</p>
      </div>

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
    </header>

    <div class="timestamp-page__workspace">
      <div class="timestamp-page__upload-workflow">
        <TimestampFileUploadZone
          :selected-file="selectedTimestampFile"
          :is-disabled="isTimestampSubmitting"
          @select-file="handleTimestampFileSelection"
          @request-timestamp="handleTimestampConfirmationRequest"
        />

        <p
          v-if="timestampSubmissionSuccessMessage"
          class="timestamp-page__feedback timestamp-page__feedback--success"
          role="status"
        >
          <span aria-hidden="true">✓</span>
          {{ timestampSubmissionSuccessMessage }}
        </p>

        <p
          v-else-if="
            timestampSubmissionErrorMessage && !isConfirmationModalOpen
          "
          class="timestamp-page__feedback timestamp-page__feedback--error"
          role="alert"
        >
          <span aria-hidden="true">!</span>
          {{ timestampSubmissionErrorMessage }}
        </p>
      </div>

      <aside class="timestamp-page__guide" aria-labelledby="timestamp-guide-title">
        <span class="timestamp-page__guide-icon" aria-hidden="true">
          <AppIcon name="timestamp" :size="24" />
        </span>
        <p>{{ t('timestamp.page.guideEyebrow') }}</p>
        <h2 id="timestamp-guide-title">{{ t('timestamp.page.guideTitle') }}</h2>

        <ol>
          <li>
            <span>01</span>
            <div>
              <strong>{{ t('timestamp.page.selectFile') }}</strong>
              <small>
                {{
                  t('timestamp.page.selectFileDescription', {
                    maximumSize: maximumTimestampFileSizeLabel,
                  })
                }}
              </small>
            </div>
          </li>
          <li>
            <span>02</span>
            <div>
              <strong>{{ t('timestamp.page.confirmInformation') }}</strong>
              <small>
                {{ t('timestamp.page.confirmInformationDescription') }}
              </small>
            </div>
          </li>
          <li>
            <span>03</span>
            <div>
              <strong>{{ t('timestamp.page.followRecord') }}</strong>
              <small>{{ t('timestamp.page.followRecordDescription') }}</small>
            </div>
          </li>
        </ol>

        <div class="timestamp-page__guide-note">
          <span aria-hidden="true">✓</span>
          <p>{{ t('timestamp.page.guideNote') }}</p>
        </div>
      </aside>
    </div>

    <TimestampHistoryTable
      :timestamp-jobs="timestampJobs"
      :is-loading="isTimestampHistoryLoading"
      :error-message="timestampHistoryErrorMessage"
      @retry="handleTimestampHistoryRefresh"
    />

    <TimestampConfirmationModal
      :is-open="isConfirmationModalOpen"
      :is-submitting="isTimestampSubmitting"
      :timestamp-file="selectedTimestampFile"
      :error-message="timestampSubmissionErrorMessage"
      @close="handleConfirmationModalClose"
      @confirm="handleTimestampSubmission"
    />
  </section>
</template>

<style scoped src="./TimestampPage.css"></style>
