/**
 * API Error Response Standardization
 * Provides consistent error response format across all API endpoints
 */

import { NextResponse } from 'next/server'

export interface ApiError {
  message: string
  code: string
  details?: any
  timestamp?: string
  path?: string
}

export class ApiErrorResponse extends Error {
  constructor(
    public statusCode: number,
    public error: ApiError
  ) {
    super(error.message)
    this.name = 'ApiErrorResponse'
  }
}

/**
 * Creates a standardized error response
 */
export function createErrorResponse(
  statusCode: number,
  message: string,
  code: string,
  details?: any,
  path?: string
): NextResponse {
  const error: ApiError = {
    message,
    code,
    details,
    timestamp: new Date().toISOString(),
    path,
  }

  return NextResponse.json({ error }, { status: statusCode })
}

/**
 * Common error responses
 */
export const ErrorResponses = {
  badRequest: (message: string = 'Bad Request', details?: any, path?: string) =>
    createErrorResponse(400, message, 'BAD_REQUEST', details, path),

  unauthorized: (message: string = 'Unauthorized', path?: string) =>
    createErrorResponse(401, message, 'UNAUTHORIZED', undefined, path),

  forbidden: (message: string = 'Forbidden', path?: string) =>
    createErrorResponse(403, message, 'FORBIDDEN', undefined, path),

  notFound: (message: string = 'Not Found', path?: string) =>
    createErrorResponse(404, message, 'NOT_FOUND', undefined, path),

  conflict: (message: string = 'Conflict', details?: any, path?: string) =>
    createErrorResponse(409, message, 'CONFLICT', details, path),

  unprocessableEntity: (message: string = 'Unprocessable Entity', details?: any, path?: string) =>
    createErrorResponse(422, message, 'UNPROCESSABLE_ENTITY', details, path),

  tooManyRequests: (message: string = 'Too Many Requests', retryAfter?: number, path?: string) =>
    createErrorResponse(
      429,
      message,
      'TOO_MANY_REQUESTS',
      retryAfter ? { retryAfter } : undefined,
      path
    ),

  internalServerError: (message: string = 'Internal Server Error', path?: string) =>
    createErrorResponse(500, message, 'INTERNAL_SERVER_ERROR', undefined, path),

  serviceUnavailable: (message: string = 'Service Unavailable', path?: string) =>
    createErrorResponse(503, message, 'SERVICE_UNAVAILABLE', undefined, path),
}

/**
 * Error handler middleware wrapper
 */
export function withErrorHandling(
  handler: (req: Request, ...args: any[]) => Promise<NextResponse>
) {
  return async (req: Request, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(req, ...args)
    } catch (error) {
      // Handle known API errors
      if (error instanceof ApiErrorResponse) {
        return createErrorResponse(
          error.statusCode,
          error.error.message,
          error.error.code,
          error.error.details,
          error.error.path
        )
      }

      // Handle Payload CMS errors
      if (error && typeof error === 'object' && 'data' in error) {
        const payloadError = error as any
        if (payloadError.errors && Array.isArray(payloadError.errors)) {
          return ErrorResponses.unprocessableEntity(
            'Payload validation failed',
            { errors: payloadError.errors },
            new URL(req.url).pathname
          )
        }
      }

      // Handle generic errors
      if (error instanceof Error) {
        console.error('API Error:', error)
        return ErrorResponses.internalServerError(
          process.env.NODE_ENV === 'production' ? 'Internal Server Error' : error.message,
          new URL(req.url).pathname
        )
      }

      // Fallback
      console.error('Unknown error:', error)
      return ErrorResponses.internalServerError('An unexpected error occurred', new URL(req.url).pathname)
    }
  }
}

/**
 * Success response helper
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  meta?: Record<string, any>
): NextResponse {
  const response: any = { data }

  if (meta) {
    response.meta = meta
  }

  return NextResponse.json(response, { status: statusCode })
}

