/**
 * Posts API Client
 * Functions for fetching and managing generated posts
 */

import { apiGet, apiPut, ApiClientError } from './base'

export interface PostListItem {
  id: string
  title: string
  company: {
    id: string
    name?: string
  } | null
  writingStyle: 'story_based' | 'insight_focused' | 'engagement_focused'
  status: 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'rejected'
  category: string
  createdAt: string
  updatedAt: string
  scheduledFor?: string
  publishedAt?: string
  contentPreview?: string
}

export interface PostsListResponse {
  docs: PostListItem[]
  totalDocs: number
  limit: number
  totalPages: number
  page: number
  hasPrevPage: boolean
  hasNextPage: boolean
  prevPage: number | null
  nextPage: number | null
}

export interface PostsListParams {
  status?: string
  company?: string
  writingStyle?: 'story_based' | 'insight_focused' | 'engagement_focused'
  category?: string
  search?: string
  sortBy?: 'createdAt' | 'updatedAt' | 'title'
  sortOrder?: 'asc' | 'desc'
  page?: number
  limit?: number
}

/**
 * Fetches a list of generated posts with filtering, search, sorting, and pagination
 */
export async function listPosts(params: PostsListParams = {}): Promise<PostsListResponse> {
  const queryParams = new URLSearchParams()

  if (params.status) {
    queryParams.append('status', params.status)
  }
  if (params.company) {
    queryParams.append('company', params.company)
  }
  if (params.writingStyle) {
    queryParams.append('writingStyle', params.writingStyle)
  }
  if (params.category) {
    queryParams.append('category', params.category)
  }
  if (params.search) {
    queryParams.append('search', params.search)
  }
  if (params.sortBy) {
    queryParams.append('sortBy', params.sortBy)
  }
  if (params.sortOrder) {
    queryParams.append('sortOrder', params.sortOrder)
  }
  if (params.page) {
    queryParams.append('page', String(params.page))
  }
  if (params.limit) {
    queryParams.append('limit', String(params.limit))
  }

  const url = `/api/posts${queryParams.toString() ? `?${queryParams.toString()}` : ''}`

  try {
    const response = await apiGet<{ data: PostsListResponse }>(url)
    return response.data
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }
    throw new ApiClientError('Failed to fetch posts', 500)
  }
}

export interface PostDetail extends PostListItem {
  content: any // RichText content
  tags: Array<{ tag: string; id?: string }>
  images: Array<{ image?: any; id?: string }>
  aiPrompt?: string | null
  aiModel?: string | null
  generatedAt?: string | null
  reviewedBy?: {
    id: string
    name?: string
  } | null
  reviewComments?: string | null
  reviewedAt?: string | null
  referencePost?: {
    id: string
  } | null
  variants?: PostDetail[] // Posts with same referencePost
}

export interface PostDetailResponse {
  data: PostDetail
}

export interface UpdatePostParams {
  title?: string
  content?: any
  writingStyle?: 'story_based' | 'insight_focused' | 'engagement_focused'
  category?: string
  status?: 'draft' | 'review' | 'approved' | 'scheduled' | 'published' | 'rejected'
  tags?: Array<{ tag: string; id?: string }>
  scheduledFor?: string
  reviewComments?: string
}

/**
 * Updates a generated post
 */
export async function updatePost(
  postId: string,
  data: UpdatePostParams
): Promise<PostDetail> {
  try {
    const response = await apiPut<PostDetailResponse>(`/api/posts/${postId}`, data)
    return response.data
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }
    throw new ApiClientError('Failed to update post', 500)
  }
}

/**
 * Fetches a single post by ID with variants
 */
export async function getPost(postId: string): Promise<PostDetail> {
  try {
    const response = await apiGet<PostDetailResponse>(`/api/posts/${postId}`)
    return response.data
  } catch (error) {
    if (error instanceof ApiClientError) {
      throw error
    }
    throw new ApiClientError('Failed to fetch post', 500)
  }
}

