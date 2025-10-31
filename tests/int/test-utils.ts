import { getPayload, Payload } from 'payload'
import configPromise from '@/payload.config'
import type { User, Company, ReferencePost, GeneratedPost, Campaign, PostAnalytics } from '@/payload-types'

export let payload: Payload

/**
 * Initialize Payload instance for tests
 */
export async function initPayload(): Promise<Payload> {
  if (!payload) {
    const config = await configPromise
    payload = await getPayload({ config })
  }
  return payload
}

/**
 * Create a test user with optional role and company
 */
export async function createTestUser(
  data: {
    email: string
    password: string
    role?: 'admin' | 'manager' | 'content_creator' | 'reviewer'
    firstName?: string
    lastName?: string
    company?: string
  }
): Promise<User> {
  const p = await initPayload()
  return await p.create({
    collection: 'users',
    data: {
      email: data.email,
      password: data.password,
      role: data.role || 'content_creator',
      firstName: data.firstName || 'Test',
      lastName: data.lastName || 'User',
      company: data.company,
    },
  })
}

/**
 * Create a test company
 */
export async function createTestCompany(data: {
  name: string
  industry?: string
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise'
  website?: string
}): Promise<Company> {
  const p = await initPayload()
  return await p.create({
    collection: 'companies',
    data: {
      name: data.name,
      industry: data.industry || 'Technology',
      size: data.size || 'medium',
      website: data.website || 'https://example.com',
      researchStatus: 'pending',
    },
  })
}

/**
 * Create a test reference post
 */
export async function createTestReferencePost(data: {
  title: string
  company: string
  linkedinUrl: string
  postType?: 'post' | 'article' | 'poll' | 'video'
  category?: 'educational' | 'promotional' | 'inspirational' | 'entertainment' | 'news'
}): Promise<ReferencePost> {
  const p = await initPayload()
  return await p.create({
    collection: 'reference-posts',
    data: {
      title: data.title,
      company: data.company,
      linkedinUrl: data.linkedinUrl,
      postType: data.postType || 'post',
      category: data.category || 'educational',
      engagementRate: 0,
    },
  })
}

/**
 * Create a test generated post
 */
export async function createTestGeneratedPost(data: {
  title: string
  company: string
  status?: 'draft' | 'review' | 'approved' | 'rejected' | 'published'
  writingStyle?: 'story_based' | 'insight_focused' | 'engagement_focused'
}): Promise<GeneratedPost> {
  const p = await initPayload()
  return await p.create({
    collection: 'generated-posts',
    data: {
      title: data.title,
      company: data.company,
      status: data.status || 'draft',
      writingStyle: data.writingStyle || 'story_based',
      content: 'Test content',
    },
  })
}

/**
 * Login and get authentication token
 */
export async function loginUser(email: string, password: string): Promise<{ token: string; user: User }> {
  const p = await initPayload()
  const result = await p.login({
    collection: 'users',
    data: {
      email,
      password,
    },
  })

  return {
    token: result.token || '',
    user: result.user as User,
  }
}

/**
 * Create authentication headers for API requests
 */
export function createAuthHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
  }
}

/**
 * Clean up test data
 */
export async function cleanupTestData() {
  const p = await initPayload()

  try {
    // Delete in reverse order of dependencies
    const campaigns = await p.find({ collection: 'campaigns', limit: 1000 })
    for (const campaign of campaigns.docs) {
      await p.delete({ collection: 'campaigns', id: campaign.id })
    }

    const generatedPosts = await p.find({ collection: 'generated-posts', limit: 1000 })
    for (const post of generatedPosts.docs) {
      await p.delete({ collection: 'generated-posts', id: post.id })
    }

    const referencePosts = await p.find({ collection: 'reference-posts', limit: 1000 })
    for (const post of referencePosts.docs) {
      await p.delete({ collection: 'reference-posts', id: post.id })
    }

    const postAnalytics = await p.find({ collection: 'post-analytics', limit: 1000 })
    for (const analytic of postAnalytics.docs) {
      await p.delete({ collection: 'post-analytics', id: analytic.id })
    }

    const media = await p.find({ collection: 'media', limit: 1000 })
    for (const item of media.docs) {
      await p.delete({ collection: 'media', id: item.id })
    }

    const companies = await p.find({ collection: 'companies', limit: 1000 })
    for (const company of companies.docs) {
      await p.delete({ collection: 'companies', id: company.id })
    }

    // Delete test users (keep admin users)
    const users = await p.find({ collection: 'users', limit: 1000 })
    for (const user of users.docs) {
      if (!(user as User).email?.includes('admin@') && (user as User).email?.includes('test@')) {
        await p.delete({ collection: 'users', id: user.id })
      }
    }
  } catch (error) {
    console.error('Error cleaning up test data:', error)
  }
}

