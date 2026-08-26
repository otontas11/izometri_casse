import type { UpdateProfilePayload } from '../types/profile.types'

export type ProfileEditableFieldName = keyof UpdateProfilePayload
export type ProfileFormErrors = Record<ProfileEditableFieldName, string>

const PROFILE_NAME_MINIMUM_LENGTH = 2
const PROFILE_NAME_MAXIMUM_LENGTH = 50
const profileNamePattern = /^[\p{L}\p{M}]+(?:[ '\-’][\p{L}\p{M}]+)*$/u
const normalizedPhonePattern = /^\+?[1-9]\d{9,14}$/

export const createEmptyProfileFormErrors = (): ProfileFormErrors => ({
  firstName: '',
  lastName: '',
  phone: '',
})

export const validateProfileName = (
  profileName: string,
  fieldLabel: string,
) => {
  const trimmedProfileName = profileName.trim()

  if (!trimmedProfileName) {
    return `${fieldLabel} alanı zorunludur.`
  }

  if (
    trimmedProfileName.length < PROFILE_NAME_MINIMUM_LENGTH ||
    trimmedProfileName.length > PROFILE_NAME_MAXIMUM_LENGTH
  ) {
    return `${fieldLabel} ${PROFILE_NAME_MINIMUM_LENGTH}-${PROFILE_NAME_MAXIMUM_LENGTH} karakter arasında olmalıdır.`
  }

  if (!profileNamePattern.test(trimmedProfileName)) {
    return `${fieldLabel} yalnızca harf, boşluk, tire ve kesme işareti içerebilir.`
  }

  return ''
}

export const validateProfilePhone = (phoneNumber: string) => {
  const trimmedPhoneNumber = phoneNumber.trim()

  if (!trimmedPhoneNumber) {
    return 'Telefon numarası alanı zorunludur.'
  }

  const normalizedPhoneNumber = trimmedPhoneNumber.replace(/[\s()-]/g, '')

  if (!normalizedPhonePattern.test(normalizedPhoneNumber)) {
    return 'Geçerli bir telefon numarası girin. Örnek: +90 555 123 45 67.'
  }

  return ''
}

export const validateProfileForm = (
  profileFormValues: UpdateProfilePayload,
): ProfileFormErrors => ({
  firstName: validateProfileName(profileFormValues.firstName, 'Ad'),
  lastName: validateProfileName(profileFormValues.lastName, 'Soyad'),
  phone: validateProfilePhone(profileFormValues.phone),
})

export const hasProfileFormErrors = (
  profileFormErrors: ProfileFormErrors,
) => Object.values(profileFormErrors).some(Boolean)
