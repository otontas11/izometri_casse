<script setup lang="ts">
import { ref, watch } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import AppSidebar from '@/components/navigation/AppSidebar.vue'
import AppTopbar from '@/components/navigation/AppTopbar.vue'

const route = useRoute()
const isNavigationOpen = ref(false)

const closeNavigation = () => {
  isNavigationOpen.value = false
}

watch(
  () => route.fullPath,
  () => closeNavigation(),
)
</script>

<template>
  <div class="app-shell">
    <AppSidebar :open="isNavigationOpen" @close="closeNavigation" />

    <button
      v-if="isNavigationOpen"
      class="app-shell__overlay"
      type="button"
      aria-label="Navigasyonu kapat"
      @click="closeNavigation"
    ></button>

    <div class="app-shell__workspace">
      <AppTopbar @toggle-navigation="isNavigationOpen = !isNavigationOpen" />

      <main class="app-shell__main">
        <RouterView />
      </main>
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  display: grid;
  grid-template-columns: var(--sidebar-width) minmax(0, 1fr);
  min-height: 100vh;
  background: var(--color-surface-canvas);
}

.app-shell__workspace {
  min-width: 0;
}

.app-shell__main {
  padding: clamp(1.5rem, 3vw, 3rem);
}

.app-shell__overlay {
  position: fixed;
  inset: 0;
  z-index: 25;
  display: none;
  cursor: pointer;
  background: rgb(16 42 67 / 46%);
  backdrop-filter: blur(2px);
}

@media (max-width: 63.99rem) {
  .app-shell {
    grid-template-columns: minmax(0, 1fr);
  }

  .app-shell__overlay {
    display: block;
  }
}

@media (max-width: 47.99rem) {
  .app-shell__main {
    padding: 1.5rem 1rem 2.5rem;
  }
}
</style>

