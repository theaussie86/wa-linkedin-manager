/**
 * LinkedIn URL Format Validation
 * 
 * Validates LinkedIn URLs for:
 * - Company pages: linkedin.com/company/*
 * - Personal profiles: linkedin.com/in/*
 * - Posts: linkedin.com/posts/*
 * 
 * @module url-validator
 */

/**
 * Type definitions for LinkedIn URL types
 */
export type LinkedInUrlType = 'company' | 'profile' | 'post' | 'unknown'

/**
 * Interface for LinkedIn URL validation result
 */
export interface LinkedInUrlValidationResult {
  isValid: boolean
  urlType: LinkedInUrlType
  errorMessage?: string
}

/**
 * Regex patterns for different LinkedIn URL formats
 */
const LINKEDIN_PATTERNS = {
  company: /^https?:\/\/(www\.)?linkedin\.com\/company\/[^\/\s]+/i,
  profile: /^https?:\/\/(www\.)?linkedin\.com\/in\/[^\/\s]+/i,
  post: /^https?:\/\/(www\.)?linkedin\.com\/posts\/[^\/\s]+/i,
} as const

/**
 * Validates a LinkedIn URL and determines its type
 * 
 * @param url - The URL to validate
 * @returns Validation result with type information
 * 
 * @example
 * ```typescript
 * const result = validateLinkedInUrl('https://www.linkedin.com/company/example')
 * // Returns: { isValid: true, urlType: 'company' }
 * ```
 */
export function validateLinkedInUrl(url: string | null | undefined): LinkedInUrlValidationResult {
  // Handle null, undefined, or empty strings
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      urlType: 'unknown',
      errorMessage: 'URL is required and must be a string',
    }
  }

  // Trim whitespace
  const trimmedUrl = url.trim()

  // Check if URL is empty after trimming
  if (trimmedUrl === '') {
    return {
      isValid: false,
      urlType: 'unknown',
      errorMessage: 'URL cannot be empty',
    }
  }

  // Validate company URL
  if (LINKEDIN_PATTERNS.company.test(trimmedUrl)) {
    return {
      isValid: true,
      urlType: 'company',
    }
  }

  // Validate profile URL
  if (LINKEDIN_PATTERNS.profile.test(trimmedUrl)) {
    return {
      isValid: true,
      urlType: 'profile',
    }
  }

  // Validate post URL
  if (LINKEDIN_PATTERNS.post.test(trimmedUrl)) {
    return {
      isValid: true,
      urlType: 'post',
    }
  }

  // URL doesn't match any LinkedIn pattern
  return {
    isValid: false,
    urlType: 'unknown',
    errorMessage: 'Invalid LinkedIn URL format. Expected formats: linkedin.com/company/*, linkedin.com/in/*, or linkedin.com/posts/*',
  }
}

/**
 * Validates a LinkedIn company URL specifically
 * 
 * @param url - The URL to validate
 * @returns true if valid company URL, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = validateLinkedInCompanyUrl('https://www.linkedin.com/company/example')
 * // Returns: true
 * ```
 */
export function validateLinkedInCompanyUrl(url: string | null | undefined): boolean {
  const result = validateLinkedInUrl(url)
  return result.isValid && result.urlType === 'company'
}

/**
 * Validates a LinkedIn profile URL specifically
 * 
 * @param url - The URL to validate
 * @returns true if valid profile URL, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = validateLinkedInProfileUrl('https://www.linkedin.com/in/username')
 * // Returns: true
 * ```
 */
export function validateLinkedInProfileUrl(url: string | null | undefined): boolean {
  const result = validateLinkedInUrl(url)
  return result.isValid && result.urlType === 'profile'
}

/**
 * Validates a LinkedIn post URL specifically
 * 
 * @param url - The URL to validate
 * @returns true if valid post URL, false otherwise
 * 
 * @example
 * ```typescript
 * const isValid = validateLinkedInPostUrl('https://www.linkedin.com/posts/username-activity-1234567890')
 * // Returns: true
 * ```
 */
export function validateLinkedInPostUrl(url: string | null | undefined): boolean {
  const result = validateLinkedInUrl(url)
  return result.isValid && result.urlType === 'post'
}

/**
 * Payload CMS field validator for LinkedIn URLs
 * Can be used as a validate function in Payload CMS field definitions
 * 
 * @param value - The value to validate
 * @returns true if valid, error message string if invalid
 * 
 * @example
 * ```typescript
 * {
 *   name: 'linkedinUrl',
 *   type: 'text',
 *   validate: linkedinUrlValidator,
 * }
 * ```
 */
export function linkedinUrlValidator(value: string | null | undefined): true | string {
  const result = validateLinkedInUrl(value)
  if (result.isValid) {
    return true
  }
  return result.errorMessage || 'Invalid LinkedIn URL format'
}

/**
 * Payload CMS field validator for LinkedIn company URLs
 * 
 * @param value - The value to validate
 * @returns true if valid, error message string if invalid
 */
export function linkedinCompanyUrlValidator(value: string | null | undefined): true | string {
  if (!value) {
    return true // Optional field
  }
  const isValid = validateLinkedInCompanyUrl(value)
  if (isValid) {
    return true
  }
  return 'Please enter a valid LinkedIn company URL (e.g., https://www.linkedin.com/company/example)'
}

/**
 * Payload CMS field validator for LinkedIn profile URLs
 * 
 * @param value - The value to validate
 * @returns true if valid, error message string if invalid
 */
export function linkedinProfileUrlValidator(value: string | null | undefined): true | string {
  if (!value) {
    return true // Optional field
  }
  const isValid = validateLinkedInProfileUrl(value)
  if (isValid) {
    return true
  }
  return 'Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)'
}

/**
 * Payload CMS field validator for LinkedIn post URLs
 * 
 * @param value - The value to validate
 * @returns true if valid, error message string if invalid
 */
export function linkedinPostUrlValidator(value: string | null | undefined): true | string {
  if (!value) {
    return true // Optional field
  }
  const isValid = validateLinkedInPostUrl(value)
  if (isValid) {
    return true
  }
  return 'Please enter a valid LinkedIn post URL (e.g., https://www.linkedin.com/posts/username-activity-1234567890)'
}

/**
 * Payload CMS field validator for LinkedIn company or profile URLs
 * Accepts both company URLs (/company/...) and profile URLs (/in/...)
 * 
 * @param value - The value to validate
 * @returns true if valid, error message string if invalid
 */
export function linkedinCompanyOrProfileUrlValidator(value: string | null | undefined): true | string {
  if (!value) {
    return true // Optional field
  }
  const result = validateLinkedInUrl(value)
  if (result.isValid && (result.urlType === 'company' || result.urlType === 'profile')) {
    return true
  }
  return 'Please enter a valid LinkedIn company or profile URL (e.g., https://www.linkedin.com/company/example or https://www.linkedin.com/in/username)'
}

