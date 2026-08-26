<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'

import AppIcon from '@/components/common/AppIcon.vue'
import { useToast } from '@/composables/useToast'
import ProfileForm from '@/features/profile/components/ProfileForm.vue'
import ProfileIdentityCard from '@/features/profile/components/ProfileIdentityCard.vue'
import ProfileSecurityPanel from '@/features/profile/components/ProfileSecurityPanel.vue'
import { useProfileStore } from '@/features/profile/stores/profile.store'
import type { UpdateProfilePayload } from '@/features/profile/types/profile.types'

const profileStore = useProfileStore()
const {
  isProfileLoading,
  isProfileSaving,
  profileFullName,
  profileLoadErrorMessage,
  profileLoadStatus,
  profileSaveErrorMessage,
  profileSaveSuccessMessage,
  userProfile,
} = storeToRefs(profileStore)
const { isAuthenticated, user: authenticatedUser } = useAuth0()
const { showErrorToast, showSuccessToast } = useToast()

const isProfileEditing = ref(false)

const profileDisplayName = computed(() => {
  if (profileFullName.value) {
    return profileFullName.value
  }

  return authenticatedUser.value?.name?.trim() || 'İzİmza kullanıcısı'
})

const profileEmailAddress = computed(
  () =>
    authenticatedUser.value?.email ||
    userProfile.value?.email ||
    'E-posta bilgisi bulunamadı',
)

const profileAvatarUrl = computed(
  () => authenticatedUser.value?.picture || userProfile.value?.avatarUrl || '',
)

const profileInitials = computed(() => {
  const displayNameParts = profileDisplayName.value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  const initials = displayNameParts
    .map((displayNamePart) => Array.from(displayNamePart)[0] ?? '')
    .join('')
    .toLocaleUpperCase('tr-TR')

  return initials || 'İZ'
})

const isProfileEmailVerified = computed(
  () => authenticatedUser.value?.email_verified === true,
)

const handleProfileEditRequest = () => {
  profileStore.clearProfileSaveFeedback()
  isProfileEditing.value = true
}

const handleProfileEditCancel = () => {
  isProfileEditing.value = false
  profileStore.clearProfileSaveFeedback()
}

const handleProfileUpdate = async (profileUpdates: UpdateProfilePayload) => {
  const isProfileUpdated = await profileStore.updateUserProfile(profileUpdates)

  if (isProfileUpdated) {
    isProfileEditing.value = false
    showSuccessToast(profileSaveSuccessMessage.value)
    return
  }

  showErrorToast(
    profileSaveErrorMessage.value || 'Profil bilgileri güncellenemedi.',
  )
}

const handleProfileRetry = () => {
  void profileStore.fetchUserProfile()
}

onMounted(() => {
  if (profileLoadStatus.value === 'idle') {
    void profileStore.fetchUserProfile()
  }
})
</script>

<template>
  <section class="profile-page" aria-labelledby="profile-page-title">
    <header class="profile-page__header">
      <div>
        <span class="profile-page__eyebrow">Hesap merkezi</span>
        <h1 id="profile-page-title">Profilim</h1>
        <p>
          Kişisel bilgilerinizi yönetin ve hesabınızın güvenlik durumunu tek
          bakışta takip edin.
        </p>
      </div>

      <div class="profile-page__security-summary">
        <span aria-hidden="true">
          <AppIcon name="signature" :size="21" />
        </span>
        <div>
          <small>Kimlik güvenliği</small>
          <strong>Auth0 ile korunuyor</strong>
        </div>
      </div>
    </header>

    <div
      v-if="!userProfile && profileLoadStatus !== 'error'"
      class="profile-page__loading-state"
      role="status"
      aria-live="polite"
    >
      <span class="profile-page__loading-spinner" aria-hidden="true"></span>
      <div>
        <strong>Profiliniz hazırlanıyor</strong>
        <p>Hesap bilgileriniz güvenli şekilde yükleniyor.</p>
      </div>
    </div>

    <div
      v-else-if="!userProfile"
      class="profile-page__error-state"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      <div>
        <strong>Profil bilgileri yüklenemedi</strong>
        <p>{{ profileLoadErrorMessage }}</p>
      </div>
      <button type="button" :disabled="isProfileLoading" @click="handleProfileRetry">
        <AppIcon name="refresh" :size="17" />
        {{ isProfileLoading ? 'Yükleniyor…' : 'Tekrar dene' }}
      </button>
    </div>

    <template v-else>
      <ProfileIdentityCard
        :avatar-url="profileAvatarUrl"
        :display-name="profileDisplayName"
        :email-address="profileEmailAddress"
        :initials="profileInitials"
        :is-editing="isProfileEditing"
        :is-email-verified="isProfileEmailVerified"
        @edit="handleProfileEditRequest"
      />

      <p
        v-if="profileSaveSuccessMessage"
        class="profile-page__feedback profile-page__feedback--success"
        role="status"
      >
        <span aria-hidden="true">✓</span>
        {{ profileSaveSuccessMessage }}
      </p>

      <p
        v-if="profileLoadErrorMessage"
        class="profile-page__feedback profile-page__feedback--error"
        role="alert"
      >
        <span aria-hidden="true">!</span>
        {{ profileLoadErrorMessage }}
        <button type="button" @click="handleProfileRetry">Yenile</button>
      </p>

      <div class="profile-page__content-grid">
        <ProfileForm
          :email-address="profileEmailAddress"
          :is-editing="isProfileEditing"
          :is-saving="isProfileSaving"
          :save-error-message="profileSaveErrorMessage"
          :user-profile="userProfile"
          @cancel="handleProfileEditCancel"
          @submit="handleProfileUpdate"
        />

        <ProfileSecurityPanel
          :is-authenticated="isAuthenticated"
          :is-email-verified="isProfileEmailVerified"
        />
      </div>
    </template>
  </section>
