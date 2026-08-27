import type { Meta, StoryObj } from '@storybook/vue3-vite'

import type { UserProfile } from '../types/profile.types'

import ProfileForm from './ProfileForm.vue'

const exampleUserProfile: UserProfile = {
  avatarUrl: null,
  email: 'oktay.tontas@example.com',
  firstName: 'Oktay',
  id: 'auth0|storybook-user',
  lastName: 'Tontaş',
  phone: '+90 555 123 45 67',
}

const profileFormMeta = {
  args: {
    emailAddress: exampleUserProfile.email,
    isEditing: false,
    isSaving: false,
    saveErrorMessage: '',
    userProfile: exampleUserProfile,
  },
  component: ProfileForm,
  tags: ['autodocs'],
  title: 'Bileşenler/Profil/Profil Formu',
} satisfies Meta<typeof ProfileForm>

export default profileFormMeta

type ProfileFormStory = StoryObj<typeof profileFormMeta>

export const ReadOnly: ProfileFormStory = {
  name: 'Görüntüleme',
}

export const Editing: ProfileFormStory = {
  args: {
    isEditing: true,
  },
  name: 'Düzenleme',
}

export const Saving: ProfileFormStory = {
  args: {
    isEditing: true,
    isSaving: true,
  },
  name: 'Kaydediliyor',
}

export const SaveError: ProfileFormStory = {
  args: {
    isEditing: true,
    saveErrorMessage: 'Profil bilgileri güncellenemedi.',
  },
  name: 'Kayıt Hatası',
}
