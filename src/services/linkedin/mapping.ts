/**
 * LinkedIn Data Mapping Utilities
 * 
 * Helper functions for transforming LinkedIn API responses into internal data formats.
 * Normalizes LinkedIn API data and validates it before mapping to Payload CMS collections.
 * 
 * @module linkedin-mapping
 */

import type {
  LinkedInCompanyApiData,
  LinkedInPostApiData,
  NormalizedCompanyData,
  NormalizedReferencePostData,
  NormalizedGeneratedPostData,
} from '../../utils/linkedin'
import {
  validateLinkedInUrl,
  validateLinkedInPostId,
  normalizeLinkedInPostId,
  validateLinkedInAuthorProfile,
} from '../../utils/linkedin'

/**
 * Collection types for mapping targets
 */
export type TargetCollection = 'companies' | 'reference-posts' | 'generated-posts'

/**
 * Error class for LinkedIn data validation errors
 */
export class LinkedInDataValidationError extends Error {
  constructor(message: string, public readonly field?: string) {
    super(message)
    this.name = 'LinkedInDataValidationError'
  }
}

/**
 * Validates LinkedIn API data before mapping
 * 
 * @param data - The LinkedIn API data to validate
 * @param targetCollection - The target collection for validation rules
 * @throws LinkedInDataValidationError if validation fails
 * 
 * @example
 * ```typescript
 * try {
 *   validateLinkedInData(apiResponse, 'companies')
 * } catch (error) {
 *   console.error('Validation failed:', error.message)
 * }
 * ```
 */
export function validateLinkedInData(
  data: LinkedInCompanyApiData | LinkedInPostApiData,
  targetCollection: TargetCollection,
): void {
  if (!data || typeof data !== 'object') {
    throw new LinkedInDataValidationError('Data must be a valid object', 'data')
  }

  switch (targetCollection) {
    case 'companies':
      const companyData = data as LinkedInCompanyApiData
      if (companyData.linkedinUrl) {
        const urlValidation = validateLinkedInUrl(companyData.linkedinUrl)
        if (!urlValidation.isValid) {
          throw new LinkedInDataValidationError(
            urlValidation.errorMessage || 'Invalid LinkedIn URL',
            'linkedinUrl',
          )
        }
      }
      if (companyData.linkedinPageUrl) {
        const pageUrlValidation = validateLinkedInUrl(companyData.linkedinPageUrl)
        if (!pageUrlValidation.isValid || pageUrlValidation.urlType !== 'company') {
          throw new LinkedInDataValidationError(
            'LinkedIn Page URL must be a valid company URL',
            'linkedinPageUrl',
          )
        }
      }
      break

    case 'reference-posts':
      const postData = data as LinkedInPostApiData
      if (postData.linkedinUrl) {
        const urlValidation = validateLinkedInUrl(postData.linkedinUrl)
        if (!urlValidation.isValid || urlValidation.urlType !== 'post') {
          throw new LinkedInDataValidationError(
            'LinkedIn URL must be a valid post URL',
            'linkedinUrl',
          )
        }
      }
      if (postData.linkedinPostId) {
        const postIdValidation = validateLinkedInPostId(postData.linkedinPostId)
        if (!postIdValidation.isValid) {
          throw new LinkedInDataValidationError(
            postIdValidation.errorMessage || 'Invalid LinkedIn Post ID',
            'linkedinPostId',
          )
        }
      }
      if (postData.authorProfile) {
        const authorValidation = validateLinkedInAuthorProfile(postData.authorProfile)
        if (!authorValidation.isValid) {
          throw new LinkedInDataValidationError(
            authorValidation.errorMessage || 'Invalid LinkedIn author profile URL',
            'authorProfile',
          )
        }
      }
      break

    case 'generated-posts':
      const generatedData = data as LinkedInPostApiData
      if (generatedData.linkedinPostId) {
        const postIdValidation = validateLinkedInPostId(generatedData.linkedinPostId)
        if (!postIdValidation.isValid) {
          throw new LinkedInDataValidationError(
            postIdValidation.errorMessage || 'Invalid LinkedIn Post ID',
            'linkedinPostId',
          )
        }
      }
      if (generatedData.linkedinUrl) {
        const urlValidation = validateLinkedInUrl(generatedData.linkedinUrl)
        if (!urlValidation.isValid || urlValidation.urlType !== 'post') {
          throw new LinkedInDataValidationError(
            'LinkedIn Publication URL must be a valid post URL',
            'linkedinPublicationUrl',
          )
        }
      }
      break

    default:
      throw new LinkedInDataValidationError(
        `Unknown target collection: ${targetCollection}`,
        'targetCollection',
      )
  }
}

