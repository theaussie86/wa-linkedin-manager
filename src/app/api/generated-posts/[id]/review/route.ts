/**
 * Custom API Endpoint: Review GeneratedPost
 * POST /api/generated-posts/{id}/review
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ErrorResponses, createSuccessResponse } from '@/middleware/error-handling'
import { withRateLimit, RateLimitConfigs } from '@/middleware/rate-limiting'
import { withValidation } from '@/middleware/api-validation'

async function handleReview(req: NextRequest, { params }: { params: { id: string } }) {
  if (req.method !== 'POST') {
    return ErrorResponses.badRequest('Only POST method is allowed', undefined, req.url)
  }

  const payload = await getPayload({ config: configPromise })
  const { id } = params

  // Get request body
  let body: { action: string; comments?: string }
  try {
    body = await req.json()
  } catch {
    return ErrorResponses.badRequest('Invalid JSON in request body', undefined, req.url)
  }

  // Validate action
  const validActions = ['approve', 'reject', 'request_changes']
  if (!body.action || !validActions.includes(body.action)) {
    return ErrorResponses.badRequest(
      `Invalid action. Must be one of: ${validActions.join(', ')}`,
      undefined,
      req.url
    )
  }

  // Find the generated post
  let generatedPost
  try {
    generatedPost = await payload.findByID({
      collection: 'generated-posts',
      id,
    })
  } catch {
    return ErrorResponses.notFound('Generated post not found', req.url)
  }

  // Validate current status allows review action
  const currentStatus = generatedPost.status
  if (currentStatus !== 'review' && currentStatus !== 'draft') {
    return ErrorResponses.unprocessableEntity(
      `Cannot review post with status '${currentStatus}'. Post must be in 'review' or 'draft' status.`,
      undefined,
      req.url
    )
  }

  // Get current user for reviewer tracking
  const user = (req as any).user
  const reviewerId = user?.id || null

  // Determine new status based on action
  let newStatus: 'approved' | 'rejected' | 'draft' = 'draft'
  if (body.action === 'approve') {
    newStatus = 'approved'
  } else if (body.action === 'reject') {
    newStatus = 'rejected'
  } else if (body.action === 'request_changes') {
    newStatus = 'draft'
  }

  // Update the post
  const updateData: any = {
    status: newStatus,
    reviewedBy: reviewerId,
    reviewedAt: new Date().toISOString(),
  }

  // Store review comments if provided
  if (body.comments) {
    updateData.reviewComments = body.comments
  }

  try {
    await payload.update({
      collection: 'generated-posts',
      id,
      data: updateData,
    })
  } catch (error) {
    console.error('Error updating generated post:', error)
    return ErrorResponses.internalServerError('Failed to update post', req.url)
  }

  // Fetch updated post with relations
  const updatedPost = await payload.findByID({
    collection: 'generated-posts',
    id,
    depth: 2,
  })

  return createSuccessResponse(updatedPost, 200, {
    message: `Post ${body.action === 'approve' ? 'approved' : body.action === 'reject' ? 'rejected' : 'sent back for changes'} successfully`,
  })
}

// Wrap with middleware
export const POST = withRateLimit(
  withErrorHandling(
    withValidation(handleReview, {
      bodySchema: {
        required: ['action'],
        properties: {
          action: {
            type: 'string',
            enum: ['approve', 'reject', 'request_changes'],
          },
          comments: {
            type: 'string',
          },
        },
      },
    })
  ),
  RateLimitConfigs.standard
)

