import { computed, ref } from 'vue'
import { defineStore } from 'pinia'

import { getApiErrorMessage } from '@/api/apiError'
import { translate } from '@/locales'
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
  const profileLoadErrorMessage = ref('')
  const profileSaveErrorMessage = ref('')
  const profileSaveSuccessMessage = ref('')

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
    profileLoadErrorMessage.value = ''

    try {
      userProfile.value = await profileApi.fetchUserProfile()
      profileLoadStatus.value = 'success'
    } catch (requestError) {
      profileLoadStatus.value = 'error'
      profileLoadErrorMessage.value = getApiErrorMessage(requestError)
    }
  }

  const updateUserProfile = async (profileUpdates: UpdateProfilePayload) => {
    if (isProfileSaving.value) {
      return false
    }

    profileSaveStatus.value = 'loading'
    profileSaveErrorMessage.value = ''
    profileSaveSuccessMessage.value = ''

    try {
      userProfile.value = await profileApi.updateUserProfile(profileUpdates)
      profileSaveStatus.value = 'success'
      profileSaveSuccessMessage.value = translate('profile.feedback.updated')

      return true
    } catch (requestError) {
      profileSaveStatus.value = 'error'
      profileSaveErrorMessage.value = getApiErrorMessage(requestError)

      return false
    }
  }

  const clearProfileSaveFeedback = () => {
    profileSaveErrorMessage.value = ''
    profileSaveSuccessMessage.value = ''

    if (!isProfileSaving.value) {
      profileSaveStatus.value = 'idle'
    }
  }

  return {
    clearProfileSaveFeedback,
    fetchUserProfile,
    isProfileLoading,
    isProfileSaving,
    profileFullName,
    profileLoadErrorMessage,
    profileLoadStatus,
    profileSaveErrorMessage,
    profileSaveSuccessMessage,
    updateUserProfile,
    userProfile,
  }
})
