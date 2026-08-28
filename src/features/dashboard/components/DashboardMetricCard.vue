<template>
  <article :class="['dashboard-metric-card', `dashboard-metric-card--${tone}`]">
    <span class="dashboard-metric-card__icon" aria-hidden="true">
      <AppIcon :name="icon" :size="21" />
    </span>

    <div class="dashboard-metric-card__content">
      <span class="dashboard-metric-card__label">{{ label }}</span>
      <strong class="dashboard-metric-card__value">{{ metricValue }}</strong>

      <span v-if="detail" class="dashboard-metric-card__detail">
        {{ detail }}
      </span>
      <div
        v-if="progress !== undefined"
        class="dashboard-metric-card__progress"
        role="progressbar"
        :aria-label="t('dashboard.metrics.archiveUsageAriaLabel')"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(progress)"
      >
        <span :style="{ width: `${progress}%` }"></span>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import type { AppIconName } from '@/types/icon'

withDefaults(
  defineProps<{
    detail?: string
    icon: AppIconName
    label: string
    metricValue: string
    progress?: number
    tone: 'blue' | 'green' | 'navy' | 'violet'
  }>(),
  {
    detail: '',
    progress: undefined,
  },
)

const { t } = useI18n({ useScope: 'global' })
</script>

<style scoped>
.dashboard-metric-card {
  --metric-color: var(--color-brand-950);
  --metric-soft: var(--color-brand-100);

  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.875rem;
  align-items: center;
  min-height: 5.25rem;
  padding: 0.75rem 0.875rem;
  overflow: hidden;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.dashboard-metric-card--blue {
  --metric-color: var(--color-primary-600);
  --metric-soft: var(--color-primary-100);
}

.dashboard-metric-card--green {
  --metric-color: var(--color-accent-600);
  --metric-soft: var(--color-accent-100);
}

.dashboard-metric-card--violet {
  --metric-color: #7c5ce5;
  --metric-soft: #f0ebff;
}

.dashboard-metric-card__icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: var(--metric-color);
  background: var(--metric-soft);
  border-radius: 0.75rem;
}

.dashboard-metric-card__content {
  display: grid;
  min-width: 0;
}

.dashboard-metric-card__label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.dashboard-metric-card__value {
  margin-top: 0.3rem;
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: clamp(1.15rem, 1.5vw, 1.45rem);
  line-height: 1.15;
  letter-spacing: -0.035em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dashboard-metric-card__detail {
  margin-top: 0.25rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.dashboard-metric-card__progress {
  height: 0.3rem;
  margin-top: 0.45rem;
  overflow: hidden;
  background: var(--color-surface-subtle);
  border-radius: 999px;
}

.dashboard-metric-card__progress span {
  display: block;
  height: 100%;
  background: var(--metric-color);
  border-radius: inherit;
}
</style>
