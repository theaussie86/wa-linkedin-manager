/**
 * T117: Integration Tests für API Endpoints
 * 
 * Tests für alle API Endpoints:
 * - Payload CMS Auto-Generated Endpoints (CRUD für alle Collections)
 * - Custom API Endpoints (generate, review)
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initPayload,
  createTestUser,
  createTestCompany,
  createTestReferencePost,
  createTestGeneratedPost,
  loginUser,
  createAuthHeaders,
  cleanupTestData,
} from './test-utils'
import type { Payload } from 'payload'

describe('API Endpoints Integration Tests', () => {
  let payload: Payload
  let adminToken: string
  let adminUser: any
  let testCompany: any

  beforeAll(async () => {
    payload = await initPayload()
    
    // Create admin user for testing
    try {
      adminUser = await createTestUser({
        email: 'admin@test.com',
        password: 'TestPass123!@#',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'User',
      })
    } catch (error) {
      // User might already exist, try to login
      const loginResult = await loginUser('admin@test.com', 'TestPass123!@#')
      adminToken = loginResult.token
      adminUser = loginResult.user
      return
    }

    const loginResult = await loginUser('admin@test.com', 'TestPass123!@#')
    adminToken = loginResult.token
    adminUser = loginResult.user

    // Create test company
    testCompany = await createTestCompany({
      name: 'Test Company API',
      industry: 'Technology',
      size: 'medium',
      website: 'https://test-company.com',
    })
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('Company API Endpoints', () => {
    it('should list companies via API', async () => {
      const response = await fetch('http://localhost:3000/api/companies', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      expect(Array.isArray(data.docs)).toBe(true)
    })

    it('should get a specific company via API', async () => {
      const response = await fetch(`http://localhost:3000/api/companies/${testCompany.id}`, {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('id', testCompany.id)
      expect(data).toHaveProperty('name', testCompany.name)
    })

    it('should create a company via API', async () => {
      const newCompany = {
        name: 'New Company via API',
        industry: 'Finance',
        size: 'small',
        website: 'https://new-company.com',
        researchStatus: 'pending',
      }

      const response = await fetch('http://localhost:3000/api/companies', {
        method: 'POST',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify(newCompany),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.name).toBe(newCompany.name)

      // Cleanup
      await payload.delete({ collection: 'companies', id: data.id })
    })

    it('should update a company via API', async () => {
      const updateData = {
        name: 'Updated Company Name',
      }

      const response = await fetch(`http://localhost:3000/api/companies/${testCompany.id}`, {
        method: 'PATCH',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify(updateData),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.name).toBe(updateData.name)

      // Restore original name
      await payload.update({
        collection: 'companies',
        id: testCompany.id,
        data: { name: testCompany.name },
      })
    })

    it('should return 401 for unauthorized requests', async () => {
      const response = await fetch('http://localhost:3000/api/companies', {
        headers: {
          'Content-Type': 'application/json',
        },
      })

      expect(response.status).toBe(401)
    })
  })

  describe('ReferencePost API Endpoints', () => {
    let testReferencePost: any

    beforeEach(async () => {
      testReferencePost = await createTestReferencePost({
        title: 'Test Reference Post',
        company: testCompany.id,
        linkedinUrl: 'https://linkedin.com/posts/test-123',
        postType: 'post',
        category: 'educational',
      })
    })

    afterEach(async () => {
      if (testReferencePost?.id) {
        await payload.delete({ collection: 'reference-posts', id: testReferencePost.id }).catch(() => {})
      }
    })

    it('should list reference posts via API', async () => {
      const response = await fetch('http://localhost:3000/api/reference-posts', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      expect(Array.isArray(data.docs)).toBe(true)
    })

    it('should get a specific reference post via API', async () => {
      const response = await fetch(`http://localhost:3000/api/reference-posts/${testReferencePost.id}`, {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('id', testReferencePost.id)
      expect(data).toHaveProperty('title', testReferencePost.title)
    })

    it('should create a reference post via API', async () => {
      const newPost = {
        title: 'New Reference Post via API',
        company: testCompany.id,
        linkedinUrl: 'https://linkedin.com/posts/new-456',
        postType: 'article',
        category: 'promotional',
        engagementRate: 5.5,
      }

      const response = await fetch('http://localhost:3000/api/reference-posts', {
        method: 'POST',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify(newPost),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.title).toBe(newPost.title)

      // Cleanup
      await payload.delete({ collection: 'reference-posts', id: data.id })
    })
  })

  describe('GeneratedPost API Endpoints', () => {
    let testGeneratedPost: any

    beforeEach(async () => {
      testGeneratedPost = await createTestGeneratedPost({
        title: 'Test Generated Post',
        company: testCompany.id,
        status: 'draft',
        writingStyle: 'story_based',
      })
    })

    afterEach(async () => {
      if (testGeneratedPost?.id) {
        await payload.delete({ collection: 'generated-posts', id: testGeneratedPost.id }).catch(() => {})
      }
    })

    it('should list generated posts via API', async () => {
      const response = await fetch('http://localhost:3000/api/generated-posts', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      expect(Array.isArray(data.docs)).toBe(true)
    })

    it('should get a specific generated post via API', async () => {
      const response = await fetch(`http://localhost:3000/api/generated-posts/${testGeneratedPost.id}`, {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('id', testGeneratedPost.id)
      expect(data).toHaveProperty('title', testGeneratedPost.title)
    })

    it('should generate AI content for a post via custom endpoint', async () => {
      const response = await fetch(`http://localhost:3000/api/generated-posts/${testGeneratedPost.id}/generate`, {
        method: 'POST',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify({
          writingStyle: 'insight_focused',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(data.data).toHaveProperty('id', testGeneratedPost.id)
    })

    it('should review a generated post via custom endpoint', async () => {
      // First set status to review
      await payload.update({
        collection: 'generated-posts',
        id: testGeneratedPost.id,
        data: { status: 'review' },
      })

      const response = await fetch(`http://localhost:3000/api/generated-posts/${testGeneratedPost.id}/review`, {
        method: 'POST',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify({
          action: 'approve',
          comments: 'Looks good!',
        }),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('data')
      expect(data.data.status).toBe('approved')
    })

    it('should reject review action for invalid status', async () => {
      // Set status to approved (cannot review again)
      await payload.update({
        collection: 'generated-posts',
        id: testGeneratedPost.id,
        data: { status: 'approved' },
      })

      const response = await fetch(`http://localhost:3000/api/generated-posts/${testGeneratedPost.id}/review`, {
        method: 'POST',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify({
          action: 'approve',
        }),
      })

      expect(response.status).toBe(422)
    })
  })

  describe('Campaign API Endpoints', () => {
    it('should list campaigns via API', async () => {
      const response = await fetch('http://localhost:3000/api/campaigns', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      expect(Array.isArray(data.docs)).toBe(true)
    })

    it('should create a campaign via API', async () => {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      const newCampaign = {
        name: 'Test Campaign via API',
        company: testCompany.id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        status: 'planning',
        budget: 10000,
      }

      const response = await fetch('http://localhost:3000/api/campaigns', {
        method: 'POST',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify(newCampaign),
      })

      expect(response.status).toBe(201)
      const data = await response.json()
      expect(data).toHaveProperty('id')
      expect(data.name).toBe(newCampaign.name)

      // Cleanup
      await payload.delete({ collection: 'campaigns', id: data.id })
    })
  })

  describe('PostAnalytics API Endpoints', () => {
    let testGeneratedPost: any
    let testAnalytics: any

    beforeEach(async () => {
      testGeneratedPost = await createTestGeneratedPost({
        title: 'Test Post for Analytics',
        company: testCompany.id,
        status: 'published',
      })

      testAnalytics = await payload.create({
        collection: 'post-analytics',
        data: {
          generatedPost: testGeneratedPost.id,
          metricType: 'engagement',
          value: 150,
          period: 'daily',
          date: new Date().toISOString(),
        },
      })
    })

    afterEach(async () => {
      if (testAnalytics?.id) {
        await payload.delete({ collection: 'post-analytics', id: testAnalytics.id }).catch(() => {})
      }
      if (testGeneratedPost?.id) {
        await payload.delete({ collection: 'generated-posts', id: testGeneratedPost.id }).catch(() => {})
      }
    })

    it('should list post analytics via API', async () => {
      const response = await fetch('http://localhost:3000/api/post-analytics', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      expect(Array.isArray(data.docs)).toBe(true)
    })

    it('should get a specific analytics record via API', async () => {
      const response = await fetch(`http://localhost:3000/api/post-analytics/${testAnalytics.id}`, {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('id', testAnalytics.id)
      expect(data).toHaveProperty('value', testAnalytics.value)
    })
  })

  describe('API Error Handling', () => {
    it('should return 404 for non-existent resources', async () => {
      const response = await fetch('http://localhost:3000/api/companies/00000000-0000-0000-0000-000000000000', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(404)
    })

    it('should return 400 for invalid data', async () => {
      const invalidData = {
        name: '', // Invalid: empty name
        industry: 'Invalid',
      }

      const response = await fetch('http://localhost:3000/api/companies', {
        method: 'POST',
        headers: createAuthHeaders(adminToken),
        body: JSON.stringify(invalidData),
      })

      expect(response.status).toBeGreaterThanOrEqual(400)
    })
  })

  describe('API Query Parameters', () => {
    it('should support limit and page parameters', async () => {
      const response = await fetch('http://localhost:3000/api/companies?limit=5&page=1', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      expect(data).toHaveProperty('limit', 5)
      expect(data).toHaveProperty('page', 1)
    })

    it('should support where filter parameter', async () => {
      const where = JSON.stringify({
        size: {
          equals: 'medium',
        },
      })

      const response = await fetch(`http://localhost:3000/api/companies?where=${encodeURIComponent(where)}`, {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      // All returned companies should be medium
      data.docs.forEach((company: any) => {
        expect(company.size).toBe('medium')
      })
    })

    it('should support sort parameter', async () => {
      const response = await fetch('http://localhost:3000/api/companies?sort=name', {
        headers: createAuthHeaders(adminToken),
      })

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data).toHaveProperty('docs')
      if (data.docs.length > 1) {
        // Check if sorted alphabetically
        const names = data.docs.map((c: any) => c.name)
        const sortedNames = [...names].sort()
        expect(names).toEqual(sortedNames)
      }
    })
  })
})

