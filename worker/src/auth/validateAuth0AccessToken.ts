import { createRemoteJWKSet, jwtVerify } from 'jose'

import { WorkerApiError } from '../http/apiResponse'
import type { AuthenticatedUser } from '../types'

const auth0KeySets = new Map<
  string,
  ReturnType<typeof createRemoteJWKSet>
>()

const normalizeAuth0Domain = (auth0Domain: string) =>
  auth0Domain.trim().replace(/^https?:\/\//, '').replace(/\/+$/, '')

const getRequiredEnvironmentValue = (
  environmentValue: string,
  environmentVariableName: string,
) => {
  const trimmedEnvironmentValue = environmentValue.trim()

  if (!trimmedEnvironmentValue) {
    throw new WorkerApiError(
      500,
      'AUTH_CONFIGURATION_ERROR',
      `${environmentVariableName} yapılandırılmamış.`,
    )
  }

  return trimmedEnvironmentValue
}

const getAuth0KeySet = (auth0IssuerUrl: string) => {
  const existingAuth0KeySet = auth0KeySets.get(auth0IssuerUrl)

  if (existingAuth0KeySet) {
    return existingAuth0KeySet
  }

  const auth0KeySet = createRemoteJWKSet(
    new URL('.well-known/jwks.json', auth0IssuerUrl),
  )
  auth0KeySets.set(auth0IssuerUrl, auth0KeySet)

  return auth0KeySet
}

const extractBearerAccessToken = (request: Request) => {
  const authorizationHeader = request.headers.get('Authorization')?.trim() ?? ''
  const bearerTokenMatch = authorizationHeader.match(/^Bearer\s+(.+)$/i)

  if (!bearerTokenMatch?.[1]) {
    throw new WorkerApiError(
      401,
      'AUTHENTICATION_REQUIRED',
      'Bu işlem için geçerli bir oturum gerekiyor.',
    )
  }

  return bearerTokenMatch[1]
}

const getOptionalTokenClaim = (tokenClaim: unknown) =>
  typeof tokenClaim === 'string' ? tokenClaim.trim() : ''

export const validateAuth0AccessToken = async (
  request: Request,
  environment: Env,
): Promise<AuthenticatedUser> => {
  const normalizedAuth0Domain = normalizeAuth0Domain(
    getRequiredEnvironmentValue(environment.AUTH0_DOMAIN, 'AUTH0_DOMAIN'),
  )
  const auth0Audience = getRequiredEnvironmentValue(
    environment.AUTH0_AUDIENCE,
    'AUTH0_AUDIENCE',
  )
  const auth0IssuerUrl = `https://${normalizedAuth0Domain}/`
  const accessToken = extractBearerAccessToken(request)

  try {
    const { payload: accessTokenPayload } = await jwtVerify(
      accessToken,
      getAuth0KeySet(auth0IssuerUrl),
      {
        algorithms: ['RS256'],
        audience: auth0Audience,
        issuer: auth0IssuerUrl,
      },
    )

    if (!accessTokenPayload.sub) {
      throw new Error('Auth0 access token sub claim içermiyor.')
    }

    return {
      emailAddress: getOptionalTokenClaim(accessTokenPayload.email),
      firstName: getOptionalTokenClaim(accessTokenPayload.given_name),
      lastName: getOptionalTokenClaim(accessTokenPayload.family_name),
      userId: accessTokenPayload.sub,
    }
  } catch (tokenValidationError) {
    console.warn('Auth0 access token doğrulanamadı.', tokenValidationError)

    throw new WorkerApiError(
      401,
      'INVALID_ACCESS_TOKEN',
      'Oturumunuz doğrulanamadı. Lütfen yeniden giriş yapın.',
    )
  }
}
