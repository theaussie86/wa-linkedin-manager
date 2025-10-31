/**
 * LinkedIn Post ID Validation
 * 
 * Validates LinkedIn Post IDs based on clarification:
 * - Post IDs are purely numeric (e.g., "1234567890")
 * - Used for tracking published posts
 * 
 * @module post-id-validator
 */

/**
 * Interface for LinkedIn Post ID validation result
 */
export interface LinkedInPostIdValidationResult {
  isValid: boolean
  errorMessage?: string
}

/**
 * Regex pattern for numeric LinkedIn Post IDs
 * Matches strings containing only digits (0-9)
 */
const POST_ID_PATTERN = /^\d+$/

/**
 * Minimum length for LinkedIn Post IDs (typically 10+ digits)
 */
const MIN_POST_ID_LENGTH = 10

/**
 * Maximum length for LinkedIn Post IDs (reasonable upper bound)
 */
const MAX_POST_ID_LENGTH = 20

/**
 * Validates a LinkedIn Post ID
 * 
 * Post IDs are numeric strings that identify published posts on LinkedIn.
 * Based on clarification, they are purely numeric (e.g., "1234567890").
 * 
 * @param postId - The Post ID to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateLinkedInPostId('1234567890')
 * // Returns: { isValid: true }
 * ```
 */
export function validateLinkedInPostId(postId: string | null | undefined): LinkedInPostIdValidationResult {
  // Handle null, undefined, or empty strings
  if (!postId || typeof postId !== 'string') {
    return {
      isValid: false,
      errorMessage: 'Post ID is required and must be a string',
    }
  }

  // Trim whitespace
  const trimmedPostId = postId.trim()

  // Check if Post ID is empty after trimming
  if (trimmedPostId === '') {
    return {
      isValid: false,
      errorMessage: 'Post ID cannot be empty',
    }
  }

  // Check if Post ID matches numeric pattern
  if (!POST_ID_PATTERN.test(trimmedPostId)) {
    return {
      isValid: false,
      errorMessage: 'Post ID must contain only numeric digits (0-9)',
    }
  }

  // Check minimum length
  if (trimmedPostId.length < MIN_POST_ID_LENGTH) {
    return {
      isValid: false,
      errorMessage: `Post ID must be at least ${MIN_POST_ID_LENGTH} digits long`,
    }
  }

  // Check maximum length
  if (trimmedPostId.length > MAX_POST_ID_LENGTH) {
    return {
      isValid: false,
      errorMessage: `Post ID must be at most ${MAX_POST_ID_LENGTH} digits long`,
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Payload CMS field validator for LinkedIn Post IDs
 * Can be used as a validate function in Payload CMS field definitions
 * 
 * @param value - The value to validate
 * @returns true if valid, error message string if invalid
 * 
 * @example
 * ```typescript
 * {
 *   name: 'linkedinPostId',
 *   type: 'text',
 *   validate: linkedinPostIdValidator,
 * }
 * ```
 */
export function linkedinPostIdValidator(value: string | null | undefined): true | string {
  // Allow empty values for optional fields
  if (!value || value.trim() === '') {
    return true
  }

  const result = validateLinkedInPostId(value)
  if (result.isValid) {
    return true
  }
  return result.errorMessage || 'Invalid LinkedIn Post ID format'
}

/**
 * Normalizes a LinkedIn Post ID by trimming whitespace
 * 
 * @param postId - The Post ID to normalize
 * @returns Normalized Post ID or null if invalid
 * 
 * @example
 * ```typescript
 * const normalized = normalizeLinkedInPostId('  1234567890  ')
 * // Returns: '1234567890'
 * ```
 */
export function normalizeLinkedInPostId(postId: string | null | undefined): string | null {
  if (!postId || typeof postId !== 'string') {
    return null
  }

  const trimmed = postId.trim()
  
  const result = validateLinkedInPostId(trimmed)
  if (result.isValid) {
    return trimmed
  }

  return null
}

