/**
 * LinkedIn Utility Functions
 * 
 * Barrel export for all LinkedIn-related utilities and validators.
 * Provides reusable helper functions, validators, and TypeScript interfaces
 * for LinkedIn data structures.
 * 
 * @module linkedin-utils
 */

// URL Validation
export {
  validateLinkedInUrl,
  validateLinkedInCompanyUrl,
  validateLinkedInProfileUrl,
  validateLinkedInPostUrl,
  linkedinUrlValidator,
  linkedinCompanyUrlValidator,
  linkedinProfileUrlValidator,
  linkedinPostUrlValidator,
  linkedinCompanyOrProfileUrlValidator,
  type LinkedInUrlType,
  type LinkedInUrlValidationResult,
} from './url-validator'

// Post ID Validation
export {
  validateLinkedInPostId,
  linkedinPostIdValidator,
  normalizeLinkedInPostId,
  type LinkedInPostIdValidationResult,
} from './post-id-validator'

// Author Profile Validation
export {
  validateLinkedInAuthorProfile,
  linkedinAuthorProfileValidator,
  normalizeLinkedInAuthorProfile,
  type LinkedInAuthorProfileValidationResult,
} from './author-profile-validator'

/**
 * TypeScript interfaces for LinkedIn data structures
 */

/**
 * LinkedIn Company API Response Structure
 * Used for normalizing LinkedIn Company API data
 */
export interface LinkedInCompanyApiData {
  id?: string
  name?: string
  website?: string
  linkedinUrl?: string
  linkedinCompanyId?: string
  linkedinFollowerCount?: number
  linkedinPageUrl?: string
  industry?: string
  size?: string
  description?: string
}

/**
 * LinkedIn Post API Response Structure
 * Used for normalizing LinkedIn Post API data
 */
export interface LinkedInPostApiData {
  id?: string
  linkedinPostId?: string
  linkedinUrl?: string
  content?: string
  author?: string
  authorProfile?: string
  authorId?: string
  companyId?: string
  companyPageId?: string
  likes?: number
  comments?: number
  shares?: number
  reach?: number
  impressions?: number
  publishedAt?: string | Date
  postType?: string
  category?: string
}

/**
 * Internal format for Company data after normalization
 */
export interface NormalizedCompanyData {
  name: string
  website?: string
  linkedinUrl?: string
  linkedinCompanyId?: string
  linkedinFollowerCount?: number
  linkedinPageUrl?: string
  industry?: string
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  description?: string
}

/**
 * Internal format for ReferencePost data after normalization
 */
export interface NormalizedReferencePostData {
  title?: string
  content: string
  author?: string
  authorProfile?: string
  linkedinUrl: string
  linkedinPostId?: string
  linkedinAuthorId?: string
  linkedinCompanyPageId?: string
  postType: 'text' | 'image' | 'video' | 'article' | 'poll'
  category?: string
  likes?: number
  comments?: number
  shares?: number
  reach?: number
  impressions?: number
  publishedAt: string | Date
}

/**
 * Internal format for GeneratedPost data after normalization
 */
export interface NormalizedGeneratedPostData {
  title: string
  content: string
  linkedinPostId?: string
  linkedinPublicationUrl?: string
  linkedinPublicationDate?: string | Date
  status?: 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'rejected'
}

