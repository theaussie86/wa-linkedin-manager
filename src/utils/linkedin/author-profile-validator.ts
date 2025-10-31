/**
 * LinkedIn Author Profile Validation
 * 
 * Validates LinkedIn author profile URLs for ReferencePost authorProfile field.
 * Validates format: linkedin.com/in/*
 * 
 * @module author-profile-validator
 */

import { validateLinkedInProfileUrl, validateLinkedInUrl } from './url-validator'

/**
 * Interface for LinkedIn Author Profile validation result
 */
export interface LinkedInAuthorProfileValidationResult {
  isValid: boolean
  errorMessage?: string
}

/**
 * Validates a LinkedIn author profile URL
 * 
 * Author profiles must match the format: linkedin.com/in/*
 * This is used specifically for the ReferencePost.authorProfile field.
 * 
 * @param profileUrl - The profile URL to validate
 * @returns Validation result
 * 
 * @example
 * ```typescript
 * const result = validateLinkedInAuthorProfile('https://www.linkedin.com/in/username')
 * // Returns: { isValid: true }
 * ```
 */
export function validateLinkedInAuthorProfile(profileUrl: string | null | undefined): LinkedInAuthorProfileValidationResult {
  // Handle null, undefined, or empty strings (optional field)
  if (!profileUrl || typeof profileUrl !== 'string') {
    return {
      isValid: true, // Optional field - empty is valid
    }
  }

  // Trim whitespace
  const trimmedUrl = profileUrl.trim()

  // Empty string after trimming is valid (optional field)
  if (trimmedUrl === '') {
    return {
      isValid: true,
    }
  }

  // Use the LinkedIn URL validator to check profile format
  const urlValidation = validateLinkedInUrl(trimmedUrl)

  if (!urlValidation.isValid) {
    return {
      isValid: false,
      errorMessage: urlValidation.errorMessage || 'Invalid LinkedIn profile URL format',
    }
  }

  // Check specifically for profile type
  if (urlValidation.urlType !== 'profile') {
    return {
      isValid: false,
      errorMessage: 'Author profile must be a LinkedIn profile URL (linkedin.com/in/*), not a company or post URL',
    }
  }

  return {
    isValid: true,
  }
}

/**
 * Payload CMS field validator for LinkedIn Author Profile URLs
 * Can be used as a validate function in Payload CMS field definitions
 * 
 * @param value - The value to validate
 * @returns true if valid, error message string if invalid
 * 
 * @example
 * ```typescript
 * {
 *   name: 'authorProfile',
 *   type: 'text',
 *   validate: linkedinAuthorProfileValidator,
 * }
 * ```
 */
export function linkedinAuthorProfileValidator(value: string | null | undefined): true | string {
  const result = validateLinkedInAuthorProfile(value)
  if (result.isValid) {
    return true
  }
  return result.errorMessage || 'Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)'
}

/**
 * Normalizes a LinkedIn author profile URL by trimming whitespace
 * 
 * @param profileUrl - The profile URL to normalize
 * @returns Normalized profile URL or null if invalid
 * 
 * @example
 * ```typescript
 * const normalized = normalizeLinkedInAuthorProfile('  https://www.linkedin.com/in/username  ')
 * // Returns: 'https://www.linkedin.com/in/username'
 * ```
 */
export function normalizeLinkedInAuthorProfile(profileUrl: string | null | undefined): string | null {
  if (!profileUrl || typeof profileUrl !== 'string') {
    return null
  }

  const trimmed = profileUrl.trim()
  
  // Empty string is valid (optional field)
  if (trimmed === '') {
    return null
  }

  const result = validateLinkedInAuthorProfile(trimmed)
  if (result.isValid) {
    return trimmed
  }

  return null
}

