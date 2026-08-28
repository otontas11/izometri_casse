<template>
  <aside
    id="application-navigation"
    ref="sidebarElement"
    :class="['app-sidebar', { 'app-sidebar--open': isOpen }]"
    :aria-label="t('layout.sidebar.ariaLabel')"
    @keydown="handleSidebarKeydown"
  >
    <div class="app-sidebar__brand-row">
      <RouterLink
        class="app-sidebar__brand"
        :to="{ name: 'dashboard' }"
        :aria-label="t('layout.sidebar.homeAriaLabel')"
        @click="emit('navigate')"
      >
        iz<span>imza</span>
      </RouterLink>

      <button
        ref="sidebarCloseButtonElement"
        class="app-sidebar__close"
        type="button"
        :aria-label="t('layout.sidebar.closeAriaLabel')"
        @click="emit('close')"
      >
        <AppIcon name="close" :size="22" />
      </button>
    </div>

    <div class="app-sidebar__context">
      <span aria-hidden="true"></span>
      {{ t('layout.sidebar.context') }}
    </div>

    <nav
      class="app-sidebar__navigation"
      :aria-label="t('layout.sidebar.navigationAriaLabel')"
    >
      <RouterLink
        v-for="navigationItem in sidebarNavigationItems"
        :key="navigationItem.routeName"
        class="app-sidebar__link"
        :to="{ name: navigationItem.routeName }"
        @click="emit('navigate')"
      >
        <AppIcon :name="navigationItem.icon" :size="21" />
        <span>{{ navigationItem.label }}</span>
      </RouterLink>
    </nav>

    <footer class="app-sidebar__footer">
      <span class="app-sidebar__footer-mark" aria-hidden="true">✓</span>
      <span>
        <strong>{{ t('layout.sidebar.secureSession') }}</strong>
        <small>{{ t('layout.sidebar.protectedConnection') }}</small>
      </span>
    </footer>
  </aside>
</template>

<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import type { AppIconName } from '@/types/icon'

interface SidebarNavigationItem {
  icon: AppIconName
  label: string
  routeName: 'dashboard' | 'profile' | 'signature' | 'timestamp'
}

const props = defineProps<{
  isOpen: boolean
}>()

const emit = defineEmits<{
  close: []
  navigate: []
}>()

const sidebarElement = ref<HTMLElement | null>(null)
const sidebarCloseButtonElement = ref<HTMLButtonElement | null>(null)
const { t } = useI18n({ useScope: 'global' })

const sidebarNavigationItems = computed<SidebarNavigationItem[]>(() => [
  {
    label: t('layout.sidebar.dashboard'),
    icon: 'dashboard',
    routeName: 'dashboard',
  },
  {
    label: t('layout.sidebar.signature'),
    icon: 'signature',
    routeName: 'signature',
  },
  {
    label: t('layout.sidebar.timestamp'),
    icon: 'timestamp',
    routeName: 'timestamp',
  },
  {
    label: t('layout.sidebar.profile'),
    icon: 'profile',
    routeName: 'profile',
  },
])

const getFocusableSidebarElements = () =>
  Array.from(
    sidebarElement.value?.querySelectorAll<HTMLElement>(
      'a[href], button:not(:disabled)',
    ) ?? [],
  ).filter((focusableElement) => focusableElement.offsetParent !== null)

const handleSidebarKeydown = (keyboardEvent: KeyboardEvent) => {
  if (!props.isOpen) {
    return
  }

  if (keyboardEvent.key === 'Escape') {
    keyboardEvent.preventDefault()
    emit('close')
    return
  }

  if (keyboardEvent.key !== 'Tab') {
    return
  }

  const focusableSidebarElements = getFocusableSidebarElements()
  const firstFocusableSidebarElement = focusableSidebarElements[0]
  const lastFocusableSidebarElement = focusableSidebarElements.at(-1)

  if (!firstFocusableSidebarElement || !lastFocusableSidebarElement) {
    keyboardEvent.preventDefault()
    return
  }

  if (
    keyboardEvent.shiftKey &&
    document.activeElement === firstFocusableSidebarElement
  ) {
    keyboardEvent.preventDefault()
    lastFocusableSidebarElement.focus()
    return
  }

  if (
    !keyboardEvent.shiftKey &&
    document.activeElement === lastFocusableSidebarElement
  ) {
    keyboardEvent.preventDefault()
    firstFocusableSidebarElement.focus()
  }
}

