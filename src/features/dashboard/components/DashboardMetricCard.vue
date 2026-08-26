<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'
import type { AppIconName } from '@/types/icon'

withDefaults(
  defineProps<{
    detail: string
    icon: AppIconName
    label: string
    progress?: number
    tone: 'blue' | 'green' | 'navy' | 'violet'
    value: string
  }>(),
  {
    progress: undefined,
  },
)
</script>

<template>
  <article :class="['dashboard-metric-card', `dashboard-metric-card--${tone}`]">
    <div class="dashboard-metric-card__topline">
      <span class="dashboard-metric-card__icon" aria-hidden="true">
        <AppIcon :name="icon" :size="21" />
      </span>
      <span class="dashboard-metric-card__label">{{ label }}</span>
    </div>

    <strong class="dashboard-metric-card__value">{{ value }}</strong>

    <div class="dashboard-metric-card__footer">
      <span>{{ detail }}</span>
      <div
        v-if="progress !== undefined"
        class="dashboard-metric-card__progress"
        role="progressbar"
        aria-label="Arşiv kullanım oranı"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="Math.round(progress)"
      >
        <span :style="{ width: `${progress}%` }"></span>
      </div>
    </div>
  </article>
</template>

<style scoped>
.dashboard-metric-card {
  --metric-color: var(--color-brand-950);
  --metric-soft: var(--color-brand-100);

  display: grid;
  min-height: 10.75rem;
  padding: 1.25rem;
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

.dashboard-metric-card__topline {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.dashboard-metric-card__icon {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--metric-color);
  background: var(--metric-soft);
  border-radius: 0.75rem;
}

.dashboard-metric-card__label {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.02em;
}

.dashboard-metric-card__value {
  align-self: end;
  margin-top: 1.25rem;
  color: var(--color-brand-950);
  font-size: clamp(1.5rem, 2vw, 2rem);
  line-height: 1;
  letter-spacing: -0.05em;
}

.dashboard-metric-card__footer {
  display: grid;
  gap: 0.55rem;
  margin-top: 0.65rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.dashboard-metric-card__progress {
  height: 0.3rem;
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
