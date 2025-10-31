import { describe, it, expect } from 'vitest'
import {
  validateLinkedInAuthorProfile,
  linkedinAuthorProfileValidator,
  normalizeLinkedInAuthorProfile,
  type LinkedInAuthorProfileValidationResult,
} from '@/utils/linkedin/author-profile-validator'

describe('LinkedIn Author Profile Validator', () => {
  describe('validateLinkedInAuthorProfile', () => {
    it('should return valid for null or undefined (optional field)', () => {
      expect(validateLinkedInAuthorProfile(null).isValid).toBe(true)
      expect(validateLinkedInAuthorProfile(undefined).isValid).toBe(true)
    })

    it('should return valid for empty strings (optional field)', () => {
      expect(validateLinkedInAuthorProfile('').isValid).toBe(true)
      expect(validateLinkedInAuthorProfile('   ').isValid).toBe(true)
    })

    it('should validate profile URLs', () => {
      const validProfileUrls = [
        'https://www.linkedin.com/in/username',
        'http://www.linkedin.com/in/john-doe',
        'https://linkedin.com/in/test-user',
        'http://linkedin.com/in/user_123',
      ]

      validProfileUrls.forEach((url) => {
        const result = validateLinkedInAuthorProfile(url)
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeUndefined()
      })
    })

    it('should reject company URLs', () => {
      const result = validateLinkedInAuthorProfile('https://www.linkedin.com/company/example')
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toContain('LinkedIn profile URL')
      expect(result.errorMessage).toContain('not a company or post URL')
    })

    it('should reject post URLs', () => {
      const result = validateLinkedInAuthorProfile('https://www.linkedin.com/posts/test')
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toContain('LinkedIn profile URL')
    })

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://example.com',
        'not-a-url',
        'https://linkedin.com/invalid',
      ]

      invalidUrls.forEach((url) => {
        const result = validateLinkedInAuthorProfile(url)
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toBeDefined()
      })
    })

    it('should trim whitespace', () => {
      const result = validateLinkedInAuthorProfile('  https://www.linkedin.com/in/username  ')
      expect(result.isValid).toBe(true)
    })
  })

  describe('linkedinAuthorProfileValidator', () => {
    it('should return true for empty values (optional field)', () => {
      expect(linkedinAuthorProfileValidator(null)).toBe(true)
      expect(linkedinAuthorProfileValidator(undefined)).toBe(true)
      expect(linkedinAuthorProfileValidator('')).toBe(true)
      expect(linkedinAuthorProfileValidator('   ')).toBe(true)
    })

    it('should return true for valid profile URLs', () => {
      expect(linkedinAuthorProfileValidator('https://www.linkedin.com/in/username')).toBe(true)
      expect(linkedinAuthorProfileValidator('http://linkedin.com/in/test-user')).toBe(true)
    })

    it('should return error message for invalid URLs', () => {
      const result1 = linkedinAuthorProfileValidator('https://www.linkedin.com/company/example')
      expect(typeof result1).toBe('string')
      expect(result1).toContain('LinkedIn profile URL')

      const result2 = linkedinAuthorProfileValidator('invalid-url')
      expect(typeof result2).toBe('string')
    })
  })

  describe('normalizeLinkedInAuthorProfile', () => {
    it('should return null for null or undefined', () => {
      expect(normalizeLinkedInAuthorProfile(null)).toBeNull()
      expect(normalizeLinkedInAuthorProfile(undefined)).toBeNull()
    })

    it('should return null for empty strings (optional field)', () => {
      expect(normalizeLinkedInAuthorProfile('')).toBeNull()
      expect(normalizeLinkedInAuthorProfile('   ')).toBeNull()
    })

    it('should return null for invalid URLs', () => {
      expect(normalizeLinkedInAuthorProfile('invalid-url')).toBeNull()
      expect(normalizeLinkedInAuthorProfile('https://www.linkedin.com/company/test')).toBeNull()
    })

    it('should return trimmed valid profile URL', () => {
      expect(normalizeLinkedInAuthorProfile('  https://www.linkedin.com/in/username  ')).toBe(
        'https://www.linkedin.com/in/username',
      )
      expect(normalizeLinkedInAuthorProfile('http://linkedin.com/in/test-user')).toBe(
        'http://linkedin.com/in/test-user',
      )
    })
  })
})