watch(
  () => props.isOpen,
  async (isOpen) => {
    if (!isOpen) {
      return
    }

    await nextTick()
    sidebarCloseButtonElement.value?.focus()
  },
)
</script>

<style scoped>
.app-sidebar {
  position: sticky;
  top: 0;
  z-index: 30;
  display: flex;
  flex-direction: column;
  width: var(--sidebar-width);
  height: 100vh;
  height: 100dvh;
  padding: 1.5rem 1rem;
  background: var(--color-surface-raised);
  border-right: 1px solid var(--color-border);
}

.app-sidebar__brand-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 2.75rem;
  padding-inline: 0.75rem;
}

.app-sidebar__brand {
  color: var(--color-brand-950);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.08em;
  text-decoration: none;
}

.app-sidebar__brand span {
  color: var(--color-primary-600);
}

.app-sidebar__close {
  display: none;
  padding: 0.5rem;
  color: var(--color-text-secondary);
  cursor: pointer;
  background: transparent;
  border-radius: var(--radius-sm);
}

.app-sidebar__context {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  margin: 1.75rem 0 1rem;
  padding-inline: 0.75rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.app-sidebar__context span {
  width: 0.5rem;
  height: 0.5rem;
  background: var(--color-accent-600);
  border-radius: 50%;
  box-shadow: 0 0 0 4px var(--color-accent-100);
}

.app-sidebar__navigation {
  display: grid;
  gap: 0.375rem;
}

.app-sidebar__link {
  position: relative;
  display: flex;
  gap: 0.875rem;
  align-items: center;
  min-height: 3.125rem;
  padding: 0.75rem 1rem;
  color: var(--color-text-secondary);
  font-size: 0.925rem;
  font-weight: 700;
  text-decoration: none;
  border-radius: var(--radius-md);
  transition:
    color var(--transition-fast),
    background-color var(--transition-fast);
}

.app-sidebar__link::before {
  position: absolute;
  top: 50%;
  left: -1rem;
  width: 0.25rem;
  height: 1.75rem;
  content: '';
  background: var(--color-accent-600);
  border-radius: 0 999px 999px 0;
  opacity: 0;
  transform: translateY(-50%);
  transition: opacity var(--transition-fast);
}

.app-sidebar__link:hover {
  color: var(--color-brand-950);
  background: var(--color-surface-subtle);
}

.app-sidebar__link.router-link-exact-active {
  color: var(--color-brand-950);
  background: var(--color-accent-100);
}

.app-sidebar__link.router-link-exact-active::before {
  opacity: 1;
}

.app-sidebar__footer {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-top: auto;
  padding: 1rem;
  color: var(--color-text-secondary);
  background: var(--color-surface-canvas);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}

.app-sidebar__footer-mark {
  display: grid;
  flex: 0 0 auto;
  width: 2rem;
  height: 2rem;
  place-items: center;
  color: var(--color-text-inverse);
  font-weight: 800;
  background: var(--color-accent-600);
  border-radius: 50%;
}

.app-sidebar__footer > span:last-child {
  display: grid;
  gap: 0.125rem;
}

.app-sidebar__footer strong {
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
}

.app-sidebar__footer small {
  font-size: var(--font-size-small);
}

@media (max-width: 63.99rem) {
  .app-sidebar {
    position: fixed;
    left: 0;
    width: min(19rem, calc(100vw - 3rem));
    visibility: hidden;
    pointer-events: none;
    box-shadow: var(--shadow-md);
    transform: translateX(-105%);
    transition:
      transform 220ms ease,
      visibility 0s linear 220ms;
  }

  .app-sidebar--open {
    visibility: visible;
    pointer-events: auto;
    transform: translateX(0);
    transition-delay: 0s;
  }

  .app-sidebar__close {
    display: grid;
    place-items: center;
  }
}
</style>
