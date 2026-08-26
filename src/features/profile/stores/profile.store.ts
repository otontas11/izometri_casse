import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import type { ApiRequestStatus } from '@/types/api.types'

import { profileApi } from '../api/profile.api'
import type {
  UpdateProfilePayload,
  UserProfile,
} from '../types/profile.types'

export const useProfileStore = defineStore('profile', () => {
  const userProfile = ref<UserProfile | null>(null)
  const profileLoadStatus = ref<ApiRequestStatus>('idle')
  const profileSaveStatus = ref<ApiRequestStatus>('idle')
  const profileErrorMessage = ref('')
  const profileSuccessMessage = ref('')

  const isProfileLoading = computed(() => profileLoadStatus.value === 'loading')
  const isProfileSaving = computed(() => profileSaveStatus.value === 'loading')
  const profileFullName = computed(() => {
    if (!userProfile.value) {
      return ''
    }

    return `${userProfile.value.firstName} ${userProfile.value.lastName}`.trim()
  })

  const fetchUserProfile = async () => {
    if (isProfileLoading.value) {
      return
    }

    profileLoadStatus.value = 'loading'
    profileErrorMessage.value = ''

    try {
      userProfile.value = await profileApi.fetchUserProfile()
      profileLoadStatus.value = 'success'
    } catch (requestError) {
      profileLoadStatus.value = 'error'
      profileErrorMessage.value = getApiErrorMessage(requestError)
    }
  }

  const updateUserProfile = async (profileUpdates: UpdateProfilePayload) => {
    if (isProfileSaving.value) {
      return false
    }

    profileSaveStatus.value = 'loading'
    profileErrorMessage.value = ''
    profileSuccessMessage.value = ''

    try {
      userProfile.value = await profileApi.updateUserProfile(profileUpdates)
      profileSaveStatus.value = 'success'
      profileSuccessMessage.value = 'Profil bilgileriniz güncellendi.'

      return true
    } catch (requestError) {
      profileSaveStatus.value = 'error'
      profileErrorMessage.value = getApiErrorMessage(requestError)

      return false
    }
  }

  const clearProfileFeedback = () => {
    profileErrorMessage.value = ''
    profileSuccessMessage.value = ''
  }

  return {
    clearProfileFeedback,
    fetchUserProfile,
    isProfileLoading,
    isProfileSaving,
    profileErrorMessage,
    profileFullName,
    profileLoadStatus,
    profileSaveStatus,
    profileSuccessMessage,
    updateUserProfile,
    userProfile,
  }
})
