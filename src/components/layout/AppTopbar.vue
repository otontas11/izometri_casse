<script setup lang="ts">
import { onMounted, ref } from 'vue'
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

onMounted(() => {
  if (dashboardRequestStatus.value === 'idle') {
    void dashboardStore.fetchDashboardData()
  }
})
</script>

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
      <LanguageSwitcher class="app-topbar__language-switcher" />
      <span class="app-topbar__quota" aria-live="polite">
        <small>{{ t('layout.topbar.remainingCredits') }}</small>
        <strong>{{ dashboardSummary?.remainingCredits ?? '—' }}</strong>
      </span>
      <AuthUserMenu />
    </div>
  </header>
</template>

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

.app-topbar__quota {
  display: flex;
  gap: 0.625rem;
  align-items: center;
  min-height: 2.5rem;
  padding: 0.45rem 0.75rem;
  color: var(--color-brand-950);
  background: var(--color-accent-100);
  border: 1px solid rgb(15 159 132 / 16%);
  border-radius: 999px;
}

.app-topbar__quota small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
}

.app-topbar__quota strong {
  color: var(--color-success);
  font-size: 0.875rem;
}

@media (max-width: 63.99rem) {
  .app-topbar__menu {
    display: grid;
  }
}

@media (max-width: 35.99rem) {
  .app-topbar__context,
  .app-topbar__language-switcher,
  .app-topbar__quota small {
    display: none;
  }

  .app-topbar__quota {
    min-width: 2.5rem;
    justify-content: center;
    padding-inline: 0.75rem;
  }
}
</style>
