import { describe, it, expect, vi } from 'vitest'
import { Campaign } from '@/collections/Campaign'

describe('Campaign Collection', () => {
  describe('Configuration', () => {
    it('should have correct slug', () => {
      expect(Campaign.slug).toBe('campaigns')
    })

    it('should have admin title configured', () => {
      expect(Campaign.admin?.useAsTitle).toBe('name')
    })

    it('should have correct default columns', () => {
      expect(Campaign.admin?.defaultColumns).toEqual([
        'name',
        'company',
        'status',
        'startDate',
        'endDate',
        'createdBy',
      ])
    })

    it('should have timestamps enabled', () => {
      expect(Campaign.timestamps).toBe(true)
    })
  })

  describe('Fields', () => {
    it('should have required company relationship', () => {
      const companyField = Campaign.fields?.find((f) => f.name === 'company') as any
      expect(companyField).toBeDefined()
      expect(companyField?.required).toBe(true)
      expect(companyField?.type).toBe('relationship')
      expect(companyField?.relationTo).toBe('companies')
    })

    it('should have required name field with validation', () => {
      const nameField = Campaign.fields?.find((f) => f.name === 'name')
      expect(nameField?.required).toBe(true)
      expect(nameField?.type).toBe('text')

      const validator = nameField?.validate
      if (typeof validator === 'function') {
        expect(validator('A')).toBe('Campaign name must be at least 2 characters long')
        expect(validator('AB')).toBe(true)
        expect(validator('Valid Campaign Name')).toBe(true)
      }
    })

    it('should have required startDate field and optional endDate field', () => {
      const startDateField = Campaign.fields?.find((f) => f.name === 'startDate')
      expect(startDateField?.required).toBe(true)
      expect(startDateField?.type).toBe('date')

      const endDateField = Campaign.fields?.find((f) => f.name === 'endDate')
      expect(endDateField?.required).toBeUndefined() // endDate is optional
      expect(endDateField?.type).toBe('date')
    })

    it('should validate endDate is after startDate when provided', () => {
      const endDateField = Campaign.fields?.find((f) => f.name === 'endDate')
      const validator = endDateField?.validate

      if (typeof validator === 'function') {
        const startDate = '2024-01-01'
        const endDateBefore = '2023-12-31'
        const endDateAfter = '2024-01-02'

        // Should allow undefined/null endDate (optional field)
        expect(
          validator(undefined, {
            siblingData: { startDate },
            data: { startDate },
          } as any),
        ).toBe(true)

        expect(
          validator(null, {
            siblingData: { startDate },
            data: { startDate },
          } as any),
        ).toBe(true)

        // Should reject endDate before startDate
        expect(
          validator(endDateBefore, {
            siblingData: { startDate },
            data: { startDate },
          } as any),
        ).toBe('End date must be after start date')

        // Should accept endDate after startDate
        expect(
          validator(endDateAfter, {
            siblingData: { startDate },
            data: { startDate },
          } as any),
        ).toBe(true)
      }
    })

    it('should have correct status enum options with default', () => {
      const statusField = Campaign.fields?.find((f) => f.name === 'status') as any
      expect(statusField?.type).toBe('select')
      expect(statusField?.defaultValue).toBe('draft')
      expect(statusField?.options.map((opt: any) => opt.value)).toEqual([
        'draft',
        'active',
        'paused',
        'completed',
        'cancelled',
      ])
    })

    it('should have relationships to generated posts and reference posts', () => {
      const generatedPostsField = Campaign.fields?.find((f) => f.name === 'generatedPosts') as any
      expect(generatedPostsField?.type).toBe('relationship')
      expect(generatedPostsField?.relationTo).toBe('generated-posts')
      expect(generatedPostsField?.hasMany).toBe(true)

      const referencePostsField = Campaign.fields?.find((f) => f.name === 'referencePosts') as any
      expect(referencePostsField?.type).toBe('relationship')
      expect(referencePostsField?.relationTo).toBe('reference-posts')
      expect(referencePostsField?.hasMany).toBe(true)
    })

    it('should validate budget is non-negative', () => {
      const budgetField = Campaign.fields?.find((f) => f.name === 'budget') as any
      expect(budgetField?.type).toBe('number')
      expect(budgetField?.min).toBe(0)
    })

    it('should have isActive field with default value', () => {
      const isActiveField = Campaign.fields?.find((f) => f.name === 'isActive')
      expect(isActiveField?.type).toBe('checkbox')
      expect((isActiveField as any)?.defaultValue).toBe(true)
    })
  })

  describe('Hooks', () => {
    it('should normalize name and set defaults in beforeValidate', () => {
      const hook = Campaign.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          name: '  Test Campaign  ',
        }

        const result = hook({ data: mockData, operation: 'create', req: {} as any })
        expect(result?.name).toBe('Test Campaign')
        expect(result?.status).toBe('draft')
        expect(result?.isActive).toBe(true)
      }
    })

    it('should validate date range in beforeChange hook', () => {
      const hook = Campaign.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const startDate = '2024-01-01'
        const endDate = '2023-12-31' // Before start date

        // Should throw error when endDate is before startDate
        expect(() =>
          hook({
            data: { startDate, endDate },
            operation: 'create',
            req: {} as any,
            previousDoc: {} as any,
            doc: {} as any,
          }),
        ).toThrow('End date must be after start date')

        // Should not throw error when endDate is missing (optional field)
        expect(() =>
          hook({
            data: { startDate },
            operation: 'create',
            req: {} as any,
            previousDoc: {} as any,
            doc: {} as any,
          }),
        ).not.toThrow()
      }
    })

    it('should validate budget is non-negative', () => {
      const hook = Campaign.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        expect(() =>
          hook({
            data: { budget: -100 },
            operation: 'create',
            req: {} as any,
            previousDoc: {} as any,
            doc: {} as any,
          }),
        ).toThrow('Budget cannot be negative')
      }
    })

    it('should auto-set createdBy on create', () => {
      const hook = Campaign.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockReq = {
          user: { id: 'user-1' },
        }

        const mockData = {}
        const result = hook({
          data: mockData,
          operation: 'create',
          req: mockReq as any,
          previousDoc: {} as any,
          doc: {} as any,
        })

        expect(result?.createdBy).toBe('user-1')
      }
    })
  })

  describe('Access Control', () => {
    it('should allow admin and manager to read all campaigns', () => {
      const access = Campaign.access?.read
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
      }
    })

    it('should restrict users to their own company campaigns', () => {
      const access = Campaign.access?.read
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
          company: {
            equals: 'company-1',
          },
        })
      }
    })

    it('should allow admin, manager, and content creators to create campaigns', () => {
      const access = Campaign.access?.create
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'content_creator' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'reviewer' } } as any })).toBe(false)
      }
    })

    it('should allow only admin to delete campaigns', () => {
      const access = Campaign.access?.delete
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(false)
      }
    })
  })
})
