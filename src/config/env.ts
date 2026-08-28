const getTrimmedEnvironmentValue = (environmentValue?: string) => environmentValue?.trim() ?? ''

export const environmentConfig = {
  apiBaseUrl: getTrimmedEnvironmentValue(import.meta.env.VITE_API_BASE_URL) || 'http://localhost:3001',
  auth0Audience: getTrimmedEnvironmentValue(import.meta.env.VITE_AUTH0_AUDIENCE),
  auth0ClientId: getTrimmedEnvironmentValue(import.meta.env.VITE_AUTH0_CLIENT_ID),
  auth0DatabaseConnection: getTrimmedEnvironmentValue(import.meta.env.VITE_AUTH0_DATABASE_CONNECTION) || 'Username-Password-Authentication',
  auth0Domain: getTrimmedEnvironmentValue(import.meta.env.VITE_AUTH0_DOMAIN),
} as const
