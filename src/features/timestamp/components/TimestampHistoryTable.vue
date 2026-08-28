<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { RouterLink } from 'vue-router'

import AppIcon from '@/components/common/AppIcon.vue'
import type {
  TimestampJob,
  TimestampJobStatus,
} from '@/features/timestamp/types/timestamp.types'
import { formatDateTime, formatFileSize } from '@/utils/formatters'

defineProps<{
  errorMessage: string
  isLoading: boolean
  timestampJobs: TimestampJob[]
}>()

const emit = defineEmits<{
  retry: []
}>()

const { t } = useI18n({ useScope: 'global' })
const timestampJobStatusTranslationKeys: Record<TimestampJobStatus, string> = {
  completed: 'timestamp.history.completed',
  failed: 'timestamp.history.failed',
  processing: 'timestamp.history.processing',
}
</script>

<template>
  <section
    class="timestamp-history-table"
    aria-labelledby="timestamp-history-table-title"
    :aria-busy="isLoading"
  >
    <header class="timestamp-history-table__header">
      <div>
        <span>{{ t('timestamp.history.eyebrow') }}</span>
        <h2 id="timestamp-history-table-title">
          {{ t('timestamp.history.title') }}
        </h2>
        <p>{{ t('timestamp.history.description') }}</p>
      </div>

      <div class="timestamp-history-table__header-actions">
        <button type="button" :disabled="isLoading" @click="emit('retry')">
          <AppIcon name="refresh" :size="17" />
          {{
            isLoading
              ? t('timestamp.history.refreshing')
              : t('timestamp.history.refresh')
          }}
        </button>
        <RouterLink
          :to="{
            name: 'document-history',
            query: { operations: 'timestamp' },
          }"
        >
          {{ t('common.viewAll') }}
          <AppIcon name="arrow-right" :size="16" />
        </RouterLink>
      </div>
    </header>

    <div
      v-if="errorMessage"
      class="timestamp-history-table__error-notice"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      <p>{{ errorMessage }}</p>
      <button type="button" :disabled="isLoading" @click="emit('retry')">
        {{ t('common.retry') }}
      </button>
    </div>

    <div
      v-if="isLoading && timestampJobs.length === 0"
      class="timestamp-history-table__loading-state"
      :aria-label="t('timestamp.history.loadingAriaLabel')"
    >
      <span v-for="skeletonIndex in 3" :key="skeletonIndex"></span>
    </div>

    <table
      v-else-if="timestampJobs.length"
      class="timestamp-history-table__content"
    >
      <caption class="visually-hidden">
        {{ t('timestamp.history.caption') }}
      </caption>
      <thead>
        <tr class="timestamp-history-table__column-headings">
          <th scope="col">{{ t('timestamp.history.file') }}</th>
          <th scope="col">{{ t('timestamp.history.status') }}</th>
          <th scope="col">{{ t('timestamp.history.transactionDate') }}</th>
          <th scope="col">{{ t('timestamp.history.cost') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="timestampJob in timestampJobs"
          :key="timestampJob.id"
          class="timestamp-history-table__row"
        >
          <td
            class="timestamp-history-table__file"
            :data-label="t('timestamp.history.file')"
          >
            <span aria-hidden="true">
              <AppIcon name="document" :size="20" />
            </span>
            <div>
              <strong>{{ timestampJob.fileName }}</strong>
              <small>
                #ZD-{{ String(timestampJob.id).padStart(4, '0') }} ·
                {{ formatFileSize(timestampJob.fileSize) }}
              </small>
            </div>
          </td>

          <td :data-label="t('timestamp.history.status')">
            <span
              :class="[
                'timestamp-history-table__status',
                `timestamp-history-table__status--${timestampJob.status}`,
              ]"
            >
              <i aria-hidden="true"></i>
              {{ t(timestampJobStatusTranslationKeys[timestampJob.status]) }}
            </span>
          </td>

          <td
            class="timestamp-history-table__date-cell"
            :data-label="t('timestamp.history.transactionDate')"
          >
            <time :datetime="timestampJob.createdAt">
              {{ formatDateTime(timestampJob.createdAt) }}
            </time>
          </td>

          <td
            class="timestamp-history-table__credit"
            :data-label="t('timestamp.history.cost')"
          >
            {{ t('timestamp.history.creditCost', timestampJob.creditCost) }}
          </td>
        </tr>
      </tbody>
    </table>

    <div v-else-if="!errorMessage" class="timestamp-history-table__empty-state">
      <span aria-hidden="true">
        <AppIcon name="timestamp" :size="27" />
      </span>
      <h3>{{ t('timestamp.history.emptyTitle') }}</h3>
      <p>{{ t('timestamp.history.emptyDescription') }}</p>
    </div>
  </section>
</template>

<style scoped>
.timestamp-history-table {
  overflow: hidden;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.timestamp-history-table__header {
  display: flex;
  gap: 1.25rem;
  align-items: flex-end;
  justify-content: space-between;
  padding: 1.4rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.timestamp-history-table__header span,
.timestamp-history-table__header h2,
.timestamp-history-table__header p,
.timestamp-history-table__error-notice p,
.timestamp-history-table__empty-state h3,
.timestamp-history-table__empty-state p {
  margin: 0;
}

.timestamp-history-table__header span {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.timestamp-history-table__header h2 {
  margin-top: 0.35rem;
  color: var(--color-brand-950);
  font-size: 1.1rem;
  letter-spacing: -0.025em;
}

.timestamp-history-table__header p {
  margin-top: 0.4rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.5;
}

.timestamp-history-table__header-actions {
  display: flex;
  gap: 0.65rem;
  align-items: center;
}

.timestamp-history-table__header-actions button,
.timestamp-history-table__header-actions a,
.timestamp-history-table__error-notice button {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0.5rem;
  align-items: center;
  justify-content: center;
  min-height: 2.6rem;
  padding: 0.65rem 0.85rem;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 500;
  cursor: pointer;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  text-decoration: none;
  transition:
    border-color var(--transition-fast),
    transform var(--transition-fast);
}

.timestamp-history-table__header-actions button:hover:not(:disabled),
.timestamp-history-table__header-actions a:hover,
.timestamp-history-table__error-notice button:hover:not(:disabled) {
  border-color: var(--color-accent-600);
  transform: translateY(-1px);
}

.timestamp-history-table__header-actions button:disabled,
.timestamp-history-table__error-notice button:disabled {
  cursor: wait;
  opacity: 0.65;
}

.timestamp-history-table__error-notice {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.85rem 1rem;
  color: var(--color-danger);
  background: color-mix(
    in srgb,
    var(--color-danger) 7%,
    var(--color-surface-raised)
  );
  border-bottom: 1px solid
    color-mix(in srgb, var(--color-danger) 20%, transparent);
}

.timestamp-history-table__error-notice > span {
  display: grid;
  width: 1.5rem;
  height: 1.5rem;
  place-items: center;
  font-size: var(--font-size-small);
  font-weight: 500;
  border: 1px solid currentColor;
  border-radius: 50%;
}

.timestamp-history-table__error-notice p {
  font-size: var(--font-size-small);
  font-weight: 500;
}

.timestamp-history-table__error-notice button {
  min-height: 2.25rem;
  color: var(--color-danger);
  background: var(--color-surface-raised);
  border-color: color-mix(in srgb, var(--color-danger) 25%, transparent);
}

.timestamp-history-table__content {
  width: 100%;
  border-collapse: collapse;
}

.timestamp-history-table__content > thead,
.timestamp-history-table__content > tbody {
  display: block;
}

.timestamp-history-table__column-headings,
.timestamp-history-table__row {
  display: grid;
  grid-template-columns:
    minmax(15rem, 1.8fr) minmax(7rem, 0.65fr)
    minmax(9rem, 0.8fr) minmax(5rem, 0.45fr);
  gap: 1rem;
  align-items: center;
}

.timestamp-history-table__column-headings > th,
.timestamp-history-table__row > td {
  min-width: 0;
  padding: 0;
  text-align: left;
}

.timestamp-history-table__column-headings > th {
  font-weight: inherit;
}

.timestamp-history-table__column-headings {
  padding: 0.7rem 1.5rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--color-surface-subtle);
  border-bottom: 1px solid var(--color-border);
}

.timestamp-history-table__row {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid var(--color-border);
}

.timestamp-history-table__row:last-child {
  border-bottom: 0;
}

.timestamp-history-table__file {
  display: flex;
  min-width: 0;
  gap: 0.75rem;
  align-items: center;
}

.timestamp-history-table__file > span {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: var(--radius-sm);
}

.timestamp-history-table__file div {
  display: grid;
  min-width: 0;
  gap: 0.25rem;
}

.timestamp-history-table__file strong {
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 0.78rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.timestamp-history-table__file small,
.timestamp-history-table__row time,
.timestamp-history-table__credit {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.timestamp-history-table__status {
  --timestamp-status-color: var(--color-text-secondary);

  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  width: fit-content;
  padding: 0.35rem 0.55rem;
  color: var(--timestamp-status-color);
  font-size: var(--font-size-small);
  font-weight: 500;
  background: color-mix(
    in srgb,
    var(--timestamp-status-color) 8%,
    var(--color-surface-raised)
  );
  border-radius: 999px;
}

.timestamp-history-table__status i {
  width: 0.4rem;
  height: 0.4rem;
  background: currentColor;
  border-radius: 50%;
}

.timestamp-history-table__status--completed {
  --timestamp-status-color: var(--color-success);
}

.timestamp-history-table__status--processing {
  --timestamp-status-color: var(--color-primary-600);
}

.timestamp-history-table__status--failed {
  --timestamp-status-color: var(--color-danger);
}

.timestamp-history-table__credit {
  width: fit-content;
  padding: 0.35rem 0.55rem;
  color: var(--color-brand-950);
  font-weight: 500;
  background: var(--color-surface-subtle);
  border-radius: 999px;
}

.timestamp-history-table__loading-state {
  display: grid;
  gap: 0.75rem;
  padding: 1rem 1.5rem 1.5rem;
}

.timestamp-history-table__loading-state span {
  height: 4rem;
  background: linear-gradient(
    100deg,
    var(--color-surface-subtle) 25%,
    var(--color-surface-raised) 40%,
    var(--color-surface-subtle) 58%
  );
  background-size: 200% 100%;
  border-radius: var(--radius-sm);
  animation: timestamp-history-table-shimmer 1.3s infinite linear;
}

.timestamp-history-table__empty-state {
  display: grid;
  min-height: 14rem;
  padding: 2rem;
  place-items: center;
  align-content: center;
  text-align: center;
}

.timestamp-history-table__empty-state > span {
  display: grid;
  width: 3.5rem;
  height: 3.5rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: 50%;
}

.timestamp-history-table__empty-state h3 {
  margin-top: 1rem;
  color: var(--color-brand-950);
  font-size: 0.92rem;
}

.timestamp-history-table__empty-state p {
  max-width: 28rem;
  margin-top: 0.45rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.55;
}

@keyframes timestamp-history-table-shimmer {
  to {
    background-position-x: -200%;
  }
}

@media (max-width: 63.99rem) {
  .timestamp-history-table__column-headings {
    display: none;
  }

  .timestamp-history-table__row {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    align-items: start;
  }

  .timestamp-history-table__file {
    grid-column: 1 / -1;
  }

  .timestamp-history-table__row [data-label]::before {
    display: block;
    margin-bottom: 0.4rem;
    color: var(--color-text-secondary);
    font-size: var(--font-size-small);
    font-weight: 500;
    letter-spacing: 0.07em;
    content: attr(data-label);
    text-transform: uppercase;
  }

  .timestamp-history-table__file::before {
    display: none !important;
  }
}

@media (max-width: 47.99rem) {
  .timestamp-history-table__header {
    display: grid;
    align-items: start;
  }

  .timestamp-history-table__header-actions {
    flex-wrap: wrap;
  }

  .timestamp-history-table__error-notice {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .timestamp-history-table__error-notice button {
    grid-column: 1 / -1;
    width: fit-content;
  }

  .timestamp-history-table__row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    padding: 1rem;
  }

  .timestamp-history-table__date-cell {
    grid-column: 1 / -1;
  }
}
</style>
