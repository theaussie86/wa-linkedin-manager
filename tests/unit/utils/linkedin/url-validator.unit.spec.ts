import { describe, it, expect } from 'vitest'
import {
  validateLinkedInUrl,
  validateLinkedInCompanyUrl,
  validateLinkedInProfileUrl,
  validateLinkedInPostUrl,
  linkedinUrlValidator,
  linkedinCompanyUrlValidator,
  linkedinProfileUrlValidator,
  linkedinPostUrlValidator,
  type LinkedInUrlType,
} from '@/utils/linkedin/url-validator'

describe('LinkedIn URL Validator', () => {
  describe('validateLinkedInUrl', () => {
    it('should reject null or undefined values', () => {
      expect(validateLinkedInUrl(null).isValid).toBe(false)
      expect(validateLinkedInUrl(undefined).isValid).toBe(false)
    })

    it('should reject empty strings', () => {
      const result = validateLinkedInUrl('')
      expect(result.isValid).toBe(false)
      expect(result.urlType).toBe('unknown')
      expect(result.errorMessage).toBe('URL cannot be empty')
    })

    it('should reject non-string values', () => {
      const result = validateLinkedInUrl(123 as any)
      expect(result.isValid).toBe(false)
      expect(result.urlType).toBe('unknown')
    })

    it('should validate company URLs', () => {
      const validCompanyUrls = [
        'https://www.linkedin.com/company/example',
        'http://www.linkedin.com/company/example',
        'https://linkedin.com/company/example-company',
        'http://linkedin.com/company/test123',
      ]

      validCompanyUrls.forEach((url) => {
        const result = validateLinkedInUrl(url)
        expect(result.isValid).toBe(true)
        expect(result.urlType).toBe('company')
      })
    })

    it('should validate profile URLs', () => {
      const validProfileUrls = [
        'https://www.linkedin.com/in/username',
        'http://www.linkedin.com/in/john-doe',
        'https://linkedin.com/in/test-user',
        'http://linkedin.com/in/user_123',
      ]

      validProfileUrls.forEach((url) => {
        const result = validateLinkedInUrl(url)
        expect(result.isValid).toBe(true)
        expect(result.urlType).toBe('profile')
      })
    })

    it('should validate post URLs', () => {
      const validPostUrls = [
        'https://www.linkedin.com/posts/username-activity-1234567890',
        'http://www.linkedin.com/posts/user-test-post',
        'https://linkedin.com/posts/test-post-id',
        'http://linkedin.com/posts/activity-123',
      ]

      validPostUrls.forEach((url) => {
        const result = validateLinkedInUrl(url)
        expect(result.isValid).toBe(true)
        expect(result.urlType).toBe('post')
      })
    })

    it('should reject invalid LinkedIn URLs', () => {
      const invalidUrls = [
        'https://example.com',
        'https://linkedin.com',
        'https://www.linkedin.com/invalid',
        'not-a-url',
        'https://twitter.com/username',
      ]

      invalidUrls.forEach((url) => {
        const result = validateLinkedInUrl(url)
        expect(result.isValid).toBe(false)
        expect(result.urlType).toBe('unknown')
        expect(result.errorMessage).toContain('Invalid LinkedIn URL format')
      })
    })

    it('should trim whitespace', () => {
      const result = validateLinkedInUrl('  https://www.linkedin.com/company/example  ')
      expect(result.isValid).toBe(true)
      expect(result.urlType).toBe('company')
    })
  })

  describe('validateLinkedInCompanyUrl', () => {
    it('should return true for valid company URLs', () => {
      expect(validateLinkedInCompanyUrl('https://www.linkedin.com/company/example')).toBe(true)
      expect(validateLinkedInCompanyUrl('http://linkedin.com/company/test')).toBe(true)
    })

    it('should return false for non-company URLs', () => {
      expect(validateLinkedInCompanyUrl('https://www.linkedin.com/in/username')).toBe(false)
      expect(validateLinkedInCompanyUrl('https://www.linkedin.com/posts/test')).toBe(false)
      expect(validateLinkedInCompanyUrl('invalid-url')).toBe(false)
    })

    it('should handle null and undefined', () => {
      expect(validateLinkedInCompanyUrl(null)).toBe(false)
      expect(validateLinkedInCompanyUrl(undefined)).toBe(false)
    })
  })

  describe('validateLinkedInProfileUrl', () => {
    it('should return true for valid profile URLs', () => {
      expect(validateLinkedInProfileUrl('https://www.linkedin.com/in/username')).toBe(true)
      expect(validateLinkedInProfileUrl('http://linkedin.com/in/test-user')).toBe(true)
    })

    it('should return false for non-profile URLs', () => {
      expect(validateLinkedInProfileUrl('https://www.linkedin.com/company/example')).toBe(false)
      expect(validateLinkedInProfileUrl('https://www.linkedin.com/posts/test')).toBe(false)
      expect(validateLinkedInProfileUrl('invalid-url')).toBe(false)
    })

    it('should handle null and undefined', () => {
      expect(validateLinkedInProfileUrl(null)).toBe(false)
      expect(validateLinkedInProfileUrl(undefined)).toBe(false)
    })
  })

  describe('validateLinkedInPostUrl', () => {
    it('should return true for valid post URLs', () => {
      expect(validateLinkedInPostUrl('https://www.linkedin.com/posts/test-activity')).toBe(true)
      expect(validateLinkedInPostUrl('http://linkedin.com/posts/user-post')).toBe(true)
    })

    it('should return false for non-post URLs', () => {
      expect(validateLinkedInPostUrl('https://www.linkedin.com/company/example')).toBe(false)
      expect(validateLinkedInPostUrl('https://www.linkedin.com/in/username')).toBe(false)
      expect(validateLinkedInPostUrl('invalid-url')).toBe(false)
    })

    it('should handle null and undefined', () => {
      expect(validateLinkedInPostUrl(null)).toBe(false)
      expect(validateLinkedInPostUrl(undefined)).toBe(false)
    })
  })

  describe('Payload CMS Validators', () => {
    describe('linkedinUrlValidator', () => {
      it('should return true for valid LinkedIn URLs', () => {
        expect(linkedinUrlValidator('https://www.linkedin.com/company/example')).toBe(true)
        expect(linkedinUrlValidator('https://www.linkedin.com/in/username')).toBe(true)
        expect(linkedinUrlValidator('https://www.linkedin.com/posts/test')).toBe(true)
      })

      it('should return error message for invalid URLs', () => {
        const result = linkedinUrlValidator('invalid-url')
        expect(typeof result).toBe('string')
        expect(result).toContain('Invalid LinkedIn URL format')
      })
    })

    describe('linkedinCompanyUrlValidator', () => {
      it('should return true for empty values (optional field)', () => {
        expect(linkedinCompanyUrlValidator(null)).toBe(true)
        expect(linkedinCompanyUrlValidator(undefined)).toBe(true)
        expect(linkedinCompanyUrlValidator('')).toBe(true)
      })

      it('should return true for valid company URLs', () => {
        expect(linkedinCompanyUrlValidator('https://www.linkedin.com/company/example')).toBe(true)
      })

      it('should return error message for invalid company URLs', () => {
        const result = linkedinCompanyUrlValidator('https://www.linkedin.com/in/username')
        expect(typeof result).toBe('string')
        expect(result).toContain('LinkedIn company URL')
      })
    })

    describe('linkedinProfileUrlValidator', () => {
      it('should return true for empty values (optional field)', () => {
        expect(linkedinProfileUrlValidator(null)).toBe(true)
        expect(linkedinProfileUrlValidator(undefined)).toBe(true)
        expect(linkedinProfileUrlValidator('')).toBe(true)
      })

      it('should return true for valid profile URLs', () => {
        expect(linkedinProfileUrlValidator('https://www.linkedin.com/in/username')).toBe(true)
      })

      it('should return error message for invalid profile URLs', () => {
        const result = linkedinProfileUrlValidator('https://www.linkedin.com/company/example')
        expect(typeof result).toBe('string')
        expect(result).toContain('LinkedIn profile URL')
      })
    })

    describe('linkedinPostUrlValidator', () => {
      it('should return true for empty values (optional field)', () => {
        expect(linkedinPostUrlValidator(null)).toBe(true)
        expect(linkedinPostUrlValidator(undefined)).toBe(true)
        expect(linkedinPostUrlValidator('')).toBe(true)
      })

      it('should return true for valid post URLs', () => {
        expect(linkedinPostUrlValidator('https://www.linkedin.com/posts/test-activity')).toBe(true)
      })

      it('should return error message for invalid post URLs', () => {
        const result = linkedinPostUrlValidator('https://www.linkedin.com/company/example')
        expect(typeof result).toBe('string')
        expect(result).toContain('LinkedIn post URL')
      })
    })
  })
})

