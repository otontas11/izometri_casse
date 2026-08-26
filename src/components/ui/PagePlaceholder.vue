<script setup lang="ts">
defineProps<{
  eyebrow: string
  title: string
  description: string
}>()
</script>

<template>
  <section class="page-placeholder" aria-labelledby="page-title">
    <header class="page-placeholder__header">
      <p>{{ eyebrow }}</p>
      <h1 id="page-title">{{ title }}</h1>
      <span>{{ description }}</span>
    </header>

    <div class="page-placeholder__surface">
      <span class="page-placeholder__status">İskelet hazır</span>
      <h2>Sayfa bileşenleri bir sonraki aşamada eklenecek.</h2>
      <p>
        Route, responsive uygulama kabuğu ve temel tasarım token’ları kullanıma
        hazır.
      </p>
    </div>
  </section>
</template>

<style scoped>
.page-placeholder {
  display: grid;
  gap: 2rem;
  width: min(100%, 90rem);
  margin-inline: auto;
}

.page-placeholder__header {
  display: grid;
  gap: 0.5rem;
}

.page-placeholder__header p,
.page-placeholder__header h1,
.page-placeholder__header span,
.page-placeholder__surface h2,
.page-placeholder__surface p {
  margin: 0;
}

.page-placeholder__header p {
  color: var(--color-accent-600);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.page-placeholder__header h1 {
  color: var(--color-brand-950);
  font-size: clamp(2rem, 4vw, 3rem);
  line-height: 1.1;
  letter-spacing: -0.04em;
}

.page-placeholder__header span {
  max-width: 42rem;
  color: var(--color-text-secondary);
  line-height: 1.7;
}

.page-placeholder__surface {
  position: relative;
  display: grid;
  min-height: 22rem;
  place-content: center;
  justify-items: center;
  padding: 3rem;
  overflow: hidden;
  text-align: center;
  background:
    radial-gradient(circle at 50% 0%, rgb(15 159 132 / 12%), transparent 38%),
    var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.page-placeholder__surface::before,
.page-placeholder__surface::after {
  position: absolute;
  width: 12rem;
  height: 12rem;
  content: '';
  border: 1px solid rgb(15 159 132 / 16%);
  border-radius: 50%;
}

.page-placeholder__surface::before {
  top: -7rem;
  left: -3rem;
}

.page-placeholder__surface::after {
  right: -5rem;
  bottom: -8rem;
}

.page-placeholder__status {
  margin-bottom: 1.25rem;
  padding: 0.45rem 0.75rem;
  color: var(--color-success);
  font-size: 0.75rem;
  font-weight: 800;
  background: var(--color-accent-100);
  border-radius: 999px;
}

.page-placeholder__surface h2 {
  max-width: 32rem;
  color: var(--color-brand-950);
  font-size: clamp(1.25rem, 3vw, 1.625rem);
  line-height: 1.35;
}

.page-placeholder__surface p {
  max-width: 32rem;
  margin-top: 0.75rem;
  color: var(--color-text-secondary);
  line-height: 1.65;
}

@media (max-width: 47.99rem) {
  .page-placeholder {
    gap: 1.5rem;
  }

  .page-placeholder__surface {
    min-height: 19rem;
    padding: 2rem 1.25rem;
  }
}
</style>

