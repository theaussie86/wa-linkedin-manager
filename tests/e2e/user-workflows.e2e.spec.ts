/**
 * T121: E2E Tests für User Workflows
 * 
 * Tests für vollständige User-Workflows:
 * - User Registration
 * - User Login
 * - User Profile Management
 * - Password Reset Workflow
 * - User Role Management
 */

import { test, expect, APIRequestContext } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

test.describe('User Workflows E2E Tests', () => {
  let apiContext: APIRequestContext
  let testUserEmail: string
  let testUserPassword: string
  let adminToken: string

  test.beforeAll(async ({ request }) => {
    apiContext = request
    
    // Create admin user for setup (if needed)
    testUserEmail = `e2e-user-${Date.now()}@test.com`
    testUserPassword = 'TestPassword123!@#'
    
    // Try to create admin user for cleanup operations
    try {
      const adminResponse = await request.post(`${API_BASE}/users`, {
        data: {
          email: 'admin@e2e-test.com',
          password: 'AdminPass123!@#',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
      })
      
      if (adminResponse.ok()) {
        const loginResponse = await request.post(`${API_BASE}/users/login`, {
          data: {
            email: 'admin@e2e-test.com',
            password: 'AdminPass123!@#',
          },
        })
        const loginData = await loginResponse.json()
        adminToken = loginData.token || ''
      }
    } catch {
      // Admin might already exist, try login
      try {
        const loginResponse = await request.post(`${API_BASE}/users/login`, {
          data: {
            email: 'admin@e2e-test.com',
            password: 'AdminPass123!@#',
          },
        })
        if (loginResponse.ok()) {
          const loginData = await loginResponse.json()
          adminToken = loginData.token || ''
        }
      } catch {
        // Ignore if admin doesn't exist
      }
    }
  })

  test.afterAll(async ({ request }) => {
    // Cleanup test users
    if (adminToken) {
      try {
        const usersResponse = await request.get(`${API_BASE}/users?where[email][contains]=e2e-`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        })
        
        if (usersResponse.ok()) {
          const usersData = await usersResponse.json()
          for (const user of usersData.docs || []) {
            await request.delete(`${API_BASE}/users/${user.id}`, {
              headers: {
                'Authorization': `Bearer ${adminToken}`,
              },
            })
          }
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  test.describe('User Registration Workflow', () => {
    test('should complete full user registration workflow', async ({ request }) => {
      const email = `register-${Date.now()}@test.com`
      const password = 'RegisterPass123!@#'

      // Step 1: Register new user
      const registerResponse = await request.post(`${API_BASE}/users`, {
        data: {
          email,
          password,
          firstName: 'Test',
          lastName: 'User',
          role: 'content_creator',
        },
      })

      expect(registerResponse.ok()).toBeTruthy()
      const registerData = await registerResponse.json()

      expect(registerData.doc).toHaveProperty('id')
      expect(registerData.doc.email).toBe(email)
      expect(registerData.doc.role).toBe('content_creator')

      // Step 2: Verify user can login immediately after registration
      const loginResponse = await request.post(`${API_BASE}/users/login`, {
        data: {
          email,
          password,
        },
      })

      expect(loginResponse.ok()).toBeTruthy()
      const loginData = await loginResponse.json()

      expect(loginData.token).toBeTruthy()
      expect(loginData.user).toHaveProperty('id')
      expect(loginData.user.email).toBe(email)
    })

    test('should reject registration with invalid email', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users`, {
        data: {
          email: 'invalid-email',
          password: 'TestPass123!@#',
          firstName: 'Test',
          lastName: 'User',
        },
      })

      expect(response.status()).toBeGreaterThanOrEqual(400)
    })

    test('should reject registration with weak password', async ({ request }) => {
      const response = await request.post(`${API_BASE}/users`, {
        data: {
          email: `weak-pass-${Date.now()}@test.com`,
          password: '123',
          firstName: 'Test',
          lastName: 'User',
        },
      })

      expect(response.status()).toBeGreaterThanOrEqual(400)
    })
  })

  test.describe('User Login Workflow', () => {
    test('should complete successful login workflow', async ({ request }) => {
      // Step 1: Create user
      const email = `login-${Date.now()}@test.com`
      const password = 'LoginPass123!@#'

      await request.post(`${API_BASE}/users`, {
        data: {
          email,
          password,
          firstName: 'Login',
          lastName: 'Test',
        },
      })

      // Step 2: Login with credentials
      const loginResponse = await request.post(`${API_BASE}/users/login`, {
        data: {
          email,
          password,
        },
      })

      expect(loginResponse.ok()).toBeTruthy()
      const loginData = await loginResponse.json()

      expect(loginData.token).toBeTruthy()
      expect(typeof loginData.token).toBe('string')
      expect(loginData.user).toHaveProperty('id')
      expect(loginData.user.email).toBe(email)

      // Step 3: Verify token works for authenticated requests
      const profileResponse = await request.get(`${API_BASE}/users/${loginData.user.id}`, {
        headers: {
          'Authorization': `Bearer ${loginData.token}`,
        },
      })

      expect(profileResponse.ok()).toBeTruthy()
    })

    test('should reject login with wrong password', async ({ request }) => {
      const email = `wrong-pass-${Date.now()}@test.com`
      const password = 'CorrectPass123!@#'

      await request.post(`${API_BASE}/users`, {
        data: {
          email,
          password,
          firstName: 'Wrong',
          lastName: 'Password',
        },
      })

      const loginResponse = await request.post(`${API_BASE}/users/login`, {
        data: {
          email,
          password: 'WrongPassword123!@#',
        },
      })

      expect(loginResponse.status()).toBe(401)
    })

    test('should reject login with non-existent user', async ({ request }) => {
      const loginResponse = await request.post(`${API_BASE}/users/login`, {
        data: {
          email: `nonexistent-${Date.now()}@test.com`,
          password: 'AnyPass123!@#',
        },
      })

      expect(loginResponse.status()).toBe(401)
    })
  })

  test.describe('User Profile Management Workflow', () => {
    let userToken: string
    let userId: string

    test.beforeEach(async ({ request }) => {
      // Create and login user
      const email = `profile-${Date.now()}@test.com`
      const password = 'ProfilePass123!@#'

      const registerResponse = await request.post(`${API_BASE}/users`, {
        data: {
          email,
          password,
          firstName: 'Profile',
          lastName: 'Test',
          role: 'content_creator',
        },
      })

      const registerData = await registerResponse.json()
      userId = registerData.doc.id

      const loginResponse = await request.post(`${API_BASE}/users/login`, {
        data: { email, password },
      })

      const loginData = await loginResponse.json()
      userToken = loginData.token
    })

    test('should update user profile information', async ({ request }) => {
      // Step 1: Get current profile
      const getResponse = await request.get(`${API_BASE}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      })

      expect(getResponse.ok()).toBeTruthy()

      // Step 2: Update profile
      const updateResponse = await request.patch(`${API_BASE}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          firstName: 'Updated',
          lastName: 'Name',
        },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateData = await updateResponse.json()

      expect(updateData.doc.firstName).toBe('Updated')
      expect(updateData.doc.lastName).toBe('Name')

      // Step 3: Verify changes persisted
      const verifyResponse = await request.get(`${API_BASE}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      })

      const verifyData = await verifyResponse.json()
      expect(verifyData.doc.firstName).toBe('Updated')
      expect(verifyData.doc.lastName).toBe('Name')
    })

    test('should access user profile with valid token', async ({ request }) => {
      const response = await request.get(`${API_BASE}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${userToken}`,
        },
      })

      expect(response.ok()).toBeTruthy()
      const data = await response.json()

      expect(data.doc).toHaveProperty('id')
      expect(data.doc).toHaveProperty('email')
      expect(data.doc).toHaveProperty('role')
    })

    test('should reject profile access without token', async ({ request }) => {
      const response = await request.get(`${API_BASE}/users/${userId}`)

      expect(response.status()).toBe(401)
    })
  })

  test.describe('User Role Management Workflow', () => {
    test('should manage user roles as admin', async ({ request }) => {
      if (!adminToken) {
        test.skip()
        return
      }

      // Step 1: Create user with content_creator role
      const email = `role-${Date.now()}@test.com`
      const password = 'RolePass123!@#'

      const createResponse = await request.post(`${API_BASE}/users`, {
        data: {
          email,
          password,
          firstName: 'Role',
          lastName: 'Test',
          role: 'content_creator',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const userId = createData.doc.id

      expect(createData.doc.role).toBe('content_creator')

      // Step 2: Update role to reviewer as admin
      const updateResponse = await request.patch(`${API_BASE}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          role: 'reviewer',
        },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateData = await updateResponse.json()

      expect(updateData.doc.role).toBe('reviewer')

      // Step 3: Verify role change
      const verifyResponse = await request.get(`${API_BASE}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      const verifyData = await verifyResponse.json()
      expect(verifyData.doc.role).toBe('reviewer')
    })
  })
})

