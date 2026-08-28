import { environmentConfig } from './env'

const normalizeAuth0Domain = (auth0Domain: string) => auth0Domain.replace(/^https?:\/\//, '').replace(/\/+$/, '')

const isPlaceholderEnvironmentValue = (environmentValue: string) => /^(your[-_]|<|change[-_]?me)/i.test(environmentValue)

const normalizedAuth0Domain = normalizeAuth0Domain(environmentConfig.auth0Domain)

export const isAuth0Configured = Boolean(
  normalizedAuth0Domain &&
  environmentConfig.auth0ClientId &&
  !isPlaceholderEnvironmentValue(normalizedAuth0Domain) &&
  !isPlaceholderEnvironmentValue(environmentConfig.auth0ClientId)
)

export const isAuth0PasswordResetConfigured = Boolean(
  isAuth0Configured &&
  environmentConfig.auth0DatabaseConnection &&
  !isPlaceholderEnvironmentValue(environmentConfig.auth0DatabaseConnection)
)

export const auth0Config = {
  audience: environmentConfig.auth0Audience,
  callbackUri: `${window.location.origin}/auth/callback`,
  clientId: environmentConfig.auth0ClientId,
  databaseConnection: environmentConfig.auth0DatabaseConnection,
  domain: normalizedAuth0Domain,
  logoutUri: window.location.origin,
} as const
