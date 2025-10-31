/**
 * Report Generation Logic
 * 
 * Provides functions to generate reports from analytics data.
 * Supports various report formats and templates.
 */

import type { Payload } from 'payload'
import type { PostAnalytics, GeneratedPost, Company } from '@/payload-types'
import { aggregateMetrics, getPostEngagement } from '../analytics/aggregation'
import { queryTimeRange } from '../analytics/time-queries'

export interface ReportOptions {
  companyId?: string
  generatedPostId?: string | string[]
  startDate: Date | string
  endDate: Date | string
  metricTypes?: string[]
  includeSummary?: boolean
  includeDetails?: boolean
  includeCharts?: boolean
}

export interface ReportSection {
  title: string
  data: any
  type: 'summary' | 'table' | 'chart' | 'metrics'
}

export interface GeneratedReport {
  id: string
  title: string
  generatedAt: Date
  dateRange: {
    start: string
    end: string
  }
  sections: ReportSection[]
  summary: {
    totalPosts: number
    totalMetrics: number
    averageEngagementRate: number
  }
}

/**
 * Generate a comprehensive analytics report
 * 
 * @param payload - Payload instance
 * @param options - Report generation options
 * @returns Generated report
 */
export async function generateReport(
  payload: Payload,
  options: ReportOptions
): Promise<GeneratedReport> {
  const reportId = `report_${Date.now()}`

  // Build sections
  const sections: ReportSection[] = []

  // Summary section
  if (options.includeSummary !== false) {
    const summary = await generateSummarySection(payload, options)
    sections.push(summary)
  }

  // Metrics aggregation section
  const metrics = await aggregateMetrics(payload, {
    companyId: options.companyId,
    generatedPostId: options.generatedPostId,
    startDate: options.startDate,
    endDate: options.endDate,
    metricType: options.metricTypes,
  })

  sections.push({
    title: 'Metrics Overview',
    type: 'metrics',
    data: metrics,
  })

  // Time series section
  const timeSeries = await queryTimeRange(payload, {
    companyId: options.companyId,
    generatedPostId: options.generatedPostId,
    startDate: options.startDate,
    endDate: options.endDate,
    metricType: options.metricTypes,
    interval: 'day',
  })

  sections.push({
    title: 'Time Series Data',
    type: 'chart',
    data: timeSeries,
  })

  // Details section
  if (options.includeDetails) {
    const details = await generateDetailsSection(payload, options)
    sections.push(details)
  }

  // Calculate summary metrics
  const summaryMetrics = await calculateSummaryMetrics(payload, options)

  const startDate = typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString().split('T')[0]
  const endDate = typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString().split('T')[0]

  return {
    id: reportId,
    title: `Analytics Report: ${startDate} to ${endDate}`,
    generatedAt: new Date(),
    dateRange: {
      start: startDate,
      end: endDate,
    },
    sections,
    summary: summaryMetrics,
  }
}

/**
 * Generate summary section for report
 * 
 * @param payload - Payload instance
 * @param options - Report options
 * @returns Summary section
 */
async function generateSummarySection(
  payload: Payload,
  options: ReportOptions
): Promise<ReportSection> {
  const summary: {
    totalPosts: number
    totalCompanies: number
    totalMetrics: number
    topPerformingPosts: any[]
  } = {
    totalPosts: 0,
    totalCompanies: 0,
    totalMetrics: 0,
    topPerformingPosts: [],
  }

  // Get posts count
  const where: any = {}
  if (options.companyId) {
    where.company = { equals: options.companyId }
  }
  if (options.generatedPostId) {
    if (Array.isArray(options.generatedPostId)) {
      where.id = { in: options.generatedPostId }
    } else {
      where.id = { equals: options.generatedPostId }
    }
  }

  const posts = await payload.find({
    collection: 'generated-posts',
    where,
    limit: 1000,
  })

  summary.totalPosts = posts.totalDocs

  // Get unique companies
  if (options.companyId) {
    summary.totalCompanies = 1
  } else {
    const companyIds = new Set<string>()
    posts.docs.forEach((post: any) => {
      if (post.company && typeof post.company === 'string') {
        companyIds.add(post.company)
      } else if (post.company && typeof post.company === 'object') {
        companyIds.add(post.company.id)
      }
    })
    summary.totalCompanies = companyIds.size
  }

  // Get metrics count
  const metricsWhere: any = {}
  if (options.generatedPostId) {
    if (Array.isArray(options.generatedPostId)) {
      metricsWhere.generatedPost = { in: options.generatedPostId }
    } else {
      metricsWhere.generatedPost = { equals: options.generatedPostId }
    }
  } else if (posts.docs.length > 0) {
    const postIds = posts.docs.map((post: any) => post.id)
    metricsWhere.generatedPost = { in: postIds }
  }

  if (options.startDate || options.endDate) {
    metricsWhere.date = {}
    if (options.startDate) {
      const start = typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString().split('T')[0]
      metricsWhere.date.greater_than_equal = start
    }
    if (options.endDate) {
      const end = typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString().split('T')[0]
      metricsWhere.date.less_than_equal = end
    }
  }

  const metrics = await payload.find({
    collection: 'post-analytics',
    where: metricsWhere,
    limit: 1, // Just need count
  })

  summary.totalMetrics = metrics.totalDocs

  // Get top performing posts (by engagement rate)
  const topPosts = await getTopPerformingPosts(payload, options, 5)
  summary.topPerformingPosts = topPosts

  return {
    title: 'Summary',
    type: 'summary',
    data: summary,
  }
}

