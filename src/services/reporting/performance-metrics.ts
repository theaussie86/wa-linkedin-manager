/**
 * Performance Metrics Calculation
 * 
 * Provides functions to calculate performance metrics from analytics data.
 * Includes KPIs, growth rates, trends, and comparative analytics.
 */

import type { Payload } from 'payload'
import type { PostAnalytics, GeneratedPost } from '@/payload-types'
import { aggregateMetrics } from '../analytics/aggregation'
import { queryTimeRange, comparePeriods } from '../analytics/time-queries'
import { getPostEngagement } from '../analytics/aggregation'

export interface PerformanceMetrics {
  totalEngagement: number
  averageEngagementRate: number
  totalReach: number
  totalImpressions: number
  clickThroughRate: number
  growthRate: number
  topPerformers: {
    postId: string
    title: string
    engagementRate: number
  }[]
}

export interface PerformanceComparison {
  current: PerformanceMetrics
  previous: PerformanceMetrics
  changes: {
    engagement: number
    engagementRate: number
    reach: number
    impressions: number
    clickThroughRate: number
  }
  growthPercentages: {
    engagement: number
    engagementRate: number
    reach: number
    impressions: number
    clickThroughRate: number
  }
}

export interface PerformanceOptions {
  companyId?: string
  generatedPostId?: string | string[]
  startDate: Date | string
  endDate: Date | string
  previousPeriod?: {
    startDate: Date | string
    endDate: Date | string
  }
}

/**
 * Calculate performance metrics
 * 
 * @param payload - Payload instance
 * @param options - Performance calculation options
 * @returns Performance metrics
 */
export async function calculatePerformanceMetrics(
  payload: Payload,
  options: PerformanceOptions
): Promise<PerformanceMetrics> {
  // Aggregate all metrics
  const aggregation = await aggregateMetrics(payload, {
    companyId: options.companyId,
    generatedPostId: options.generatedPostId,
    startDate: options.startDate,
    endDate: options.endDate,
  })

  // Extract metrics
  const likes = aggregation.metrics.find((m) => m.metricType === 'likes')
  const comments = aggregation.metrics.find((m) => m.metricType === 'comments')
  const shares = aggregation.metrics.find((m) => m.metricType === 'shares')
  const views = aggregation.metrics.find((m) => m.metricType === 'views')
  const engagementRate = aggregation.metrics.find((m) => m.metricType === 'engagement_rate')
  const reach = aggregation.metrics.find((m) => m.metricType === 'reach')
  const impressions = aggregation.metrics.find((m) => m.metricType === 'impressions')
  const clicks = aggregation.metrics.find((m) => m.metricType === 'clicks')

  // Calculate total engagement (likes + comments + shares)
  const totalEngagement = (likes?.total || 0) + (comments?.total || 0) + (shares?.total || 0)

  // Calculate click-through rate
  const clickThroughRate =
    impressions && impressions.total > 0
      ? ((clicks?.total || 0) / impressions.total) * 100
      : 0

  // Get top performing posts
  const topPerformers = await getTopPerformingPosts(payload, options, 10)

  // Calculate growth rate (placeholder - would need previous period data)
  const growthRate = 0 // TODO: Implement growth rate calculation

  return {
    totalEngagement,
    averageEngagementRate: engagementRate?.average || 0,
    totalReach: reach?.total || 0,
    totalImpressions: impressions?.total || 0,
    clickThroughRate,
    growthRate,
    topPerformers,
  }
}

/**
 * Compare performance between two periods
 * 
 * @param payload - Payload instance
 * @param options - Performance comparison options
 * @returns Performance comparison
 */
export async function comparePerformance(
  payload: Payload,
  options: PerformanceOptions & {
    previousPeriod: {
      startDate: Date | string
      endDate: Date | string
    }
  }
): Promise<PerformanceComparison> {
  // Calculate metrics for both periods
  const [current, previous] = await Promise.all([
    calculatePerformanceMetrics(payload, {
      companyId: options.companyId,
      generatedPostId: options.generatedPostId,
      startDate: options.startDate,
      endDate: options.endDate,
    }),
    calculatePerformanceMetrics(payload, {
      companyId: options.companyId,
      generatedPostId: options.generatedPostId,
      startDate: options.previousPeriod.startDate,
      endDate: options.previousPeriod.endDate,
    }),
  ])

  // Calculate changes
  const changes = {
    engagement: current.totalEngagement - previous.totalEngagement,
    engagementRate: current.averageEngagementRate - previous.averageEngagementRate,
    reach: current.totalReach - previous.totalReach,
    impressions: current.totalImpressions - previous.totalImpressions,
    clickThroughRate: current.clickThroughRate - previous.clickThroughRate,
  }

  // Calculate growth percentages
  const growthPercentages = {
    engagement:
      previous.totalEngagement > 0
        ? ((changes.engagement / previous.totalEngagement) * 100)
        : 0,
    engagementRate:
      previous.averageEngagementRate > 0
        ? ((changes.engagementRate / previous.averageEngagementRate) * 100)
        : 0,
    reach: previous.totalReach > 0 ? ((changes.reach / previous.totalReach) * 100) : 0,
    impressions:
      previous.totalImpressions > 0 ? ((changes.impressions / previous.totalImpressions) * 100) : 0,
    clickThroughRate:
      previous.clickThroughRate > 0
        ? ((changes.clickThroughRate / previous.clickThroughRate) * 100)
        : 0,
  }

  return {
    current,
    previous,
    changes,
    growthPercentages,
  }
}

