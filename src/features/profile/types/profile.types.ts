export interface UserProfile {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  avatarUrl: string | null
}

export type UpdateProfilePayload = Pick<UserProfile, 'firstName' | 'lastName' | 'phone'>
