/**
 * Metrics Aggregation Logic
 * 
 * Provides functions to aggregate analytics metrics over various time periods.
 * Supports grouping by metric type, date ranges, and custom intervals.
 */

import type { Payload } from 'payload'
import type { PostAnalytics, GeneratedPost } from '@/payload-types'
import type { Where } from 'payload'

export interface AggregationOptions {
  generatedPostId?: string | string[]
  companyId?: string
  metricType?: string | string[]
  startDate?: Date | string
  endDate?: Date | string
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly'
  groupBy?: 'metricType' | 'date' | 'period' | 'company'
}

export interface AggregatedMetric {
  metricType: string
  total: number
  average: number
  min: number
  max: number
  count: number
  period?: string
  date?: string
}

export interface AggregationResult {
  metrics: AggregatedMetric[]
  summary: {
    totalMetrics: number
    dateRange: {
      start: string
      end: string
    }
  }
}

/**
 * Aggregate metrics based on options
 * 
 * @param payload - Payload instance
 * @param options - Aggregation options
 * @returns Aggregated metrics
 */
export async function aggregateMetrics(
  payload: Payload,
  options: AggregationOptions = {}
): Promise<AggregationResult> {
  // Build where query
  const where: Where = {}

  if (options.generatedPostId) {
    if (Array.isArray(options.generatedPostId)) {
      where.generatedPost = {
        in: options.generatedPostId,
      }
    } else {
      where.generatedPost = {
        equals: options.generatedPostId,
      }
    }
  }

  if (options.companyId) {
    // Need to filter through generatedPost -> company relationship
    // This requires a more complex query
    const generatedPosts = await payload.find({
      collection: 'generated-posts',
      where: {
        company: {
          equals: options.companyId,
        },
      },
      limit: 1000, // Adjust based on your needs
      select: {
        id: true,
      },
    })

    const postIds = generatedPosts.docs.map((post) => post.id)
    if (postIds.length > 0) {
      where.generatedPost = {
        in: postIds,
      }
    } else {
      // No posts for this company, return empty result
      return {
        metrics: [],
        summary: {
          totalMetrics: 0,
          dateRange: {
            start: options.startDate
              ? (typeof options.startDate === 'string'
                  ? options.startDate
                  : options.startDate.toISOString().split('T')[0])
              : '',
            end: options.endDate
              ? (typeof options.endDate === 'string'
                  ? options.endDate
                  : options.endDate.toISOString().split('T')[0])
              : '',
          },
        },
      }
    }
  }

  if (options.metricType) {
    if (Array.isArray(options.metricType)) {
      where.metricType = {
        in: options.metricType,
      }
    } else {
      where.metricType = {
        equals: options.metricType,
      }
    }
  }

  if (options.startDate || options.endDate) {
    where.date = {}
    if (options.startDate) {
      const start = typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString().split('T')[0]
      where.date.greater_than_equal = start
    }
    if (options.endDate) {
      const end = typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString().split('T')[0]
      where.date.less_than_equal = end
    }
  }

  if (options.period) {
    where.period = {
      equals: options.period,
    }
  }

  // Fetch all matching analytics
  const analytics = await payload.find({
    collection: 'post-analytics',
    where,
    limit: 10000, // Adjust based on your needs
  })

  // Perform aggregation
  const aggregatedMetrics = performAggregation(analytics.docs as PostAnalytics[], options)

  return {
    metrics: aggregatedMetrics,
    summary: {
      totalMetrics: analytics.totalDocs,
      dateRange: {
        start: options.startDate
          ? (typeof options.startDate === 'string'
              ? options.startDate
              : options.startDate.toISOString().split('T')[0])
          : '',
        end: options.endDate
          ? (typeof options.endDate === 'string'
              ? options.endDate
              : options.endDate.toISOString().split('T')[0])
          : '',
      },
    },
  }
}

/**
 * Aggregate metrics by metric type
 * 
 * @param analytics - Array of analytics records
 * @param options - Aggregation options
 * @returns Aggregated metrics grouped by metric type
 */
function performAggregation(
  analytics: PostAnalytics[],
  options: AggregationOptions
): AggregatedMetric[] {
  const grouped = new Map<string, number[]>()

  // Group by metric type and/or date/period based on groupBy option
  analytics.forEach((record) => {
    let key = record.metricType as string

    if (options.groupBy === 'date' && record.date) {
      key = `${record.metricType}_${record.date}`
    } else if (options.groupBy === 'period' && record.period) {
      key = `${record.metricType}_${record.period}`
    }

    if (!grouped.has(key)) {
      grouped.set(key, [])
    }
    grouped.get(key)!.push(record.value || 0)
  })

  // Calculate aggregations for each group
  const aggregated: AggregatedMetric[] = []

  grouped.forEach((values, key) => {
    const parts = key.split('_')
    const metricType = options.groupBy === 'date' || options.groupBy === 'period' ? parts.slice(0, -1).join('_') : key
    const period = options.groupBy === 'period' ? parts[parts.length - 1] : undefined
    const date = options.groupBy === 'date' ? parts[parts.length - 1] : undefined

    const total = values.reduce((sum, val) => sum + val, 0)
    const count = values.length
    const average = count > 0 ? total / count : 0
    const min = Math.min(...values)
    const max = Math.max(...values)

    aggregated.push({
      metricType,
      total,
      average,
      min,
      max,
      count,
      period,
      date,
    })
  })

  return aggregated
}

/**
 * Get total engagement metrics for a post
 * 
 * @param payload - Payload instance
 * @param generatedPostId - ID of the generated post
 * @returns Total engagement metrics
 */
export async function getPostEngagement(
  payload: Payload,
  generatedPostId: string
): Promise<{
  totalLikes: number
  totalComments: number
  totalShares: number
  totalViews: number
  averageEngagementRate: number
}> {
  const result = await aggregateMetrics(payload, {
    generatedPostId,
  })

  const likes = result.metrics.find((m) => m.metricType === 'likes')
  const comments = result.metrics.find((m) => m.metricType === 'comments')
  const shares = result.metrics.find((m) => m.metricType === 'shares')
  const views = result.metrics.find((m) => m.metricType === 'views')
  const engagementRate = result.metrics.find((m) => m.metricType === 'engagement_rate')

  return {
    totalLikes: likes?.total || 0,
    totalComments: comments?.total || 0,
    totalShares: shares?.total || 0,
    totalViews: views?.total || 0,
    averageEngagementRate: engagementRate?.average || 0,
  }
}

/**
 * Get metrics grouped by time period
 * 
 * @param payload - Payload instance
 * @param options - Aggregation options
 * @returns Metrics grouped by period
 */
export async function getMetricsByPeriod(
  payload: Payload,
  options: AggregationOptions & {
    period: 'hourly' | 'daily' | 'weekly' | 'monthly'
  }
): Promise<AggregatedMetric[]> {
  const result = await aggregateMetrics(payload, {
    ...options,
    groupBy: 'period',
  })

  return result.metrics.filter((m) => m.period === options.period)
}
