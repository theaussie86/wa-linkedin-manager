import { describe, it, expect } from 'vitest'
import {
  validateLinkedInData,
  normalizeLinkedInCompanyData,
  normalizeLinkedInPostData,
  convertToInternalFormat,
  LinkedInDataValidationError,
  type TargetCollection,
} from '@/services/linkedin/mapping'
import type {
  LinkedInCompanyApiData,
  LinkedInPostApiData,
} from '@/utils/linkedin'

describe('LinkedIn Mapping Service', () => {
  describe('validateLinkedInData', () => {
    it('should throw error for null or undefined data', () => {
      expect(() => validateLinkedInData(null as any, 'companies')).toThrow(
        LinkedInDataValidationError,
      )
      expect(() => validateLinkedInData(undefined as any, 'companies')).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should validate company linkedinUrl', () => {
      const validData: LinkedInCompanyApiData = {
        name: 'Test Company',
        linkedinUrl: 'https://www.linkedin.com/company/test',
      }
      expect(() => validateLinkedInData(validData, 'companies')).not.toThrow()

      const invalidData: LinkedInCompanyApiData = {
        name: 'Test Company',
        linkedinUrl: 'invalid-url',
      }
      expect(() => validateLinkedInData(invalidData, 'companies')).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should validate company linkedinPageUrl as company type', () => {
      const validData: LinkedInCompanyApiData = {
        name: 'Test Company',
        linkedinPageUrl: 'https://www.linkedin.com/company/test',
      }
      expect(() => validateLinkedInData(validData, 'companies')).not.toThrow()

      const invalidData: LinkedInCompanyApiData = {
        name: 'Test Company',
        linkedinPageUrl: 'https://www.linkedin.com/in/test',
      }
      expect(() => validateLinkedInData(invalidData, 'companies')).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should validate reference post linkedinUrl as post type', () => {
      const validData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test-activity-1234567890',
        content: 'Post content',
        postType: 'text',
        publishedAt: '2024-01-01',
      }
      expect(() => validateLinkedInData(validData, 'reference-posts')).not.toThrow()

      const invalidData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/company/test',
        content: 'Post content',
        postType: 'text',
        publishedAt: '2024-01-01',
      }
      expect(() => validateLinkedInData(invalidData, 'reference-posts')).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should validate post ID format', () => {
      const validData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        linkedinPostId: '1234567890',
        content: 'Post content',
        postType: 'text',
        publishedAt: '2024-01-01',
      }
      expect(() => validateLinkedInData(validData, 'reference-posts')).not.toThrow()

      const invalidData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        linkedinPostId: 'abc123',
        content: 'Post content',
        postType: 'text',
        publishedAt: '2024-01-01',
      }
      expect(() => validateLinkedInData(invalidData, 'reference-posts')).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should validate author profile URL', () => {
      const validData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        authorProfile: 'https://www.linkedin.com/in/author',
        content: 'Post content',
        postType: 'text',
        publishedAt: '2024-01-01',
      }
      expect(() => validateLinkedInData(validData, 'reference-posts')).not.toThrow()

      const invalidData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        authorProfile: 'https://www.linkedin.com/company/test',
        content: 'Post content',
        postType: 'text',
        publishedAt: '2024-01-01',
      }
      expect(() => validateLinkedInData(invalidData, 'reference-posts')).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should throw error for unknown target collection', () => {
      const data = { name: 'Test' }
      expect(() =>
        validateLinkedInData(data as any, 'unknown' as TargetCollection),
      ).toThrow(LinkedInDataValidationError)
    })
  })

  describe('normalizeLinkedInCompanyData', () => {
    it('should normalize valid company data', () => {
      const apiData: LinkedInCompanyApiData = {
        name: '  Test Company  ',
        website: '  https://example.com  ',
        linkedinUrl: '  https://www.linkedin.com/company/test  ',
        linkedinCompanyId: '  123  ',
        linkedinFollowerCount: 1000,
        industry: '  Technology  ',
        size: 'medium',
        description: '  Test description  ',
      }

      const normalized = normalizeLinkedInCompanyData(apiData)

      expect(normalized.name).toBe('Test Company')
      expect(normalized.website).toBe('https://example.com')
      expect(normalized.linkedinUrl).toBe('https://www.linkedin.com/company/test')
      expect(normalized.linkedinCompanyId).toBe('123')
      expect(normalized.linkedinFollowerCount).toBe(1000)
      expect(normalized.industry).toBe('Technology')
      expect(normalized.size).toBe('medium')
      expect(normalized.description).toBe('Test description')
    })

    it('should handle optional fields', () => {
      const apiData: LinkedInCompanyApiData = {
        name: 'Test Company',
      }

      const normalized = normalizeLinkedInCompanyData(apiData)

      expect(normalized.name).toBe('Test Company')
      expect(normalized.website).toBeUndefined()
      expect(normalized.linkedinUrl).toBeUndefined()
    })

    it('should validate size enum', () => {
      const apiData: LinkedInCompanyApiData = {
        name: 'Test Company',
        size: 'medium',
      }

      const normalized = normalizeLinkedInCompanyData(apiData)
      expect(normalized.size).toBe('medium')

      const invalidData: LinkedInCompanyApiData = {
        name: 'Test Company',
        size: 'invalid' as any,
      }

      const normalizedInvalid = normalizeLinkedInCompanyData(invalidData)
      expect(normalizedInvalid.size).toBeUndefined()
    })

    it('should throw error for invalid data', () => {
      const invalidData: LinkedInCompanyApiData = {
        name: 'Test Company',
        linkedinUrl: 'invalid-url',
      }

      expect(() => normalizeLinkedInCompanyData(invalidData)).toThrow(
        LinkedInDataValidationError,
      )
    })
  })

  describe('normalizeLinkedInPostData', () => {
    it('should normalize valid post data', () => {
      const apiData: LinkedInPostApiData = {
        linkedinUrl: '  https://www.linkedin.com/posts/test  ',
        linkedinPostId: '  1234567890  ',
        content: '  Post content  ',
        postType: 'text',
        publishedAt: '2024-01-01',
        title: '  Test Post  ',
        author: '  John Doe  ',
        authorProfile: '  https://www.linkedin.com/in/john  ',
        likes: 100,
        comments: 50,
        shares: 25,
      }

      const normalized = normalizeLinkedInPostData(apiData)

      expect(normalized.linkedinUrl).toBe('https://www.linkedin.com/posts/test')
      expect(normalized.content).toBe('Post content')
      expect(normalized.postType).toBe('text')
      expect(normalized.publishedAt).toBe('2024-01-01')
      expect(normalized.title).toBe('Test Post')
      expect(normalized.author).toBe('John Doe')
      expect(normalized.authorProfile).toBe('https://www.linkedin.com/in/john')
      expect(normalized.linkedinPostId).toBe('1234567890')
      expect(normalized.likes).toBe(100)
      expect(normalized.comments).toBe(50)
      expect(normalized.shares).toBe(25)
    })

    it('should require linkedinUrl', () => {
      const apiData: LinkedInPostApiData = {
        content: 'Post content',
        postType: 'text',
        publishedAt: '2024-01-01',
      }

      expect(() => normalizeLinkedInPostData(apiData)).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should require content', () => {
      const apiData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        postType: 'text',
        publishedAt: '2024-01-01',
      }

      expect(() => normalizeLinkedInPostData(apiData)).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should require postType', () => {
      const apiData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        content: 'Post content',
        publishedAt: '2024-01-01',
      }

      expect(() => normalizeLinkedInPostData(apiData)).toThrow(
        LinkedInDataValidationError,
      )
    })

    it('should require publishedAt', () => {
      const apiData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        content: 'Post content',
        postType: 'text',
      }

      expect(() => normalizeLinkedInPostData(apiData)).toThrow(
        LinkedInDataValidationError,
      )
    })
  })

  describe('convertToInternalFormat', () => {
    it('should convert company data', () => {
      const apiData: LinkedInCompanyApiData = {
        name: 'Test Company',
        linkedinUrl: 'https://www.linkedin.com/company/test',
      }

      const result = convertToInternalFormat(apiData, 'companies')
      expect(result).toHaveProperty('name')
      expect(result).toHaveProperty('linkedinUrl')
    })

    it('should convert reference post data', () => {
      const apiData: LinkedInPostApiData = {
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        content: 'Post content',
        postType: 'text',
        publishedAt: '2024-01-01',
      }

      const result = convertToInternalFormat(apiData, 'reference-posts')
      expect(result).toHaveProperty('linkedinUrl')
      expect(result).toHaveProperty('content')
      expect(result).toHaveProperty('postType')
      expect(result).toHaveProperty('publishedAt')
    })

    it('should convert generated post data', () => {
      const apiData: LinkedInPostApiData = {
        id: 'post-123',
        content: 'Post content',
        linkedinPostId: '1234567890',
        linkedinUrl: 'https://www.linkedin.com/posts/test',
        publishedAt: '2024-01-01',
      }

      const result = convertToInternalFormat(apiData, 'generated-posts')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('content')
    })

    it('should throw error for unsupported collection', () => {
      const apiData = { name: 'Test' }
      expect(() =>
        convertToInternalFormat(apiData as any, 'unsupported' as TargetCollection),
      ).toThrow(LinkedInDataValidationError)
    })
  })
})

