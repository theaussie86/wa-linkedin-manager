'use server'

/**
 * Server Actions for Posts
 * Replaces /api/posts endpoints
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'

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

/**
 * Transform post for response
 */
function transformPost(post: any): PostDetail {
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
    contentPreview: post.content ? extractTextPreview(post.content) : undefined,
  }
}

/**
 * Fetches a list of generated posts with filtering, search, sorting, and pagination
 */
export async function listPosts(params: PostsListParams = {}): Promise<PostsListResponse> {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()

  // Authenticate user
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    throw new Error('Authentication required')
  }

  // Build where clause - respect access control
  const where: any = {}

  // Access control: Non-admin/manager users can only see posts from their company
  // and cannot see drafts unless they created them
  if (user.role !== 'admin' && user.role !== 'manager') {
    if (!user.company) {
      // User has no company assigned, return empty list
      return {
        docs: [],
        totalDocs: 0,
        limit: params.limit || 20,
        totalPages: 0,
        page: params.page || 1,
        hasPrevPage: false,
        hasNextPage: false,
        prevPage: null,
        nextPage: null,
      }
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
  const sort = params.sortOrder === 'asc' ? params.sortBy || 'createdAt' : `-${params.sortBy || 'createdAt'}`

  // Pagination
  const page = Math.max(1, params.page || 1)
  const limit = Math.min(100, Math.max(1, params.limit || 20))

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
        headers: headersList,
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
      contentPreview: post.content ? extractTextPreview(post.content) : undefined,
    }))

    return {
      docs: transformedDocs,
      totalDocs: result.totalDocs,
      limit: result.limit,
      totalPages: result.totalPages,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
    }
  } catch (error) {
    console.error('Error fetching posts:', error)
    throw new Error('Failed to fetch posts')
  }
}

/**
 * Fetches a single post by ID with variants
 */
export async function getPost(postId: string): Promise<PostDetail> {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()

  // Authenticate user
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    throw new Error('Authentication required')
  }

  try {
    // Fetch the post with depth 2 to include related data
    const post = await payload.findByID({
      collection: 'generated-posts',
      id: postId,
      depth: 2,
      req: {
        user,
        headers: headersList,
      } as Parameters<typeof payload.findByID>[0]['req'],
    })

    // Access control: Check if user can access this post
    if (user.role !== 'admin' && user.role !== 'manager') {
      if (!user.company) {
        throw new Error('Access denied')
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
        throw new Error('Access denied')
      }

      // Content creators can only see their own drafts
      if (post.status === 'draft' && user.role === 'content_creator') {
        const postCreatedBy =
          typeof post.createdBy === 'string' || typeof post.createdBy === 'number'
            ? post.createdBy
            : post.createdBy?.id

        if (postCreatedBy !== user.id) {
          throw new Error('Access denied')
        }
      }

      // Reviewers and others cannot see drafts
      if (post.status === 'draft' && user.role !== 'content_creator') {
        throw new Error('Access denied')
      }
    }

    // Fetch variants (posts with same referencePost)
    let variants: PostDetail[] = []
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
          headers: headersList,
        } as Parameters<typeof payload.find>[0]['req'],
      })

      variants = variantsResult.docs
        .filter((p) => String(p.id) !== String(postId)) // Exclude current post
        .map(transformPost)
    }

    // Transform post for response
    const transformedPost = transformPost(post)

    return {
      ...transformedPost,
      variants,
    }
  } catch (error: any) {
    console.error('Error fetching post:', error)

    // Handle not found
    if (error.status === 404 || error.message?.includes('not found')) {
      throw new Error('Post not found')
    }

    throw error instanceof Error ? error : new Error('Failed to fetch post')
  }
}

/**
 * Updates a post
 */
export async function updatePost(postId: string, data: UpdatePostParams): Promise<PostDetail> {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()

  // Authenticate user
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    throw new Error('Authentication required')
  }

  try {
    // Fetch existing post to check access and validate status transitions
    const existingPost = await payload.findByID({
      collection: 'generated-posts',
      id: postId,
      depth: 1,
      req: {
        user,
        headers: headersList,
      } as Parameters<typeof payload.findByID>[0]['req'],
    })

    // Access control: Check if user can update this post
    if (user.role !== 'admin' && user.role !== 'manager') {
      if (!user.company) {
        throw new Error('Access denied')
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
        throw new Error('Access denied')
      }

      // Content creators can only update their own draft posts
      if (user.role === 'content_creator') {
        if (existingPost.status !== 'draft') {
          throw new Error('Only draft posts can be edited')
        }

        const postCreatedBy =
          typeof existingPost.createdBy === 'string' || typeof existingPost.createdBy === 'number'
            ? existingPost.createdBy
            : existingPost.createdBy?.id

        if (postCreatedBy !== user.id) {
          throw new Error('Access denied')
        }
      }

      // Reviewers can only update posts in review status
      if (user.role === 'reviewer') {
        if (existingPost.status !== 'review') {
          throw new Error('Only posts in review can be updated')
        }
      }
    }

    // Validate and prepare update data
    const updateData: any = {}

    if (data.title !== undefined) {
      updateData.title = data.title
    }
    if (data.content !== undefined) {
      updateData.content = data.content
    }
    if (data.writingStyle !== undefined) {
      if (!['story_based', 'insight_focused', 'engagement_focused'].includes(data.writingStyle)) {
        throw new Error('Invalid writing style')
      }
      updateData.writingStyle = data.writingStyle
    }
    if (data.category !== undefined) {
      const validCategories = [
        'thought_leadership',
        'industry_insights',
        'company_updates',
        'educational',
        'behind_scenes',
        'case_studies',
      ]
      if (!validCategories.includes(data.category)) {
        throw new Error('Invalid category')
      }
      updateData.category = data.category
    }
    if (data.tags !== undefined) {
      updateData.tags = data.tags
    }

    // Handle status transitions
    if (data.status !== undefined && data.status !== existingPost.status) {
      const newStatus = data.status
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
        throw new Error(`Invalid status transition from ${oldStatus} to ${newStatus}`)
      }

      // Role-based status transition validation
      if (newStatus === 'review' && user.role !== 'content_creator' && user.role !== 'admin' && user.role !== 'manager') {
        throw new Error('Only content creators can submit posts for review')
      }

      if ((newStatus === 'approved' || newStatus === 'rejected') && user.role !== 'reviewer' && user.role !== 'admin' && user.role !== 'manager') {
        throw new Error('Only reviewers can approve or reject posts')
      }

      if (newStatus === 'scheduled' && user.role !== 'manager' && user.role !== 'admin') {
        throw new Error('Only managers can schedule posts')
      }

      updateData.status = newStatus

      // Set review metadata if approving/rejecting
      if (newStatus === 'approved' || newStatus === 'rejected') {
        updateData.reviewedBy = user.id
        updateData.reviewedAt = new Date().toISOString()
        if (newStatus === 'rejected' && data.reviewComments) {
          updateData.reviewComments = data.reviewComments
        }
      }

      // Set scheduledFor if scheduling
      if (newStatus === 'scheduled' && data.scheduledFor) {
        updateData.scheduledFor = data.scheduledFor
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
        headers: headersList,
      } as Parameters<typeof payload.update>[0]['req'],
    })

    return transformPost(updatedPost)
  } catch (error: any) {
    console.error('Error updating post:', error)

    // Handle not found
    if (error.status === 404 || error.message?.includes('not found')) {
      throw new Error('Post not found')
    }

    throw error instanceof Error ? error : new Error('Failed to update post')
  }
}

