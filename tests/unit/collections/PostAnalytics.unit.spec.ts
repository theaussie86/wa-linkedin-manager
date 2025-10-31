import { describe, it, expect, vi } from 'vitest'
import { PostAnalytics } from '@/collections/PostAnalytics'

describe('PostAnalytics Collection', () => {
  describe('Configuration', () => {
    it('should have correct slug', () => {
      expect(PostAnalytics.slug).toBe('post-analytics')
    })

    it('should have admin title configured', () => {
      expect(PostAnalytics.admin?.useAsTitle).toBe('metricType')
    })

    it('should have correct default columns', () => {
      expect(PostAnalytics.admin?.defaultColumns).toEqual([
        'generatedPost',
        'metricType',
        'value',
        'date',
        'period',
      ])
    })

    it('should have timestamps enabled', () => {
      expect(PostAnalytics.timestamps).toBe(true)
    })
  })

  describe('Fields', () => {
    it('should have required generatedPost relationship', () => {
      const postField = PostAnalytics.fields?.find((f) => f.name === 'generatedPost') as any
      expect(postField).toBeDefined()
      expect(postField?.required).toBe(true)
      expect(postField?.type).toBe('relationship')
      expect(postField?.relationTo).toBe('generated-posts')
    })

    it('should have required metricType field with correct options', () => {
      const metricTypeField = PostAnalytics.fields?.find((f) => f.name === 'metricType') as any
      expect(metricTypeField?.required).toBe(true)
      expect(metricTypeField?.type).toBe('select')
      expect(metricTypeField?.options.map((opt: any) => opt.value)).toEqual([
        'likes',
        'comments',
        'shares',
        'views',
        'clicks',
        'engagement_rate',
        'reach',
        'impressions',
      ])
    })

    it('should have required value field with minimum 0', () => {
      const valueField = PostAnalytics.fields?.find((f) => f.name === 'value') as any
      expect(valueField?.required).toBe(true)
      expect(valueField?.type).toBe('number')
      expect(valueField?.min).toBe(0)
    })

    it('should have required date field', () => {
      const dateField = PostAnalytics.fields?.find((f) => f.name === 'date')
      expect(dateField?.required).toBe(true)
      expect(dateField?.type).toBe('date')
    })

    it('should have period field with default value', () => {
      const periodField = PostAnalytics.fields?.find((f) => f.name === 'period') as any
      expect(periodField?.type).toBe('select')
      expect(periodField?.defaultValue).toBe('daily')
      expect(periodField?.options.map((opt: any) => opt.value)).toEqual([
        'hourly',
        'daily',
        'weekly',
        'monthly',
      ])
    })

    it('should have source field with default value', () => {
      const sourceField = PostAnalytics.fields?.find((f) => f.name === 'source') as any
      expect(sourceField?.type).toBe('select')
      expect(sourceField?.defaultValue).toBe('manual')
      expect(sourceField?.options.map((opt: any) => opt.value)).toEqual(['linkedin', 'manual', 'api'])
    })
  })

  describe('Hooks', () => {
    it('should set default period and source in beforeValidate', () => {
      const hook = PostAnalytics.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {}

        const result = hook({ data: mockData, operation: 'create', req: {} as any })
        expect(result?.period).toBe('daily')
        expect(result?.source).toBe('manual')
      }
    })

    it('should validate engagement rate does not exceed 100', () => {
      const hook = PostAnalytics.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        expect(() =>
          hook({
            data: {
              metricType: 'engagement_rate',
              value: 101,
            },
            operation: 'create',
            req: {} as any,
            previousDoc: {} as any,
            doc: {} as any,
          }),
        ).toThrow('Engagement rate cannot exceed 100%')
      }
    })

    it('should validate value is non-negative', () => {
      const hook = PostAnalytics.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        expect(() =>
          hook({
            data: {
              metricType: 'likes',
              value: -1,
            },
            operation: 'create',
            req: {} as any,
            previousDoc: {} as any,
            doc: {} as any,
          }),
        ).toThrow('Metric value cannot be negative')
      }
    })

    it('should validate date is not in the future', () => {
      const hook = PostAnalytics.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const futureDate = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString() // 2 hours from now

        expect(() =>
          hook({
            data: {
              metricType: 'likes',
              value: 100,
              date: futureDate,
            },
            operation: 'create',
            req: {} as any,
            previousDoc: {} as any,
            doc: {} as any,
          }),
        ).toThrow('Metric date cannot be in the future')
      }
    })

    it('should allow date up to 1 hour in future for timezone differences', () => {
      const hook = PostAnalytics.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const nearFutureDate = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes from now

        expect(() =>
          hook({
            data: {
              metricType: 'likes',
              value: 100,
              date: nearFutureDate,
            },
            operation: 'create',
            req: {} as any,
            previousDoc: {} as any,
            doc: {} as any,
          }),
        ).not.toThrow()
      }
    })
  })

  describe('Access Control', () => {
    it('should allow admin and manager to read all analytics', () => {
      const access = PostAnalytics.access?.read
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
      }
    })

    it('should allow admin, manager, and content creators to create analytics', () => {
      const access = PostAnalytics.access?.create
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'content_creator' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'reviewer' } } as any })).toBe(false)
      }
    })

    it('should allow only admin and manager to update analytics', () => {
      const access = PostAnalytics.access?.update
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'content_creator' } } as any })).toBe(false)
      }
    })

    it('should allow only admin to delete analytics', () => {
      const access = PostAnalytics.access?.delete
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(false)
      }
    })
  })
})

