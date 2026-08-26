<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const currentRoute = useRoute()
const isSidebarOpen = ref(false)
const appTopbarComponent = ref<InstanceType<typeof AppTopbar> | null>(null)

const compactNavigationMediaQueryValue = '(max-width: 63.99rem)'
let compactNavigationMediaQuery: MediaQueryList | null = null
let previousBodyOverflowValue = ''
let isBodyScrollLockedBySidebar = false
let shouldRestoreSidebarToggleFocus = false

const lockBodyScrollForSidebar = () => {
  if (isBodyScrollLockedBySidebar) {
    return
  }

  previousBodyOverflowValue = document.body.style.overflow
  document.body.style.overflow = 'hidden'
  isBodyScrollLockedBySidebar = true
}

const unlockBodyScrollForSidebar = () => {
  if (!isBodyScrollLockedBySidebar) {
    return
  }

  document.body.style.overflow = previousBodyOverflowValue
  isBodyScrollLockedBySidebar = false
}

const handleSidebarClose = (shouldRestoreToggleFocus = true) => {
  if (!isSidebarOpen.value) {
    return
  }

  shouldRestoreSidebarToggleFocus = shouldRestoreToggleFocus
  isSidebarOpen.value = false
}

const handleSidebarToggle = () => {
  if (isSidebarOpen.value) {
    handleSidebarClose()
    return
  }

  shouldRestoreSidebarToggleFocus = false
  isSidebarOpen.value = true
}

const handleSidebarNavigation = () => {
  handleSidebarClose(false)
}

const handleCompactNavigationBreakpointChange = (
  breakpointChangeEvent: MediaQueryListEvent,
) => {
  if (!breakpointChangeEvent.matches) {
    handleSidebarClose(false)
  }
}

watch(isSidebarOpen, async (isOpen) => {
  if (isOpen) {
    lockBodyScrollForSidebar()
    return
  }

  unlockBodyScrollForSidebar()

  if (shouldRestoreSidebarToggleFocus) {
    await nextTick()
    appTopbarComponent.value?.focusSidebarToggleButton()
  }

  shouldRestoreSidebarToggleFocus = false
})

watch(
  () => currentRoute.fullPath,
  () => handleSidebarClose(false),
)

onMounted(() => {
  compactNavigationMediaQuery = window.matchMedia(
    compactNavigationMediaQueryValue,
  )
  compactNavigationMediaQuery.addEventListener(
    'change',
    handleCompactNavigationBreakpointChange,
  )
})

onBeforeUnmount(() => {
  compactNavigationMediaQuery?.removeEventListener(
    'change',
    handleCompactNavigationBreakpointChange,
  )
  unlockBodyScrollForSidebar()
})
</script>

<template>
  <div class="app-layout">
    <AppSidebar
      :is-open="isSidebarOpen"
      @close="handleSidebarClose"
      @navigate="handleSidebarNavigation"
    />

    <div
      v-if="isSidebarOpen"
      class="app-layout__overlay"
      aria-hidden="true"
      @click="handleSidebarClose()"
    ></div>

    <div class="app-layout__workspace" :inert="isSidebarOpen">
      <AppTopbar
        ref="appTopbarComponent"
        :is-sidebar-open="isSidebarOpen"
        @toggle-sidebar="handleSidebarToggle"
      />

      <main class="app-layout__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-layout {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
  background: var(--color-surface-canvas);
}

.app-layout__workspace {
  min-width: 0;
}

.app-layout__main {
  padding: clamp(1.5rem, 3vw, 3rem);
}

.app-layout__overlay {
  position: fixed;
  inset: 0;
  z-index: 25;
  display: none;
  cursor: pointer;
  background: rgb(16 42 67 / 46%);
  backdrop-filter: blur(2px);
}

@media (max-width: 63.99rem) {
  .app-layout {
    grid-template-columns: minmax(0, 1fr);
  }

  .app-layout__overlay {
    display: block;
  }
}

@media (max-width: 47.99rem) {
  .app-layout__main {
    padding: 1.5rem 1rem 2.5rem;
  }
}
</style>
