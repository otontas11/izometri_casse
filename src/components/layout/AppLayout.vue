<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppSidebar from '@/components/layout/AppSidebar.vue'
import AppTopbar from '@/components/layout/AppTopbar.vue'

const currentRoute = useRoute()
const isSidebarOpen = ref(false)

const handleSidebarClose = () => {
  isSidebarOpen.value = false
}

const handleSidebarToggle = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

watch(
  () => currentRoute.fullPath,
  () => handleSidebarClose(),
)
</script>

<template>
  <div class="app-layout">
    <AppSidebar :is-open="isSidebarOpen" @close="handleSidebarClose" />

    <button
      v-if="isSidebarOpen"
      class="app-layout__overlay"
      type="button"
      aria-label="Navigasyonu kapat"
      @click="handleSidebarClose"
    ></button>

    <div class="app-layout__workspace">
      <AppTopbar @toggle-sidebar="handleSidebarToggle" />

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
