<script setup lang="ts">
import { computed, ref, watch } from 'vue'

import AppIcon from '@/components/common/AppIcon.vue'

const props = defineProps<{
  avatarUrl: string
  displayName: string
  emailAddress: string
  initials: string
  isEditing: boolean
  isEmailVerified: boolean
}>()

const emit = defineEmits<{
  edit: []
}>()

const hasAvatarImageError = ref(false)
const shouldDisplayAvatarImage = computed(
  () => Boolean(props.avatarUrl) && !hasAvatarImageError.value,
)

watch(
  () => props.avatarUrl,
  () => {
    hasAvatarImageError.value = false
  },
)
</script>

<template>
  <section class="profile-identity-card" aria-labelledby="profile-identity-title">
    <div class="profile-identity-card__avatar" aria-hidden="true">
      <img
        v-if="shouldDisplayAvatarImage"
        :src="avatarUrl"
        alt=""
        @error="hasAvatarImageError = true"
      />
      <span v-else>{{ initials }}</span>
    </div>

    <div class="profile-identity-card__details">
      <small>İzİmza hesabı</small>
      <h2 id="profile-identity-title">{{ displayName }}</h2>
      <p>{{ emailAddress }}</p>

      <span
        :class="[
          'profile-identity-card__verification-status',
          {
            'profile-identity-card__verification-status--pending':
              !isEmailVerified,
          },
        ]"
      >
        <span aria-hidden="true">{{ isEmailVerified ? '✓' : '!' }}</span>
        {{ isEmailVerified ? 'E-posta doğrulandı' : 'Doğrulama bekleniyor' }}
      </span>
    </div>

    <button
      class="profile-identity-card__edit-button"
      type="button"
      :disabled="isEditing"
      @click="emit('edit')"
    >
      <AppIcon name="profile" :size="18" />
      {{ isEditing ? 'Düzenleniyor' : 'Bilgileri düzenle' }}
    </button>
  </section>
</template>

<style scoped>
.profile-identity-card {
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  gap: 1.25rem;
  align-items: center;
  padding: clamp(1.25rem, 3vw, 1.75rem);
  overflow: hidden;
  color: var(--color-text-inverse);
  background:
    radial-gradient(
      circle at 85% 0%,
      color-mix(in srgb, var(--color-accent-600) 38%, transparent),
      transparent 38%
    ),
    var(--color-brand-950);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
}

.profile-identity-card::after {
  position: absolute;
  right: -3rem;
  bottom: -5rem;
  width: 12rem;
  height: 12rem;
  content: '';
  border: 1px solid
    color-mix(in srgb, var(--color-text-inverse) 9%, transparent);
  border-radius: 50%;
}

.profile-identity-card__avatar {
  position: relative;
  z-index: 1;
  display: grid;
  width: clamp(4.5rem, 8vw, 5.5rem);
  height: clamp(4.5rem, 8vw, 5.5rem);
  overflow: hidden;
  place-items: center;
  color: var(--color-brand-950);
  font-size: 1.35rem;
  font-weight: 500;
  letter-spacing: -0.04em;
  background: var(--color-accent-100);
  border: 3px solid
    color-mix(in srgb, var(--color-text-inverse) 18%, transparent);
  border-radius: 1.25rem;
}

.profile-identity-card__avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-identity-card__details {
  position: relative;
  z-index: 1;
  min-width: 0;
}

.profile-identity-card__details small,
.profile-identity-card__details h2,
.profile-identity-card__details p {
  margin: 0;
}

.profile-identity-card__details > small {
  color: color-mix(in srgb, var(--color-text-inverse) 63%, transparent);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.11em;
  text-transform: uppercase;
}

.profile-identity-card__details h2 {
  margin-top: 0.35rem;
  overflow: hidden;
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  line-height: 1.15;
  text-overflow: ellipsis;
  letter-spacing: -0.04em;
  white-space: nowrap;
}

.profile-identity-card__details > p {
  margin-top: 0.3rem;
  overflow: hidden;
  color: color-mix(in srgb, var(--color-text-inverse) 70%, transparent);
  font-size: 0.76rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.profile-identity-card__verification-status {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  margin-top: 0.85rem;
  padding: 0.35rem 0.6rem;
  color: var(--color-accent-100);
  font-size: var(--font-size-small);
  font-weight: 500;
  background: color-mix(in srgb, var(--color-accent-600) 24%, transparent);
  border: 1px solid
    color-mix(in srgb, var(--color-accent-100) 20%, transparent);
  border-radius: 999px;
}

.profile-identity-card__verification-status > span {
  display: grid;
  width: 1.15rem;
  height: 1.15rem;
  place-items: center;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  background: var(--color-accent-100);
  border-radius: 50%;
}

.profile-identity-card__verification-status--pending {
  color: color-mix(in srgb, var(--color-text-inverse) 86%, transparent);
  background: color-mix(in srgb, var(--color-warning) 28%, transparent);
}

.profile-identity-card__verification-status--pending > span {
  background: color-mix(
    in srgb,
    var(--color-warning) 45%,
    var(--color-text-inverse)
  );
}

.profile-identity-card__edit-button {
  position: relative;
  z-index: 1;
  display: inline-flex;
  gap: 0.55rem;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.7rem 1rem;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 500;
  cursor: pointer;
  background: var(--color-surface-raised);
  border-radius: var(--radius-sm);
  transition:
    transform var(--transition-fast),
    opacity var(--transition-fast);
}

.profile-identity-card__edit-button:hover:not(:disabled) {
  transform: translateY(-1px);
}

.profile-identity-card__edit-button:disabled {
  cursor: default;
  opacity: 0.62;
}

@media (max-width: 700px) {
  .profile-identity-card {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .profile-identity-card__edit-button {
    grid-column: 1 / -1;
    width: 100%;
  }
}

@media (max-width: 440px) {
  .profile-identity-card {
    grid-template-columns: 1fr;
    text-align: center;
  }

  .profile-identity-card__avatar {
    margin-inline: auto;
  }

  .profile-identity-card__verification-status {
    justify-content: center;
  }
}
</style>