</template>

<style scoped>
.profile-page {
  display: grid;
  gap: 1.75rem;
  width: min(100%, 90rem);
  margin-inline: auto;
}

.profile-page__header {
  display: flex;
  gap: 2rem;
  align-items: flex-end;
  justify-content: space-between;
}

.profile-page__header h1,
.profile-page__header p,
.profile-page__loading-state p,
.profile-page__error-state p,
.profile-page__feedback {
  margin: 0;
}

.profile-page__eyebrow {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.profile-page__header h1 {
  margin-top: 0.45rem;
  color: var(--color-brand-950);
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1;
  letter-spacing: -0.055em;
}

.profile-page__header > div:first-child > p {
  max-width: 43rem;
  margin-top: 0.75rem;
  color: var(--color-text-secondary);
  font-size: 0.9rem;
  line-height: 1.65;
}

.profile-page__security-summary {
  display: flex;
  flex: 0 0 auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.8rem 1rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
}

.profile-page__security-summary > span {
  display: grid;
  width: 2.65rem;
  height: 2.65rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: var(--radius-sm);
}

.profile-page__security-summary div {
  display: grid;
  gap: 0.2rem;
}

.profile-page__security-summary small {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.profile-page__security-summary strong {
  color: var(--color-brand-950);
  font-size: 0.78rem;
  font-weight: 500;
}

.profile-page__loading-state,
.profile-page__error-state {
  display: flex;
  gap: 1rem;
  align-items: center;
  min-height: 13rem;
  padding: clamp(1.25rem, 3vw, 2rem);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.profile-page__loading-state strong,
.profile-page__error-state strong {
  color: var(--color-brand-950);
  font-size: 0.9rem;
}

.profile-page__loading-state p,
.profile-page__error-state p {
  margin-top: 0.3rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.55;
}

.profile-page__loading-spinner {
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  border: 3px solid var(--color-primary-100);
  border-top-color: var(--color-primary-600);
  border-radius: 50%;
  animation: profile-page-spin 800ms linear infinite;
}

.profile-page__error-state > span {
  display: grid;
  width: 2.5rem;
  height: 2.5rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-text-inverse);
  font-weight: 500;
  background: var(--color-danger);
  border-radius: 50%;
}

.profile-page__error-state > div {
  min-width: 0;
  margin-right: auto;
}

.profile-page__error-state button,
.profile-page__feedback button {
  display: inline-flex;
  gap: 0.45rem;
  align-items: center;
  justify-content: center;
  min-height: 2.5rem;
  padding: 0.6rem 0.85rem;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  font-weight: 500;
  cursor: pointer;
  background: var(--color-brand-950);
  border-radius: var(--radius-sm);
}

.profile-page__error-state button:disabled {
  cursor: wait;
  opacity: 0.6;
}

.profile-page__content-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.65fr) minmax(17rem, 0.7fr);
  gap: 1rem;
  align-items: start;
}

.profile-page__feedback {
  display: flex;
  gap: 0.65rem;
  align-items: center;
  padding: 0.85rem 1rem;
  font-size: var(--font-size-small);
  font-weight: 500;
  background: var(--color-surface-raised);
  border: 1px solid currentColor;
  border-radius: var(--radius-sm);
}

.profile-page__feedback > span {
  display: grid;
  width: 1.4rem;
  height: 1.4rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  border-radius: 50%;
}

.profile-page__feedback--success {
  color: var(--color-success);
}

.profile-page__feedback--success > span {
  background: var(--color-success);
}

.profile-page__feedback--error {
  color: var(--color-danger);
}

.profile-page__feedback--error > span {
  background: var(--color-danger);
}

.profile-page__feedback button {
  min-height: 2rem;
  margin-left: auto;
  color: var(--color-danger);
  background: color-mix(in srgb, var(--color-danger) 9%, transparent);
}

@keyframes profile-page-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 960px) {
  .profile-page__content-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 720px) {
  .profile-page__header {
    align-items: flex-start;
    flex-direction: column;
  }

  .profile-page__security-summary {
    width: 100%;
  }

  .profile-page__error-state {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .profile-page__error-state button {
    width: 100%;
  }
}
</style>
