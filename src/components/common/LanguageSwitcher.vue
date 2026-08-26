<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import {
  setApplicationLocale,
  type SupportedApplicationLocale,
} from '@/locales'

const { locale, t } = useI18n({ useScope: 'global' })

const languageOptions: Array<{
  label: string
  locale: SupportedApplicationLocale
}> = [
  { label: 'TR', locale: 'tr' },
  { label: 'EN', locale: 'en' },
]

const selectApplicationLocale = (
  selectedLocale: SupportedApplicationLocale,
) => {
  if (locale.value !== selectedLocale) {
    setApplicationLocale(selectedLocale)
  }
}

const getLanguageName = (applicationLocale: SupportedApplicationLocale) =>
  t(
    applicationLocale === 'tr'
      ? 'language.turkish'
      : 'language.english',
  )
</script>

<template>
  <div
    class="language-switcher"
    role="group"
    :aria-label="t('language.selectorLabel')"
  >
    <button
      v-for="languageOption in languageOptions"
      :key="languageOption.locale"
      type="button"
      :class="{
        'language-switcher__button--active':
          locale === languageOption.locale,
      }"
      :aria-pressed="locale === languageOption.locale"
      :aria-label="
        t('language.switchTo', {
          language: getLanguageName(languageOption.locale),
        })
      "
      @click="selectApplicationLocale(languageOption.locale)"
    >
      {{ languageOption.label }}
    </button>
  </div>
</template>

<style scoped>
.language-switcher {
  display: inline-flex;
  min-height: 2.5rem;
  padding: 0.2rem;
  background: var(--color-surface-canvas);
  border: 1px solid var(--color-border);
  border-radius: 999px;
}

.language-switcher button {
  min-width: 2rem;
  padding: 0.35rem 0.45rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 800;
  cursor: pointer;
  background: transparent;
  border-radius: 999px;
}

.language-switcher button:hover,
.language-switcher__button--active {
  color: var(--color-brand-950);
  background: var(--color-surface-raised);
}

.language-switcher__button--active {
  box-shadow: var(--shadow-sm);
}
</style>
