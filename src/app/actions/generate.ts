'use server'

/**
 * Server Actions for Content Generation
 * Replaces /api/generate endpoint
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'
import { validateYouTubeUrl, validateBlogUrl, validateMemoText } from '@/lib/utils/validation'
import { triggerContentGeneration } from '@/services/n8n/webhook-client'

export interface ContentGenerationRequest {
  inputType: 'youtube' | 'blog' | 'memo'
  youtubeUrl?: string
  blogUrl?: string
  memoText?: string
  company: string
  customInstructions?: string
  callToAction?: string
  generateImage?: boolean
}

export interface GeneratedPost {
  id: string
  title: string
  content: any
  writingStyle: 'story_based' | 'insight_focused' | 'engagement_focused'
  status: string
  company: string | { id: string; name: string }
  category: string
  createdAt: string
  updatedAt: string
}

export interface ContentGenerationResponse {
  posts: GeneratedPost[]
  referencePostId?: string
  errors?: string[]
}

export interface ContentGenerationError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

/**
 * Generates content based on input (YouTube, Blog, or Memo)
 */
export async function generateContent(
  request: ContentGenerationRequest
): Promise<ContentGenerationResponse> {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()

  // Validate input type
  if (!request.inputType || !['youtube', 'blog', 'memo'].includes(request.inputType)) {
    throw new Error('Invalid inputType. Must be one of: youtube, blog, memo')
  }

  // Validate input based on type
  if (request.inputType === 'youtube') {
    if (!request.youtubeUrl) {
      throw new Error('youtubeUrl is required for youtube input type')
    }
    if (!validateYouTubeUrl(request.youtubeUrl)) {
      throw new Error(
        'Invalid YouTube URL format. Expected: https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID'
      )
    }
  } else if (request.inputType === 'blog') {
    if (!request.blogUrl) {
      throw new Error('blogUrl is required for blog input type')
    }
    if (!validateBlogUrl(request.blogUrl)) {
      throw new Error('Invalid blog URL format. Expected: https://example.com')
    }
  } else if (request.inputType === 'memo') {
    if (!request.memoText) {
      throw new Error('memoText is required for memo input type')
    }
    if (!validateMemoText(request.memoText)) {
      throw new Error('Memo text must be at least 50 characters long')
    }
  }

  // Validate company exists
  if (!request.company) {
    throw new Error('company is required')
  }

  let company
  try {
    company = await payload.findByID({
      collection: 'companies',
      id: request.company,
    })
  } catch {
    throw new Error('Company not found')
  }

  // Check if company is active
  if (!company.isActive) {
    throw new Error('Company is not active')
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

  const generatedPosts: GeneratedPost[] = []
  const errors: string[] = []

  for (const writingStyle of writingStyles) {
    try {
      const postData: any = {
        company: request.company,
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

      if (request.customInstructions) {
        postData.aiPrompt = request.customInstructions
      }

      const post = await payload.create({
        collection: 'generated-posts',
        data: postData,
        req: {
          headers: headersList,
        } as Parameters<typeof payload.create>[0]['req'],
      })

      generatedPosts.push({
        id: String(post.id),
        title: post.title,
        content: post.content,
        writingStyle: post.writingStyle,
        status: post.status,
        company: request.company,
        category: post.category,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      })

      // Trigger n8n workflow for content generation
      // The workflow will update the post with generated content
      try {
        await triggerContentGeneration(
          typeof post.id === 'string' ? post.id : String(post.id),
          request.generateImage || false,
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
    throw new Error('Failed to create any generated posts')
  }

  return {
    posts: generatedPosts,
    referencePostId,
    errors: errors.length > 0 ? errors : undefined,
  }
}

