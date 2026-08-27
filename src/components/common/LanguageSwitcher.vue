<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import { useI18n } from 'vue-i18n'

import {
  setApplicationLocale,
  type SupportedApplicationLocale,
} from '@/locales'

interface LanguageOption {
  code: string
  locale: SupportedApplicationLocale
}

const turkishLanguageOption: LanguageOption = {
  code: 'TR',
  locale: 'tr',
}
const languageOptions: LanguageOption[] = [
  turkishLanguageOption,
  { code: 'EN', locale: 'en' },
]

const { locale, t } = useI18n({ useScope: 'global' })
const isLanguageMenuOpen = ref(false)
const languageSwitcherElement = ref<HTMLElement | null>(null)
const languageMenuElement = ref<HTMLElement | null>(null)
const languageMenuTriggerElement = ref<HTMLButtonElement | null>(null)

const selectedLanguageOption = computed(
  () =>
    languageOptions.find(
      (languageOption) => languageOption.locale === locale.value,
    ) ?? turkishLanguageOption,
)

const getLanguageName = (applicationLocale: SupportedApplicationLocale) =>
  t(
    applicationLocale === 'tr'
      ? 'language.turkish'
      : 'language.english',
  )

const closeLanguageMenu = () => {
  isLanguageMenuOpen.value = false
}

const closeLanguageMenuAndRestoreTriggerFocus = async () => {
  if (!isLanguageMenuOpen.value) {
    return
  }

  closeLanguageMenu()
  await nextTick()
  languageMenuTriggerElement.value?.focus()
}

const openLanguageMenuAndFocusOption = async (
  shouldFocusLastOption = false,
) => {
  isLanguageMenuOpen.value = true
  await nextTick()
  const languageOptionElements = Array.from(
    languageMenuElement.value?.querySelectorAll<HTMLButtonElement>(
      'button',
    ) ?? [],
  )
  const languageOptionToFocus = shouldFocusLastOption
    ? languageOptionElements[languageOptionElements.length - 1]
    : languageOptionElements[0]

  languageOptionToFocus?.focus()
}

const handleLanguageMenuTriggerClick = () => {
  isLanguageMenuOpen.value = !isLanguageMenuOpen.value
}

const handleLanguageMenuTriggerKeydown = (keyboardEvent: KeyboardEvent) => {
  if (
    keyboardEvent.key === 'ArrowDown' ||
    keyboardEvent.key === 'ArrowUp'
  ) {
    keyboardEvent.preventDefault()
    void openLanguageMenuAndFocusOption(
      keyboardEvent.key === 'ArrowUp',
    )
  }
}

const handleLanguageOptionKeydown = (keyboardEvent: KeyboardEvent) => {
  const languageOptionElements = Array.from(
    languageMenuElement.value?.querySelectorAll<HTMLButtonElement>(
      'button',
    ) ?? [],
  )
  const focusedOptionIndex = languageOptionElements.indexOf(
    keyboardEvent.currentTarget as HTMLButtonElement,
  )

  if (focusedOptionIndex < 0 || languageOptionElements.length === 0) {
    return
  }

  let optionIndexToFocus: number

  if (keyboardEvent.key === 'ArrowDown') {
    optionIndexToFocus =
      (focusedOptionIndex + 1) % languageOptionElements.length
  } else if (keyboardEvent.key === 'ArrowUp') {
    optionIndexToFocus =
      (focusedOptionIndex - 1 + languageOptionElements.length) %
      languageOptionElements.length
  } else if (keyboardEvent.key === 'Home') {
    optionIndexToFocus = 0
  } else if (keyboardEvent.key === 'End') {
    optionIndexToFocus = languageOptionElements.length - 1
  } else {
    return
  }

  keyboardEvent.preventDefault()
  languageOptionElements[optionIndexToFocus]?.focus()
}

const handleLanguageSelection = async (
  selectedLocale: SupportedApplicationLocale,
) => {
  if (locale.value !== selectedLocale) {
    setApplicationLocale(selectedLocale)
  }

  await closeLanguageMenuAndRestoreTriggerFocus()
}

const handleLanguageSwitcherFocusOut = (focusEvent: FocusEvent) => {
  const nextFocusedElement = focusEvent.relatedTarget

  if (
    !(nextFocusedElement instanceof Node) ||
    !languageSwitcherElement.value?.contains(nextFocusedElement)
  ) {
    closeLanguageMenu()
  }
}

const handleOutsidePointerDown = (pointerEvent: PointerEvent) => {
  if (
    pointerEvent.target instanceof Node &&
    !languageSwitcherElement.value?.contains(pointerEvent.target)
  ) {
    closeLanguageMenu()
  }
}

onMounted(() =>
  document.addEventListener('pointerdown', handleOutsidePointerDown),
)
onBeforeUnmount(() =>
  document.removeEventListener('pointerdown', handleOutsidePointerDown),
)
</script>

