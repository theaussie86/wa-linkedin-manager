/**
 * API Request Validation Middleware
 * Validates incoming API requests based on OpenAPI specification
 */

import { NextRequest, NextResponse } from 'next/server'

export interface ValidationError {
  field: string
  message: string
  code: string
}

export interface ValidationResult {
  valid: boolean
  errors?: ValidationError[]
}

/**
 * Validates request body against schema
 */
export function validateRequestBody(
  body: any,
  schema: {
    required?: string[]
    properties?: Record<string, { type: string; enum?: string[]; format?: string }>
  }
): ValidationResult {
  const errors: ValidationError[] = []

  // Check required fields
  if (schema.required) {
    for (const field of schema.required) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        errors.push({
          field,
          message: `Field '${field}' is required`,
          code: 'REQUIRED_FIELD_MISSING',
        })
      }
    }
  }

  // Validate field types and formats
  if (schema.properties) {
    for (const [field, rules] of Object.entries(schema.properties)) {
      if (body[field] !== undefined && body[field] !== null) {
        // Type validation
        if (rules.type === 'string' && typeof body[field] !== 'string') {
          errors.push({
            field,
            message: `Field '${field}' must be a string`,
            code: 'INVALID_TYPE',
          })
        } else if (rules.type === 'integer' && !Number.isInteger(body[field])) {
          errors.push({
            field,
            message: `Field '${field}' must be an integer`,
            code: 'INVALID_TYPE',
          })
        } else if (rules.type === 'boolean' && typeof body[field] !== 'boolean') {
          errors.push({
            field,
            message: `Field '${field}' must be a boolean`,
            code: 'INVALID_TYPE',
          })
        }

        // Enum validation
        if (rules.enum && !rules.enum.includes(body[field])) {
          errors.push({
            field,
            message: `Field '${field}' must be one of: ${rules.enum.join(', ')}`,
            code: 'INVALID_ENUM_VALUE',
          })
        }

        // Format validation
        if (rules.format === 'uri' || rules.format === 'url') {
          try {
            new URL(body[field])
          } catch {
            errors.push({
              field,
              message: `Field '${field}' must be a valid URL`,
              code: 'INVALID_FORMAT',
            })
          }
        } else if (rules.format === 'date-time') {
          const date = new Date(body[field])
          if (isNaN(date.getTime())) {
            errors.push({
              field,
              message: `Field '${field}' must be a valid date-time`,
              code: 'INVALID_FORMAT',
            })
          }
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Validates query parameters
 */
export function validateQueryParams(
  searchParams: URLSearchParams,
  schema: {
    properties?: Record<
      string,
      {
        type: string
        enum?: string[]
        format?: string
        default?: any
      }
    >
  }
): ValidationResult {
  const errors: ValidationError[] = []

  if (schema.properties) {
    for (const [param, rules] of Object.entries(schema.properties)) {
      const value = searchParams.get(param)

      if (value !== null) {
        // Type validation
        if (rules.type === 'integer') {
          const num = parseInt(value, 10)
          if (isNaN(num)) {
            errors.push({
              field: param,
              message: `Query parameter '${param}' must be an integer`,
              code: 'INVALID_TYPE',
            })
          }
        } else if (rules.type === 'boolean') {
          if (value !== 'true' && value !== 'false') {
            errors.push({
              field: param,
              message: `Query parameter '${param}' must be a boolean`,
              code: 'INVALID_TYPE',
            })
          }
        }

        // Enum validation
        if (rules.enum && !rules.enum.includes(value)) {
          errors.push({
            field: param,
            message: `Query parameter '${param}' must be one of: ${rules.enum.join(', ')}`,
            code: 'INVALID_ENUM_VALUE',
          })
        }
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined,
  }
}

/**
 * Middleware wrapper for request validation
 */
export function withValidation(
  handler: (req: NextRequest, ...args: any[]) => Promise<NextResponse>,
  options?: {
    bodySchema?: {
      required?: string[]
      properties?: Record<string, { type: string; enum?: string[]; format?: string }>
    }
    querySchema?: {
      properties?: Record<
        string,
        {
          type: string
          enum?: string[]
          format?: string
          default?: any
        }
      >
    }
  }
) {
  return async (req: NextRequest, ...args: any[]): Promise<NextResponse> => {
    // Validate request body if provided
    if (options?.bodySchema && (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH')) {
      try {
        const body = await req.json()
        const validation = validateRequestBody(body, options.bodySchema)

        if (!validation.valid) {
          return NextResponse.json(
            {
              error: {
                message: 'Validation failed',
                code: 'VALIDATION_ERROR',
                details: validation.errors,
              },
            },
            { status: 400 }
          )
        }

        // Attach validated body to request
        ;(req as any).validatedBody = body
      } catch (error) {
        return NextResponse.json(
          {
            error: {
              message: 'Invalid JSON in request body',
              code: 'INVALID_JSON',
            },
          },
          { status: 400 }
        )
      }
    }

    // Validate query parameters if provided
    if (options?.querySchema) {
      const searchParams = new URL(req.url).searchParams
      const validation = validateQueryParams(searchParams, options.querySchema)

      if (!validation.valid) {
        return NextResponse.json(
          {
            error: {
              message: 'Query parameter validation failed',
              code: 'VALIDATION_ERROR',
              details: validation.errors,
            },
          },
          { status: 400 }
        )
      }
    }

    return handler(req, ...args)
  }
}

