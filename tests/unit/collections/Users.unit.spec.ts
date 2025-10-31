import { describe, it, expect, vi } from 'vitest'
import { Users } from '@/collections/Users'

describe('Users Collection', () => {
  describe('Configuration', () => {
    it('should have correct slug', () => {
      expect(Users.slug).toBe('users')
    })

    it('should have admin title configured', () => {
      expect(Users.admin?.useAsTitle).toBe('email')
    })

    it('should have correct default columns', () => {
      expect(Users.admin?.defaultColumns).toEqual(['email', 'firstName', 'lastName', 'role', 'isActive'])
    })

    it('should have auth configuration', () => {
      expect(Users.auth?.tokenExpiration).toBe(7200) // 2 hours
      expect(Users.auth?.verify).toBe(true)
      expect(Users.auth?.maxLoginAttempts).toBe(5)
      expect(Users.auth?.lockTime).toBe(600 * 1000) // 10 minutes
    })
  })

  describe('Fields', () => {
    it('should have required firstName and lastName fields', () => {
      const firstNameField = Users.fields?.find((f) => f.name === 'firstName') as any
      expect(firstNameField?.required).toBe(true)
      expect(firstNameField?.minLength).toBe(2)
      expect(firstNameField?.maxLength).toBe(50)

      const lastNameField = Users.fields?.find((f) => f.name === 'lastName') as any
      expect(lastNameField?.required).toBe(true)
      expect(lastNameField?.minLength).toBe(2)
      expect(lastNameField?.maxLength).toBe(50)
    })

    it('should have required role field with correct options and default', () => {
      const roleField = Users.fields?.find((f) => f.name === 'role') as any
      expect(roleField?.required).toBe(true)
      expect(roleField?.defaultValue).toBe('content_creator')
      expect(roleField?.options.map((opt: any) => opt.value)).toEqual([
        'admin',
        'manager',
        'content_creator',
        'reviewer',
      ])
    })

    it('should have company relationship', () => {
      const companyField = Users.fields?.find((f) => f.name === 'company') as any
      expect(companyField?.type).toBe('relationship')
      expect(companyField?.relationTo).toBe('companies')
      expect(companyField?.hasMany).toBe(false)
    })

    it('should have isActive field with default value', () => {
      const isActiveField = Users.fields?.find((f) => f.name === 'isActive')
      expect(isActiveField?.type).toBe('checkbox')
      expect((isActiveField as any)?.defaultValue).toBe(true)
    })

    it('should have lastLoginAt field as read-only', () => {
      const lastLoginField = Users.fields?.find((f) => f.name === 'lastLoginAt') as any
      expect(lastLoginField?.type).toBe('date')
      expect(lastLoginField?.admin?.readOnly).toBe(true)
    })
  })

  describe('Hooks', () => {
    it('should normalize and validate email in beforeValidate', () => {
      const hook = Users.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          email: '  TEST@EXAMPLE.COM  ',
        }

        const result = hook({ data: mockData, operation: 'create', req: {} as any })
        expect(result?.email).toBe('test@example.com')
      }
    })

    it('should reject invalid email format', () => {
      const hook = Users.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        expect(() =>
          hook({
            data: {
              email: 'invalid-email',
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('Invalid email format')
      }
    })

    it('should validate password strength', () => {
      const hook = Users.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        // Too short
        expect(() =>
          hook({
            data: {
              email: 'test@example.com',
              password: 'Short1!',
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('Password must be at least 8 characters long')

        // Missing uppercase
        expect(() =>
          hook({
            data: {
              email: 'test@example.com',
              password: 'lowercase1!',
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('Password must contain at least one uppercase letter')

        // Missing lowercase
        expect(() =>
          hook({
            data: {
              email: 'test@example.com',
              password: 'UPPERCASE1!',
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('Password must contain at least one lowercase letter')

        // Missing number
        expect(() =>
          hook({
            data: {
              email: 'test@example.com',
              password: 'NoNumber!',
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('Password must contain at least one number')

        // Missing special character
        expect(() =>
          hook({
            data: {
              email: 'test@example.com',
              password: 'NoSpecial1',
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('Password must contain at least one special character')

        // Valid password
        expect(() =>
          hook({
            data: {
              email: 'test@example.com',
              password: 'ValidPassword1!',
            },
            operation: 'create',
            req: {} as any,
          }),
        ).not.toThrow()
      }
    })
  })

  describe('Access Control', () => {
    it('should allow only admin to create users', () => {
      const access = Users.access?.create
      if (access) {
        expect(access({ req: { user: { role: 'admin' } } as any })).toBe(true)
        expect(access({ req: { user: { role: 'manager' } } as any })).toBe(false)
      }
    })

    it('should allow admin to read all users', () => {
      const access = Users.access?.read
      if (access) {
        const mockReq = {
          user: { role: 'admin', id: 'admin-1' },
        }
        expect(access({ req: mockReq as any, id: 'user-1' })).toBe(true)
      }
    })

    it('should allow users to read their own data', () => {
      const access = Users.access?.read
      if (access) {
        const mockReq = {
          user: { role: 'content_creator', id: 'user-1' },
        }
        expect(access({ req: mockReq as any, id: 'user-1' })).toBe(true)
        expect(access({ req: mockReq as any, id: 'user-2' })).toBe(false)
      }
    })
  })
})

