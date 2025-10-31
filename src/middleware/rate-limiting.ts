/**
 * API Rate Limiting Middleware
 * Implements token bucket algorithm for rate limiting
 */

import { NextRequest, NextResponse } from 'next/server'

interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Maximum requests per window
  message?: string // Custom error message
}

interface RateLimitStore {
  [key: string]: {
    count: number
    resetAt: number
  }
}

// In-memory store (for production, use Redis or similar)
const rateLimitStore: RateLimitStore = {}

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now()
  for (const key in rateLimitStore) {
    if (rateLimitStore[key].resetAt < now) {
      delete rateLimitStore[key]
    }
  }
}, 5 * 60 * 1000)

/**
 * Get client identifier for rate limiting
 */
function getClientIdentifier(req: NextRequest): string {
  // Try to get API key from header
  const apiKey = req.headers.get('x-api-key')
  if (apiKey) {
    return `api_key:${apiKey}`
  }

  // Fallback to IP address
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'

  return `ip:${ip}`
}

/**
 * Check if request should be rate limited
 */
function checkRateLimit(
  identifier: string,
  config: RateLimitConfig
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now()
  const entry = rateLimitStore[identifier]

  // Initialize or reset if window expired
  if (!entry || entry.resetAt < now) {
    rateLimitStore[identifier] = {
      count: 1,
      resetAt: now + config.windowMs,
    }
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: now + config.windowMs,
    }
  }

  // Check if limit exceeded
  if (entry.count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: entry.resetAt,
    }
  }

  // Increment counter
  entry.count++
  return {
    allowed: true,
    remaining: config.maxRequests - entry.count,
    resetAt: entry.resetAt,
  }
}

/**
 * Rate limiting middleware
 */
export function withRateLimit(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  config: RateLimitConfig
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    const identifier = getClientIdentifier(req)
    const result = checkRateLimit(identifier, config)

    // Add rate limit headers
    const headers = new Headers()
    headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    headers.set('X-RateLimit-Remaining', result.remaining.toString())
    headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString())

    if (!result.allowed) {
      const retryAfter = Math.ceil((result.resetAt - Date.now()) / 1000)
      headers.set('Retry-After', retryAfter.toString())

      return NextResponse.json(
        {
          error: {
            message: config.message || 'Too many requests, please try again later',
            code: 'RATE_LIMIT_EXCEEDED',
            retryAfter,
          },
        },
        { status: 429, headers }
      )
    }

    // Execute handler
    const response = await handler(req, ...args)

    // Add rate limit headers to response
    result.allowed && response.headers.set('X-RateLimit-Limit', config.maxRequests.toString())
    response.headers.set('X-RateLimit-Remaining', result.remaining.toString())
    response.headers.set('X-RateLimit-Reset', new Date(result.resetAt).toISOString())

    return response
  }
}

/**
 * Predefined rate limit configurations
 */
export const RateLimitConfigs = {
  // Strict: 10 requests per minute
  strict: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,
    message: 'Rate limit exceeded. Maximum 10 requests per minute.',
  },

  // Standard: 100 requests per minute
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 100,
    message: 'Rate limit exceeded. Maximum 100 requests per minute.',
  },

  // Generous: 1000 requests per minute
  generous: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 1000,
    message: 'Rate limit exceeded. Maximum 1000 requests per minute.',
  },

  // Per hour limits
  hourlyStrict: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 100,
    message: 'Rate limit exceeded. Maximum 100 requests per hour.',
  },

  hourlyStandard: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxRequests: 1000,
    message: 'Rate limit exceeded. Maximum 1000 requests per hour.',
  },
}

