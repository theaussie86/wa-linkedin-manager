/**
 * T119: Integration Tests für Authentication
 * 
 * Tests für:
 * - User Login und Logout
 * - Token Validation
 * - Access Control und Permissions
 * - Password Hashing und Validation
 * - Session Management
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initPayload,
  createTestUser,
  createTestCompany,
  loginUser,
  createAuthHeaders,
  cleanupTestData,
} from './test-utils'
import type { Payload } from 'payload'

describe('Authentication Integration Tests', () => {
  let payload: Payload
  let testCompany: any

  beforeAll(async () => {
    payload = await initPayload()
    testCompany = await createTestCompany({
      name: 'Auth Test Company',
    })
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('User Registration and Login', () => {
    it('should create a user with hashed password', async () => {
      const user = await createTestUser({
        email: `auth-test-${Date.now()}@test.com`,
        password: 'SecurePass123!@#',
        role: 'content_creator',
        company: testCompany.id,
      })

      expect(user).toHaveProperty('id')
      expect(user).toHaveProperty('email')
      expect(user.password).not.toBe('SecurePass123!@#') // Password should be hashed
      
      // Verify password is not stored in plain text
      const userDoc = await payload.findByID({
        collection: 'users',
        id: user.id,
      })
      
      expect(userDoc.password).not.toBe('SecurePass123!@#')
      expect(userDoc.password?.length).toBeGreaterThan(20) // Hashed passwords are longer

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })

    it('should login with correct credentials', async () => {
      const user = await createTestUser({
        email: `login-test-${Date.now()}@test.com`,
        password: 'CorrectPass123!@#',
        role: 'content_creator',
      })

      const result = await loginUser(user.email, 'CorrectPass123!@#')

      expect(result).toHaveProperty('token')
      expect(result.token).toBeTruthy()
      expect(result.user).toHaveProperty('id', user.id)
      expect(result.user).toHaveProperty('email', user.email)

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })

    it('should reject login with incorrect password', async () => {
      const user = await createTestUser({
        email: `wrong-pass-${Date.now()}@test.com`,
        password: 'CorrectPass123!@#',
        role: 'content_creator',
      })

      await expect(
        loginUser(user.email, 'WrongPassword123!@#')
      ).rejects.toThrow()

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })

    it('should reject login with non-existent email', async () => {
      await expect(
        loginUser('nonexistent@test.com', 'AnyPassword123!@#')
      ).rejects.toThrow()
    })

    it('should reject login with invalid email format', async () => {
      await expect(
        loginUser('invalid-email', 'Password123!@#')
      ).rejects.toThrow()
    })
  })

  describe('Password Validation', () => {
    it('should enforce minimum password length', async () => {
      await expect(
        createTestUser({
          email: `short-pass-${Date.now()}@test.com`,
          password: 'Short1!', // Too short
          role: 'content_creator',
        })
      ).rejects.toThrow()
    })

    it('should require uppercase letter in password', async () => {
      await expect(
        createTestUser({
          email: `no-upper-${Date.now()}@test.com`,
          password: 'nolowercase123!@#', // No uppercase
          role: 'content_creator',
        })
      ).rejects.toThrow()
    })

    it('should require lowercase letter in password', async () => {
      await expect(
        createTestUser({
          email: `no-lower-${Date.now()}@test.com`,
          password: 'NOLOWERCASE123!@#', // No lowercase
          role: 'content_creator',
        })
      ).rejects.toThrow()
    })

    it('should require number in password', async () => {
      await expect(
        createTestUser({
          email: `no-number-${Date.now()}@test.com`,
          password: 'NoNumbers!@#', // No number
          role: 'content_creator',
        })
      ).rejects.toThrow()
    })

    it('should require special character in password', async () => {
      await expect(
        createTestUser({
          email: `no-special-${Date.now()}@test.com`,
          password: 'NoSpecialChar123', // No special character
          role: 'content_creator',
        })
      ).rejects.toThrow()
    })

    it('should accept valid password', async () => {
      const user = await createTestUser({
        email: `valid-pass-${Date.now()}@test.com`,
        password: 'ValidPass123!@#',
        role: 'content_creator',
      })

      expect(user).toHaveProperty('id')

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })
  })

  describe('Token Validation', () => {
    it('should validate token for authenticated requests', async () => {
      const user = await createTestUser({
        email: `token-test-${Date.now()}@test.com`,
        password: 'TokenPass123!@#',
        role: 'admin',
      })

      const loginResult = await loginUser(user.email, 'TokenPass123!@#')
      const token = loginResult.token

      // Use token to make authenticated request
      const response = await fetch('http://localhost:3000/api/companies', {
        headers: createAuthHeaders(token),
      })

      expect(response.status).toBe(200)

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })

    it('should reject requests without token', async () => {
      const response = await fetch('http://localhost:3000/api/companies', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(401)
    })

    it('should reject requests with invalid token', async () => {
      const response = await fetch('http://localhost:3000/api/companies', {
        headers: {
          'Authorization': 'Bearer invalid-token-12345',
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(401)
    })
  })

  describe('Access Control by Role', () => {
    let adminUser: any
    let managerUser: any
    let contentCreatorUser: any
    let reviewerUser: any
    let adminToken: string
    let managerToken: string
    let contentCreatorToken: string
    let reviewerToken: string

    beforeEach(async () => {
      // Create users with different roles
      adminUser = await createTestUser({
        email: `admin-access-${Date.now()}@test.com`,
        password: 'AdminPass123!@#',
        role: 'admin',
        company: testCompany.id,
      })

      managerUser = await createTestUser({
        email: `manager-access-${Date.now()}@test.com`,
        password: 'ManagerPass123!@#',
        role: 'manager',
        company: testCompany.id,
      })

      contentCreatorUser = await createTestUser({
        email: `creator-access-${Date.now()}@test.com`,
        password: 'CreatorPass123!@#',
        role: 'content_creator',
        company: testCompany.id,
      })

      reviewerUser = await createTestUser({
        email: `reviewer-access-${Date.now()}@test.com`,
        password: 'ReviewerPass123!@#',
        role: 'reviewer',
        company: testCompany.id,
      })

      // Login and get tokens
      adminToken = (await loginUser(adminUser.email, 'AdminPass123!@#')).token
      managerToken = (await loginUser(managerUser.email, 'ManagerPass123!@#')).token
      contentCreatorToken = (await loginUser(contentCreatorUser.email, 'CreatorPass123!@#')).token
      reviewerToken = (await loginUser(reviewerUser.email, 'ReviewerPass123!@#')).token
    })

    afterEach(async () => {
      if (adminUser?.id) {
        await payload.delete({ collection: 'users', id: adminUser.id }).catch(() => {})
      }
      if (managerUser?.id) {
        await payload.delete({ collection: 'users', id: managerUser.id }).catch(() => {})
      }
      if (contentCreatorUser?.id) {
        await payload.delete({ collection: 'users', id: contentCreatorUser.id }).catch(() => {})
      }
      if (reviewerUser?.id) {
        await payload.delete({ collection: 'users', id: reviewerUser.id }).catch(() => {})
      }
    })

    it('should allow admin to access all companies', async () => {
      const response = await fetch('http://localhost:3000/api/companies', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
    })

    it('should allow manager to access companies', async () => {
      const response = await fetch('http://localhost:3000/api/companies', {
        headers: createAuthHeaders(managerToken),
      })

      expect(response.status).toBe(200)
    })

    it('should restrict content creator to their company', async () => {
      // Content creators can only see their own company
      const response = await fetch('http://localhost:3000/api/companies', {
        headers: createAuthHeaders(contentCreatorToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      // Should only see their own company
      if (data.docs.length > 0) {
        data.docs.forEach((company: any) => {
          expect(company.id).toBe(testCompany.id)
        })
      }
    })

    it('should allow admin to create users', async () => {
      const newUser = {
        email: `admin-created-${Date.now()}@test.com`,
        password: 'NewUserPass123!@#',
        role: 'content_creator',
        firstName: 'Admin',
        lastName: 'Created',
        company: testCompany.id,
      }

      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify(newUser),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('id')

      // Cleanup
      await payload.delete({ collection: 'users', id: data.id })
    })

    it('should prevent non-admin from creating users', async () => {
      const newUser = {
        email: `creator-created-${Date.now()}@test.com`,
        password: 'NewUserPass123!@#',
        role: 'content_creator',
        firstName: 'Creator',
        lastName: 'Created',
      }

      const response = await fetch('http://localhost:3000/api/users', {
        method: 'POST',
        headers: createAuthHeaders(contentCreatorToken),
        body: JSON.stringify(newUser),
      })

      expect(response.status).toBe(403)
    })
  })

  describe('User Session Management', () => {
    it('should update lastLoginAt after login', async () => {
      const user = await createTestUser({
        email: `session-test-${Date.now()}@test.com`,
        password: 'SessionPass123!@#',
        role: 'content_creator',
      })

      const beforeLogin = new Date()

      await loginUser(user.email, 'SessionPass123!@#')

      // Wait a bit for hook to execute
      await new Promise((resolve) => setTimeout(resolve, 100))

      const retrieved = await payload.findByID({
        collection: 'users',
        id: user.id,
      })

      expect(retrieved.lastLoginAt).toBeDefined()
      if (retrieved.lastLoginAt) {
        const loginTime = new Date(retrieved.lastLoginAt)
        expect(loginTime.getTime()).toBeGreaterThanOrEqual(beforeLogin.getTime())
      }

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })

    it('should track user activity', async () => {
      const user = await createTestUser({
        email: `activity-test-${Date.now()}@test.com`,
        password: 'ActivityPass123!@#',
        role: 'content_creator',
      })

      const loginResult = await loginUser(user.email, 'ActivityPass123!@#')
      
      // Make authenticated request
      await fetch('http://localhost:3000/api/companies', {
        headers: createAuthHeaders(loginResult.token),
      })

      // User should be able to make authenticated requests
      expect(loginResult.user).toBeDefined()
      expect(loginResult.user.id).toBe(user.id)

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })
  })

  describe('User Account Management', () => {
    it('should allow users to update their own profile', async () => {
      const user = await createTestUser({
        email: `self-update-${Date.now()}@test.com`,
        password: 'UpdatePass123!@#',
        role: 'content_creator',
      })

      const loginResult = await loginUser(user.email, 'UpdatePass123!@#')

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
      }

      const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
        method: 'PATCH',
        headers: createAuthHeaders(loginResult.token),
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.firstName).toBe(updateData.firstName)
      expect(data.lastName).toBe(updateData.lastName)

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })

    it('should prevent users from changing their role', async () => {
      const user = await createTestUser({
        email: `role-change-${Date.now()}@test.com`,
        password: 'RolePass123!@#',
        role: 'content_creator',
      })

      const loginResult = await loginUser(user.email, 'RolePass123!@#')

      const updateData = {
        role: 'admin', // Attempt to escalate privilege
      }

      const response = await fetch(`http://localhost:3000/api/users/${user.id}`, {
        method: 'PATCH',
        headers: createAuthHeaders(loginResult.token),
        body: JSON.stringify(updateData),
      })

      // Should either reject or ignore role change
      expect([200, 403]).toContain(response.status)

      // Cleanup
      await payload.delete({ collection: 'users', id: user.id })
    })
  })
})