<template>
  <div
    ref="languageSwitcherElement"
    class="language-switcher"
    @focusout="handleLanguageSwitcherFocusOut"
    @keydown.esc.stop.prevent="closeLanguageMenuAndRestoreTriggerFocus"
  >
    <button
      ref="languageMenuTriggerElement"
      class="language-switcher__trigger"
      type="button"
      aria-haspopup="menu"
      aria-controls="application-language-menu"
      :aria-expanded="isLanguageMenuOpen"
      :aria-label="
        isLanguageMenuOpen
          ? t('language.closeMenu')
          : t('language.openMenu')
      "
      @click="handleLanguageMenuTriggerClick"
      @keydown="handleLanguageMenuTriggerKeydown"
    >
      <span class="language-switcher__current-code">
        {{ selectedLanguageOption.code }}
      </span>
      <span class="language-switcher__current-name">
        {{ getLanguageName(selectedLanguageOption.locale) }}
      </span>
      <span
        :class="[
          'language-switcher__chevron',
          {
            'language-switcher__chevron--open': isLanguageMenuOpen,
          },
        ]"
        aria-hidden="true"
      ></span>
    </button>

    <div
      v-if="isLanguageMenuOpen"
      id="application-language-menu"
      ref="languageMenuElement"
      class="language-switcher__menu"
      role="menu"
      :aria-label="t('language.selectorLabel')"
    >
      <button
        v-for="languageOption in languageOptions"
        :key="languageOption.locale"
        type="button"
        role="menuitemradio"
        :class="[
          'language-switcher__option',
          {
            'language-switcher__option--active':
              locale === languageOption.locale,
          },
        ]"
        :aria-checked="locale === languageOption.locale"
        :aria-label="
          t('language.switchTo', {
            language: getLanguageName(languageOption.locale),
          })
        "
        @click="handleLanguageSelection(languageOption.locale)"
        @keydown="handleLanguageOptionKeydown"
      >
        <span class="language-switcher__option-code">
          {{ languageOption.code }}
        </span>
        <span class="language-switcher__option-name">
          {{ getLanguageName(languageOption.locale) }}
        </span>
        <span
          class="language-switcher__option-check"
          aria-hidden="true"
        >
          {{ locale === languageOption.locale ? '✓' : '' }}
        </span>
      </button>
    </div>
  </div>
</template>

<style scoped>
.language-switcher {
  position: relative;
  display: inline-flex;
}

.language-switcher__trigger {
  display: flex;
  gap: 0.5rem;
  align-items: center;
  min-height: 2.625rem;
  padding: 0.3rem 0.7rem 0.3rem 0.35rem;
  color: var(--color-brand-950);
  font-size: var(--font-size-small);
  font-weight: 800;
  cursor: pointer;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: 999px;
  box-shadow: var(--shadow-sm);
  transition:
    border-color var(--transition-fast),
    box-shadow var(--transition-fast),
    transform var(--transition-fast);
}

.language-switcher__trigger:hover,
.language-switcher__trigger:focus-visible {
  border-color: var(--color-accent-600);
  box-shadow: 0 0 0 3px rgb(15 159 132 / 12%);
  outline: none;
  transform: translateY(-1px);
}

.language-switcher__current-code,
.language-switcher__option-code {
  display: grid;
  place-items: center;
  color: var(--color-primary-700);
  font-size: 0.68rem;
  font-weight: 900;
  background: var(--color-primary-100);
  border-radius: 50%;
}

.language-switcher__current-code {
  width: 2rem;
  height: 2rem;
}

.language-switcher__current-name {
  min-width: 3.4rem;
  text-align: left;
}

.language-switcher__chevron {
  width: 0.42rem;
  height: 0.42rem;
  margin: 0 0.15rem 0.2rem 0.1rem;
  border-right: 2px solid var(--color-text-secondary);
  border-bottom: 2px solid var(--color-text-secondary);
  transform: rotate(45deg);
  transition: transform var(--transition-fast);
}

.language-switcher__chevron--open {
  margin-bottom: -0.2rem;
  transform: rotate(225deg);
}

.language-switcher__menu {
  position: absolute;
  top: calc(100% + 0.65rem);
  right: 0;
  z-index: 50;
  display: grid;
  gap: 0.25rem;
  width: 13rem;
  padding: 0.45rem;
  background: var(--color-surface-raised);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-md);
}

.language-switcher__menu::before {
  position: absolute;
  top: -0.375rem;
  right: 1.25rem;
  width: 0.75rem;
  height: 0.75rem;
  content: '';
  background: var(--color-surface-raised);
  border-top: 1px solid var(--color-border);
  border-left: 1px solid var(--color-border);
  transform: rotate(45deg);
}

.language-switcher__option {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: 2rem minmax(0, 1fr) 1.25rem;
  gap: 0.65rem;
  align-items: center;
  width: 100%;
  padding: 0.6rem;
  color: var(--color-text-secondary);
  font-size: var(--font-size-small);
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  background: transparent;
  border-radius: 0.65rem;
}

.language-switcher__option:hover,
.language-switcher__option:focus-visible {
  color: var(--color-brand-950);
  background: var(--color-surface-canvas);
  outline: none;
}

.language-switcher__option--active {
  color: var(--color-primary-700);
  background: var(--color-primary-100);
}

.language-switcher__option-code {
  width: 2rem;
  height: 2rem;
}

.language-switcher__option-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.language-switcher__option-check {
  color: var(--color-accent-600);
  font-size: 0.9rem;
  font-weight: 900;
  text-align: center;
}

@media (max-width: 35.99rem) {
  .language-switcher__trigger {
    gap: 0.35rem;
    padding-right: 0.6rem;
  }

  .language-switcher__current-name {
    display: none;
  }

  .language-switcher__menu {
    width: 11.5rem;
  }
}
</style>
