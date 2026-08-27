<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuth0 } from '@auth0/auth0-vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'

import AppIcon from '@/components/common/AppIcon.vue'
import { useToast } from '@/composables/useToast'
import ProfileForm from '@/features/profile/components/ProfileForm.vue'
import ProfileIdentityCard from '@/features/profile/components/ProfileIdentityCard.vue'
import ProfileSecurityPanel from '@/features/profile/components/ProfileSecurityPanel.vue'
import { useProfileStore } from '@/features/profile/stores/profile.store'
import type { UpdateProfilePayload } from '@/features/profile/types/profile.types'
import { getApplicationLocaleCode } from '@/locales'

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
const { t } = useI18n({ useScope: 'global' })

const isProfileEditing = ref(false)

const profileDisplayName = computed(() => {
  if (profileFullName.value) {
    return profileFullName.value
  }

  return (
    authenticatedUser.value?.name?.trim() || t('profile.page.userFallback')
  )
})

const profileEmailAddress = computed(
  () =>
    authenticatedUser.value?.email ||
    userProfile.value?.email ||
    t('profile.page.emailUnavailable'),
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
    .toLocaleUpperCase(getApplicationLocaleCode())

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
    profileSaveErrorMessage.value || t('profile.page.updateError'),
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
        <span class="profile-page__eyebrow">{{ t('profile.page.eyebrow') }}</span>
        <h1 id="profile-page-title">{{ t('profile.page.title') }}</h1>
        <p>{{ t('profile.page.description') }}</p>
      </div>

      <div class="profile-page__security-summary">
        <span aria-hidden="true">
          <AppIcon name="signature" :size="21" />
        </span>
        <div>
          <small>{{ t('profile.page.identitySecurity') }}</small>
          <strong>{{ t('profile.page.protectedByAuth0') }}</strong>
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
        <strong>{{ t('profile.page.preparing') }}</strong>
        <p>{{ t('profile.page.loadingDescription') }}</p>
      </div>
    </div>

    <div
      v-else-if="!userProfile"
      class="profile-page__error-state"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      <div>
        <strong>{{ t('profile.page.loadErrorTitle') }}</strong>
        <p>{{ profileLoadErrorMessage }}</p>
      </div>
      <button type="button" :disabled="isProfileLoading" @click="handleProfileRetry">
        <AppIcon name="refresh" :size="17" />
        {{
          isProfileLoading
            ? t('profile.page.loading')
            : t('profile.page.retry')
        }}
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
        <button type="button" @click="handleProfileRetry">
          {{ t('profile.page.refresh') }}
        </button>
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

<style scoped src="./ProfilePage.css"></style>
