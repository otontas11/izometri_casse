export class WorkerApiError extends Error {
  readonly errorCode: string
  readonly statusCode: number

  constructor(statusCode: number, errorCode: string, message: string) {
    super(message)
    this.name = 'WorkerApiError'
    this.statusCode = statusCode
    this.errorCode = errorCode
  }
}

const getConfiguredAllowedOrigins = (environment: Env) =>
  environment.ALLOWED_ORIGINS.split(',')
    .map((allowedOrigin) => allowedOrigin.trim())
    .filter(Boolean)

export const assertRequestOriginIsAllowed = (
  request: Request,
  environment: Env,
) => {
  const requestOrigin = request.headers.get('Origin')

  if (
    requestOrigin &&
    !getConfiguredAllowedOrigins(environment).includes(requestOrigin)
  ) {
    throw new WorkerApiError(
      403,
      'ORIGIN_NOT_ALLOWED',
      'Bu kaynaktan API erişimine izin verilmiyor.',
    )
  }
}

export const createCorsHeaders = (request: Request, environment: Env) => {
  const corsHeaders = new Headers({ Vary: 'Origin' })
  const requestOrigin = request.headers.get('Origin')

  if (
    requestOrigin &&
    getConfiguredAllowedOrigins(environment).includes(requestOrigin)
  ) {
    corsHeaders.set('Access-Control-Allow-Origin', requestOrigin)
    corsHeaders.set('Access-Control-Allow-Headers', 'Authorization, Content-Type')
    corsHeaders.set(
      'Access-Control-Allow-Methods',
      'GET, HEAD, PATCH, POST, OPTIONS',
    )
    corsHeaders.set('Access-Control-Max-Age', '86400')
  }

  return corsHeaders
}

export const createJsonResponse = (
  responsePayload: unknown,
  statusCode: number,
  corsHeaders: Headers,
) => {
  const responseHeaders = new Headers(corsHeaders)
  responseHeaders.set('Content-Type', 'application/json; charset=utf-8')
  responseHeaders.set('Cache-Control', 'no-store')

  return new Response(JSON.stringify(responsePayload), {
    status: statusCode,
    headers: responseHeaders,
  })
}

export const createEmptyResponse = (
  statusCode: number,
  corsHeaders: Headers,
) => new Response(null, { status: statusCode, headers: corsHeaders })

export const createErrorResponse = (
  requestError: unknown,
  corsHeaders: Headers,
) => {
  if (requestError instanceof WorkerApiError) {
    return createJsonResponse(
      {
        error: requestError.errorCode,
        message: requestError.message,
      },
      requestError.statusCode,
      corsHeaders,
    )
  }

  console.error('Cloudflare Worker isteği tamamlanamadı.', requestError)

  return createJsonResponse(
    {
      error: 'INTERNAL_SERVER_ERROR',
      message: 'İşlem şu anda tamamlanamıyor. Lütfen tekrar deneyin.',
    },
    500,
    corsHeaders,
  )
}
