<script setup lang="ts">
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'

const { t } = useI18n({ useScope: 'global' })
</script>

<template>
  <section
    class="dashboard-quick-actions-panel"
    :aria-label="t('dashboard.quickActions.ariaLabel')"
  >
    <article class="dashboard-quick-actions-panel__primary-action">
      <div class="dashboard-quick-actions-panel__primary-copy">
        <span class="dashboard-quick-actions-panel__badge">
          <span aria-hidden="true"></span>
          {{ t('dashboard.quickActions.fastestAction') }}
        </span>
        <h2>{{ t('dashboard.quickActions.title') }}</h2>
        <p>{{ t('dashboard.quickActions.description') }}</p>
      </div>

      <RouterLink
        class="dashboard-quick-actions-panel__timestamp-link"
        :to="{ name: 'timestamp' }"
      >
        <span
          class="dashboard-quick-actions-panel__timestamp-icon"
          aria-hidden="true"
        >
          <AppIcon name="upload" :size="24" />
        </span>
        <span class="dashboard-quick-actions-panel__timestamp-copy">
          <strong>{{ t('dashboard.quickActions.startSelectingFile') }}</strong>
          <small>{{ t('dashboard.quickActions.goToTimestamp') }}</small>
        </span>
        <AppIcon name="arrow-right" :size="20" />
      </RouterLink>
    </article>

    <aside
      class="dashboard-quick-actions-panel__trust-chain"
      aria-labelledby="dashboard-trust-chain-title"
    >
      <div class="dashboard-quick-actions-panel__trust-heading">
        <span
          class="dashboard-quick-actions-panel__trust-icon"
          aria-hidden="true"
        >
          <AppIcon name="timestamp" :size="21" />
        </span>
        <div>
          <small>{{ t('dashboard.quickActions.assurance') }}</small>
          <h2 id="dashboard-trust-chain-title">
            {{ t('dashboard.quickActions.trustChain') }}
          </h2>
        </div>
      </div>

      <ol class="dashboard-quick-actions-panel__trust-steps">
        <li>
          <span>01</span>
          <div>
            <strong>{{ t('dashboard.quickActions.fileIntegrity') }}</strong>
            <small>
              {{ t('dashboard.quickActions.fileIntegrityDescription') }}
            </small>
          </div>
        </li>
        <li>
          <span>02</span>
          <div>
            <strong>{{ t('dashboard.quickActions.timeProof') }}</strong>
            <small>{{ t('dashboard.quickActions.timeProofDescription') }}</small>
          </div>
        </li>
        <li>
          <span>03</span>
          <div>
            <strong>{{ t('dashboard.quickActions.secureArchive') }}</strong>
            <small>
              {{ t('dashboard.quickActions.secureArchiveDescription') }}
            </small>
          </div>
        </li>
      </ol>
    </aside>
  </section>
</template>

<style scoped>
.dashboard-quick-actions-panel {
  display: grid;
  grid-template-columns: minmax(0, 1.55fr) minmax(18rem, 0.65fr);
  gap: 1rem;
}

.dashboard-quick-actions-panel__primary-action {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(16rem, 0.75fr);
  gap: clamp(1.5rem, 4vw, 3rem);
  align-items: center;
  min-height: 20rem;
  padding: clamp(1.5rem, 3vw, 2.5rem);
  overflow: hidden;
  color: var(--color-text-inverse);
  background:
    radial-gradient(circle at 8% 10%, rgb(37 99 235 / 42%), transparent 34%),
    radial-gradient(circle at 95% 90%, rgb(15 159 132 / 32%), transparent 35%),
    var(--color-brand-950);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 45px rgb(16 42 67 / 16%);
}

.dashboard-quick-actions-panel__primary-action::before,
.dashboard-quick-actions-panel__primary-action::after {
  position: absolute;
  content: '';
  border: 1px solid rgb(255 255 255 / 9%);
  border-radius: 50%;
}

.dashboard-quick-actions-panel__primary-action::before {
  top: -8rem;
  right: 16%;
  width: 20rem;
  height: 20rem;
}

.dashboard-quick-actions-panel__primary-action::after {
  right: -5rem;
  bottom: -8rem;
  width: 18rem;
  height: 18rem;
}

.dashboard-quick-actions-panel__primary-copy,
.dashboard-quick-actions-panel__timestamp-link {
  position: relative;
  z-index: 1;
}

.dashboard-quick-actions-panel__badge {
  display: inline-flex;
  gap: 0.5rem;
  align-items: center;
  width: fit-content;
  padding: 0.45rem 0.65rem;
  color: #bff4e9;
  font-size: var(--font-size-small);
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  background: rgb(15 159 132 / 16%);
  border: 1px solid rgb(82 224 197 / 18%);
  border-radius: 999px;
}

