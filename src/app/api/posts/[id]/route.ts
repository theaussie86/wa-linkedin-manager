/**
 * Post Detail API Endpoint
 * GET /api/posts/[id] - Get a single post with variants
 * PUT /api/posts/[id] - Update a post
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ErrorResponses, createSuccessResponse } from '@/middleware/error-handling'
import { withRateLimit, RateLimitConfigs } from '@/middleware/rate-limiting'
import { headers as getHeaders } from 'next/headers'

/**
 * GET /api/posts/[id]
 * Fetches a single post by ID and includes variants (posts with same referencePost)
 */
async function handleGetPost(req: NextRequest, { params }: { params: { id: string } }) {
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

  const postId = params.id

  try {
    // Fetch the post with depth 2 to include related data
    const post = await payload.findByID({
      collection: 'generated-posts',
      id: postId,
      depth: 2,
      req: {
        user,
        headers,
      } as Parameters<typeof payload.findByID>[0]['req'],
    })

    // Access control: Check if user can access this post
    if (user.role !== 'admin' && user.role !== 'manager') {
      if (!user.company) {
        return ErrorResponses.forbidden('Access denied', req.url)
      }

      const companyId =
        typeof user.company === 'string' || typeof user.company === 'number'
          ? user.company
          : String(user.company.id)

      const postCompanyId =
        typeof post.company === 'string' || typeof post.company === 'number'
          ? post.company
          : String(post.company.id)

      if (postCompanyId !== companyId) {
        return ErrorResponses.forbidden('Access denied', req.url)
      }

      // Content creators can only see their own drafts
      if (post.status === 'draft' && user.role === 'content_creator') {
        const postCreatedBy =
          typeof post.createdBy === 'string' || typeof post.createdBy === 'number'
            ? post.createdBy
            : post.createdBy?.id

        if (postCreatedBy !== user.id) {
          return ErrorResponses.forbidden('Access denied', req.url)
        }
      }

      // Reviewers and others cannot see drafts
      if (post.status === 'draft' && user.role !== 'content_creator') {
        return ErrorResponses.forbidden('Access denied', req.url)
      }
    }

    // Fetch variants (posts with same referencePost)
    let variants: any[] = []
    if (post.referencePost) {
      const referencePostId =
        typeof post.referencePost === 'string' || typeof post.referencePost === 'number'
          ? post.referencePost
          : post.referencePost.id

      const variantsResult = await payload.find({
        collection: 'generated-posts',
        where: {
          referencePost: {
            equals: referencePostId,
          },
        },
        depth: 2,
        limit: 100, // Should be max 3, but set higher for safety
        req: {
          user,
          headers,
        } as Parameters<typeof payload.find>[0]['req'],
      })

      variants = variantsResult.docs
        .filter((p) => String(p.id) !== String(postId)) // Exclude current post
        .map(transformPost)
    }

    // Transform post for response
    const transformedPost = transformPost(post)

    return createSuccessResponse(
      {
        ...transformedPost,
        variants,
      },
      200
    )
  } catch (error: any) {
    console.error('Error fetching post:', error)

    // Handle not found
    if (error.status === 404 || error.message?.includes('not found')) {
      return ErrorResponses.notFound('Post not found', req.url)
    }

    return ErrorResponses.internalServerError('Failed to fetch post', req.url)
  }
}

/**
 * PUT /api/posts/[id]
 * Updates a post
 */
