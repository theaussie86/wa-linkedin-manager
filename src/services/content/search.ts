/**
 * Content Search and Filtering Service
 * 
 * Provides search and filtering capabilities for content posts.
 * Supports text search, filtering by multiple criteria, and sorting.
 */

import type { Where } from 'payload'

export interface SearchFilters {
  query?: string
  category?: string | string[]
  tags?: string | string[]
  status?: string | string[]
  writingStyle?: string | string[]
  postType?: string | string[]
  companyId?: string | string[]
  userId?: string | string[]
  dateFrom?: Date | string
  dateTo?: Date | string
  minEngagementRate?: number
  maxEngagementRate?: number
}

export interface SearchOptions {
  limit?: number
  page?: number
  sort?: string
  sortDirection?: 'asc' | 'desc'
}

export interface SearchResult<T> {
  docs: T[]
  totalDocs: number
  limit: number
  totalPages: number
  page?: number
  hasPrevPage?: boolean
  hasNextPage?: boolean
  prevPage?: number
  nextPage?: number
}

/**
 * Build Payload CMS where query from search filters
 * 
 * @param filters - Search and filter criteria
 * @returns Payload CMS where clause
 */
export function buildSearchQuery(filters: SearchFilters): Where {
  const where: Where = {}

  // Text search across title and content
  if (filters.query) {
    const query = filters.query.trim()
    if (query.length > 0) {
      where.or = [
        {
          title: {
            contains: query,
          },
        },
        {
          content: {
            contains: query,
          },
        },
      ]
    }
  }

  // Category filter
  if (filters.category) {
    if (Array.isArray(filters.category)) {
      where.category = {
        in: filters.category,
      }
    } else {
      where.category = {
        equals: filters.category,
      }
    }
  }

  // Tags filter
  if (filters.tags) {
    const tagArray = Array.isArray(filters.tags) ? filters.tags : [filters.tags]
    where.tags = {
      contains: tagArray,
    }
  }

  // Status filter
  if (filters.status) {
    if (Array.isArray(filters.status)) {
      where.status = {
        in: filters.status,
      }
    } else {
      where.status = {
        equals: filters.status,
      }
    }
  }

  // Writing style filter
  if (filters.writingStyle) {
    if (Array.isArray(filters.writingStyle)) {
      where.writingStyle = {
        in: filters.writingStyle,
      }
    } else {
      where.writingStyle = {
        equals: filters.writingStyle,
      }
    }
  }

  // Post type filter
  if (filters.postType) {
    if (Array.isArray(filters.postType)) {
      where.postType = {
        in: filters.postType,
      }
    } else {
      where.postType = {
        equals: filters.postType,
      }
    }
  }

  // Company filter
  if (filters.companyId) {
    if (Array.isArray(filters.companyId)) {
      where.company = {
        in: filters.companyId,
      }
    } else {
      where.company = {
        equals: filters.companyId,
      }
    }
  }

  // User filter (for reviewer or creator)
  if (filters.userId) {
    if (Array.isArray(filters.userId)) {
      where.or = [
        ...(where.or || []),
        {
          reviewedBy: {
            in: filters.userId,
          },
        },
      ]
    } else {
      where.or = [
        ...(where.or || []),
        {
          reviewedBy: {
            equals: filters.userId,
          },
        },
      ]
    }
  }

  // Date range filter
  if (filters.dateFrom || filters.dateTo) {
    where.and = where.and || []
    const dateField = filters.dateFrom || filters.dateTo ? 'createdAt' : undefined

    if (dateField) {
      if (filters.dateFrom) {
        where.and.push({
          [dateField]: {
            greater_than_equal: typeof filters.dateFrom === 'string' ? filters.dateFrom : filters.dateFrom.toISOString(),
          },
        })
      }

      if (filters.dateTo) {
        where.and.push({
          [dateField]: {
            less_than_equal: typeof filters.dateTo === 'string' ? filters.dateTo : filters.dateTo.toISOString(),
          },
        })
      }
    }
  }

  // Engagement rate range filter
  if (filters.minEngagementRate !== undefined || filters.maxEngagementRate !== undefined) {
    where.and = where.and || []
    const engagementFilter: Where = {}

    if (filters.minEngagementRate !== undefined) {
      engagementFilter.greater_than_equal = filters.minEngagementRate
    }

    if (filters.maxEngagementRate !== undefined) {
      engagementFilter.less_than_equal = filters.maxEngagementRate
    }

    where.and.push({
      engagementRate: engagementFilter,
    })
  }

  return where
}

