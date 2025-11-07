/**
 * Content Generation API Endpoint
 * POST /api/generate
 * 
 * Creates a Content Generation Request and generates 3 GeneratedPosts
 * (one for each writing style: story_based, insight_focused, engagement_focused)
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { NextRequest, NextResponse } from 'next/server'
import { withErrorHandling, ErrorResponses, createSuccessResponse } from '@/middleware/error-handling'
import { withRateLimit, RateLimitConfigs } from '@/middleware/rate-limiting'
import { validateYouTubeUrl, validateBlogUrl, validateMemoText } from '@/lib/utils/validation'
import { triggerContentGeneration } from '@/services/n8n/webhook-client'

interface ContentGenerationRequest {
  inputType: 'youtube' | 'blog' | 'memo'
  youtubeUrl?: string
  blogUrl?: string
  memoText?: string
  company: string // Company ID
  customInstructions?: string
  callToAction?: string
  generateImage?: boolean
}

async function handleGenerate(req: NextRequest) {
  if (req.method !== 'POST') {
    return ErrorResponses.badRequest('Only POST method is allowed', undefined, req.url)
  }

  const payload = await getPayload({ config: configPromise })

  // Get request body
  let body: ContentGenerationRequest
  try {
    body = await req.json()
  } catch {
    return ErrorResponses.badRequest('Invalid JSON in request body', undefined, req.url)
  }

  // Validate input type
  if (!body.inputType || !['youtube', 'blog', 'memo'].includes(body.inputType)) {
    return ErrorResponses.badRequest(
      'Invalid inputType. Must be one of: youtube, blog, memo',
      undefined,
      req.url
    )
  }

  // Validate input based on type
  if (body.inputType === 'youtube') {
    if (!body.youtubeUrl) {
      return ErrorResponses.badRequest('youtubeUrl is required for youtube input type', undefined, req.url)
    }
    if (!validateYouTubeUrl(body.youtubeUrl)) {
      return ErrorResponses.badRequest(
        'Invalid YouTube URL format. Expected: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID',
        undefined,
        req.url
      )
    }
  } else if (body.inputType === 'blog') {
    if (!body.blogUrl) {
      return ErrorResponses.badRequest('blogUrl is required for blog input type', undefined, req.url)
    }
    if (!validateBlogUrl(body.blogUrl)) {
      return ErrorResponses.badRequest('Invalid blog URL format. Expected: https://example.com', undefined, req.url)
    }
  } else if (body.inputType === 'memo') {
    if (!body.memoText) {
      return ErrorResponses.badRequest('memoText is required for memo input type', undefined, req.url)
    }
    if (!validateMemoText(body.memoText)) {
      return ErrorResponses.badRequest('Memo text must be at least 50 characters long', undefined, req.url)
    }
  }

  // Validate company exists
  if (!body.company) {
    return ErrorResponses.badRequest('company is required', undefined, req.url)
  }

  let company
  try {
    company = await payload.findByID({
      collection: 'companies',
      id: body.company,
    })
  } catch {
    return ErrorResponses.notFound('Company not found', req.url)
  }

  // Check if company is active
  if (!company.isActive) {
    return ErrorResponses.unprocessableEntity('Company is not active', undefined, req.url)
  }

  // Note: ReferencePost is optional for grouping related posts
  // We skip creating it here as it's not required for content generation
  // Posts can be grouped by referencePost field if needed later
  let referencePostId: string | undefined

  // Create 3 GeneratedPosts (one for each writing style)
  const writingStyles: Array<'story_based' | 'insight_focused' | 'engagement_focused'> = [
    'story_based',
    'insight_focused',
    'engagement_focused',
  ]

  const generatedPosts = []
  const errors: string[] = []

  for (const writingStyle of writingStyles) {
    try {
      const postData: any = {
        company: body.company,
        title: `Generated Post - ${writingStyle}`, // Will be updated by n8n workflow
        content: {
          root: {
            children: [
              {
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'Content wird generiert...',
                    type: 'text',
                    version: 1,
                  },
                ],
                direction: 'ltr',
                format: '',
                indent: 0,
                type: 'paragraph',
                version: 1,
              },
            ],
            direction: 'ltr',
            format: '',
            indent: 0,
            type: 'root',
            version: 1,
          },
        },
        writingStyle,
        category: 'thought_leadership', // Default category, can be updated later
        status: 'draft',
      }

      if (referencePostId) {
        postData.referencePost = referencePostId
      }

      if (body.customInstructions) {
        postData.aiPrompt = body.customInstructions
      }

      const post = await payload.create({
        collection: 'generated-posts',
        data: postData,
      })

      generatedPosts.push(post)

      // Trigger n8n workflow for content generation
      // The workflow will update the post with generated content
      try {
        await triggerContentGeneration(
          typeof post.id === 'string' ? post.id : String(post.id),
          body.generateImage || false,
          payload
        )
      } catch (error) {
        console.error(`Failed to trigger content generation for post ${post.id}:`, error)
        errors.push(`Failed to trigger workflow for ${writingStyle} post`)
      }
    } catch (error) {
      console.error(`Error creating generated post for ${writingStyle}:`, error)
      errors.push(`Failed to create ${writingStyle} post`)
    }
  }

  if (generatedPosts.length === 0) {
    return ErrorResponses.internalServerError(
      'Failed to create any generated posts',
      req.url
    )
  }

  // Return success response with created posts
  return createSuccessResponse(
    {
      posts: generatedPosts,
      referencePostId,
      errors: errors.length > 0 ? errors : undefined,
    },
    201,
    {
      message: `Successfully created ${generatedPosts.length} generated post(s)`,
      totalCreated: generatedPosts.length,
      totalExpected: 3,
    }
  )
}

// Wrap with middleware
export const POST = withRateLimit(
  withErrorHandling(handleGenerate),
  RateLimitConfigs.strict // Use strict rate limiting for content generation
)

