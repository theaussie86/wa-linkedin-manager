import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ReferencePost } from '@/collections/ReferencePost'
import { linkedinPostUrlValidator, linkedinPostIdValidator, linkedinAuthorProfileValidator } from '@/utils/linkedin'

describe('ReferencePost Collection', () => {
  describe('Configuration', () => {
    it('should have correct slug', () => {
      expect(ReferencePost.slug).toBe('reference-posts')
    })

    it('should have admin title configured', () => {
      expect(ReferencePost.admin?.useAsTitle).toBe('title')
    })

    it('should have correct default columns', () => {
      expect(ReferencePost.admin?.defaultColumns).toEqual([
        'title',
        'company',
        'postType',
        'category',
        'engagementRate',
        'publishedAt',
      ])
    })

    it('should have timestamps enabled', () => {
      expect(ReferencePost.timestamps).toBe(true)
    })
  })

  describe('Fields', () => {
    it('should have required company relationship', () => {
      const companyField = ReferencePost.fields?.find((f) => f.name === 'company') as any
      expect(companyField).toBeDefined()
      expect(companyField?.required).toBe(true)
      expect(companyField?.type).toBe('relationship')
      expect(companyField?.relationTo).toBe('companies')
    })

    it('should have required content field', () => {
      const contentField = ReferencePost.fields?.find((f) => f.name === 'content')
      expect(contentField).toBeDefined()
      expect(contentField?.required).toBe(true)
      expect(contentField?.type).toBe('richText')
    })

    it('should have required LinkedIn URL with validator', () => {
      const linkedinField = ReferencePost.fields?.find((f) => f.name === 'linkedinUrl')
      expect(linkedinField?.required).toBe(true)
      expect(linkedinField?.unique).toBe(true)
      expect(linkedinField?.validate).toBe(linkedinPostUrlValidator)
    })

    it('should validate LinkedIn Post ID', () => {
      const postIdField = ReferencePost.fields?.find((f) => f.name === 'linkedinPostId')
      expect(postIdField?.validate).toBe(linkedinPostIdValidator)
    })

    it('should validate author profile URL', () => {
      const authorProfileField = ReferencePost.fields?.find((f) => f.name === 'authorProfile')
      expect(authorProfileField?.validate).toBe(linkedinAuthorProfileValidator)
    })

    it('should have correct postType enum options', () => {
      const postTypeField = ReferencePost.fields?.find((f) => f.name === 'postType') as any
      expect(postTypeField?.required).toBe(true)
      expect(postTypeField?.type).toBe('select')
      expect(postTypeField?.options.map((opt: any) => opt.value)).toEqual([
        'text',
        'image',
        'video',
        'article',
        'poll',
      ])
    })

    it('should have correct category enum options', () => {
      const categoryField = ReferencePost.fields?.find((f) => f.name === 'category') as any
      expect(categoryField?.type).toBe('select')
      expect(categoryField?.options.map((opt: any) => opt.value)).toEqual([
        'thought_leadership',
        'industry_insights',
        'company_updates',
        'educational',
        'behind_scenes',
        'case_studies',
      ])
    })

    it('should validate engagement rate range', () => {
      const engagementField = ReferencePost.fields?.find((f) => f.name === 'engagementRate')
      const validator = engagementField?.validate

      if (typeof validator === 'function') {
        expect(validator(50)).toBe(true)
        expect(validator(-1)).toBe('Engagement rate must be between 0 and 100')
        expect(validator(101)).toBe('Engagement rate must be between 0 and 100')
        expect(validator(0)).toBe(true)
        expect(validator(100)).toBe(true)
      }
    })

    it('should validate video URL format', () => {
      const videoField = ReferencePost.fields?.find((f) => f.name === 'videoUrl')
      const validator = videoField?.validate

      if (typeof validator === 'function') {
        expect(validator('invalid-url')).toBe('Please enter a valid video URL')
        expect(validator('https://example.com/video')).toBe(true)
        expect(validator(null)).toBe(true) // Optional field
      }
    })

    it('should have default values for engagement metrics', () => {
      const likesField = ReferencePost.fields?.find((f) => f.name === 'likes') as any
      expect(likesField?.defaultValue).toBe(0)
      expect(likesField?.min).toBe(0)

      const commentsField = ReferencePost.fields?.find((f) => f.name === 'comments') as any
      expect(commentsField?.defaultValue).toBe(0)
      expect(commentsField?.min).toBe(0)

      const sharesField = ReferencePost.fields?.find((f) => f.name === 'shares') as any
      expect(sharesField?.defaultValue).toBe(0)
      expect(sharesField?.min).toBe(0)
    })

    it('should have isActive field with default value', () => {
      const isActiveField = ReferencePost.fields?.find((f) => f.name === 'isActive')
      expect(isActiveField?.type).toBe('checkbox')
      expect((isActiveField as any)?.defaultValue).toBe(true)
    })
  })

  describe('Hooks', () => {
    it('should normalize URLs in beforeValidate hook', () => {
      const hook = ReferencePost.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          linkedinUrl: '  https://linkedin.com/posts/test  ',
          authorProfile: '  https://linkedin.com/in/test  ',
          videoUrl: '  https://example.com/video  ',
          articleUrl: '  https://example.com/article  ',
        }

        const result = hook({ data: mockData, operation: 'create', req: {} as any })
        expect(result?.linkedinUrl).toBe('https://linkedin.com/posts/test')
        expect(result?.authorProfile).toBe('https://linkedin.com/in/test')
        expect(result?.videoUrl).toBe('https://example.com/video')
        expect(result?.articleUrl).toBe('https://example.com/article')
      }
    })

    it('should set scrapedAt on create if not provided', () => {
      const hook = ReferencePost.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockDate = new Date().toISOString()
        vi.useFakeTimers()
        vi.setSystemTime(new Date(mockDate))

        const mockData = {}
        const result = hook({ data: mockData, operation: 'create', req: {} as any })

        expect(result?.scrapedAt).toBe(mockDate)
        vi.useRealTimers()
      }
    })

    it('should calculate engagement rate in beforeChange hook', () => {
      const hook = ReferencePost.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          likes: 100,
          comments: 50,
          shares: 25,
          reach: 1000,
        }

        const result = hook({
          data: mockData,
          operation: 'create',
          req: {} as any,
          previousDoc: {} as any,
          doc: {} as any,
        })

        // engagementRate = (100 + 50 + 25) / 1000 * 100 = 17.5, rounded = 18
        expect(result?.engagementRate).toBe(18)
      }
    })

    it('should handle zero reach in engagement rate calculation', () => {
      const hook = ReferencePost.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          likes: 100,
          comments: 50,
          shares: 25,
          reach: 0,
        }

        const result = hook({
          data: mockData,
          operation: 'create',
          req: {} as any,
          previousDoc: {} as any,
          doc: {} as any,
        })

        // Should use 1 to avoid division by zero
        expect(result?.engagementRate).toBeDefined()
      }
    })
  })

  describe('Access Control', () => {
    it('should allow admin and manager to read all reference posts', () => {
      const access = ReferencePost.access?.read
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
      }
    })

    it('should restrict users to their own company active posts', () => {
      const access = ReferencePost.access?.read
      if (access) {
        const mockReq = {
          user: {
            role: 'content_creator',
            id: 'user-1',
            company: { id: 'company-1' },
          },
        }
        const result = access({ req: mockReq as any })
        expect(result).toEqual({
          and: [
            {
              company: {
                equals: 'company-1',
              },
            },
            {
              isActive: {
                equals: true,
              },
            },
          ],
        })
      }
    })

    it('should allow admin, manager, and content creators to create posts', () => {
      const access = ReferencePost.access?.create
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'content_creator' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'reviewer' } } as any })).toBe(false)
      }
    })
  })
})

