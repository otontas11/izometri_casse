import { axiosInstance } from '@/api/axiosInstance'

import type {
  UpdateProfilePayload,
  UserProfile,
} from '../types/profile.types'

const fetchUserProfile = async () => {
  const { data: userProfile } =
    await axiosInstance.get<UserProfile>('/profile')

  return userProfile
}

const updateUserProfile = async (profileUpdates: UpdateProfilePayload) => {
  const { data: updatedUserProfile } = await axiosInstance.patch<UserProfile>(
    '/profile',
    profileUpdates,
  )

  return updatedUserProfile
}

export const profileApi = {
  fetchUserProfile,
  updateUserProfile,
}
