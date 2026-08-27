import { createI18n } from 'vue-i18n'

import englishMessages from './en.json'
import turkishMessages from './tr.json'

const supportedApplicationLocales = ['tr', 'en'] as const
export type SupportedApplicationLocale =
  (typeof supportedApplicationLocales)[number]

const APPLICATION_LOCALE_STORAGE_KEY = 'izimza-locale'
const DEFAULT_APPLICATION_LOCALE: SupportedApplicationLocale = 'tr'

const isSupportedApplicationLocale = (
  localeValue: string | null,
): localeValue is SupportedApplicationLocale =>
  supportedApplicationLocales.includes(
    localeValue as SupportedApplicationLocale,
  )

const getInitialApplicationLocale = (): SupportedApplicationLocale => {
  const savedApplicationLocale = window.localStorage.getItem(
    APPLICATION_LOCALE_STORAGE_KEY,
  )

  if (isSupportedApplicationLocale(savedApplicationLocale)) {
    return savedApplicationLocale
  }

  return navigator.language.toLocaleLowerCase().startsWith('en')
    ? 'en'
    : DEFAULT_APPLICATION_LOCALE
}

const initialApplicationLocale = getInitialApplicationLocale()

export const i18n = createI18n({
  fallbackLocale: DEFAULT_APPLICATION_LOCALE,
  legacy: false,
  locale: initialApplicationLocale,
  messages: {
    en: englishMessages,
    tr: turkishMessages,
  },
})

document.documentElement.lang = initialApplicationLocale

const getApplicationLocale = () =>
  i18n.global.locale.value as SupportedApplicationLocale

export const getApplicationLocaleCode = () =>
  getApplicationLocale() === 'en' ? 'en-US' : 'tr-TR'

export const setApplicationLocale = (
  applicationLocale: SupportedApplicationLocale,
) => {
  i18n.global.locale.value = applicationLocale
  document.documentElement.lang = applicationLocale
  window.localStorage.setItem(
    APPLICATION_LOCALE_STORAGE_KEY,
    applicationLocale,
  )
}

export const translate = (
  messageKey: string,
  messageParameters?: Record<string, string | number>,
) =>
  messageParameters
    ? i18n.global.t(messageKey, messageParameters)
    : i18n.global.t(messageKey)
