<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { RouterLink } from 'vue-router'

import { auth0Config } from '@/config/auth0.config'

const { logout: logoutFromAuth0, user: authenticatedUser } = useAuth0()
const isUserMenuOpen = ref(false)
const userMenuElement = ref<HTMLElement | null>(null)
const userMenuTriggerElement = ref<HTMLButtonElement | null>(null)
const userMenuPopoverElement = ref<HTMLElement | null>(null)
const hasAuthenticatedUserPictureError = ref(false)

const authenticatedUserDisplayName = computed(
  () =>
    authenticatedUser.value?.name ||
    authenticatedUser.value?.nickname ||
    authenticatedUser.value?.email ||
    'İzİmza Kullanıcısı',
)
const authenticatedUserEmail = computed(
  () => authenticatedUser.value?.email ?? '',
)
const authenticatedUserPicture = computed(
  () => authenticatedUser.value?.picture ?? '',
)
const shouldDisplayAuthenticatedUserPicture = computed(
  () =>
    Boolean(authenticatedUserPicture.value) &&
    !hasAuthenticatedUserPictureError.value,
)
const authenticatedUserInitials = computed(() => {
  const displayNameWords = authenticatedUserDisplayName.value
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (displayNameWords.length === 0) {
    return 'İZ'
  }

  return displayNameWords
    .slice(0, 2)
    .map((word) => word.charAt(0).toLocaleUpperCase('tr-TR'))
    .join('')
})

const closeUserMenu = () => {
  isUserMenuOpen.value = false
}

const closeUserMenuAndRestoreTriggerFocus = async () => {
  if (!isUserMenuOpen.value) {
    return
  }

  closeUserMenu()
  await nextTick()
  userMenuTriggerElement.value?.focus()
}

const openUserMenuAndFocusFirstAction = async () => {
  isUserMenuOpen.value = true
  await nextTick()
  userMenuPopoverElement.value
    ?.querySelector<HTMLElement>('a[href], button:not(:disabled)')
    ?.focus()
}

const handleUserMenuTriggerKeydown = (keyboardEvent: KeyboardEvent) => {
  if (keyboardEvent.key === 'ArrowDown') {
    keyboardEvent.preventDefault()
    void openUserMenuAndFocusFirstAction()
  }
}

const handleUserMenuFocusOut = (focusEvent: FocusEvent) => {
  const nextFocusedElement = focusEvent.relatedTarget

  if (
    !(nextFocusedElement instanceof Node) ||
    !userMenuElement.value?.contains(nextFocusedElement)
  ) {
    closeUserMenu()
  }
}

const handleOutsidePointerDown = (pointerEvent: PointerEvent) => {
  if (
    pointerEvent.target instanceof Node &&
    !userMenuElement.value?.contains(pointerEvent.target)
  ) {
    closeUserMenu()
  }
}

const handleLogout = async () => {
  closeUserMenu()
  await logoutFromAuth0({
    logoutParams: {
      returnTo: auth0Config.logoutUri,
    },
  })
}

watch(authenticatedUserPicture, () => {
  hasAuthenticatedUserPictureError.value = false
})

onMounted(() =>
  document.addEventListener('pointerdown', handleOutsidePointerDown),
)
onBeforeUnmount(() =>
  document.removeEventListener('pointerdown', handleOutsidePointerDown),
)
</script>

<template>
  <div
    ref="userMenuElement"
    class="auth-user-menu"
    @focusout="handleUserMenuFocusOut"
    @keydown.esc.stop.prevent="closeUserMenuAndRestoreTriggerFocus"
  >
    <button
      ref="userMenuTriggerElement"
      class="auth-user-menu__trigger"
      type="button"
      :aria-expanded="isUserMenuOpen"
      aria-controls="authenticated-user-popover"
      :aria-label="
        isUserMenuOpen ? 'Kullanıcı menüsünü kapat' : 'Kullanıcı menüsünü aç'
      "
      @click="isUserMenuOpen = !isUserMenuOpen"
      @keydown="handleUserMenuTriggerKeydown"
    >
      <img
        v-if="shouldDisplayAuthenticatedUserPicture"
        :src="authenticatedUserPicture"
        alt=""
        referrerpolicy="no-referrer"
        @error="hasAuthenticatedUserPictureError = true"
      />
      <span v-else>{{ authenticatedUserInitials }}</span>
    </button>

    <div
      v-if="isUserMenuOpen"
      id="authenticated-user-popover"
      ref="userMenuPopoverElement"
      class="auth-user-menu__popover"
    >
      <div class="auth-user-menu__identity">
        <strong>{{ authenticatedUserDisplayName }}</strong>
        <small v-if="authenticatedUserEmail">{{ authenticatedUserEmail }}</small>
      </div>

      <RouterLink
        :to="{ name: 'profile' }"
        @click="closeUserMenu"
      >
        Profil ve güvenlik
      </RouterLink>
      <button type="button" @click="handleLogout">
        Güvenli çıkış
      </button>
    </div>
  </div>
</template>

<style scoped>
.auth-user-menu {
  position: relative;
}

.auth-user-menu__trigger {
  display: grid;
  width: 2.625rem;
  height: 2.625rem;
  padding: 0;
  place-items: center;
  overflow: hidden;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  font-weight: 800;
  cursor: pointer;
  background: var(--color-brand-950);
  border: 2px solid var(--color-surface-raised);
  border-radius: 50%;
  box-shadow: 0 0 0 1px var(--color-border);
}

.auth-user-menu__trigger img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.auth-user-menu__popover {
  position: absolute;
  top: calc(100% + 0.75rem);
  right: 0;
  display: grid;
  width: min(17rem, calc(100vw - 2rem));
  padding: 0.5rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.auth-user-menu__popover::before {
  position: absolute;
  top: -0.375rem;
  right: 0.875rem;
  width: 0.75rem;
  height: 0.75rem;
  content: '';
  background: var(--color-surface-raised);
  border-top: 1px solid var(--color-border);
  border-left: 1px solid var(--color-border);
  transform: rotate(45deg);
}

.auth-user-menu__identity {
  display: grid;
  gap: 0.2rem;
  padding: 0.75rem;
  border-bottom: 1px solid var(--color-border);
}

.auth-user-menu__identity strong {
  overflow: hidden;
  color: var(--color-brand-950);
  font-size: 0.8rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-user-menu__identity small {
  overflow: hidden;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.auth-user-menu__popover a,
.auth-user-menu__popover button {
  width: 100%;
  padding: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.78rem;
  font-weight: 700;
  text-align: left;
  text-decoration: none;
  cursor: pointer;
  background: transparent;
  border-radius: 0.5rem;
}

.auth-user-menu__popover a:hover,
.auth-user-menu__popover button:hover {
  color: var(--color-brand-950);
  background: var(--color-surface-canvas);
}
</style>
