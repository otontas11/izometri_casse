<template>
  <header class="app-topbar">
    <button
      ref="sidebarToggleButtonElement"
      class="app-topbar__menu"
      type="button"
      aria-controls="application-navigation"
      :aria-expanded="isSidebarOpen"
      :aria-label="
        isSidebarOpen
          ? t('layout.topbar.closeNavigation')
          : t('layout.topbar.openNavigation')
      "
      @click="emit('toggleSidebar')"
    >
      <AppIcon name="menu" :size="23" />
    </button>

    <div class="app-topbar__context">
      <strong>İzİmza</strong>
      <span>{{ t('layout.topbar.context') }}</span>
    </div>

    <div class="app-topbar__actions">
      <div
        :class="[
          'app-topbar__credit-balance',
          {
            'app-topbar__credit-balance--low': hasLowRemainingCredits,
          },
        ]"
        :aria-label="
          t('layout.topbar.remainingCreditsAriaLabel', {
            count: displayedRemainingCredits,
          })
        "
        aria-live="polite"
        role="status"
      >
        <span class="app-topbar__credit-icon" aria-hidden="true">
          <AppIcon name="wallet" :size="19" />
        </span>
        <span class="app-topbar__credit-details">
          <small>{{ t('layout.topbar.remainingCredits') }}</small>
          <strong>{{ displayedRemainingCredits }}</strong>
        </span>
      </div>
      <LanguageSwitcher class="app-topbar__language-switcher" />
      <AuthUserMenu />
    </div>
  </header>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import LanguageSwitcher from '@/components/common/LanguageSwitcher.vue'
import AuthUserMenu from '@/features/auth/components/AuthUserMenu.vue'
import { useDashboardStore } from '@/features/dashboard/stores/dashboard.store'

defineProps<{
  isSidebarOpen: boolean
}>()

const emit = defineEmits<{
  toggleSidebar: []
}>()

const { t } = useI18n({ useScope: 'global' })
const sidebarToggleButtonElement = ref<HTMLButtonElement | null>(null)

const focusSidebarToggleButton = () => {
  sidebarToggleButtonElement.value?.focus()
}

defineExpose({ focusSidebarToggleButton })

const dashboardStore = useDashboardStore()
const { dashboardRequestStatus, dashboardSummary } = storeToRefs(dashboardStore)
const remainingCredits = computed(
  () => dashboardSummary.value?.remainingCredits ?? null,
)
const displayedRemainingCredits = computed(
  () => remainingCredits.value ?? '—',
)
const hasLowRemainingCredits = computed(
  () => remainingCredits.value !== null && remainingCredits.value <= 5,
)

onMounted(() => {
  if (dashboardRequestStatus.value === 'idle') {
    void dashboardStore.fetchDashboardData()
  }
})
</script>

<style scoped>
.app-topbar {
  position: sticky;
  top: 0;
  z-index: 20;
  display: flex;
  align-items: center;
  min-height: var(--topbar-height);
  padding: 0.75rem clamp(1rem, 3vw, 3rem);
  background: rgb(255 255 255 / 88%);
  border-bottom: 1px solid rgb(220 229 236 / 80%);
  backdrop-filter: blur(14px);
}

.app-topbar__menu {
  display: none;
  width: 2.75rem;
  height: 2.75rem;
  margin-right: 0.75rem;
  place-items: center;
  color: var(--color-brand-950);
  cursor: pointer;
  background: var(--color-surface-canvas);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.app-topbar__context {
  display: grid;
  gap: 0.125rem;
}

.app-topbar__context strong {
  color: var(--color-brand-950);
  font-size: 0.875rem;
}

.app-topbar__context span {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.app-topbar__actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-left: auto;
}

.app-topbar__credit-balance {
  display: flex;
  gap: 0.7rem;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.35rem 0.8rem 0.35rem 0.4rem;
  color: var(--color-text-inverse);
  background: linear-gradient(
    135deg,
    var(--color-brand-950),
    var(--color-brand-800)
  );
  border: 1px solid rgb(255 255 255 / 12%);
  border-radius: var(--radius-md);
  box-shadow: 0 0.35rem 0.85rem rgb(16 42 67 / 18%);
}

.app-topbar__credit-balance--low {
  background: linear-gradient(135deg, #92400e, var(--color-warning));
}

.app-topbar__credit-icon {
  display: grid;
  width: 2rem;
  height: 2rem;
  color: var(--color-brand-950);
  background: var(--color-accent-100);
  border-radius: 0.65rem;
  place-items: center;
}

.app-topbar__credit-details {
  display: grid;
  gap: 0.05rem;
  min-width: 4.9rem;
}

.app-topbar__credit-details small {
  color: rgb(255 255 255 / 72%);
  font-size: 0.65rem;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.app-topbar__credit-details strong {
  color: var(--color-text-inverse);
  font-size: 1rem;
  line-height: 1;
}

@media (max-width: 63.99rem) {
  .app-topbar__menu {
    display: grid;
  }
}

@media (max-width: 35.99rem) {
  .app-topbar__context,
  .app-topbar__credit-details small {
    display: none;
  }

  .app-topbar {
    padding-inline: 0.75rem;
  }

  .app-topbar__actions {
    gap: 0.5rem;
  }

  .app-topbar__credit-balance {
    gap: 0.45rem;
    padding-right: 0.65rem;
  }

  .app-topbar__credit-details {
    min-width: auto;
  }
}
</style>
