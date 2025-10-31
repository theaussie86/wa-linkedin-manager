import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Company } from '@/collections/Company'
import { linkedinCompanyUrlValidator } from '@/utils/linkedin'

describe('Company Collection', () => {
  describe('Configuration', () => {
    it('should have correct slug', () => {
      expect(Company.slug).toBe('companies')
    })

    it('should have admin title configured', () => {
      expect(Company.admin?.useAsTitle).toBe('name')
    })

    it('should have correct default columns', () => {
      expect(Company.admin?.defaultColumns).toEqual([
        'name',
        'industry',
        'size',
        'researchStatus',
        'isActive',
      ])
    })

    it('should have timestamps enabled', () => {
      expect(Company.timestamps).toBe(true)
    })
  })

  describe('Fields', () => {
    it('should have required name field', () => {
      const nameField = Company.fields?.find((f) => f.name === 'name')
      expect(nameField).toBeDefined()
      expect(nameField?.required).toBe(true)
      expect(nameField?.type).toBe('text')
    })

    it('should validate name field minimum length', () => {
      const nameField = Company.fields?.find((f) => f.name === 'name')
      const validator = nameField?.validate

      if (typeof validator === 'function') {
        expect(validator('A')).toBe('Company name must be at least 2 characters long')
        expect(validator('AB')).toBe(true)
        expect(validator('Valid Company Name')).toBe(true)
      }
    })

    it('should validate website URL format', () => {
      const websiteField = Company.fields?.find((f) => f.name === 'website')
      const validator = websiteField?.validate

      if (typeof validator === 'function') {
        expect(validator('invalid-url')).toBe('Please enter a valid website URL (e.g., https://example.com)')
        expect(validator('https://example.com')).toBe(true)
        expect(validator('http://example.com')).toBe(true)
        expect(validator(null)).toBe(true) // Optional field
      }
    })

    it('should validate LinkedIn URL', () => {
      const linkedinField = Company.fields?.find((f) => f.name === 'linkedinUrl')
      expect(linkedinField?.validate).toBe(linkedinCompanyUrlValidator)
      expect(linkedinField?.unique).toBe(true)
    })

    it('should have correct size enum options', () => {
      const sizeField = Company.fields?.find((f) => f.name === 'size') as any
      expect(sizeField?.type).toBe('select')
      expect(sizeField?.options).toHaveLength(5)
      expect(sizeField?.options.map((opt: any) => opt.value)).toEqual([
        'startup',
        'small',
        'medium',
        'large',
        'enterprise',
      ])
    })

    it('should have correct researchStatus enum options', () => {
      const statusField = Company.fields?.find((f) => f.name === 'researchStatus') as any
      expect(statusField?.type).toBe('select')
      expect(statusField?.options).toHaveLength(4)
      expect(statusField?.defaultValue).toBe('pending')
      expect(statusField?.options.map((opt: any) => opt.value)).toEqual([
        'pending',
        'in_progress',
        'completed',
        'failed',
      ])
    })

    it('should have isActive field with default value', () => {
      const isActiveField = Company.fields?.find((f) => f.name === 'isActive')
      expect(isActiveField?.type).toBe('checkbox')
      expect((isActiveField as any)?.defaultValue).toBe(true)
    })

    it('should have logo relationship to media', () => {
      const logoField = Company.fields?.find((f) => f.name === 'logo') as any
      expect(logoField?.type).toBe('upload')
      expect(logoField?.relationTo).toBe('media')
    })
  })

  describe('Hooks', () => {
    it('should normalize URLs in beforeValidate hook', () => {
      const hook = Company.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          linkedinUrl: '  https://linkedin.com/company/test  ',
          website: '  https://example.com  ',
          name: '  Test Company  ',
        }

        const result = hook({ data: mockData, operation: 'create', req: {} as any })
        expect(result?.linkedinUrl).toBe('https://linkedin.com/company/test')
        expect(result?.website).toBe('https://example.com')
        expect(result?.name).toBe('Test Company')
      }
    })

    it('should update lastResearchAt when researchStatus changes to completed', () => {
      const hook = Company.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          researchStatus: 'completed',
        }
        const mockDate = new Date().toISOString()
        vi.useFakeTimers()
        vi.setSystemTime(new Date(mockDate))

        const result = hook({
          data: mockData,
          operation: 'update',
          req: {} as any,
          previousDoc: {} as any,
          doc: {} as any,
        })

        expect(result?.lastResearchAt).toBe(mockDate)
        vi.useRealTimers()
      }
    })

    it('should set isActive to true by default on create', () => {
      const hook = Company.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {}

        const result = hook({
          data: mockData,
          operation: 'create',
          req: {} as any,
          previousDoc: {} as any,
          doc: {} as any,
        })

        expect(result?.isActive).toBe(true)
      }
    })
  })

  describe('Access Control', () => {
    it('should allow admin to read all companies', () => {
      const access = Company.access?.read
      if (access) {
        const mockReq = {
          user: { role: 'admin', id: 'admin-1' },
        }
        expect(access({ req: mockReq as any })).toBe(true)
      }
    })

    it('should allow manager to read all companies', () => {
      const access = Company.access?.read
      if (access) {
        const mockReq = {
          user: { role: 'manager', id: 'manager-1' },
        }
        expect(access({ req: mockReq as any })).toBe(true)
      }
    })

    it('should restrict non-admin/manager users to their own active company', () => {
      const access = Company.access?.read
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
              id: {
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

    it('should allow admin and manager to create companies', () => {
      const access = Company.access?.create
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'content_creator' } } as any })).toBe(false)
      }
    })

    it('should allow admin to delete companies', () => {
      const access = Company.access?.delete
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(false)
      }
    })
  })
})