/**
 * Normalizes LinkedIn Company API data to internal format
 * 
 * @param apiData - The LinkedIn Company API response data
 * @returns Normalized company data ready for Payload CMS
 * @throws LinkedInDataValidationError if validation fails
 * 
 * @example
 * ```typescript
 * const normalized = normalizeLinkedInCompanyData({
 *   name: 'Example Corp',
 *   linkedinUrl: 'https://www.linkedin.com/company/example',
 *   linkedinFollowerCount: 1000,
 * })
 * ```
 */
export function normalizeLinkedInCompanyData(
  apiData: LinkedInCompanyApiData,
): NormalizedCompanyData {
  // Validate data before normalization
  validateLinkedInData(apiData, 'companies')

  const normalized: NormalizedCompanyData = {
    name: apiData.name || '',
  }

  // Optional fields
  if (apiData.website) {
    normalized.website = apiData.website.trim()
  }

  if (apiData.linkedinUrl) {
    normalized.linkedinUrl = apiData.linkedinUrl.trim()
  }

  if (apiData.linkedinCompanyId) {
    normalized.linkedinCompanyId = apiData.linkedinCompanyId.trim()
  }

  if (apiData.linkedinFollowerCount !== undefined && apiData.linkedinFollowerCount !== null) {
    normalized.linkedinFollowerCount = Number(apiData.linkedinFollowerCount)
  }

  if (apiData.linkedinPageUrl) {
    normalized.linkedinPageUrl = apiData.linkedinPageUrl.trim()
  }

  if (apiData.industry) {
    normalized.industry = apiData.industry.trim()
  }

  if (apiData.size) {
    const validSizes: NormalizedCompanyData['size'][] = ['startup', 'small', 'medium', 'large', 'enterprise']
    if (validSizes.includes(apiData.size as NormalizedCompanyData['size'])) {
      normalized.size = apiData.size as NormalizedCompanyData['size']
    }
  }

  if (apiData.description) {
    normalized.description = apiData.description.trim()
  }

  return normalized
}

/**
 * Normalizes LinkedIn Post API data to internal ReferencePost format
 * 
 * @param apiData - The LinkedIn Post API response data
 * @returns Normalized reference post data ready for Payload CMS
 * @throws LinkedInDataValidationError if validation fails
 * 
 * @example
 * ```typescript
 * const normalized = normalizeLinkedInPostData({
 *   linkedinUrl: 'https://www.linkedin.com/posts/example-1234567890',
 *   linkedinPostId: '1234567890',
 *   content: 'Post content',
 *   postType: 'text',
 *   publishedAt: '2024-01-01T00:00:00Z',
 * })
 * ```
 */
