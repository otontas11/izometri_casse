<script setup lang="ts">
import { computed, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import BaseInput from '@/components/ui/BaseInput.vue'

import type {
  UpdateProfilePayload,
  UserProfile,
} from '../types/profile.types'
import {
  createEmptyProfileFormErrors,
  hasProfileFormErrors,
  type ProfileEditableFieldName,
  validateProfileForm,
  validateProfileName,
  validateProfilePhone,
} from '../utils/profileValidation'

const props = withDefaults(
  defineProps<{
    emailAddress: string
    isEditing: boolean
    isSaving: boolean
    saveErrorMessage?: string
    userProfile: UserProfile
  }>(),
  {
    saveErrorMessage: '',
  },
)

const emit = defineEmits<{
  cancel: []
  submit: [profileUpdates: UpdateProfilePayload]
}>()

const { locale, t } = useI18n({ useScope: 'global' })
const profileFormValues = reactive<UpdateProfilePayload>({
  firstName: '',
  lastName: '',
  phone: '',
})
const profileFormErrors = reactive(createEmptyProfileFormErrors())

const isProfileFormDirty = computed(
  () =>
    profileFormValues.firstName !== props.userProfile.firstName ||
    profileFormValues.lastName !== props.userProfile.lastName ||
    profileFormValues.phone !== props.userProfile.phone,
)

const clearProfileFormErrors = () => {
  Object.assign(profileFormErrors, createEmptyProfileFormErrors())
}

const resetProfileForm = () => {
  Object.assign(profileFormValues, {
    firstName: props.userProfile.firstName,
    lastName: props.userProfile.lastName,
    phone: props.userProfile.phone,
  })
  clearProfileFormErrors()
}

const validateProfileField = (fieldName: ProfileEditableFieldName) => {
  if (fieldName === 'firstName') {
    profileFormErrors.firstName = validateProfileName(
      profileFormValues.firstName,
      t('profile.form.firstName'),
    )
    return
  }

  if (fieldName === 'lastName') {
    profileFormErrors.lastName = validateProfileName(
      profileFormValues.lastName,
      t('profile.form.lastName'),
    )
    return
  }

  profileFormErrors.phone = validateProfilePhone(profileFormValues.phone)
}

const handleProfileFormSubmit = () => {
  const validationErrors = validateProfileForm(profileFormValues)
  Object.assign(profileFormErrors, validationErrors)

  if (hasProfileFormErrors(validationErrors) || !isProfileFormDirty.value) {
    return
  }

  emit('submit', {
    firstName: profileFormValues.firstName.trim(),
    lastName: profileFormValues.lastName.trim(),
    phone: profileFormValues.phone.trim(),
  })
}

const handleProfileFormCancel = () => {
  resetProfileForm()
  emit('cancel')
}

watch(
  () => props.userProfile,
  resetProfileForm,
  { deep: true, immediate: true },
)

watch(
  () => props.isEditing,
  (isEditing) => {
    if (!isEditing) {
      resetProfileForm()
    }
  },
)

watch(
  () => profileFormValues.firstName,
  () => {
    if (profileFormErrors.firstName) {
      validateProfileField('firstName')
    }
  },
)

watch(
  () => profileFormValues.lastName,
  () => {
    if (profileFormErrors.lastName) {
      validateProfileField('lastName')
    }
  },
)

watch(
  () => profileFormValues.phone,
  () => {
    if (profileFormErrors.phone) {
      validateProfileField('phone')
    }
  },
)

watch(locale, () => {
  if (profileFormErrors.firstName) {
    validateProfileField('firstName')
  }

  if (profileFormErrors.lastName) {
    validateProfileField('lastName')
  }

  if (profileFormErrors.phone) {
    validateProfileField('phone')
  }
})
</script>

<template>
  <form
    class="profile-form"
    novalidate
    aria-labelledby="profile-form-title"
    @submit.prevent="handleProfileFormSubmit"
  >
    <header class="profile-form__header">
      <div>
        <small>{{ t('profile.form.eyebrow') }}</small>
        <h2 id="profile-form-title">{{ t('profile.form.title') }}</h2>
      </div>
      <span :class="{ 'profile-form__mode--editing': isEditing }">
        {{
          isEditing
            ? t('profile.form.editingMode')
            : t('profile.form.viewingMode')
        }}
      </span>
    </header>

    <p class="profile-form__description">
      {{ t('profile.form.description') }}
    </p>

    <div class="profile-form__fields">
      <BaseInput
        id="profile-first-name"
        v-model="profileFormValues.firstName"
        name="firstName"
        :label="t('profile.form.firstName')"
        autocomplete="given-name"
        :maximum-length="50"
        :readonly="!isEditing"
        :disabled="isSaving"
        :required="isEditing"
        :error-message="isEditing ? profileFormErrors.firstName : ''"
        @blur="validateProfileField('firstName')"
      />

      <BaseInput
        id="profile-last-name"
        v-model="profileFormValues.lastName"
        name="lastName"
        :label="t('profile.form.lastName')"
        autocomplete="family-name"
        :maximum-length="50"
        :readonly="!isEditing"
        :disabled="isSaving"
        :required="isEditing"
        :error-message="isEditing ? profileFormErrors.lastName : ''"
        @blur="validateProfileField('lastName')"
      />

      <BaseInput
        id="profile-phone"
        v-model="profileFormValues.phone"
        name="phone"
        type="tel"
        input-mode="tel"
        :label="t('profile.form.phone')"
        autocomplete="tel"
        placeholder="+90 555 123 45 67"
        :maximum-length="24"
        :readonly="!isEditing"
        :disabled="isSaving"
        :required="isEditing"
        :error-message="isEditing ? profileFormErrors.phone : ''"
        @blur="validateProfileField('phone')"
      />

      <BaseInput
        id="profile-email"
        :model-value="emailAddress"
        name="email"
        type="email"
        input-mode="email"
        :label="t('profile.form.email')"
        autocomplete="email"
        readonly
        :hint="t('profile.form.emailHint')"
      />
    </div>

    <p
      v-if="saveErrorMessage"
      class="profile-form__save-error"
      role="alert"
    >
      <span aria-hidden="true">!</span>
      {{ saveErrorMessage }}
    </p>

    <footer v-if="isEditing" class="profile-form__actions">
      <p>{{ t('profile.form.saveNote') }}</p>
      <div>
        <button
          type="button"
          :disabled="isSaving"
          @click="handleProfileFormCancel"
        >
          {{ t('common.cancel') }}
        </button>
        <button type="submit" :disabled="isSaving || !isProfileFormDirty">
          <span
            v-if="isSaving"
            class="profile-form__spinner"
            aria-hidden="true"
          ></span>
          {{ isSaving ? t('profile.form.saving') : t('profile.form.save') }}
        </button>
      </div>
    </footer>
  </form>
</template>

<style scoped>
.profile-form {
  display: grid;
  min-width: 0;
  padding: clamp(1.25rem, 3vw, 1.75rem);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.profile-form__header {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
}

.profile-form__header small,
.profile-form__header h2,
.profile-form__description,
.profile-form__actions p,
.profile-form__save-error {
  margin: 0;
}

.profile-form__header small {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.profile-form__header h2 {
  margin-top: 0.25rem;
  color: var(--color-brand-950);
  font-size: 1.2rem;
  line-height: 1.25;
  letter-spacing: -0.025em;
}

.profile-form__header > span {
  flex: 0 0 auto;
  padding: 0.38rem 0.65rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 500;
  background: var(--color-surface-subtle);
  border-radius: 999px;
}

.profile-form__header > .profile-form__mode--editing {
  color: var(--color-primary-600);
  background: var(--color-primary-100);
}

.profile-form__description {
  max-width: 38rem;
  margin-top: 0.85rem;
  color: var(--color-text-secondary);
  font-size: 0.76rem;
  line-height: 1.6;
}

.profile-form__fields {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem;
  margin-top: 1.5rem;
}

.profile-form__save-error {
  display: flex;
  gap: 0.6rem;
  align-items: center;
  margin-top: 1rem;
  padding: 0.8rem 0.9rem;
  color: var(--color-danger);
  font-size: var(--font-size-small);
  font-weight: 500;
  background: color-mix(in srgb, var(--color-danger) 6%, transparent);
  border: 1px solid
    color-mix(in srgb, var(--color-danger) 28%, var(--color-border));
  border-radius: var(--radius-sm);
}

.profile-form__save-error > span {
  display: grid;
  width: 1.35rem;
  height: 1.35rem;
  flex: 0 0 auto;
  place-items: center;
  color: var(--color-text-inverse);
  font-size: var(--font-size-small);
  background: var(--color-danger);
  border-radius: 50%;
}

.profile-form__actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  margin-top: 1.5rem;
  padding-top: 1.15rem;
  border-top: 1px solid var(--color-border);
}

.profile-form__actions p {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.45;
}

.profile-form__actions > div {
  display: flex;
  flex: 0 0 auto;
  gap: 0.65rem;
}

.profile-form__actions button {
  min-height: 2.65rem;
  padding: 0.65rem 0.95rem;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 500;
  cursor: pointer;
  background: var(--color-surface-subtle);
  border-radius: var(--radius-sm);
}

.profile-form__actions button[type='submit'] {
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  color: var(--color-text-inverse);
  background: var(--color-primary-600);
}

.profile-form__actions button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.profile-form__spinner {
  width: 0.9rem;
  height: 0.9rem;
  border: 2px solid
    color-mix(in srgb, var(--color-text-inverse) 35%, transparent);
  border-top-color: var(--color-text-inverse);
  border-radius: 50%;
  animation: profile-form-spin 700ms linear infinite;
}

@keyframes profile-form-spin {
  to {
    transform: rotate(360deg);
  }
}

@media (max-width: 700px) {
  .profile-form__fields {
    grid-template-columns: 1fr;
  }

  .profile-form__actions {
    align-items: stretch;
    flex-direction: column;
  }

  .profile-form__actions > div,
  .profile-form__actions button {
    width: 100%;
  }

  .profile-form__actions button {
    justify-content: center;
  }
}

@media (max-width: 440px) {
  .profile-form__header {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
