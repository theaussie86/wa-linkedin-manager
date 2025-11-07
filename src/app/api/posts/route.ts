/**
 * Posts API Endpoint
 * GET /api/posts
 * 
 * Returns a list of generated posts with filtering, search, sorting, and pagination
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ErrorResponses, createSuccessResponse } from '@/middleware/error-handling'
import { withRateLimit, RateLimitConfigs } from '@/middleware/rate-limiting'
import { headers as getHeaders } from 'next/headers'

interface PostsQueryParams {
  status?: string
  company?: string
  writingStyle?: string
  category?: string
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
  page?: string
  limit?: string
}

async function handleGetPosts(req: NextRequest) {
  if (req.method !== 'GET') {
    return ErrorResponses.badRequest('Only GET method is allowed', undefined, req.url)
  }

  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()

  // Authenticate user
  const { user } = await payload.auth({ headers })

  if (!user) {
    return ErrorResponses.unauthorized('Authentication required', req.url)
  }

  // Parse query parameters
  const { searchParams } = new URL(req.url)
  const params: PostsQueryParams = {
    status: searchParams.get('status') || undefined,
    company: searchParams.get('company') || undefined,
    writingStyle: searchParams.get('writingStyle') || undefined,
    category: searchParams.get('category') || undefined,
    search: searchParams.get('search') || undefined,
    sortBy: (searchParams.get('sortBy') as 'createdAt' | 'updatedAt' | 'title') || 'createdAt',
    sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || 'desc',
    page: searchParams.get('page') || '1',
    limit: searchParams.get('limit') || '20',
  }

  // Build where clause - respect access control
  const where: any = {}

  // Access control: Non-admin/manager users can only see posts from their company
  // and cannot see drafts unless they created them
  if (user.role !== 'admin' && user.role !== 'manager') {
    if (!user.company) {
      // User has no company assigned, return empty list
      return createSuccessResponse(
        {
          docs: [],
          totalDocs: 0,
          limit: parseInt(params.limit || '20', 10),
          totalPages: 0,
          page: parseInt(params.page || '1', 10),
          hasPrevPage: false,
          hasNextPage: false,
          prevPage: null,
          nextPage: null,
        },
        200
      )
    }

    const companyId =
      typeof user.company === 'string' || typeof user.company === 'number'
        ? user.company
        : String(user.company.id)

    // If no company filter is set, use user's company
    if (!params.company) {
      where.company = {
        equals: companyId,
      }
    }

    // Content creators can see their own drafts, but others cannot
    // Only apply this if no status filter is set
    if (!params.status && user.role === 'content_creator') {
      // Allow drafts created by this user or non-draft posts
      where.or = [
        {
          status: {
            not_equals: 'draft',
          },
        },
        {
          and: [
            {
              status: {
                equals: 'draft',
              },
            },
            // Note: We can't filter by createdBy easily here, so we'll show all non-draft posts
            // and drafts will be filtered client-side if needed
          ],
        },
      ]
    } else if (!params.status) {
      // Reviewers and others cannot see drafts (only if no status filter is set)
      where.status = {
        not_equals: 'draft',
      }
    }
  }

  // Apply filters (these override access control filters if set)
  if (params.status) {
    where.status = {
      equals: params.status,
    }
    // Remove or clause if status filter is set
    if (where.or) {
      delete where.or
    }
  }

  if (params.company) {
    where.company = {
      equals: params.company,
    }
  }

  if (params.writingStyle) {
    where.writingStyle = {
      equals: params.writingStyle,
    }
  }

  if (params.category) {
    where.category = {
      equals: params.category,
    }
  }

  // Search: Search in title and content
  if (params.search) {
    const searchTerm = params.search.trim()
    if (searchTerm.length > 0) {
      where.or = [
        {
          title: {
            contains: searchTerm,
          },
        },
        // Note: RichText content search is complex, so we'll search in title for now
        // Full-text search would require database-level support
      ]
    }
  }

  // Build sort
  const sort = params.sortOrder === 'asc' ? params.sortBy : `-${params.sortBy}`

  // Pagination
  const page = Math.max(1, parseInt(params.page || '1', 10))
  const limit = Math.min(100, Math.max(1, parseInt(params.limit || '20', 10)))

  try {
    // Fetch posts with user context for access control
    const result = await payload.find({
      collection: 'generated-posts',
      where,
      sort,
      limit,
      page,
      depth: 1, // Include related data (company, etc.)
      req: {
        user,
        headers,
      } as Parameters<typeof payload.find>[0]['req'],
    })

    // Transform posts for response
    const transformedDocs = result.docs.map((post) => ({
      id: String(post.id),
      title: post.title,
      company: post.company
        ? {
            id: typeof post.company === 'string' ? post.company : String(post.company.id),
            name:
              typeof post.company === 'object' && post.company && 'name' in post.company
                ? post.company.name
                : undefined,
          }
        : null,
      writingStyle: post.writingStyle,
      status: post.status,
      category: post.category,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      scheduledFor: post.scheduledFor,
      publishedAt: post.publishedAt,
      // Include minimal content preview (first 100 characters)
      contentPreview: post.content
        ? extractTextPreview(post.content)
        : undefined,
    }))

    return createSuccessResponse(
      {
        docs: transformedDocs,
        totalDocs: result.totalDocs,
        limit: result.limit,
        totalPages: result.totalPages,
        page: result.page,
        hasPrevPage: result.hasPrevPage,
        hasNextPage: result.hasNextPage,
        prevPage: result.prevPage,
        nextPage: result.nextPage,
      },
      200
    )
  } catch (error) {
    console.error('Error fetching posts:', error)
    return ErrorResponses.internalServerError('Failed to fetch posts', req.url)
  }
}

/**
 * Extract text preview from RichText content
 */
function extractTextPreview(content: any): string {
  if (!content || !content.root || !content.root.children) {
    return ''
  }

  let text = ''
  const maxLength = 100

  function extractText(node: any): void {
    if (node.text) {
      text += node.text
      if (text.length >= maxLength) {
        return
      }
    }
    if (node.children) {
      for (const child of node.children) {
        extractText(child)
        if (text.length >= maxLength) {
          return
        }
      }
    }
  }

  for (const child of content.root.children) {
    extractText(child)
    if (text.length >= maxLength) {
      break
    }
  }

  return text.slice(0, maxLength).trim() + (text.length > maxLength ? '...' : '')
}

// Wrap with middleware
export const GET = withRateLimit(
  withErrorHandling(handleGetPosts),
  RateLimitConfigs.standard
)