/**
 * Parse sort string into Payload CMS sort format
 * 
 * @param sort - Sort field (e.g., "title", "-createdAt")
 * @returns Payload CMS sort string
 */
export function parseSort(sort?: string): string {
  if (!sort) {
    return '-createdAt' // Default: newest first
  }

  // Remove leading dash if present and validate
  const sortField = sort.replace(/^-/, '')
  const validSortFields = [
    'title',
    'createdAt',
    'updatedAt',
    'publishedAt',
    'scheduledFor',
    'status',
    'category',
    'engagementRate',
    'likes',
    'comments',
    'shares',
  ]

  if (!validSortFields.includes(sortField)) {
    return '-createdAt' // Default if invalid
  }

  return sort
}

/**
 * Build complete search query with all filters and options
 * 
 * @param filters - Search and filter criteria
 * @param options - Search options (pagination, sorting)
 * @returns Complete query object for Payload CMS
 */
export function buildCompleteQuery(
  filters: SearchFilters,
  options: SearchOptions = {},
): {
  where: Where
  limit: number
  page?: number
  sort?: string
} {
  const where = buildSearchQuery(filters)
  const limit = options.limit || 20
  const page = options.page || 1
  const sort = parseSort(options.sort || options.sortDirection ? undefined : '-createdAt')

  return {
    where,
    limit,
    page,
    sort,
  }
}

/**
 * Search reference posts with filters
 * 
 * This is a helper function that can be used in API routes or hooks
 * 
 * @param payload - Payload instance
 * @param filters - Search filters
 * @param options - Search options
 * @returns Search results
 */
export async function searchReferencePosts(
  payload: any,
  filters: SearchFilters,
  options: SearchOptions = {},
): Promise<SearchResult<any>> {
  const query = buildCompleteQuery(filters, options)

  const result = await payload.find({
    collection: 'reference-posts',
    where: query.where,
    limit: query.limit,
    page: query.page,
    sort: query.sort,
  })

  return {
    docs: result.docs,
    totalDocs: result.totalDocs,
    limit: result.limit,
    totalPages: result.totalPages,
    page: result.page,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  }
}

/**
 * Search generated posts with filters
 * 
 * @param payload - Payload instance
 * @param filters - Search filters
 * @param options - Search options
 * @returns Search results
 */
export async function searchGeneratedPosts(
  payload: any,
  filters: SearchFilters,
  options: SearchOptions = {},
): Promise<SearchResult<any>> {
  const query = buildCompleteQuery(filters, options)

  const result = await payload.find({
    collection: 'generated-posts',
    where: query.where,
    limit: query.limit,
    page: query.page,
    sort: query.sort,
  })

  return {
    docs: result.docs,
    totalDocs: result.totalDocs,
    limit: result.limit,
    totalPages: result.totalPages,
    page: result.page,
    hasPrevPage: result.hasPrevPage,
    hasNextPage: result.hasNextPage,
    prevPage: result.prevPage,
    nextPage: result.nextPage,
  }
}

/**
 * Get filter options for UI dropdowns
 * 
 * @returns Available filter options
 */
export function getFilterOptions() {
  return {
    categories: [
      { label: 'Thought Leadership', value: 'thought_leadership' },
      { label: 'Industry Insights', value: 'industry_insights' },
      { label: 'Company Updates', value: 'company_updates' },
      { label: 'Educational', value: 'educational' },
      { label: 'Behind the Scenes', value: 'behind_scenes' },
      { label: 'Case Studies', value: 'case_studies' },
    ],
    statuses: [
      { label: 'Draft', value: 'draft' },
      { label: 'Review', value: 'review' },
      { label: 'Approved', value: 'approved' },
      { label: 'Scheduled', value: 'scheduled' },
      { label: 'Published', value: 'published' },
      { label: 'Rejected', value: 'rejected' },
    ],
    writingStyles: [
      { label: 'Story Based', value: 'story_based' },
      { label: 'Insight Focused', value: 'insight_focused' },
      { label: 'Engagement Focused', value: 'engagement_focused' },
    ],
    postTypes: [
      { label: 'Text', value: 'text' },
      { label: 'Image', value: 'image' },
      { label: 'Video', value: 'video' },
      { label: 'Article', value: 'article' },
      { label: 'Poll', value: 'poll' },
    ],
  }
}