async function handleUpdatePost(req: NextRequest, { params }: { params: { id: string } }) {
  if (req.method !== 'PUT') {
    return ErrorResponses.badRequest('Only PUT method is allowed', undefined, req.url)
  }

  const payload = await getPayload({ config: configPromise })
  const headers = await getHeaders()

  // Authenticate user
  const { user } = await payload.auth({ headers })

  if (!user) {
    return ErrorResponses.unauthorized('Authentication required', req.url)
  }

  const postId = params.id

  try {
    // Fetch existing post to check access and validate status transitions
    const existingPost = await payload.findByID({
      collection: 'generated-posts',
      id: postId,
      depth: 1,
      req: {
        user,
        headers,
      } as Parameters<typeof payload.findByID>[0]['req'],
    })

    // Access control: Check if user can update this post
    if (user.role !== 'admin' && user.role !== 'manager') {
      if (!user.company) {
        return ErrorResponses.forbidden('Access denied', req.url)
      }

      const companyId =
        typeof user.company === 'string' || typeof user.company === 'number'
          ? user.company
          : String(user.company.id)

      const postCompanyId =
        typeof existingPost.company === 'string' || typeof existingPost.company === 'number'
          ? existingPost.company
          : String(existingPost.company.id)

      if (postCompanyId !== companyId) {
        return ErrorResponses.forbidden('Access denied', req.url)
      }

      // Content creators can only update their own draft posts
      if (user.role === 'content_creator') {
        if (existingPost.status !== 'draft') {
          return ErrorResponses.forbidden('Only draft posts can be edited', req.url)
        }

        const postCreatedBy =
          typeof existingPost.createdBy === 'string' || typeof existingPost.createdBy === 'number'
            ? existingPost.createdBy
            : existingPost.createdBy?.id

        if (postCreatedBy !== user.id) {
          return ErrorResponses.forbidden('Access denied', req.url)
        }
      }

      // Reviewers can only update posts in review status
      if (user.role === 'reviewer') {
        if (existingPost.status !== 'review') {
          return ErrorResponses.forbidden('Only posts in review can be updated', req.url)
        }
      }
    }

    // Parse request body
    const body = await req.json()
    const updateData: any = {}

    // Validate and prepare update data
    if (body.title !== undefined) {
      updateData.title = body.title
    }
    if (body.content !== undefined) {
      updateData.content = body.content
    }
    if (body.writingStyle !== undefined) {
      if (!['story_based', 'insight_focused', 'engagement_focused'].includes(body.writingStyle)) {
        return ErrorResponses.badRequest('Invalid writing style', undefined, req.url)
      }
      updateData.writingStyle = body.writingStyle
    }
    if (body.category !== undefined) {
      const validCategories = [
        'thought_leadership',
        'industry_insights',
        'company_updates',
        'educational',
        'behind_scenes',
        'case_studies',
      ]
      if (!validCategories.includes(body.category)) {
        return ErrorResponses.badRequest('Invalid category', undefined, req.url)
      }
      updateData.category = body.category
    }
    if (body.tags !== undefined) {
      updateData.tags = body.tags
    }

    // Handle status transitions
    if (body.status !== undefined && body.status !== existingPost.status) {
      const newStatus = body.status
      const oldStatus = existingPost.status

      // Validate status transition
      const validTransitions: Record<string, string[]> = {
        draft: ['review'],
        review: ['approved', 'rejected'],
        approved: ['scheduled'],
        scheduled: ['published'],
        rejected: ['draft'], // Can be re-submitted
        published: [], // Published posts cannot be changed
      }

      if (!validTransitions[oldStatus || 'draft']?.includes(newStatus)) {
        return ErrorResponses.badRequest(
          `Invalid status transition from ${oldStatus} to ${newStatus}`,
          undefined,
          req.url
        )
      }

      // Role-based status transition validation
      if (newStatus === 'review' && user.role !== 'content_creator' && user.role !== 'admin' && user.role !== 'manager') {
        return ErrorResponses.forbidden('Only content creators can submit posts for review', req.url)
      }

      if ((newStatus === 'approved' || newStatus === 'rejected') && user.role !== 'reviewer' && user.role !== 'admin' && user.role !== 'manager') {
        return ErrorResponses.forbidden('Only reviewers can approve or reject posts', req.url)
      }

      if (newStatus === 'scheduled' && user.role !== 'manager' && user.role !== 'admin') {
        return ErrorResponses.forbidden('Only managers can schedule posts', req.url)
      }

      updateData.status = newStatus

      // Set review metadata if approving/rejecting
      if (newStatus === 'approved' || newStatus === 'rejected') {
        updateData.reviewedBy = user.id
        updateData.reviewedAt = new Date().toISOString()
        if (newStatus === 'rejected' && body.reviewComments) {
          updateData.reviewComments = body.reviewComments
        }
      }

      // Set scheduledFor if scheduling
      if (newStatus === 'scheduled' && body.scheduledFor) {
        updateData.scheduledFor = body.scheduledFor
      }
    }

    // Update the post
    const updatedPost = await payload.update({
      collection: 'generated-posts',
      id: postId,
      data: updateData,
      depth: 2,
      req: {
        user,
        headers,
      } as Parameters<typeof payload.update>[0]['req'],
    })

    return createSuccessResponse(transformPost(updatedPost), 200)
  } catch (error: any) {
    console.error('Error updating post:', error)

    // Handle not found
    if (error.status === 404 || error.message?.includes('not found')) {
      return ErrorResponses.notFound('Post not found', req.url)
    }

    // Handle validation errors
    if (error.errors && Array.isArray(error.errors)) {
      return ErrorResponses.unprocessableEntity('Validation failed', { errors: error.errors }, req.url)
    }

    return ErrorResponses.internalServerError('Failed to update post', req.url)
  }
}

/**
 * Transform post for API response
 */
function transformPost(post: any) {
  return {
    id: String(post.id),
    title: post.title,
    content: post.content,
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
    tags: post.tags || [],
    images: post.images || [],
    aiPrompt: post.aiPrompt,
    aiModel: post.aiModel,
    generatedAt: post.generatedAt,
    reviewedBy: post.reviewedBy
      ? {
          id: typeof post.reviewedBy === 'string' ? post.reviewedBy : String(post.reviewedBy.id),
          name:
            typeof post.reviewedBy === 'object' && post.reviewedBy && 'name' in post.reviewedBy
              ? post.reviewedBy.name
              : undefined,
        }
      : null,
    reviewComments: post.reviewComments,
    reviewedAt: post.reviewedAt,
    scheduledFor: post.scheduledFor,
    publishedAt: post.publishedAt,
    referencePost: post.referencePost
      ? {
          id:
            typeof post.referencePost === 'string'
              ? post.referencePost
              : String(post.referencePost.id),
        }
      : null,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  }
}

// Route handlers
export const GET = withRateLimit(
  withErrorHandling(handleGetPost),
  RateLimitConfigs.standard
)

export const PUT = withRateLimit(
  withErrorHandling(handleUpdatePost),
  RateLimitConfigs.standard
)

