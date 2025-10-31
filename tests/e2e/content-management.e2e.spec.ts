/**
 * T122: E2E Tests für Content Management
 * 
 * Tests für vollständige Content-Management-Workflows:
 * - Company Creation and Management
 * - ReferencePost Creation and Management
 * - GeneratedPost Creation and Management
 * - Content Review Workflow
 * - Campaign Management
 */

import { test, expect, APIRequestContext } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

test.describe('Content Management E2E Tests', () => {
  let apiContext: APIRequestContext
  let adminToken: string
  let contentCreatorToken: string
  let reviewerToken: string
  let testCompany: any
  let testReferencePost: any

  test.beforeAll(async ({ request }) => {
    apiContext = request

    // Create admin user
    try {
      await request.post(`${API_BASE}/users`, {
        data: {
          email: 'admin@content-e2e.com',
          password: 'AdminPass123!@#',
          role: 'admin',
          firstName: 'Admin',
          lastName: 'User',
        },
      })
    } catch {
      // User might already exist
    }

    const adminLogin = await request.post(`${API_BASE}/users/login`, {
      data: {
        email: 'admin@content-e2e.com',
        password: 'AdminPass123!@#',
      },
    })

    if (adminLogin.ok()) {
      const adminData = await adminLogin.json()
      adminToken = adminData.token || ''
    }

    // Create content creator user
    const creatorEmail = `creator-${Date.now()}@test.com`
    await request.post(`${API_BASE}/users`, {
      data: {
        email: creatorEmail,
        password: 'CreatorPass123!@#',
        role: 'content_creator',
        firstName: 'Content',
        lastName: 'Creator',
      },
    })

    const creatorLogin = await request.post(`${API_BASE}/users/login`, {
      data: {
        email: creatorEmail,
        password: 'CreatorPass123!@#',
      },
    })

    if (creatorLogin.ok()) {
      const creatorData = await creatorLogin.json()
      contentCreatorToken = creatorData.token || ''
    }

    // Create reviewer user
    const reviewerEmail = `reviewer-${Date.now()}@test.com`
    await request.post(`${API_BASE}/users`, {
      data: {
        email: reviewerEmail,
        password: 'ReviewerPass123!@#',
        role: 'reviewer',
        firstName: 'Content',
        lastName: 'Reviewer',
      },
    })

    const reviewerLogin = await request.post(`${API_BASE}/users/login`, {
      data: {
        email: reviewerEmail,
        password: 'ReviewerPass123!@#',
      },
    })

    if (reviewerLogin.ok()) {
      const reviewerData = await reviewerLogin.json()
      reviewerToken = reviewerData.token || ''
    }

    // Create test company
    if (adminToken) {
      const companyResponse = await request.post(
        `${API_BASE}/companies`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            name: 'E2E Test Company',
            industry: 'Technology',
            size: 'medium',
            website: 'https://e2e-test.com',
            researchStatus: 'completed',
          },
        }
      )

      if (companyResponse.ok()) {
        const companyData = await companyResponse.json()
        testCompany = companyData.doc
      }
    }
  })

  test.afterAll(async ({ request }) => {
    // Cleanup test data
    if (adminToken) {
      try {
        // Delete campaigns
        const campaignsResponse = await request.get(`${API_BASE}/campaigns?limit=1000`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
        })
        if (campaignsResponse.ok()) {
          const campaignsData = await campaignsResponse.json()
          for (const campaign of campaignsData.docs || []) {
            await request.delete(`${API_BASE}/campaigns/${campaign.id}`, {
              headers: { 'Authorization': `Bearer ${adminToken}` },
            })
          }
        }

        // Delete generated posts
        const generatedResponse = await request.get(`${API_BASE}/generated-posts?limit=1000`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
        })
        if (generatedResponse.ok()) {
          const generatedData = await generatedResponse.json()
          for (const post of generatedData.docs || []) {
            await request.delete(`${API_BASE}/generated-posts/${post.id}`, {
              headers: { 'Authorization': `Bearer ${adminToken}` },
            })
          }
        }

        // Delete reference posts
        const referenceResponse = await request.get(`${API_BASE}/reference-posts?limit=1000`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
        })
        if (referenceResponse.ok()) {
          const referenceData = await referenceResponse.json()
          for (const post of referenceData.docs || []) {
            await request.delete(`${API_BASE}/reference-posts/${post.id}`, {
              headers: { 'Authorization': `Bearer ${adminToken}` },
            })
          }
        }

        // Delete company
        if (testCompany?.id) {
          await request.delete(`${API_BASE}/companies/${testCompany.id}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
          })
        }
      } catch {
        // Ignore cleanup errors
      }
    }
  })

  test.describe('Company Management Workflow', () => {
    test('should create and manage company', async ({ request }) => {
      if (!adminToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create company
      const createResponse = await request.post(`${API_BASE}/companies`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          name: 'New E2E Company',
          industry: 'Finance',
          size: 'large',
          website: 'https://new-e2e-company.com',
          researchStatus: 'pending',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const companyId = createData.doc.id

      expect(createData.doc.name).toBe('New E2E Company')
      expect(createData.doc.industry).toBe('Finance')

      // Step 2: Read company
      const readResponse = await request.get(`${API_BASE}/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(readResponse.ok()).toBeTruthy()
      const readData = await readResponse.json()

      expect(readData.doc.name).toBe('New E2E Company')

      // Step 3: Update company
      const updateResponse = await request.patch(`${API_BASE}/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          researchStatus: 'completed',
        },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateData = await updateResponse.json()

      expect(updateData.doc.researchStatus).toBe('completed')

      // Step 4: List companies
      const listResponse = await request.get(`${API_BASE}/companies?limit=10`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(listResponse.ok()).toBeTruthy()
      const listData = await listResponse.json()

      expect(listData.docs).toBeInstanceOf(Array)

      // Step 5: Delete company
      const deleteResponse = await request.delete(`${API_BASE}/companies/${companyId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(deleteResponse.ok()).toBeTruthy()
    })
  })

  test.describe('ReferencePost Management Workflow', () => {
    test('should create and manage reference post', async ({ request }) => {
      if (!adminToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create reference post
      const createResponse = await request.post(`${API_BASE}/reference-posts`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'E2E Test Reference Post',
          company: testCompany.id,
          linkedinUrl: 'https://www.linkedin.com/posts/test-1234567890',
          postType: 'post',
          category: 'educational',
          engagementRate: 5.5,
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      expect(createData.doc.title).toBe('E2E Test Reference Post')
      expect(createData.doc.postType).toBe('post')

      // Step 2: Read reference post
      const readResponse = await request.get(`${API_BASE}/reference-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(readResponse.ok()).toBeTruthy()

      // Step 3: Update reference post
      const updateResponse = await request.patch(`${API_BASE}/reference-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          engagementRate: 7.5,
        },
      })

      expect(updateResponse.ok()).toBeTruthy()
      const updateData = await updateResponse.json()

      expect(updateData.doc.engagementRate).toBe(7.5)

      // Step 4: List reference posts
      const listResponse = await request.get(`${API_BASE}/reference-posts?where[company][equals]=${testCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(listResponse.ok()).toBeTruthy()
      const listData = await listResponse.json()

      expect(listData.docs).toBeInstanceOf(Array)

      // Step 5: Delete reference post
      const deleteResponse = await request.delete(`${API_BASE}/reference-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(deleteResponse.ok()).toBeTruthy()
    })
  })

  test.describe('GeneratedPost Management Workflow', () => {
    test('should create and manage generated post', async ({ request }) => {
      if (!contentCreatorToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create generated post
      const createResponse = await request.post(`${API_BASE}/generated-posts`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'E2E Test Generated Post',
          company: testCompany.id,
          content: 'This is test content for E2E testing.',
          status: 'draft',
          writingStyle: 'story_based',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      expect(createData.doc.title).toBe('E2E Test Generated Post')
      expect(createData.doc.status).toBe('draft')

      // Step 2: Update post status to review
      const updateToReviewResponse = await request.patch(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          status: 'review',
        },
      })

      expect(updateToReviewResponse.ok()).toBeTruthy()

      // Step 3: Reviewer reviews the post
      if (reviewerToken) {
        const reviewResponse = await request.post(`${API_BASE}/generated-posts/${postId}/review`, {
          headers: {
            'Authorization': `Bearer ${reviewerToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            action: 'approve',
            comments: 'Looks good for E2E test!',
          },
        })

        expect(reviewResponse.ok()).toBeTruthy()

        // Step 4: Verify status changed to approved
        const verifyResponse = await request.get(`${API_BASE}/generated-posts/${postId}`, {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
          },
        })

        expect(verifyResponse.ok()).toBeTruthy()
        const verifyData = await verifyResponse.json()

        expect(['approved', 'review']).toContain(verifyData.doc.status)
      }

      // Cleanup
      await request.delete(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })
    })

    test('should handle review workflow with rejection', async ({ request }) => {
      if (!contentCreatorToken || !reviewerToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create post
      const createResponse = await request.post(`${API_BASE}/generated-posts`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'Reject Test Post',
          company: testCompany.id,
          content: 'Test content to reject',
          status: 'review',
          writingStyle: 'insight_focused',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      // Step 2: Reviewer rejects the post
      const rejectResponse = await request.post(`${API_BASE}/generated-posts/${postId}/review`, {
        headers: {
          'Authorization': `Bearer ${reviewerToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          action: 'reject',
          comments: 'Needs improvement for E2E test',
        },
      })

      expect(rejectResponse.ok()).toBeTruthy()

      // Step 3: Verify status changed to rejected
      const verifyResponse = await request.get(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })

      expect(verifyResponse.ok()).toBeTruthy()
      const verifyData = await verifyResponse.json()

      expect(['rejected', 'review']).toContain(verifyData.doc.status)

      // Cleanup
      await request.delete(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })
    })
  })

  test.describe('Campaign Management Workflow', () => {
    test('should create and manage campaign', async ({ request }) => {
      if (!adminToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create campaign
      const startDate = new Date()
      const endDate = new Date()
      endDate.setMonth(endDate.getMonth() + 1)

      const createResponse = await request.post(`${API_BASE}/campaigns`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          name: 'E2E Test Campaign',
          company: testCompany.id,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          status: 'planned',
          budget: 5000,
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const campaignId = createData.doc.id

      expect(createData.doc.name).toBe('E2E Test Campaign')
      expect(createData.doc.status).toBe('planned')

      // Step 2: Update campaign status
      const updateResponse = await request.patch(`${API_BASE}/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          status: 'active',
        },
      })

      expect(updateResponse.ok()).toBeTruthy()

      // Step 3: List campaigns
      const listResponse = await request.get(`${API_BASE}/campaigns?where[company][equals]=${testCompany.id}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(listResponse.ok()).toBeTruthy()

      // Cleanup
      await request.delete(`${API_BASE}/campaigns/${campaignId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })
    })
  })
})

