import { describe, it, expect, vi } from 'vitest'
import { GeneratedPost } from '@/collections/GeneratedPost'
import { linkedinPostIdValidator, linkedinPostUrlValidator } from '@/utils/linkedin'

describe('GeneratedPost Collection', () => {
  describe('Configuration', () => {
    it('should have correct slug', () => {
      expect(GeneratedPost.slug).toBe('generated-posts')
    })

    it('should have admin title configured', () => {
      expect(GeneratedPost.admin?.useAsTitle).toBe('title')
    })

    it('should have correct default columns', () => {
      expect(GeneratedPost.admin?.defaultColumns).toEqual([
        'title',
        'company',
        'writingStyle',
        'status',
        'scheduledFor',
        'publishedAt',
      ])
    })

    it('should have timestamps enabled', () => {
      expect(GeneratedPost.timestamps).toBe(true)
    })
  })

  describe('Fields', () => {
    it('should have required company relationship', () => {
      const companyField = GeneratedPost.fields?.find((f) => f.name === 'company') as any
      expect(companyField).toBeDefined()
      expect(companyField?.required).toBe(true)
      expect(companyField?.type).toBe('relationship')
      expect(companyField?.relationTo).toBe('companies')
    })

    it('should have required title and content fields', () => {
      const titleField = GeneratedPost.fields?.find((f) => f.name === 'title')
      expect(titleField?.required).toBe(true)
      expect(titleField?.type).toBe('text')

      const contentField = GeneratedPost.fields?.find((f) => f.name === 'content')
      expect(contentField?.required).toBe(true)
      expect(contentField?.type).toBe('richText')
    })

    it('should have correct writingStyle enum options', () => {
      const styleField = GeneratedPost.fields?.find((f) => f.name === 'writingStyle') as any
      expect(styleField?.required).toBe(true)
      expect(styleField?.type).toBe('select')
      expect(styleField?.options.map((opt: any) => opt.value)).toEqual([
        'story_based',
        'insight_focused',
        'engagement_focused',
      ])
    })

    it('should have correct status enum options with default', () => {
      const statusField = GeneratedPost.fields?.find((f) => f.name === 'status') as any
      expect(statusField?.type).toBe('select')
      expect(statusField?.defaultValue).toBe('draft')
      expect(statusField?.options.map((opt: any) => opt.value)).toEqual([
        'draft',
        'review',
        'approved',
        'scheduled',
        'published',
        'rejected',
      ])
    })

    it('should validate LinkedIn Post ID', () => {
      const postIdField = GeneratedPost.fields?.find((f) => f.name === 'linkedinPostId')
      expect(postIdField?.validate).toBe(linkedinPostIdValidator)
    })

    it('should validate LinkedIn publication URL', () => {
      const urlField = GeneratedPost.fields?.find((f) => f.name === 'linkedinPublicationUrl')
      expect(urlField?.validate).toBe(linkedinPostUrlValidator)
    })
  })

  describe('Hooks', () => {
    it('should normalize title and set default status in beforeValidate', () => {
      const hook = GeneratedPost.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          title: '  Test Post  ',
        }

        const result = hook({ data: mockData, operation: 'create', req: {} as any })
        expect(result?.title).toBe('Test Post')
        expect(result?.status).toBe('draft')
      }
    })

    it('should validate status transitions', () => {
      const hook = GeneratedPost.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        // Valid transition: draft -> review
        const validData = {
          status: 'review',
        }
        const validDoc = { status: 'draft' }

        expect(() =>
          hook({
            data: validData,
            operation: 'update',
            req: { user: { id: 'user-1' } } as any,
            previousDoc: validDoc as any,
            doc: validDoc as any,
          }),
        ).not.toThrow()

        // Invalid transition: published -> draft
        const invalidData = {
          status: 'draft',
        }
        const invalidDoc = { status: 'published' }

        expect(() =>
          hook({
            data: invalidData,
            operation: 'update',
            req: { user: { id: 'user-1' } } as any,
            previousDoc: invalidDoc as any,
            doc: invalidDoc as any,
          }),
        ).toThrow('Invalid status transition')
      }
    })

    it('should set reviewedBy and reviewedAt when status changes to approved/rejected', () => {
      const hook = GeneratedPost.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockDate = new Date().toISOString()
        vi.useFakeTimers()
        vi.setSystemTime(new Date(mockDate))

        const mockData = {
          status: 'approved',
        }
        const mockDoc = { status: 'review' }
        const mockReq = {
          user: { id: 'reviewer-1' },
        }

        const result = hook({
          data: mockData,
          operation: 'update',
          req: mockReq as any,
          previousDoc: mockDoc as any,
          doc: mockDoc as any,
        })

        expect(result?.reviewedBy).toBe('reviewer-1')
        expect(result?.reviewedAt).toBe(mockDate)
        vi.useRealTimers()
      }
    })

    it('should set publishedAt when status changes to published', () => {
      const hook = GeneratedPost.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockDate = new Date().toISOString()
        vi.useFakeTimers()
        vi.setSystemTime(new Date(mockDate))

        const mockData = {
          status: 'published',
        }
        const mockDoc = { status: 'scheduled' }

        const result = hook({
          data: mockData,
          operation: 'update',
          req: {} as any,
          previousDoc: mockDoc as any,
          doc: mockDoc as any,
        })

        expect(result?.publishedAt).toBe(mockDate)
        expect(result?.linkedinPublicationDate).toBe(mockDate)
        vi.useRealTimers()
      }
    })

    it('should validate scheduled date is in future', () => {
      const hook = GeneratedPost.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const pastDate = new Date(Date.now() - 86400000).toISOString() // Yesterday
        const mockData = {
          status: 'scheduled',
          scheduledFor: pastDate,
        }
        const mockDoc = { status: 'approved' }

        expect(() =>
          hook({
            data: mockData,
            operation: 'update',
            req: {} as any,
            previousDoc: mockDoc as any,
            doc: mockDoc as any,
          }),
        ).toThrow('Scheduled date must be in the future')
      }
    })

    it('should set generatedAt when AI model is provided on create', () => {
      const hook = GeneratedPost.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockDate = new Date().toISOString()
        vi.useFakeTimers()
        vi.setSystemTime(new Date(mockDate))

        const mockData = {
          aiModel: 'gpt-4',
        }

        const result = hook({
          data: mockData,
          operation: 'create',
          req: {} as any,
          previousDoc: {} as any,
          doc: {} as any,
        })

        expect(result?.generatedAt).toBe(mockDate)
        vi.useRealTimers()
      }
    })
  })

  describe('Access Control', () => {
    it('should allow admin and manager to read all posts', () => {
      const access = GeneratedPost.access?.read
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
      }
    })

    it('should hide drafts from non-admin users', () => {
      const access = GeneratedPost.access?.read
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
              status: {
                not_equals: 'draft',
              },
            },
          ],
        })
      }
    })

    it('should allow content creators to update only their own drafts', () => {
      const access = GeneratedPost.access?.update
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
              status: {
                equals: 'draft',
              },
            },
          ],
        })
      }
    })

    it('should allow reviewers to update posts', () => {
      const access = GeneratedPost.access?.update
      if (access) {
        expect(access({ req: { user: { role: 'reviewer' } } as any })).toBe(true)
      }
    })
  })
})

