<script setup lang="ts">
import AppIcon from '@/components/common/AppIcon.vue'

defineProps<{
  isAuthenticated: boolean
  isEmailVerified: boolean
}>()
</script>

<template>
  <section
    class="profile-security-panel"
    aria-labelledby="profile-security-panel-title"
  >
    <header class="profile-security-panel__header">
      <span aria-hidden="true">
        <AppIcon name="signature" :size="22" />
      </span>
      <div>
        <small>Güvenlik</small>
        <h2 id="profile-security-panel-title">Kimlik sağlayıcısı</h2>
      </div>
    </header>

    <p class="profile-security-panel__description">
      Oturumunuz ve kimlik bilgileriniz OAuth 2.0 / OpenID Connect akışıyla
      Auth0 tarafından korunur.
    </p>

    <dl class="profile-security-panel__status-list">
      <div>
        <dt>Oturum</dt>
        <dd :class="{ 'profile-security-panel__status--success': isAuthenticated }">
          <span aria-hidden="true"></span>
          {{ isAuthenticated ? 'Aktif' : 'Kontrol ediliyor' }}
        </dd>
      </div>
      <div>
        <dt>E-posta</dt>
        <dd
          :class="{
            'profile-security-panel__status--success': isEmailVerified,
          }"
        >
          <span aria-hidden="true"></span>
          {{ isEmailVerified ? 'Doğrulandı' : 'Doğrulama bekleniyor' }}
        </dd>
      </div>
      <div>
        <dt>Kimlik sistemi</dt>
        <dd>Auth0</dd>
      </div>
    </dl>

    <div class="profile-security-panel__note">
      <span aria-hidden="true">i</span>
      <p>
        Şifre ve e-posta değişiklikleri güvenlik nedeniyle doğrudan kimlik
        sağlayıcınız üzerinden yönetilir.
      </p>
    </div>
  </section>
</template>

<style scoped>
.profile-security-panel {
  display: grid;
  align-content: start;
  min-width: 0;
  padding: clamp(1.25rem, 3vw, 1.5rem);
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.profile-security-panel__header {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.8rem;
  align-items: center;
}

.profile-security-panel__header > span {
  display: grid;
  width: 2.75rem;
  height: 2.75rem;
  place-items: center;
  color: var(--color-accent-600);
  background: var(--color-accent-100);
  border-radius: var(--radius-sm);
}

.profile-security-panel__header small,
.profile-security-panel__header h2,
.profile-security-panel__description,
.profile-security-panel__status-list,
.profile-security-panel__status-list dd,
.profile-security-panel__note p {
  margin: 0;
}

.profile-security-panel__header small {
  color: var(--color-accent-600);
  font-size: var(--font-size-small);
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.profile-security-panel__header h2 {
  margin-top: 0.2rem;
  color: var(--color-brand-950);
  font-size: 1rem;
  line-height: 1.3;
  letter-spacing: -0.02em;
}

.profile-security-panel__description {
  margin-top: 1.1rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  line-height: 1.65;
}

.profile-security-panel__status-list {
  display: grid;
  margin-top: 1.25rem;
}

.profile-security-panel__status-list > div {
  display: flex;
  gap: 1rem;
  align-items: center;
  justify-content: space-between;
  padding-block: 0.8rem;
  border-top: 1px solid var(--color-border);
}

.profile-security-panel__status-list dt {
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
}

.profile-security-panel__status-list dd {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 500;
}

.profile-security-panel__status-list dd > span {
  width: 0.42rem;
  height: 0.42rem;
  background: var(--color-warning);
  border-radius: 50%;
}

.profile-security-panel__status-list dd:not(:has(span)) {
  padding: 0.28rem 0.5rem;
  background: var(--color-surface-subtle);
  border-radius: 999px;
}

.profile-security-panel__status-list
  .profile-security-panel__status--success
  > span {
  background: var(--color-success);
  box-shadow: 0 0 0 3px
    color-mix(in srgb, var(--color-success) 12%, transparent);
}

.profile-security-panel__note {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: 0.6rem;
  margin-top: 1rem;
  padding: 0.85rem;
  color: var(--color-text-secondary);
  background: var(--color-surface-subtle);
  border-radius: var(--radius-sm);
}

.profile-security-panel__note > span {
  display: grid;
  width: 1.3rem;
  height: 1.3rem;
  place-items: center;
  color: var(--color-primary-600);
  font-family: serif;
  font-size: var(--font-size-small);
  font-weight: 700;
  background: var(--color-primary-100);
  border-radius: 50%;
}

.profile-security-panel__note p {
  font-size: var(--font-size-small);
  line-height: 1.55;
}
</style>