/**
 * Generate details section for report
 * 
 * @param payload - Payload instance
 * @param options - Report options
 * @returns Details section
 */
async function generateDetailsSection(
  payload: Payload,
  options: ReportOptions
): Promise<ReportSection> {
  const where: any = {}
  if (options.companyId) {
    where.company = { equals: options.companyId }
  }
  if (options.generatedPostId) {
    if (Array.isArray(options.generatedPostId)) {
      where.id = { in: options.generatedPostId }
    } else {
      where.id = { equals: options.generatedPostId }
    }
  }

  const posts = await payload.find({
    collection: 'generated-posts',
    where,
    limit: 100,
    populate: ['company'],
  })

  // Get engagement data for each post
  const postsWithMetrics = await Promise.all(
    posts.docs.map(async (post: any) => {
      const engagement = await getPostEngagement(payload, post.id)
      return {
        post: {
          id: post.id,
          title: post.title,
          company: post.company,
          status: post.status,
          publishedAt: post.publishedAt,
        },
        engagement,
      }
    })
  )

  return {
    title: 'Post Details',
    type: 'table',
    data: postsWithMetrics,
  }
}

/**
 * Calculate summary metrics
 * 
 * @param payload - Payload instance
 * @param options - Report options
 * @returns Summary metrics
 */
async function calculateSummaryMetrics(
  payload: Payload,
  options: ReportOptions
): Promise<{
  totalPosts: number
  totalMetrics: number
  averageEngagementRate: number
}> {
  const where: any = {}
  if (options.companyId) {
    where.company = { equals: options.companyId }
  }
  if (options.generatedPostId) {
    if (Array.isArray(options.generatedPostId)) {
      where.id = { in: options.generatedPostId }
    } else {
      where.id = { equals: options.generatedPostId }
    }
  }

  const posts = await payload.find({
    collection: 'generated-posts',
    where,
    limit: 1000,
  })

  const metricsWhere: any = {}
  if (posts.docs.length > 0) {
    const postIds = posts.docs.map((post: any) => post.id)
    metricsWhere.generatedPost = { in: postIds }
  }

  if (options.startDate || options.endDate) {
    metricsWhere.date = {}
    if (options.startDate) {
      const start = typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString().split('T')[0]
      metricsWhere.date.greater_than_equal = start
    }
    if (options.endDate) {
      const end = typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString().split('T')[0]
      metricsWhere.date.less_than_equal = end
    }
  }

  metricsWhere.metricType = { equals: 'engagement_rate' }

  const engagementMetrics = await payload.find({
    collection: 'post-analytics',
    where: metricsWhere,
    limit: 10000,
  })

  const totalEngagement = engagementMetrics.docs.reduce(
    (sum: number, metric: any) => sum + (metric.value || 0),
    0
  )
  const averageEngagementRate =
    engagementMetrics.totalDocs > 0 ? totalEngagement / engagementMetrics.totalDocs : 0

  return {
    totalPosts: posts.totalDocs,
    totalMetrics: engagementMetrics.totalDocs,
    averageEngagementRate,
  }
}

/**
 * Get top performing posts by engagement
 * 
 * @param payload - Payload instance
 * @param options - Report options
 * @param limit - Number of top posts to return
 * @returns Top performing posts
 */
async function getTopPerformingPosts(
  payload: Payload,
  options: ReportOptions,
  limit: number = 10
): Promise<any[]> {
  const where: any = {}
  if (options.companyId) {
    where.company = { equals: options.companyId }
  }
  if (options.generatedPostId) {
    if (Array.isArray(options.generatedPostId)) {
      where.id = { in: options.generatedPostId }
    } else {
      where.id = { equals: options.generatedPostId }
    }
  }

  const posts = await payload.find({
    collection: 'generated-posts',
    where,
    limit: 100,
  })

  // Get engagement for each post
  const postsWithEngagement = await Promise.all(
    posts.docs.map(async (post: any) => {
      const engagement = await getPostEngagement(payload, post.id)
      return {
        post: {
          id: post.id,
          title: post.title,
          status: post.status,
        },
        engagement: engagement.averageEngagementRate,
      }
    })
  )

  // Sort by engagement rate and return top N
  return postsWithEngagement
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit)
}
