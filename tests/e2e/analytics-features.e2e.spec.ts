/**
 * T123: E2E Tests für Analytics Features
 * 
 * Tests für vollständige Analytics-Workflows:
 * - PostAnalytics Data Collection
 * - Metrics Aggregation
 * - Time-based Analytics Queries
 * - Analytics Reporting
 */

import { test, expect, APIRequestContext } from '@playwright/test'

const BASE_URL = process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000'
const API_BASE = `${BASE_URL}/api`

test.describe('Analytics Features E2E Tests', () => {
  let apiContext: APIRequestContext
  let adminToken: string
  let contentCreatorToken: string
  let testCompany: any
  let testGeneratedPost: any

  test.beforeAll(async ({ request }) => {
    apiContext = request

    // Create admin user
    try {
      await request.post(`${API_BASE}/users`, {
        data: {
          email: 'admin@analytics-e2e.com',
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
        email: 'admin@analytics-e2e.com',
        password: 'AdminPass123!@#',
      },
    })

    if (adminLogin.ok()) {
      const adminData = await adminLogin.json()
      adminToken = adminData.token || ''
    }

    // Create content creator user
    const creatorEmail = `analytics-creator-${Date.now()}@test.com`
    await request.post(`${API_BASE}/users`, {
      data: {
        email: creatorEmail,
        password: 'CreatorPass123!@#',
        role: 'content_creator',
        firstName: 'Analytics',
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
            name: 'Analytics E2E Test Company',
            industry: 'Technology',
            size: 'medium',
            website: 'https://analytics-e2e-test.com',
            researchStatus: 'completed',
          },
        }
      )

      if (companyResponse.ok()) {
        const companyData = await companyResponse.json()
        testCompany = companyData.doc
      }
    }

    // Create test generated post
    if (contentCreatorToken && testCompany) {
      const postResponse = await request.post(
        `${API_BASE}/generated-posts`,
        {
          headers: {
            'Authorization': `Bearer ${contentCreatorToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            title: 'Analytics Test Post',
            company: testCompany.id,
            content: 'Content for analytics testing',
            status: 'published',
            writingStyle: 'story_based',
          },
        }
      )

      if (postResponse.ok()) {
        const postData = await postResponse.json()
        testGeneratedPost = postData.doc
      }
    }
  })

  test.afterAll(async ({ request }) => {
    // Cleanup test data
    if (adminToken) {
      try {
        // Delete analytics
        const analyticsResponse = await request.get(`${API_BASE}/post-analytics?limit=1000`, {
          headers: { 'Authorization': `Bearer ${adminToken}` },
        })
        if (analyticsResponse.ok()) {
          const analyticsData = await analyticsResponse.json()
          for (const analytic of analyticsData.docs || []) {
            await request.delete(`${API_BASE}/post-analytics/${analytic.id}`, {
              headers: { 'Authorization': `Bearer ${adminToken}` },
            })
          }
        }

        // Delete generated posts
        if (testGeneratedPost?.id) {
          await request.delete(`${API_BASE}/generated-posts/${testGeneratedPost.id}`, {
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

  test.describe('PostAnalytics Data Collection Workflow', () => {
    test('should create and collect analytics data', async ({ request }) => {
      if (!adminToken || !testGeneratedPost) {
        test.skip()
        return
      }

      // Step 1: Create analytics entry
      const createResponse = await request.post(`${API_BASE}/post-analytics`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          post: testGeneratedPost.id,
          metricType: 'views',
          value: 150,
          period: 'daily',
          date: new Date().toISOString(),
        },
      })

      expect(createResponse.ok()).toBeTruthy()
      const createData = await createResponse.json()
      const analyticsId = createData.doc.id

      expect(createData.doc.metricType).toBe('views')
      expect(createData.doc.value).toBe(150)

      // Step 2: Create additional metrics
      const likesResponse = await request.post(`${API_BASE}/post-analytics`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          post: testGeneratedPost.id,
          metricType: 'likes',
          value: 25,
          period: 'daily',
          date: new Date().toISOString(),
        },
      })

      expect(likesResponse.ok()).toBeTruthy()

      const commentsResponse = await request.post(`${API_BASE}/post-analytics`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          post: testGeneratedPost.id,
          metricType: 'comments',
          value: 10,
          period: 'daily',
          date: new Date().toISOString(),
        },
      })

      expect(commentsResponse.ok()).toBeTruthy()

      // Step 3: Read analytics data
      const readResponse = await request.get(`${API_BASE}/post-analytics/${analyticsId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })

      expect(readResponse.ok()).toBeTruthy()
      const readData = await readResponse.json()

      expect(readData.doc).toHaveProperty('post')
      expect(readData.doc).toHaveProperty('metricType')
      expect(readData.doc).toHaveProperty('value')

      // Cleanup
      await request.delete(`${API_BASE}/post-analytics/${analyticsId}`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
        },
      })
    })

    test('should handle multiple metric types', async ({ request }) => {
      if (!adminToken || !testGeneratedPost) {
        test.skip()
        return
      }

      const metricTypes = ['views', 'likes', 'comments', 'shares', 'clicks']

      const createdMetrics: string[] = []

      // Create metrics for each type
      for (const metricType of metricTypes) {
        const response = await request.post(`${API_BASE}/post-analytics`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            post: testGeneratedPost.id,
            metricType,
            value: Math.floor(Math.random() * 100),
            period: 'daily',
            date: new Date().toISOString(),
          },
        })

        expect(response.ok()).toBeTruthy()
        const data = await response.json()
        createdMetrics.push(data.doc.id)
      }

      // Verify all metrics were created
      const listResponse = await request.get(
        `${API_BASE}/post-analytics?where[post][equals]=${testGeneratedPost.id}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      )

      expect(listResponse.ok()).toBeTruthy()
      const listData = await listResponse.json()

      expect(listData.docs.length).toBeGreaterThanOrEqual(metricTypes.length)

      // Cleanup
      for (const id of createdMetrics) {
        await request.delete(`${API_BASE}/post-analytics/${id}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        })
      }
    })
  })

  test.describe('Time-based Analytics Queries Workflow', () => {
    test('should query analytics by date range', async ({ request }) => {
      if (!adminToken || !testGeneratedPost) {
        test.skip()
        return
      }

      // Create analytics entries for different dates
      const today = new Date()
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const lastWeek = new Date(today)
      lastWeek.setDate(lastWeek.getDate() - 7)

      const createdIds: string[] = []

      // Create today's analytics
      const todayResponse = await request.post(`${API_BASE}/post-analytics`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          post: testGeneratedPost.id,
          metricType: 'views',
          value: 200,
          period: 'daily',
          date: today.toISOString(),
        },
      })

      if (todayResponse.ok()) {
        const data = await todayResponse.json()
        createdIds.push(data.doc.id)
      }

      // Create yesterday's analytics
      const yesterdayResponse = await request.post(`${API_BASE}/post-analytics`, {
        headers: {
          'Authorization': `Bearer ${adminToken}`,
          'Content-Type': 'application/json',
        },
        data: {
          post: testGeneratedPost.id,
          metricType: 'views',
          value: 150,
          period: 'daily',
          date: yesterday.toISOString(),
        },
      })

      if (yesterdayResponse.ok()) {
        const data = await yesterdayResponse.json()
        createdIds.push(data.doc.id)
      }

      // Query analytics for the post
      const queryResponse = await request.get(
        `${API_BASE}/post-analytics?where[post][equals]=${testGeneratedPost.id}&sort=-date`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      )

      expect(queryResponse.ok()).toBeTruthy()
      const queryData = await queryResponse.json()

      expect(queryData.docs).toBeInstanceOf(Array)
      expect(queryData.docs.length).toBeGreaterThanOrEqual(2)

      // Verify sorting by date
      if (queryData.docs.length >= 2) {
        const dates = queryData.docs.map((doc: any) => new Date(doc.date).getTime())
        const sortedDates = [...dates].sort((a, b) => b - a)
        expect(dates).toEqual(sortedDates)
      }

      // Cleanup
      for (const id of createdIds) {
        await request.delete(`${API_BASE}/post-analytics/${id}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        })
      }
    })

    test('should handle different period types', async ({ request }) => {
      if (!adminToken || !testGeneratedPost) {
        test.skip()
        return
      }

      const periods = ['daily', 'weekly', 'monthly'] as const
      const createdIds: string[] = []

      // Create analytics for different periods
      for (const period of periods) {
        const response = await request.post(`${API_BASE}/post-analytics`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            post: testGeneratedPost.id,
            metricType: 'views',
            value: 100,
            period,
            date: new Date().toISOString(),
          },
        })

        if (response.ok()) {
          const data = await response.json()
          createdIds.push(data.doc.id)
        }
      }

      // Query by period type
      const queryResponse = await request.get(
        `${API_BASE}/post-analytics?where[post][equals]=${testGeneratedPost.id}&where[period][equals]=daily`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      )

      expect(queryResponse.ok()).toBeTruthy()
      const queryData = await queryResponse.json()

      // Verify all results have daily period
      for (const doc of queryData.docs || []) {
        expect(doc.period).toBe('daily')
      }

      // Cleanup
      for (const id of createdIds) {
        await request.delete(`${API_BASE}/post-analytics/${id}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        })
      }
    })
  })

  test.describe('Analytics Reporting Workflow', () => {
    test('should aggregate analytics data for reporting', async ({ request }) => {
      if (!adminToken || !testGeneratedPost) {
        test.skip()
        return
      }

      // Create multiple analytics entries
      const createdIds: string[] = []
      const metrics = [
        { type: 'views', value: 150 },
        { type: 'likes', value: 30 },
        { type: 'comments', value: 15 },
        { type: 'shares', value: 5 },
      ]

      for (const metric of metrics) {
        const response = await request.post(`${API_BASE}/post-analytics`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            post: testGeneratedPost.id,
            metricType: metric.type,
            value: metric.value,
            period: 'daily',
            date: new Date().toISOString(),
          },
        })

        if (response.ok()) {
          const data = await response.json()
          createdIds.push(data.doc.id)
        }
      }

      // Query all analytics for the post
      const reportResponse = await request.get(
        `${API_BASE}/post-analytics?where[post][equals]=${testGeneratedPost.id}`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      )

      expect(reportResponse.ok()).toBeTruthy()
      const reportData = await reportResponse.json()

      expect(reportData.docs.length).toBeGreaterThanOrEqual(metrics.length)

      // Verify metrics aggregation
      const viewsData = reportData.docs.filter((doc: any) => doc.metricType === 'views')
      const likesData = reportData.docs.filter((doc: any) => doc.metricType === 'likes')
      const commentsData = reportData.docs.filter((doc: any) => doc.metricType === 'comments')
      const sharesData = reportData.docs.filter((doc: any) => doc.metricType === 'shares')

      expect(viewsData.length).toBeGreaterThanOrEqual(1)
      expect(likesData.length).toBeGreaterThanOrEqual(1)
      expect(commentsData.length).toBeGreaterThanOrEqual(1)
      expect(sharesData.length).toBeGreaterThanOrEqual(1)

      // Cleanup
      for (const id of createdIds) {
        await request.delete(`${API_BASE}/post-analytics/${id}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        })
      }
    })

    test('should generate analytics summary', async ({ request }) => {
      if (!adminToken || !testGeneratedPost) {
        test.skip()
        return
      }

      // Create analytics data
      const createdIds: string[] = []
      for (let i = 0; i < 5; i++) {
        const response = await request.post(`${API_BASE}/post-analytics`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          data: {
            post: testGeneratedPost.id,
            metricType: 'views',
            value: 100 + i * 10,
            period: 'daily',
            date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
          },
        })

        if (response.ok()) {
          const data = await response.json()
          createdIds.push(data.doc.id)
        }
      }

      // Get analytics summary
      const summaryResponse = await request.get(
        `${API_BASE}/post-analytics?where[post][equals]=${testGeneratedPost.id}&where[metricType][equals]=views&sort=-date&limit=10`,
        {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        }
      )

      expect(summaryResponse.ok()).toBeTruthy()
      const summaryData = await summaryResponse.json()

      expect(summaryData.docs).toBeInstanceOf(Array)
      expect(summaryData.totalDocs).toBeGreaterThanOrEqual(5)

      // Verify pagination
      expect(summaryData.limit).toBe(10)
      expect(summaryData.page).toBe(1)

      // Cleanup
      for (const id of createdIds) {
        await request.delete(`${API_BASE}/post-analytics/${id}`, {
          headers: {
            'Authorization': `Bearer ${adminToken}`,
          },
        })
      }
    })
  })
})

