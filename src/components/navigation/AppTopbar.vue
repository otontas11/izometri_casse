<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import AuthUserMenu from '@/features/auth/components/AuthUserMenu.vue'

const emit = defineEmits<{
  toggleNavigation: []
}>()
</script>

<template>
  <header class="app-topbar">
    <button
      class="app-topbar__menu"
      type="button"
      aria-label="Navigasyonu aç"
      @click="emit('toggleNavigation')"
    >
      <AppIcon name="menu" :size="23" />
    </button>

    <div class="app-topbar__context">
      <strong>İzİmza</strong>
      <span>Güvenli dijital işlemler</span>
    </div>

    <div class="app-topbar__actions">
      <span class="app-topbar__language" aria-label="Seçili dil Türkçe">TR</span>
      <span class="app-topbar__quota">
        <small>Kalan kontör</small>
        <strong>19</strong>
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
  font-size: 0.75rem;
}

.app-topbar__actions {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  margin-left: auto;
}

.app-topbar__language {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  place-items: center;
  color: var(--color-text-secondary);
  font-size: 0.75rem;
  font-weight: 800;
  background: var(--color-surface-canvas);
  border: 1px solid var(--color-border);
  border-radius: 50%;
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
  font-size: 0.7rem;
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
  .app-topbar__language,
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
