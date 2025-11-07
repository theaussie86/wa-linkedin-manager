/**
 * Content Generation API Client
 */

import { apiPost, ApiClientError } from './base'

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
  try {
    const response = await apiPost<{ data: ContentGenerationResponse; meta?: any }>(
      '/api/generate',
      request
    )
    return response.data
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw {
        message: error.message,
        status: error.status,
        errors: error.errors,
      } as ContentGenerationError
    }
    throw {
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    } as ContentGenerationError
  }
}