/**
 * Calculate engagement rate for a post
 * 
 * @param payload - Payload instance
 * @param generatedPostId - Post ID
 * @returns Engagement rate
 */
export async function calculatePostEngagementRate(
  payload: Payload,
  generatedPostId: string
): Promise<number> {
  const engagement = await getPostEngagement(payload, generatedPostId)

  // Engagement rate = (likes + comments + shares) / impressions * 100
  // If impressions not available, use views as fallback
  const impressions = engagement.totalViews || 1
  const totalInteractions = engagement.totalLikes + engagement.totalComments + engagement.totalShares

  return impressions > 0 ? (totalInteractions / impressions) * 100 : 0
}

/**
 * Get top performing posts by engagement
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @param limit - Number of posts to return
 * @returns Top performing posts
 */
async function getTopPerformingPosts(
  payload: Payload,
  options: PerformanceOptions,
  limit: number = 10
): Promise<{ postId: string; title: string; engagementRate: number }[]> {
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

  // Calculate engagement rate for each post
  const postsWithMetrics = await Promise.all(
    posts.docs.map(async (post: any) => {
      const engagementRate = await calculatePostEngagementRate(payload, post.id)
      return {
        postId: post.id,
        title: post.title || 'Untitled',
        engagementRate,
      }
    })
  )

  // Sort by engagement rate and return top N
  return postsWithMetrics.sort((a, b) => b.engagementRate - a.engagementRate).slice(0, limit)
}

/**
 * Calculate average metrics across all posts
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @returns Average metrics
 */
export async function calculateAverageMetrics(
  payload: Payload,
  options: PerformanceOptions
): Promise<{
  averageLikes: number
  averageComments: number
  averageShares: number
  averageViews: number
  averageEngagementRate: number
}> {
  const aggregation = await aggregateMetrics(payload, {
    companyId: options.companyId,
    generatedPostId: options.generatedPostId,
    startDate: options.startDate,
    endDate: options.endDate,
  })

  const likes = aggregation.metrics.find((m) => m.metricType === 'likes')
  const comments = aggregation.metrics.find((m) => m.metricType === 'comments')
  const shares = aggregation.metrics.find((m) => m.metricType === 'shares')
  const views = aggregation.metrics.find((m) => m.metricType === 'views')
  const engagementRate = aggregation.metrics.find((m) => m.metricType === 'engagement_rate')

  return {
    averageLikes: likes?.average || 0,
    averageComments: comments?.average || 0,
    averageShares: shares?.average || 0,
    averageViews: views?.average || 0,
    averageEngagementRate: engagementRate?.average || 0,
  }
}

/**
 * Calculate ROI (Return on Investment) metrics
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @param costPerPost - Cost per post (optional)
 * @returns ROI metrics
 */
export async function calculateROI(
  payload: Payload,
  options: PerformanceOptions,
  costPerPost?: number
): Promise<{
  totalPosts: number
  totalCost: number
  totalEngagement: number
  costPerEngagement: number
  roi: number
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

  const totalPosts = posts.totalDocs
  const totalCost = costPerPost ? totalPosts * costPerPost : 0

  const metrics = await calculatePerformanceMetrics(payload, options)
  const totalEngagement = metrics.totalEngagement

  const costPerEngagement = totalEngagement > 0 ? totalCost / totalEngagement : 0

  // ROI = (Value - Cost) / Cost * 100
  // For simplicity, value is based on engagement (could be more sophisticated)
  const engagementValue = totalEngagement * 0.1 // Placeholder: 0.1 per engagement
  const roi = totalCost > 0 ? ((engagementValue - totalCost) / totalCost) * 100 : 0

  return {
    totalPosts,
    totalCost,
    totalEngagement,
    costPerEngagement,
    roi,
  }
}