.dashboard-quick-actions-panel__badge span {
  width: 0.45rem;
  height: 0.45rem;
  background: #52e0c5;
  border-radius: 50%;
  box-shadow: 0 0 0 4px rgb(82 224 197 / 12%);
}

.dashboard-quick-actions-panel__primary-action h2,
.dashboard-quick-actions-panel__primary-action p,
.dashboard-quick-actions-panel__trust-chain h2,
.dashboard-quick-actions-panel__trust-steps {
  margin: 0;
}

.dashboard-quick-actions-panel__primary-action h2 {
  max-width: 34rem;
  margin-top: 1.25rem;
  font-size: clamp(1.75rem, 3vw, 2.5rem);
  line-height: 1.14;
  letter-spacing: -0.05em;
}

.dashboard-quick-actions-panel__primary-action p {
  max-width: 34rem;
  margin-top: 1rem;
  color: rgb(255 255 255 / 68%);
  font-size: 0.83rem;
  line-height: 1.75;
}

.dashboard-quick-actions-panel__timestamp-link {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.875rem;
  align-items: center;
  min-height: 8.5rem;
  padding: 1.25rem;
  color: var(--color-brand-950);
  text-decoration: none;
  background: rgb(255 255 255 / 94%);
  border: 1px solid rgb(255 255 255 / 55%);
  border-radius: var(--radius-lg);
  box-shadow: 0 16px 35px rgb(0 0 0 / 15%);
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.dashboard-quick-actions-panel__timestamp-link:hover {
  background: #fff;
  transform: translateY(-3px);
}

.dashboard-quick-actions-panel__timestamp-icon {
  display: grid;
  width: 3.25rem;
  height: 3.25rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: 1rem;
}

.dashboard-quick-actions-panel__timestamp-copy {
  display: grid;
  gap: 0.35rem;
}

.dashboard-quick-actions-panel__timestamp-copy strong {
  font-size: 0.86rem;
}

.dashboard-quick-actions-panel__timestamp-copy small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 600;
}

.dashboard-quick-actions-panel__trust-chain {
  display: grid;
  align-content: start;
  padding: 1.5rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.dashboard-quick-actions-panel__trust-heading {
  display: flex;
  gap: 0.875rem;
  align-items: center;
  padding-bottom: 1.25rem;
  border-bottom: 1px solid var(--color-border);
}

.dashboard-quick-actions-panel__trust-icon {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: 0.875rem;
}

.dashboard-quick-actions-panel__trust-heading small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
}

.dashboard-quick-actions-panel__trust-heading h2 {
  margin-top: 0.2rem;
  color: var(--color-brand-950);
  font-size: 1rem;
}

.dashboard-quick-actions-panel__trust-steps {
  display: grid;
  padding: 0;
  list-style: none;
}

.dashboard-quick-actions-panel__trust-steps li {
  position: relative;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr);
  gap: 0.75rem;
  padding-top: 1.25rem;
}

.dashboard-quick-actions-panel__trust-steps li:not(:last-child)::after {
  position: absolute;
  top: 3.2rem;
  bottom: -0.85rem;
  left: 0.95rem;
  width: 1px;
  content: '';
  background: var(--color-border);
}

.dashboard-quick-actions-panel__trust-steps li > span {
  display: grid;
  z-index: 1;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 800;
  background: var(--color-accent-100);
  border: 3px solid var(--color-surface-raised);
  border-radius: 50%;
}

.dashboard-quick-actions-panel__trust-steps li div {
  display: grid;
  gap: 0.2rem;
  padding-top: 0.25rem;
}

.dashboard-quick-actions-panel__trust-steps li strong {
  color: var(--color-brand-950);
  font-size: 0.76rem;
}

.dashboard-quick-actions-panel__trust-steps li small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.5;
}

@media (max-width: 79.99rem) {
  .dashboard-quick-actions-panel {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-quick-actions-panel__trust-steps {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
  }

  .dashboard-quick-actions-panel__trust-steps li:not(:last-child)::after {
    display: none;
  }
}

@media (max-width: 47.99rem) {
  .dashboard-quick-actions-panel__primary-action {
    grid-template-columns: minmax(0, 1fr);
    min-height: auto;
  }

  .dashboard-quick-actions-panel__trust-steps {
    grid-template-columns: minmax(0, 1fr);
  }

  .dashboard-quick-actions-panel__trust-steps li:not(:last-child)::after {
    display: block;
  }
}
</style>
