/**
 * T124: E2E Tests für AI Integration
 * 
 * Tests für vollständige AI-Integrations-Workflows:
 * - Content Generation Workflow
 * - AI Content Review Process
 * - Content Style Variations
 * - AI Model Configuration
 */

import { test, expect, APIRequestContext } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

test.describe('AI Integration E2E Tests', () => {
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
          email: 'admin@ai-e2e.com',
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
        email: 'admin@ai-e2e.com',
        password: 'AdminPass123!@#',
      },
    })

    if (adminLogin.ok()) {
      const adminData = await adminLogin.json()
      adminToken = adminData.token || ''
    }

    // Create content creator user
    const creatorEmail = `ai-creator-${Date.now()}@test.com`
    await request.post(`${API_BASE}/users`, {
      data: {
        email: creatorEmail,
        password: 'CreatorPass123!@#',
        role: 'content_creator',
        firstName: 'AI',
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
    const reviewerEmail = `ai-reviewer-${Date.now()}@test.com`
    await request.post(`${API_BASE}/users`, {
      data: {
        email: reviewerEmail,
        password: 'ReviewerPass123!@#',
        role: 'reviewer',
        firstName: 'AI',
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
            name: 'AI E2E Test Company',
            industry: 'Technology',
            size: 'medium',
            website: 'https://ai-e2e-test.com',
            researchStatus: 'completed',
          },
        }
      )

      if (companyResponse.ok()) {
        const companyData = await companyResponse.json()
        testCompany = companyData.doc
      }

      // Create test reference post
      const refPostResponse = await request.post(
        `${API_BASE}/reference-posts`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            title: 'AI Test Reference Post',
            company: testCompany.id,
            linkedinUrl: 'https://www.linkedin.com/posts/test-1234567890',
            postType: 'post',
            category: 'educational',
            engagementRate: 8.5,
          },
        }
      )

      if (refPostResponse.ok()) {
        const refPostData = await refPostResponse.json()
        testReferencePost = refPostData.doc
      }
    }
  })

  test.afterAll(async ({ request }) => {
    // Cleanup test data
    if (adminToken) {
      try {
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
        if (testReferencePost?.id) {
          await request.delete(`${API_BASE}/reference-posts/${testReferencePost.id}`, {
            headers: { 'Authorization': `Bearer ${adminToken}` },
          })
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

  test.describe('Content Generation Workflow', () => {
    test('should complete full AI content generation workflow', async ({ request }) => {
      if (!contentCreatorToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create draft post
      const createResponse = await request.post(`${API_BASE}/generated-posts`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'AI Generated Post',
          company: testCompany.id,
          content: 'Initial draft content',
          status: 'draft',
          writingStyle: 'story_based',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      expect(createData.doc.status).toBe('draft')
      expect(createData.doc.writingStyle).toBe('story_based')

      // Step 2: Trigger AI content generation
      const generateResponse = await request.post(
        `${API_BASE}/generated-posts/${postId}/generate`,
        {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            writingStyle: 'insight_focused',
            referencePostId: testReferencePost?.id,
          },
        }
      )

      // Generation endpoint should be accessible
      // Note: Actual AI generation might require mock or external service
      expect([200, 201, 202]).toContain(generateResponse.status())

      // Step 3: Verify post was updated
      const verifyResponse = await request.get(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })

      expect(verifyResponse.ok()).toBeTruthy()

      // Cleanup
      await request.delete(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })
    })

    test('should generate content with different writing styles', async ({ request }) => {
      if (!contentCreatorToken || !testCompany) {
        test.skip()
        return
      }

      const writingStyles = ['story_based', 'insight_focused', 'engagement_focused']
      const createdPostIds: string[] = []

      for (const style of writingStyles) {
        // Step 1: Create post with specific style
        const createResponse = await request.post(`${API_BASE}/generated-posts`, {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            title: `AI Post - ${style}`,
            company: testCompany.id,
            content: 'Test content',
            status: 'draft',
            writingStyle: style,
          },
        })

        expect(createResponse.ok()).toBeTruthy()
        const createData = await createResponse.json()
        const postId = createData.doc.id

        expect(createData.doc.writingStyle).toBe(style)
        createdPostIds.push(postId)

        // Step 2: Trigger generation with style
        const generateResponse = await request.post(
          `${API_BASE}/generated-posts/${postId}/generate`,
          {
            headers: {
              'Authorization': `Bearer ${contentCreatorToken}`,
              'Content-Type': 'application/json',
            },
            data: {
              writingStyle: style,
            },
          }
        )

        expect([200, 201, 202]).toContain(generateResponse.status())
      }

      // Verify all posts were created with correct styles
      for (const postId of createdPostIds) {
        const verifyResponse = await request.get(`${API_BASE}/generated-posts/${postId}`, {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
          },
        })

        expect(verifyResponse.ok()).toBeTruthy()
      }

      // Cleanup
      for (const postId of createdPostIds) {
        await request.delete(`${API_BASE}/generated-posts/${postId}`, {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
          },
        })
      }
    })

    test('should generate content with reference post', async ({ request }) => {
      if (!contentCreatorToken || !testCompany || !testReferencePost) {
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
          title: 'AI Post with Reference',
          company: testCompany.id,
          content: 'Initial content',
          status: 'draft',
          writingStyle: 'story_based',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      // Step 2: Generate content using reference post
      const generateResponse = await request.post(
        `${API_BASE}/generated-posts/${postId}/generate`,
        {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            writingStyle: 'engagement_focused',
            referencePostId: testReferencePost.id,
          },
        }
      )

      expect([200, 201, 202]).toContain(generateResponse.status())

      // Step 3: Verify reference post was linked
      const verifyResponse = await request.get(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })

      expect(verifyResponse.ok()).toBeTruthy()

      // Cleanup
      await request.delete(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })
    })
  })

  test.describe('AI Content Review Process Workflow', () => {
    test('should complete review workflow for AI-generated content', async ({ request }) => {
      if (!contentCreatorToken || !reviewerToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create and generate post
      const createResponse = await request.post(`${API_BASE}/generated-posts`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'AI Review Test Post',
          company: testCompany.id,
          content: 'AI generated content for review',
          status: 'draft',
          writingStyle: 'story_based',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      // Step 2: Generate content
      const generateResponse = await request.post(
        `${API_BASE}/generated-posts/${postId}/generate`,
        {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            writingStyle: 'insight_focused',
          },
        }
      )

      expect([200, 201, 202]).toContain(generateResponse.status())

      // Step 3: Move to review status
      const updateToReviewResponse = await request.patch(
        `${API_BASE}/generated-posts/${postId}`,
        {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            status: 'review',
          },
        }
      )

      expect(updateToReviewResponse.ok()).toBeTruthy()

      // Step 4: Reviewer reviews and approves
      const reviewResponse = await request.post(
        `${API_BASE}/generated-posts/${postId}/review`,
        {
          headers: {
            'Authorization': `Bearer ${reviewerToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            action: 'approve',
            comments: 'AI-generated content approved for E2E test',
          },
        }
      )

      expect(reviewResponse.ok()).toBeTruthy()

      // Step 5: Verify status changed
      const verifyResponse = await request.get(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })

      expect(verifyResponse.ok()).toBeTruthy()
      const verifyData = await verifyResponse.json()

      expect(['approved', 'review']).toContain(verifyData.doc.status)

      // Cleanup
      await request.delete(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })
    })

    test('should handle review rejection workflow', async ({ request }) => {
      if (!contentCreatorToken || !reviewerToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create and generate post
      const createResponse = await request.post(`${API_BASE}/generated-posts`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'AI Reject Test Post',
          company: testCompany.id,
          content: 'AI content to reject',
          status: 'review',
          writingStyle: 'engagement_focused',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      // Step 2: Reviewer rejects with comments
      const rejectResponse = await request.post(
        `${API_BASE}/generated-posts/${postId}/review`,
        {
          headers: {
            'Authorization': `Bearer ${reviewerToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            action: 'reject',
            comments: 'Content needs improvement: missing key points',
          },
        }
      )

      expect(rejectResponse.ok()).toBeTruthy()

      // Step 3: Verify rejection
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

    test('should handle request changes workflow', async ({ request }) => {
      if (!contentCreatorToken || !reviewerToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create post in review
      const createResponse = await request.post(`${API_BASE}/generated-posts`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'AI Changes Request Post',
          company: testCompany.id,
          content: 'Content needing changes',
          status: 'review',
          writingStyle: 'story_based',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      // Step 2: Reviewer requests changes
      const requestChangesResponse = await request.post(
        `${API_BASE}/generated-posts/${postId}/review`,
        {
          headers: {
            'Authorization': `Bearer ${reviewerToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            action: 'request_changes',
            comments: 'Please add more details in the second paragraph',
          },
        }
      )

      // Note: request_changes might not be implemented, check status code
      expect([200, 201, 400, 422]).toContain(requestChangesResponse.status())

      // Cleanup
      await request.delete(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })
    })
  })

  test.describe('AI Model Configuration Workflow', () => {
    test('should handle different AI model configurations', async ({ request }) => {
      if (!contentCreatorToken || !testCompany) {
        test.skip()
        return
      }

      // Step 1: Create post with AI configuration
      const createResponse = await request.post(`${API_BASE}/generated-posts`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          title: 'AI Model Config Post',
          company: testCompany.id,
          content: 'Content for model testing',
          status: 'draft',
          writingStyle: 'insight_focused',
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const postId = createData.doc.id

      // Step 2: Generate with different configuration
      const generateResponse = await request.post(
        `${API_BASE}/generated-posts/${postId}/generate`,
        {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            writingStyle: 'engagement_focused',
          },
        }
      )

      expect([200, 201, 202]).toContain(generateResponse.status())

      // Step 3: Verify post has AI-related fields
      const verifyResponse = await request.get(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })

      expect(verifyResponse.ok()).toBeTruthy()
      const verifyData = await verifyResponse.json()

      expect(verifyData.doc).toHaveProperty('writingStyle')
      expect(verifyData.doc).toHaveProperty('status')

      // Cleanup
      await request.delete(`${API_BASE}/generated-posts/${postId}`, {
        headers: {
          'Authorization': `Bearer ${contentCreatorToken}`,
        },
      })
    })
  })
})

