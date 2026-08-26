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

<style scoped>
.timestamp-page {
  display: grid;
  gap: 1.75rem;
  width: min(100%, 90rem);
  margin-inline: auto;
}

.timestamp-page__header {
  display: flex;
  gap: 2rem;
  align-items: flex-end;
  justify-content: space-between;
}

.timestamp-page__header h1,
.timestamp-page__header p,
.timestamp-page__guide p,
.timestamp-page__guide h2,
.timestamp-page__guide ol,
.timestamp-page__guide-note p,
.timestamp-page__feedback {
  margin: 0;
}

.timestamp-page__eyebrow {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.timestamp-page__header h1 {
  margin-top: 0.45rem;
  color: var(--color-brand-950);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1;
  letter-spacing: -0.055em;
}

.timestamp-page__header > div:first-child > p {
  max-width: 43rem;
  margin-top: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.65;
}

.timestamp-page__transaction-summary {
  display: flex;
  flex: 0 0 auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.8rem 1rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.timestamp-page__transaction-summary > span {
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: var(--radius-sm);
}

.timestamp-page__transaction-summary--insufficient {
  border-color: color-mix(
    in srgb,
    var(--color-warning) 35%,
    var(--color-border)
  );
}

.timestamp-page__transaction-summary--insufficient > span {
  color: var(--color-warning);
  background: color-mix(
    in srgb,
    var(--color-warning) 12%,
    var(--color-surface-raised)
  );
}

.timestamp-page__transaction-summary div {
  display: grid;
  gap: 0.2rem;
}

.timestamp-page__transaction-summary small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.timestamp-page__transaction-summary strong {
  color: var(--color-brand-950);
  font-size: 0.78rem;
  font-weight: 500;
}

.timestamp-page__transaction-summary .timestamp-page__available-credits {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 500;
}

.timestamp-page__transaction-summary--insufficient
  .timestamp-page__available-credits {
  color: var(--color-warning);
}

.timestamp-page__workspace {
  display: grid;
  grid-template-columns: minmax(0, 1.75fr) minmax(18rem, 0.65fr);
  gap: 1rem;
  align-items: start;
}

.timestamp-page__upload-workflow {
  display: grid;
  min-width: 0;
  gap: 1rem;
}

.timestamp-page__guide {
  position: sticky;
  top: calc(var(--topbar-height) + 1rem);
  display: grid;
  padding: 1.5rem;
  overflow: hidden;
  color: var(--color-text-inverse);
  background:
    radial-gradient(
      circle at 100% 0%,
      color-mix(in srgb, var(--color-accent-600) 35%, transparent),
      transparent 42%
    ),
    var(--color-brand-950);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.timestamp-page__guide-icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: var(--color-brand-950);
  background: var(--color-accent-100);
  border-radius: var(--radius-sm);
}

.timestamp-page__guide > p {
  margin-top: 1.4rem;
  color: color-mix(in srgb, var(--color-text-inverse) 64%, transparent);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.timestamp-page__guide h2 {
  max-width: 16rem;
  margin-top: 0.45rem;
  font-size: 1.3rem;
  line-height: 1.25;
  letter-spacing: -0.03em;
}

.timestamp-page__guide ol {
  display: grid;
  gap: 1.15rem;
  margin-top: 1.75rem;
  padding: 0;
  list-style: none;
}

.timestamp-page__guide li {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.75rem;
}

.timestamp-page__guide li > span {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: var(--color-accent-100);
  font-family: var(--font-family-mono);
  font-size: var(--font-size-small);
  border: 1px solid
    color-mix(in srgb, var(--color-text-inverse) 22%, transparent);
  border-radius: 50%;
}

.timestamp-page__guide li div {
  display: grid;
  gap: 0.3rem;
}

.timestamp-page__guide li strong {
  font-size: 0.78rem;
  font-weight: 500;
}

.timestamp-page__guide li small {
  color: color-mix(in srgb, var(--color-text-inverse) 65%, transparent);
  font-size: var(--font-size-small);
  line-height: 1.5;
}

.timestamp-page__guide-note {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.65rem;
  margin-top: 1.75rem;
  padding-top: 1.1rem;
  color: color-mix(in srgb, var(--color-text-inverse) 75%, transparent);
  border-top: 1px solid
    color-mix(in srgb, var(--color-text-inverse) 16%, transparent);
}

.timestamp-page__guide-note > span {
  display: grid;
  width: 1.35rem;
  height: 1.35rem;
  place-items: center;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 500;
  background: var(--color-accent-100);
  border-radius: 50%;
}

.timestamp-page__guide-note p {
  font-size: var(--font-size-small);
  line-height: 1.55;
}

.timestamp-page__feedback {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  padding: 0.9rem 1rem;
  font-size: 0.76rem;
  font-weight: 500;
  background: var(--color-surface-raised);
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
}

.timestamp-page__feedback > span {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.timestamp-page__feedback--success {
  color: var(--color-success);
  background: color-mix(
    in srgb,
    var(--color-success) 7%,
    var(--color-surface-raised)
  );
}

.timestamp-page__feedback--error {
  color: var(--color-danger);
  background: color-mix(
    in srgb,
    var(--color-danger) 7%,
    var(--color-surface-raised)
  );
}

@media (max-width: 79.99rem) {
  .timestamp-page__workspace {
    grid-template-columns: minmax(0, 1fr);
  }

  .timestamp-page__guide {
    position: static;
  }

  .timestamp-page__guide ol {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .timestamp-page__guide-note {
    max-width: 36rem;
  }
}

@media (max-width: 47.99rem) {
  .timestamp-page {
    gap: 1.25rem;
  }

  .timestamp-page__header {
    display: grid;
    gap: 1.25rem;
    align-items: start;
  }

  .timestamp-page__transaction-summary {
    width: fit-content;
  }

  .timestamp-page__guide ol {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
