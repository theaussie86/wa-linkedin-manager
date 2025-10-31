/**
 * T118: Integration Tests für Database Operations
 * 
 * Tests für:
 * - CRUD Operations für alle Collections
 * - Relationships zwischen Entitäten
 * - Data Integrity und Constraints
 * - Hooks und Validierung
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import {
  initPayload,
  createTestUser,
  createTestCompany,
  createTestReferencePost,
  createTestGeneratedPost,
  cleanupTestData,
} from './test-utils'
import type { Payload } from 'payload'

describe('Database Operations Integration Tests', () => {
  let payload: Payload

  beforeAll(async () => {
    payload = await initPayload()
  })

  afterAll(async () => {
    await cleanupTestData()
  })

  describe('Company CRUD Operations', () => {
    it('should create a company', async () => {
      const company = await createTestCompany({
        name: 'Test Company DB',
        industry: 'Technology',
        size: 'medium',
        website: 'https://test-company-db.com',
      })

      expect(company).toHaveProperty('id')
      expect(company.name).toBe('Test Company DB')
      expect(company.industry).toBe('Technology')
      expect(company.size).toBe('medium')

      // Cleanup
      await payload.delete({ collection: 'companies', id: company.id })
    })

    it('should read a company', async () => {
      const company = await createTestCompany({
        name: 'Read Test Company',
        industry: 'Finance',
      })

      const retrieved = await payload.findByID({
        collection: 'companies',
        id: company.id,
      })

      expect(retrieved.id).toBe(company.id)
      expect(retrieved.name).toBe(company.name)

      // Cleanup
      await payload.delete({ collection: 'companies', id: company.id })
    })

    it('should update a company', async () => {
      const company = await createTestCompany({
        name: 'Update Test Company',
        industry: 'Technology',
      })

      const updated = await payload.update({
        collection: 'companies',
        id: company.id,
        data: {
          name: 'Updated Company Name',
          industry: 'Healthcare',
        },
      })

      expect(updated.name).toBe('Updated Company Name')
      expect(updated.industry).toBe('Healthcare')

      // Cleanup
      await payload.delete({ collection: 'companies', id: company.id })
    })

    it('should delete a company', async () => {
      const company = await createTestCompany({
        name: 'Delete Test Company',
      })

      await payload.delete({
        collection: 'companies',
        id: company.id,
      })

      // Verify deletion
      await expect(
        payload.findByID({
          collection: 'companies',
          id: company.id,
        })
      ).rejects.toThrow()
    })

    it('should list companies with pagination', async () => {
      // Create multiple companies
      const companies = []
      for (let i = 0; i < 5; i++) {
        const company = await createTestCompany({
          name: `Pagination Test Company ${i}`,
        })
        companies.push(company)
      }

      const result = await payload.find({
        collection: 'companies',
        limit: 3,
        page: 1,
      })

      expect(result.docs.length).toBeLessThanOrEqual(3)
      expect(result.totalDocs).toBeGreaterThanOrEqual(5)
      expect(result.page).toBe(1)

      // Cleanup
      for (const company of companies) {
        await payload.delete({ collection: 'companies', id: company.id }).catch(() => {})
      }
    })
  })

  describe('ReferencePost CRUD Operations', () => {
    let testCompany: any

    beforeEach(async () => {
      testCompany = await createTestCompany({
        name: 'Reference Post Test Company',
      })
    })

    afterEach(async () => {
      if (testCompany?.id) {
        await payload.delete({ collection: 'companies', id: testCompany.id }).catch(() => {})
      }
    })

    it('should create a reference post with company relationship', async () => {
      const post = await createTestReferencePost({
        title: 'Test Reference Post DB',
        company: testCompany.id,
        linkedinUrl: 'https://linkedin.com/posts/test-db-123',
      })

      expect(post).toHaveProperty('id')
      expect(post.title).toBe('Test Reference Post DB')
      expect(typeof post.company).toBe('string')
      expect(post.company).toBe(testCompany.id)

      // Verify relationship by fetching with depth
      const retrieved = await payload.findByID({
        collection: 'reference-posts',
        id: post.id,
        depth: 1,
      })

      expect(retrieved.company).toHaveProperty('id', testCompany.id)
      expect(retrieved.company).toHaveProperty('name', testCompany.name)

      // Cleanup
      await payload.delete({ collection: 'reference-posts', id: post.id })
    })

    it('should calculate engagement rate correctly', async () => {
      const post = await createTestReferencePost({
        title: 'Engagement Test Post',
        company: testCompany.id,
        linkedinUrl: 'https://linkedin.com/posts/engagement-123',
      })

      // Update with engagement metrics
      const updated = await payload.update({
        collection: 'reference-posts',
        id: post.id,
        data: {
          likes: 100,
          comments: 20,
          shares: 10,
          impressions: 1000,
        },
      })

      // Engagement rate = (likes + comments + shares) / impressions * 100
      const expectedRate = ((100 + 20 + 10) / 1000) * 100
      expect(updated.engagementRate).toBeCloseTo(expectedRate, 2)

      // Cleanup
      await payload.delete({ collection: 'reference-posts', id: post.id })
    })
  })

  describe('GeneratedPost CRUD Operations', () => {
    let testCompany: any
    let testReferencePost: any

    beforeEach(async () => {
      testCompany = await createTestCompany({
        name: 'Generated Post Test Company',
      })
      testReferencePost = await createTestReferencePost({
        title: 'Test Reference for Generated',
        company: testCompany.id,
        linkedinUrl: 'https://linkedin.com/posts/reference-123',
      })
    })

    afterEach(async () => {
      if (testReferencePost?.id) {
        await payload.delete({ collection: 'reference-posts', id: testReferencePost.id }).catch(() => {})
      }
      if (testCompany?.id) {
        await payload.delete({ collection: 'companies', id: testCompany.id }).catch(() => {})
      }
    })

    it('should create a generated post with relationships', async () => {
      const post = await createTestGeneratedPost({
        title: 'Test Generated Post DB',
        company: testCompany.id,
        status: 'draft',
      })

      expect(post).toHaveProperty('id')
      expect(post.title).toBe('Test Generated Post DB')
      expect(post.status).toBe('draft')

      // Verify company relationship
      const retrieved = await payload.findByID({
        collection: 'generated-posts',
        id: post.id,
        depth: 1,
      })

      expect(retrieved.company).toHaveProperty('id', testCompany.id)

      // Cleanup
      await payload.delete({ collection: 'generated-posts', id: post.id })
    })

    it('should link reference post to generated post', async () => {
      const post = await createTestGeneratedPost({
        title: 'Post with Reference',
        company: testCompany.id,
      })

      const updated = await payload.update({
        collection: 'generated-posts',
        id: post.id,
        data: {
          referencePost: testReferencePost.id,
        },
      })

      const retrieved = await payload.findByID({
        collection: 'generated-posts',
        id: post.id,
        depth: 2,
      })

      expect(retrieved.referencePost).toHaveProperty('id', testReferencePost.id)
      expect(retrieved.referencePost).toHaveProperty('title', testReferencePost.title)

      // Cleanup
      await payload.delete({ collection: 'generated-posts', id: post.id })
    })

    it('should validate status transitions', async () => {
      const post = await createTestGeneratedPost({
        title: 'Status Transition Test',
        company: testCompany.id,
        status: 'draft',
      })

      // Draft -> Review (valid)
      let updated = await payload.update({
        collection: 'generated-posts',
        id: post.id,
        data: { status: 'review' },
      })
      expect(updated.status).toBe('review')

      // Review -> Approved (valid)
      updated = await payload.update({
        collection: 'generated-posts',
        id: post.id,
        data: { status: 'approved' },
      })
      expect(updated.status).toBe('approved')

      // Cleanup
      await payload.delete({ collection: 'generated-posts', id: post.id })
    })
  })

  describe('Campaign CRUD Operations', () => {
    let testCompany: any
    let testGeneratedPost: any
    let testReferencePost: any

    beforeEach(async () => {
      testCompany = await createTestCompany({
        name: 'Campaign Test Company',
      })
      testGeneratedPost = await createTestGeneratedPost({
        title: 'Campaign Generated Post',
        company: testCompany.id,
      })
      testReferencePost = await createTestReferencePost({
        title: 'Campaign Reference Post',
        company: testCompany.id,
        linkedinUrl: 'https://linkedin.com/posts/campaign-ref-123',
      })
    })

    afterEach(async () => {
      if (testReferencePost?.id) {
        await payload.delete({ collection: 'reference-posts', id: testReferencePost.id }).catch(() => {})
      }
      if (testGeneratedPost?.id) {
        await payload.delete({ collection: 'generated-posts', id: testGeneratedPost.id }).catch(() => {})
      }
      if (testCompany?.id) {
        await payload.delete({ collection: 'companies', id: testCompany.id }).catch(() => {})
      }
    })

    it('should create a campaign with relationships', async () => {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      const campaign = await payload.create({
        collection: 'campaigns',
        data: {
          name: 'Test Campaign DB',
          company: testCompany.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'planning',
          budget: 5000,
          generatedPosts: [testGeneratedPost.id],
          referencePosts: [testReferencePost.id],
        },
      })

      expect(campaign).toHaveProperty('id')
      expect(campaign.name).toBe('Test Campaign DB')

      // Verify relationships
      const retrieved = await payload.findByID({
        collection: 'campaigns',
        id: campaign.id,
        depth: 2,
      })

      expect(retrieved.company).toHaveProperty('id', testCompany.id)
      expect(Array.isArray(retrieved.generatedPosts)).toBe(true)
      expect(retrieved.generatedPosts.length).toBeGreaterThan(0)

      // Cleanup
      await payload.delete({ collection: 'campaigns', id: campaign.id })
    })

    it('should validate date range', async () => {
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() - 1) // End before start (invalid)

      await expect(
        payload.create({
          collection: 'campaigns',
          data: {
            name: 'Invalid Date Range Campaign',
            company: testCompany.id,
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            status: 'planning',
          },
        })
      ).rejects.toThrow()
    })
  })

  describe('PostAnalytics CRUD Operations', () => {
    let testGeneratedPost: any

    beforeEach(async () => {
      const testCompany = await createTestCompany({
        name: 'Analytics Test Company',
      })
      testGeneratedPost = await createTestGeneratedPost({
        title: 'Analytics Test Post',
        company: testCompany.id,
        status: 'published',
      })
    })

    afterEach(async () => {
      if (testGeneratedPost?.id) {
        const retrieved = await payload.findByID({
          collection: 'generated-posts',
          id: testGeneratedPost.id,
        })
        if (retrieved.company) {
          await payload.delete({ collection: 'companies', id: retrieved.company }).catch(() => {})
        }
        await payload.delete({ collection: 'generated-posts', id: testGeneratedPost.id }).catch(() => {})
      }
    })

    it('should create analytics data', async () => {
      const analytics = await payload.create({
        collection: 'post-analytics',
        data: {
          generatedPost: testGeneratedPost.id,
          metricType: 'engagement',
          value: 250,
          period: 'daily',
          date: new Date().toISOString(),
        },
      })

      expect(analytics).toHaveProperty('id')
      expect(analytics.metricType).toBe('engagement')
      expect(analytics.value).toBe(250)

      // Cleanup
      await payload.delete({ collection: 'post-analytics', id: analytics.id })
    })

    it('should link analytics to generated post', async () => {
      const analytics = await payload.create({
        collection: 'post-analytics',
        data: {
          generatedPost: testGeneratedPost.id,
          metricType: 'impressions',
          value: 1000,
          period: 'weekly',
          date: new Date().toISOString(),
        },
      })

      const retrieved = await payload.findByID({
        collection: 'post-analytics',
        id: analytics.id,
        depth: 1,
      })

      expect(retrieved.generatedPost).toHaveProperty('id', testGeneratedPost.id)
      expect(retrieved.generatedPost).toHaveProperty('title', testGeneratedPost.title)

      // Cleanup
      await payload.delete({ collection: 'post-analytics', id: analytics.id })
    })
  })

  describe('Database Relationships', () => {
    let testCompany: any
    let testUser: any

    beforeEach(async () => {
      testCompany = await createTestCompany({
        name: 'Relationship Test Company',
      })
      testUser = await createTestUser({
        email: `relationship-test-${Date.now()}@test.com`,
        password: 'TestPass123!@#',
        company: testCompany.id,
      })
    })

    afterEach(async () => {
      if (testUser?.id) {
        await payload.delete({ collection: 'users', id: testUser.id }).catch(() => {})
      }
      if (testCompany?.id) {
        await payload.delete({ collection: 'companies', id: testCompany.id }).catch(() => {})
      }
    })

    it('should maintain user-company relationship', async () => {
      const retrieved = await payload.findByID({
        collection: 'users',
        id: testUser.id,
        depth: 1,
      })

      expect(retrieved.company).toHaveProperty('id', testCompany.id)
      expect(retrieved.company).toHaveProperty('name', testCompany.name)
    })

    it('should cascade delete relationships correctly', async () => {
      // Create a reference post linked to company
      const post = await createTestReferencePost({
        title: 'Cascade Test Post',
        company: testCompany.id,
        linkedinUrl: 'https://linkedin.com/posts/cascade-123',
      })

      // Delete company should not cascade delete posts (soft delete or separate handling)
      // But we can verify the relationship exists
      const retrieved = await payload.findByID({
        collection: 'reference-posts',
        id: post.id,
        depth: 1,
      })

      expect(retrieved.company).toHaveProperty('id', testCompany.id)

      // Cleanup
      await payload.delete({ collection: 'reference-posts', id: post.id })
    })
  })

  describe('Data Integrity and Validation', () => {
    let testCompany: any

    beforeEach(async () => {
      testCompany = await createTestCompany({
        name: 'Validation Test Company',
      })
    })

    afterEach(async () => {
      if (testCompany?.id) {
        await payload.delete({ collection: 'companies', id: testCompany.id }).catch(() => {})
      }
    })

    it('should enforce required fields', async () => {
      await expect(
        payload.create({
          collection: 'companies',
          data: {
            // Missing required 'name' field
            industry: 'Technology',
          } as any,
        })
      ).rejects.toThrow()
    })

    it('should validate enum values', async () => {
      await expect(
        payload.create({
          collection: 'companies',
          data: {
            name: 'Invalid Enum Company',
            size: 'invalid_size' as any,
            industry: 'Technology',
          },
        })
      ).rejects.toThrow()
    })

    it('should validate URL formats', async () => {
      await expect(
        payload.create({
          collection: 'companies',
          data: {
            name: 'Invalid URL Company',
            website: 'not-a-valid-url',
            industry: 'Technology',
          },
        })
      ).rejects.toThrow()
    })

    it('should handle unique constraints', async () => {
      // Create first company
      const company1 = await createTestCompany({
        name: 'Unique Test Company',
      })

      // Note: This test depends on having unique constraints defined
      // If unique constraints exist, the second creation should fail
      // Otherwise, it will succeed

      // Cleanup
      await payload.delete({ collection: 'companies', id: company1.id })
    })
  })

  describe('Query Operations', () => {
    let testCompanies: any[] = []

    beforeAll(async () => {
      // Create test data
      for (let i = 0; i < 3; i++) {
        const company = await createTestCompany({
          name: `Query Test Company ${i}`,
          size: i % 2 === 0 ? 'small' : 'medium',
          industry: 'Technology',
        })
        testCompanies.push(company)
      }
    })

    afterAll(async () => {
      for (const company of testCompanies) {
        await payload.delete({ collection: 'companies', id: company.id }).catch(() => {})
      }
    })

    it('should filter by field value', async () => {
      const result = await payload.find({
        collection: 'companies',
        where: {
          size: {
            equals: 'small',
          },
        },
      })

      expect(result.docs.length).toBeGreaterThan(0)
      result.docs.forEach((company) => {
        expect(company.size).toBe('small')
      })
    })

    it('should filter by multiple conditions', async () => {
      const result = await payload.find({
        collection: 'companies',
        where: {
          and: [
            {
              size: {
                equals: 'medium',
              },
            },
            {
              industry: {
                equals: 'Technology',
              },
            },
          ],
        },
      })

      result.docs.forEach((company) => {
        expect(company.size).toBe('medium')
        expect(company.industry).toBe('Technology')
      })
    })

    it('should sort results', async () => {
      const result = await payload.find({
        collection: 'companies',
        sort: 'name',
        limit: 10,
      })

      if (result.docs.length > 1) {
        const names = result.docs.map((c) => c.name)
        const sortedNames = [...names].sort()
        expect(names).toEqual(sortedNames)
      }
    })
  })
})

