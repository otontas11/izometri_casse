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

const handleLanguageSelection = (changeEvent: Event) => {
  const languageSelectElement = changeEvent.target

  if (!(languageSelectElement instanceof HTMLSelectElement)) {
    return
  }

  selectApplicationLocale(
    languageSelectElement.value as SupportedApplicationLocale,
  )
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
  >
    <select
      class="language-switcher__select"
      :aria-label="t('language.selectorLabel')"
      :value="locale"
      @change="handleLanguageSelection"
    >
      <option
        v-for="languageOption in languageOptions"
        :key="languageOption.locale"
        :value="languageOption.locale"
      >
        {{ languageOption.label }} · {{ getLanguageName(languageOption.locale) }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.language-switcher::after {
  position: absolute;
  right: 0.75rem;
  width: 0.4rem;
  height: 0.4rem;
  pointer-events: none;
  content: '';
  border-right: 2px solid currentcolor;
  border-bottom: 2px solid currentcolor;
  transform: translateY(-25%) rotate(45deg);
}

.language-switcher__select {
  min-height: 2.5rem;
  padding: 0.45rem 2rem 0.45rem 0.75rem;
  appearance: none;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 800;
  cursor: pointer;
  background: var(--color-surface-canvas);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast);
}

.language-switcher__select:hover {
  color: var(--color-brand-950);
  border-color: var(--color-accent-600);
}

.language-switcher__select:focus-visible {
  outline: none;
  border-color: var(--color-accent-600);
  box-shadow: 0 0 0 3px rgb(15 159 132 / 14%);
}

@media (max-width: 35.99rem) {
  .language-switcher__select {
    width: 4.5rem;
    padding-left: 0.65rem;
    text-overflow: ellipsis;
  }
}
</style>