export function normalizeLinkedInPostData(
  apiData: LinkedInPostApiData,
): NormalizedReferencePostData {
  // Validate data before normalization
  validateLinkedInData(apiData, 'reference-posts')

  // Required fields
  if (!apiData.linkedinUrl) {
    throw new LinkedInDataValidationError('LinkedIn URL is required for reference posts', 'linkedinUrl')
  }

  if (!apiData.content) {
    throw new LinkedInDataValidationError('Content is required for reference posts', 'content')
  }

  if (!apiData.postType) {
    throw new LinkedInDataValidationError('Post type is required for reference posts', 'postType')
  }

  if (!apiData.publishedAt) {
    throw new LinkedInDataValidationError('Published date is required for reference posts', 'publishedAt')
  }

  const normalized: NormalizedReferencePostData = {
    linkedinUrl: apiData.linkedinUrl.trim(),
    content: apiData.content.trim(),
    postType: apiData.postType as NormalizedReferencePostData['postType'],
    publishedAt: apiData.publishedAt,
  }

  // Optional fields
  if (apiData.id || apiData.title) {
    normalized.title = (apiData.id || apiData.title || '').trim()
  }

  if (apiData.author) {
    normalized.author = apiData.author.trim()
  }

  if (apiData.authorProfile) {
    normalized.authorProfile = apiData.authorProfile.trim()
  }

  // Normalize and validate Post ID if present
  if (apiData.linkedinPostId) {
    const normalizedPostId = normalizeLinkedInPostId(apiData.linkedinPostId)
    if (normalizedPostId) {
      normalized.linkedinPostId = normalizedPostId
    }
  }

  if (apiData.authorId) {
    normalized.linkedinAuthorId = apiData.authorId.trim()
  }

  if (apiData.companyPageId) {
    normalized.linkedinCompanyPageId = apiData.companyPageId.trim()
  }

  if (apiData.category) {
    normalized.category = apiData.category.trim()
  }

  // Numeric fields
  if (apiData.likes !== undefined && apiData.likes !== null) {
    normalized.likes = Number(apiData.likes)
  }

  if (apiData.comments !== undefined && apiData.comments !== null) {
    normalized.comments = Number(apiData.comments)
  }

  if (apiData.shares !== undefined && apiData.shares !== null) {
    normalized.shares = Number(apiData.shares)
  }

  if (apiData.reach !== undefined && apiData.reach !== null) {
    normalized.reach = Number(apiData.reach)
  }

  if (apiData.impressions !== undefined && apiData.impressions !== null) {
    normalized.impressions = Number(apiData.impressions)
  }

  return normalized
}

/**
 * Converts LinkedIn API data to internal Payload CMS collection format
 * 
 * @param apiData - The LinkedIn API response data
 * @param targetCollection - The target Payload CMS collection
 * @returns Normalized data in the target collection format
 * @throws LinkedInDataValidationError if validation fails
 * 
 * @example
 * ```typescript
 * const companyData = convertToInternalFormat(apiResponse, 'companies')
 * // Returns: NormalizedCompanyData ready for Payload CMS
 * ```
 */
export function convertToInternalFormat(
  apiData: LinkedInCompanyApiData | LinkedInPostApiData,
  targetCollection: TargetCollection,
): NormalizedCompanyData | NormalizedReferencePostData | NormalizedGeneratedPostData {
  switch (targetCollection) {
    case 'companies':
      return normalizeLinkedInCompanyData(apiData as LinkedInCompanyApiData)

    case 'reference-posts':
      return normalizeLinkedInPostData(apiData as LinkedInPostApiData)

    case 'generated-posts':
      // For generated posts, we use a simpler normalization
      // as they are typically created internally, not from API
      const postData = apiData as LinkedInPostApiData
      const normalized: NormalizedGeneratedPostData = {
        title: postData.id || 'Untitled Post',
        content: postData.content || '',
      }

      if (postData.linkedinPostId) {
        const normalizedPostId = normalizeLinkedInPostId(postData.linkedinPostId)
        if (normalizedPostId) {
          normalized.linkedinPostId = normalizedPostId
        }
      }

      if (postData.linkedinUrl) {
        normalized.linkedinPublicationUrl = postData.linkedinUrl.trim()
      }

      if (postData.publishedAt) {
        normalized.linkedinPublicationDate = postData.publishedAt
      }

      if (postData.id && postData.status) {
        normalized.status = postData.status as NormalizedGeneratedPostData['status']
      }

      return normalized

    default:
      throw new LinkedInDataValidationError(
        `Unsupported target collection: ${targetCollection}`,
        'targetCollection',
      )
  }
}

