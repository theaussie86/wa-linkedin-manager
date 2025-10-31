/**
 * Time-based Analytics Queries
 * 
 * Provides functions for querying analytics data based on time ranges,
 * date intervals, and temporal patterns.
 */

import type { Payload } from 'payload'
import type { PostAnalytics } from '@/payload-types'
import type { Where } from 'payload'

export interface TimeQueryOptions {
  generatedPostId?: string | string[]
  companyId?: string
  metricType?: string | string[]
  startDate: Date | string
  endDate: Date | string
  interval?: 'hour' | 'day' | 'week' | 'month'
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly'
}

export interface TimeSeriesData {
  date: string
  metrics: {
    [metricType: string]: number
  }
  total: number
}

export interface TimeQueryResult {
  series: TimeSeriesData[]
  summary: {
    totalRecords: number
    dateRange: {
      start: string
      end: string
    }
    metrics: string[]
  }
}

/**
 * Query analytics data for a time range
 * 
 * @param payload - Payload instance
 * @param options - Time query options
 * @returns Time series data
 */
export async function queryTimeRange(
  payload: Payload,
  options: TimeQueryOptions
): Promise<TimeQueryResult> {
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
    // Filter through generatedPost -> company relationship
    const generatedPosts = await payload.find({
      collection: 'generated-posts',
      where: {
        company: {
          equals: options.companyId,
        },
      },
      limit: 1000,
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
      // No posts for this company
      const startDate = typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString().split('T')[0]
      const endDate = typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString().split('T')[0]
      
      return {
        series: [],
        summary: {
          totalRecords: 0,
          dateRange: {
            start: startDate,
            end: endDate,
          },
          metrics: [],
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

  // Date range
  const startDate = typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString().split('T')[0]
  const endDate = typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString().split('T')[0]

  where.date = {
    greater_than_equal: startDate,
    less_than_equal: endDate,
  }

  if (options.period) {
    where.period = {
      equals: options.period,
    }
  }

  // Fetch analytics
  const analytics = await payload.find({
    collection: 'post-analytics',
    where,
    limit: 10000,
    sort: 'date',
  })

  // Group by date interval
  const series = groupByInterval(analytics.docs as PostAnalytics[], options.interval || 'day')

  // Get unique metric types
  const metricTypes = new Set<string>()
  analytics.docs.forEach((doc) => {
    const analyticsDoc = doc as PostAnalytics
    if (analyticsDoc.metricType) {
      metricTypes.add(analyticsDoc.metricType as string)
    }
  })

  return {
    series,
    summary: {
      totalRecords: analytics.totalDocs,
      dateRange: {
        start: startDate,
        end: endDate,
      },
      metrics: Array.from(metricTypes),
    },
  }
}

/**
 * Group analytics records by time interval
 * 
 * @param analytics - Array of analytics records
 * @param interval - Time interval ('hour', 'day', 'week', 'month')
 * @returns Time series data grouped by interval
 */
function groupByInterval(
  analytics: PostAnalytics[],
  interval: 'hour' | 'day' | 'week' | 'month'
): TimeSeriesData[] {
  const grouped = new Map<string, Map<string, number[]>>()

  analytics.forEach((record) => {
    if (!record.date) return

    const date = new Date(record.date)
    let key = formatDateByInterval(date, interval)

    if (!grouped.has(key)) {
      grouped.set(key, new Map())
    }

    const metricType = (record.metricType as string) || 'unknown'
    if (!grouped.get(key)!.has(metricType)) {
      grouped.get(key)!.set(metricType, [])
    }

    grouped.get(key)!.get(metricType)!.push(record.value || 0)
  })

  // Convert to time series format
  const series: TimeSeriesData[] = []

  grouped.forEach((metrics, dateKey) => {
    const dateMetrics: { [metricType: string]: number } = {}
    let total = 0

    metrics.forEach((values, metricType) => {
      const sum = values.reduce((a, b) => a + b, 0)
      dateMetrics[metricType] = sum
      total += sum
    })

    series.push({
      date: dateKey,
      metrics: dateMetrics,
      total,
    })
  })

  // Sort by date
  series.sort((a, b) => a.date.localeCompare(b.date))

  return series
}

/**
 * Format date based on interval
 * 
 * @param date - Date to format
 * @param interval - Time interval
 * @returns Formatted date string
 */
function formatDateByInterval(date: Date, interval: 'hour' | 'day' | 'week' | 'month'): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hour = String(date.getHours()).padStart(2, '0')

  switch (interval) {
    case 'hour':
      return `${year}-${month}-${day} ${hour}:00`
    case 'day':
      return `${year}-${month}-${day}`
    case 'week': {
      // Get start of week (Monday)
      const weekStart = new Date(date)
      const day = weekStart.getDay()
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
      weekStart.setDate(diff)
      return `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
    }
    case 'month':
      return `${year}-${month}`
    default:
      return `${year}-${month}-${day}`
  }
}

/**
 * Get metrics for the last N days
 * 
 * @param payload - Payload instance
 * @param days - Number of days
 * @param options - Additional query options
 * @returns Time series data for the last N days
 */
export async function getLastNDays(
  payload: Payload,
  days: number,
  options: Omit<TimeQueryOptions, 'startDate' | 'endDate'> = {}
): Promise<TimeQueryResult> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  return queryTimeRange(payload, {
    ...options,
    startDate,
    endDate,
    interval: 'day',
  })
}

/**
 * Get metrics for a specific month
 * 
 * @param payload - Payload instance
 * @param year - Year
 * @param month - Month (1-12)
 * @param options - Additional query options
 * @returns Time series data for the month
 */
export async function getMonthMetrics(
  payload: Payload,
  year: number,
  month: number,
  options: Omit<TimeQueryOptions, 'startDate' | 'endDate'> = {}
): Promise<TimeQueryResult> {
  const startDate = new Date(year, month - 1, 1)
  const endDate = new Date(year, month, 0) // Last day of month

  return queryTimeRange(payload, {
    ...options,
    startDate,
    endDate,
    interval: 'day',
  })
}

/**
 * Compare metrics between two time periods
 * 
 * @param payload - Payload instance
 * @param period1 - First time period
 * @param period2 - Second time period
 * @param options - Additional query options
 * @returns Comparison data
 */
export async function comparePeriods(
  payload: Payload,
  period1: { startDate: Date | string; endDate: Date | string },
  period2: { startDate: Date | string; endDate: Date | string },
  options: Omit<TimeQueryOptions, 'startDate' | 'endDate'> = {}
): Promise<{
  period1: TimeQueryResult
  period2: TimeQueryResult
  comparison: {
    [metricType: string]: {
      period1Total: number
      period2Total: number
      change: number
      changePercent: number
    }
  }
}> {
  const [result1, result2] = await Promise.all([
    queryTimeRange(payload, {
      ...options,
      ...period1,
    }),
    queryTimeRange(payload, {
      ...options,
      ...period2,
    }),
  ])

  // Calculate comparison
  const comparison: {
    [metricType: string]: {
      period1Total: number
      period2Total: number
      change: number
      changePercent: number
    }
  } = {}

  const allMetricTypes = new Set<string>()
  result1.summary.metrics.forEach((m) => allMetricTypes.add(m))
  result2.summary.metrics.forEach((m) => allMetricTypes.add(m))

  allMetricTypes.forEach((metricType) => {
    const period1Total = result1.series.reduce(
      (sum, data) => sum + (data.metrics[metricType] || 0),
      0
    )
    const period2Total = result2.series.reduce(
      (sum, data) => sum + (data.metrics[metricType] || 0),
      0
    )

    const change = period2Total - period1Total
    const changePercent = period1Total > 0 ? (change / period1Total) * 100 : 0

    comparison[metricType] = {
      period1Total,
      period2Total,
      change,
      changePercent,
    }
  })

  return {
    period1: result1,
    period2: result2,
    comparison,
  }
}
