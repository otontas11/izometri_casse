import type { Meta, StoryObj } from '@storybook/vue3-vite'

import { storybookUserProfile } from '@/mocks/storybookApiHandlers'

import ProfileForm from './ProfileForm.vue'

const profileFormMeta = {
  args: {
    emailAddress: storybookUserProfile.email,
    isEditing: false,
    isSaving: false,
    saveErrorMessage: '',
    userProfile: storybookUserProfile,
  },
  component: ProfileForm,
  tags: ['autodocs'],
  title: 'Profile/ProfileForm',
} satisfies Meta<typeof ProfileForm>

export default profileFormMeta

type ProfileFormStory = StoryObj<typeof profileFormMeta>

export const ReadOnly: ProfileFormStory = {}

export const Editing: ProfileFormStory = {
  args: {
    isEditing: true,
  },
}

export const Saving: ProfileFormStory = {
  args: {
    isEditing: true,
    isSaving: true,
  },
}

export const SaveError: ProfileFormStory = {
  args: {
    isEditing: true,
    saveErrorMessage: 'Profil bilgileri güncellenemedi.',
  },
}
