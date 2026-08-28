<template>
  <TransitionGroup name="toast-notification"
                   tag="div"
                   class="toast-notification"
                   aria-live="polite"
                   :aria-label="t('notifications.ariaLabel')"
  >
    <article v-for="notification in activeNotifications"
             :key="notification.id"
             :class="[
               'toast-notification__message',
               `toast-notification__message--${notification.variant}`,
             ]"
             :role="notification.variant === 'error' ? 'alert' : 'status'"
    >
      <span class="toast-notification__symbol" aria-hidden="true">
        {{ notificationSymbols[notification.variant] }}
      </span>
      <p>{{ notification.message }}</p>
      <button type="button"
              :aria-label="t('notifications.dismissAriaLabel')"
              @click="notificationStore.dismissNotification(notification.id)"
      >
        ×
      </button>
    </article>
  </TransitionGroup>
</template>

<script setup lang="ts">
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import { useNotificationStore } from '@/stores/notification.store'

const notificationStore = useNotificationStore()
const { activeNotifications } = storeToRefs(notificationStore)
const { t } = useI18n({ useScope: 'global' })

const notificationSymbols = {
  error: '!',
  success: '✓',
  warning: '!',
} as const
</script>

<style scoped>
.toast-notification {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 200;
  display: grid;
  width: min(25rem, calc(100vw - 2rem));
  gap: 0.75rem;
  pointer-events: none;
}

.toast-notification__message {
  --notification-color: var(--color-primary-600);
  --notification-background: var(--color-primary-100);

  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 0.7rem;
  align-items: center;
  padding: 0.85rem 0.9rem;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 700;
  pointer-events: auto;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-left: 3px solid var(--notification-color);
  border-radius: var(--radius-md);
  box-shadow: 0 18px 40px rgb(16 42 67 / 16%);
}

.toast-notification__message--success {
  --notification-color: var(--color-accent-600);
  --notification-background: var(--color-accent-100);
}

.toast-notification__message--warning {
  --notification-color: var(--color-warning);
  --notification-background: #fff8e8;
}

.toast-notification__message--error {
  --notification-color: var(--color-danger);
  --notification-background: #fff0f1;
}

.toast-notification__symbol {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  color: var(--notification-color);
  font-size: var(--font-size-small);
  font-weight: 800;
  background: var(--notification-background);
  border-radius: 50%;
}

.toast-notification__message p {
  margin: 0;
  line-height: 1.5;
}

.toast-notification__message button {
  display: grid;
  width: 1.75rem;
  height: 1.75rem;
  place-items: center;
  color: var(--color-text-secondary);
  font-size: 1.1rem;
  cursor: pointer;
  background: transparent;
  border-radius: 50%;
}

.toast-notification__message button:hover {
  color: var(--color-brand-950);
  background: var(--color-surface-subtle);
}

.toast-notification-enter-active,
.toast-notification-leave-active {
  transition:
    opacity var(--transition-fast),
    transform var(--transition-fast);
}

.toast-notification-enter-from,
.toast-notification-leave-to {
  opacity: 0;
  transform: translateX(calc(100% + 2rem));
}

@media (max-width: 47.99rem) {
  .toast-notification {
    top: 1rem;
    right: 1rem;
  }
}
</style>
