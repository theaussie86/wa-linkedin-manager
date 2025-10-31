import { describe, it, expect } from 'vitest'
import {
  validateLinkedInPostId,
  linkedinPostIdValidator,
  normalizeLinkedInPostId,
  type LinkedInPostIdValidationResult,
} from '@/utils/linkedin/post-id-validator'

describe('LinkedIn Post ID Validator', () => {
  describe('validateLinkedInPostId', () => {
    it('should reject null or undefined values', () => {
      const nullResult = validateLinkedInPostId(null)
      expect(nullResult.isValid).toBe(false)
      expect(nullResult.errorMessage).toBe('Post ID is required and must be a string')

      const undefinedResult = validateLinkedInPostId(undefined)
      expect(undefinedResult.isValid).toBe(false)
    })

    it('should reject empty strings', () => {
      const result = validateLinkedInPostId('')
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toBe('Post ID cannot be empty')
    })

    it('should reject non-numeric strings', () => {
      const invalidIds = ['abc123', '123abc', 'post-123', '123-456-789', '123.456']

      invalidIds.forEach((id) => {
        const result = validateLinkedInPostId(id)
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toContain('numeric digits')
      })
    })

    it('should reject post IDs shorter than 10 digits', () => {
      const shortIds = ['123', '12345', '123456789'] // Less than 10 digits

      shortIds.forEach((id) => {
        const result = validateLinkedInPostId(id)
        expect(result.isValid).toBe(false)
        expect(result.errorMessage).toContain('at least 10 digits')
      })
    })

    it('should reject post IDs longer than 20 digits', () => {
      const longId = '123456789012345678901' // 21 digits

      const result = validateLinkedInPostId(longId)
      expect(result.isValid).toBe(false)
      expect(result.errorMessage).toContain('at most 20 digits')
    })

    it('should accept valid post IDs', () => {
      const validIds = [
        '1234567890', // 10 digits (minimum)
        '12345678901234567890', // 20 digits (maximum)
        '98765432109876543210', // Valid 20-digit ID
        '1234567890123456', // Valid 16-digit ID
      ]

      validIds.forEach((id) => {
        const result = validateLinkedInPostId(id)
        expect(result.isValid).toBe(true)
        expect(result.errorMessage).toBeUndefined()
      })
    })

    it('should trim whitespace', () => {
      const result = validateLinkedInPostId('  1234567890  ')
      expect(result.isValid).toBe(true)
    })
  })

  describe('linkedinPostIdValidator', () => {
    it('should return true for empty values (optional field)', () => {
      expect(linkedinPostIdValidator(null)).toBe(true)
      expect(linkedinPostIdValidator(undefined)).toBe(true)
      expect(linkedinPostIdValidator('')).toBe(true)
      expect(linkedinPostIdValidator('   ')).toBe(true)
    })

    it('should return true for valid post IDs', () => {
      expect(linkedinPostIdValidator('1234567890')).toBe(true)
      expect(linkedinPostIdValidator('12345678901234567890')).toBe(true)
    })

    it('should return error message for invalid post IDs', () => {
      const result1 = linkedinPostIdValidator('12345') // Too short
      expect(typeof result1).toBe('string')
      expect(result1).toContain('at least 10 digits')

      const result2 = linkedinPostIdValidator('abc123') // Not numeric
      expect(typeof result2).toBe('string')
      expect(result2).toContain('numeric digits')
    })
  })

  describe('normalizeLinkedInPostId', () => {
    it('should return null for null or undefined', () => {
      expect(normalizeLinkedInPostId(null)).toBeNull()
      expect(normalizeLinkedInPostId(undefined)).toBeNull()
    })

    it('should return null for invalid post IDs', () => {
      expect(normalizeLinkedInPostId('12345')).toBeNull() // Too short
      expect(normalizeLinkedInPostId('abc123')).toBeNull() // Not numeric
      expect(normalizeLinkedInPostId('')).toBeNull() // Empty
    })

    it('should return trimmed valid post ID', () => {
      expect(normalizeLinkedInPostId('  1234567890  ')).toBe('1234567890')
      expect(normalizeLinkedInPostId('1234567890123456')).toBe('1234567890123456')
    })
  })
})

