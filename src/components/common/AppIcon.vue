<script setup lang="ts">
import { computed } from 'vue'

import type { AppIconName } from '@/types/icon'

const props = withDefaults(
  defineProps<{
    name: AppIconName
    size?: number
  }>(),
  {
    size: 20,
  },
)

const iconPaths: Record<AppIconName, string> = {
  archive: 'M4 7h16v13H4zM3 4h18v3H3zM9 11h6',
  'arrow-right': 'M5 12h14M13 6l6 6-6 6',
  close: 'M6 6l12 12M18 6 6 18',
  dashboard: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  document: 'M6 2h8l4 4v16H6zM14 2v5h5M9 12h6M9 16h6',
  download: 'M12 3v12m0 0 4-4m-4 4-4-4M5 21h14',
  menu: 'M4 7h16M4 12h16M4 17h16',
  profile: 'M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  refresh: 'M20 7v5h-5M4 17v-5h5M18.5 9a7 7 0 0 0-12-2M5.5 15a7 7 0 0 0 12 2',
  signature: 'M4 19c3-1 4-4 6-8 1-2 2-3 3-3 2 0 1 4-1 6-1 2-2 4 0 4 1 0 2-2 3-3 1-1 2-1 2 1v2',
  storage: 'M7 18h10a4 4 0 0 0 .5-8A6 6 0 0 0 6 9a4.5 4.5 0 0 0 1 9Z',
  timestamp: 'M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9ZM12 7v5l3.5 2',
  trash: 'M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6',
  upload: 'M12 16V4m0 0-4 4m4-4 4 4M4 16v4h16v-4',
  wallet: 'M3 6h16v14H3zM3 9h17a2 2 0 0 1 2 2v5h-6a3 3 0 0 1 0-6h6',
}

const selectedIconPath = computed(() => iconPaths[props.name])
</script>

<template>
  <svg
    class="app-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.8"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path :d="selectedIconPath" />
  </svg>
</template>
