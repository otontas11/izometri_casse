<template>
  <section
    class="profile-password-reset-panel"
    aria-labelledby="profile-password-reset-panel-title"
  >
    <span class="profile-password-reset-panel__icon" aria-hidden="true">
      <AppIcon name="mail" :size="22" />
    </span>

    <div class="profile-password-reset-panel__content">
      <small>{{ t('profile.passwordReset.eyebrow') }}</small>
      <h2 id="profile-password-reset-panel-title">
        {{ t('profile.passwordReset.title') }}
      </h2>
      <p>
        {{
          t('profile.passwordReset.description', {
            emailAddress,
          })
        }}
      </p>
    </div>

    <button
      type="button"
      :disabled="isRequesting"
      :aria-busy="isRequesting"
      @click="emit('request')"
    >
      <span
        v-if="isRequesting"
        class="profile-password-reset-panel__spinner"
        aria-hidden="true"
      ></span>
      <AppIcon v-else name="mail" :size="18" />
      {{
        isRequesting
          ? t('profile.passwordReset.sending')
          : t('profile.passwordReset.sendLink')
      }}
    </button>
  </section>
</template>

<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  emailAddress: string
  isRequesting: boolean
}>()

const emit = defineEmits<{
  request: []
}>()

const { t } = useI18n({ useScope: 'global' })
</script>

<style scoped>
.profile-password-reset-panel {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1rem;
  align-items: center;
  padding: clamp(1.15rem, 3vw, 1.5rem);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.profile-password-reset-panel__icon {
  display: grid;
  width: 3rem;
  height: 3rem;
  place-items: center;
  color: var(--color-primary-600);
  background: var(--color-primary-100);
  border-radius: var(--radius-sm);
}

.profile-password-reset-panel__content {
  min-width: 0;
}

.profile-password-reset-panel__content small,
.profile-password-reset-panel__content h2,
.profile-password-reset-panel__content p {
  margin: 0;
}

.profile-password-reset-panel__content small {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.profile-password-reset-panel__content h2 {
  margin-top: 0.2rem;
  color: var(--color-brand-950);
  font-size: 1rem;
  line-height: 1.3;
}

.profile-password-reset-panel__content p {
  margin-top: 0.35rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.55;
}

.profile-password-reset-panel > button {
  display: inline-flex;
  flex: 0 0 auto;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  min-height: 2.8rem;
  padding: 0.7rem 0.95rem;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  font-weight: 500;
  cursor: pointer;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
  transition:
    background-color var(--transition-fast),
    transform var(--transition-fast);
}

.profile-password-reset-panel > button:hover:not(:disabled) {
  background: var(--color-primary-600);
  transform: translateY(-1px);
}

.profile-password-reset-panel > button:disabled {
  cursor: wait;
  opacity: 0.58;
}

.profile-password-reset-panel__spinner {
  width: 0.95rem;
  height: 0.95rem;
  border: 2px solid
    color-mix(in srgb, var(--color-text-inverse) 35%, transparent);
  border-top-color: var(--color-text-inverse);
  border-radius: 50%;
  animation: profile-password-reset-panel-spin 700ms linear infinite;
}

@keyframes profile-password-reset-panel-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 700px) {
  .profile-password-reset-panel {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: start;
  }

  .profile-password-reset-panel > button {
    grid-column: 1 / -1;
    width: 100%;
  }
}
</style>
