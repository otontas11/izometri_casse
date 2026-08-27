import { validateAuth0AccessToken } from './auth/validateAuth0AccessToken'
import { ensureAuthenticatedUserProfile } from './data/applicationData'
import {
  assertRequestOriginIsAllowed,
  createCorsHeaders,
  createEmptyResponse,
  createErrorResponse,
  createJsonResponse,
} from './http/apiResponse'
import { routeAuthenticatedRequest } from './routes/applicationRoutes'

export default {
  async fetch(request: Request, environment: Env): Promise<Response> {
    const corsHeaders = createCorsHeaders(request, environment)

    try {
      assertRequestOriginIsAllowed(request, environment)

      if (request.method === 'OPTIONS') {
        return createEmptyResponse(204, corsHeaders)
      }

      const requestUrl = new URL(request.url)

      if (request.method === 'GET' && requestUrl.pathname === '/health') {
        return createJsonResponse(
          { service: 'izimza-case-api', status: 'healthy' },
          200,
          corsHeaders,
        )
      }

      const authenticatedUser = await validateAuth0AccessToken(
        request,
        environment,
      )
      await ensureAuthenticatedUserProfile(
        environment.DATABASE,
        authenticatedUser,
      )

      return await routeAuthenticatedRequest(
        request,
        environment,
        authenticatedUser,
        corsHeaders,
      )
    } catch (requestError) {
      return createErrorResponse(requestError, corsHeaders)
    }
  },
} satisfies ExportedHandler<Env>
