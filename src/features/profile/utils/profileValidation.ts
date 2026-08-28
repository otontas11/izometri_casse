import { translate } from '@/locales'

import type { UpdateProfilePayload } from '../types/profile.types'

export type ProfileEditableFieldName = keyof UpdateProfilePayload
type ProfileFormErrors = Record<ProfileEditableFieldName, string>

const PROFILE_NAME_MINIMUM_LENGTH = 2
const PROFILE_NAME_MAXIMUM_LENGTH = 50
const profileNamePattern = /^[\p{L}\p{M}]+(?:[ '\-’][\p{L}\p{M}]+)*$/u
const normalizedPhonePattern = /^\+?[1-9]\d{9,14}$/

export const createEmptyProfileFormErrors = (): ProfileFormErrors => ({
  firstName: '',
  lastName: '',
  phone: '',
})

export const validateProfileName = (profileName: string, fieldLabel: string) => {
  const trimmedProfileName = profileName.trim()

  if (!trimmedProfileName) {
    return translate('profile.validation.required', { fieldLabel })
  }

  if (trimmedProfileName.length < PROFILE_NAME_MINIMUM_LENGTH || trimmedProfileName.length > PROFILE_NAME_MAXIMUM_LENGTH) {
    return translate('profile.validation.nameLength', {
      fieldLabel,
      maximumLength: PROFILE_NAME_MAXIMUM_LENGTH,
      minimumLength: PROFILE_NAME_MINIMUM_LENGTH,
    })
  }

  if (!profileNamePattern.test(trimmedProfileName)) {
    return translate('profile.validation.nameCharacters', { fieldLabel })
  }

  return ''
}

export const validateProfilePhone = (phoneNumber: string) => {
  const trimmedPhoneNumber = phoneNumber.trim()

  if (!trimmedPhoneNumber) {
    return translate('profile.validation.phoneRequired')
  }

  const normalizedPhoneNumber = trimmedPhoneNumber.replace(/[\s()-]/g, '')

  if (!normalizedPhonePattern.test(normalizedPhoneNumber)) {
    return translate('profile.validation.phoneInvalid')
  }

  return ''
}

export const validateProfileForm = (profileFormValues: UpdateProfilePayload): ProfileFormErrors => ({
  firstName: validateProfileName(profileFormValues.firstName, translate('profile.form.firstName')),
  lastName: validateProfileName(profileFormValues.lastName, translate('profile.form.lastName')),
  phone: validateProfilePhone(profileFormValues.phone),
})

export const hasProfileFormErrors = (profileFormErrors: ProfileFormErrors) => Object.values(profileFormErrors).some(Boolean)
