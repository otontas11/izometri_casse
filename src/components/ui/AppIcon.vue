<script setup lang="ts">
import { computed } from 'vue'

import type { AppIconName } from '@/types/navigation'

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
  close: 'M6 6l12 12M18 6 6 18',
  dashboard: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  menu: 'M4 7h16M4 12h16M4 17h16',
  profile: 'M20 21a8 8 0 0 0-16 0M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
  timestamp: 'M12 21a9 9 0 1 0-9-9 9 9 0 0 0 9 9ZM12 7v5l3.5 2',
}

const path = computed(() => iconPaths[props.name])
</script>

<template>
  <svg
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
    <path :d="path" />
  </svg>
</template>

