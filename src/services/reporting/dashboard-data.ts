/**
 * Analytics Dashboard Data Service
 * 
 * Provides data structures and functions for dashboard display.
 * Includes widgets, charts, and summary statistics.
 */

import type { Payload } from 'payload'
import type { PostAnalytics } from '@/payload-types'
import { aggregateMetrics } from '../analytics/aggregation'
import { queryTimeRange, getLastNDays } from '../analytics/time-queries'
import { calculatePerformanceMetrics, calculateAverageMetrics } from './performance-metrics'

export interface DashboardWidget {
  id: string
  type: 'metric' | 'chart' | 'table' | 'summary'
  title: string
  data: any
  config?: Record<string, any>
}

export interface DashboardData {
  widgets: DashboardWidget[]
  summary: {
    totalPosts: number
    totalCompanies: number
    totalMetrics: number
    dateRange: {
      start: string
      end: string
    }
  }
  generatedAt: Date
}

export interface DashboardOptions {
  companyId?: string
  startDate?: Date | string
  endDate?: Date | string
  period?: 'day' | 'week' | 'month' | 'year'
  includeCharts?: boolean
  includeTables?: boolean
}

/**
 * Generate dashboard data
 * 
 * @param payload - Payload instance
 * @param options - Dashboard options
 * @returns Dashboard data
 */
export async function generateDashboardData(
  payload: Payload,
  options: DashboardOptions = {}
): Promise<DashboardData> {
  const widgets: DashboardWidget[] = []

  // Determine date range
  let startDate: Date
  let endDate: Date = new Date()

  if (options.period) {
    switch (options.period) {
      case 'day':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 1)
        break
      case 'week':
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
        break
      case 'month':
        startDate = new Date()
        startDate.setMonth(startDate.getMonth() - 1)
        break
      case 'year':
        startDate = new Date()
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      default:
        startDate = new Date()
        startDate.setDate(startDate.getDate() - 7)
    }
  } else {
    startDate = options.startDate
      ? typeof options.startDate === 'string'
        ? new Date(options.startDate)
        : options.startDate
      : new Date()
    startDate.setDate(startDate.getDate() - 7)

    endDate = options.endDate
      ? typeof options.endDate === 'string'
        ? new Date(options.endDate)
        : options.endDate
      : new Date()
  }

  // Summary widget
  const summaryWidget = await generateSummaryWidget(payload, {
    companyId: options.companyId,
    startDate,
    endDate,
  })
  widgets.push(summaryWidget)

  // Performance metrics widget
  const performanceWidget = await generatePerformanceWidget(payload, {
    companyId: options.companyId,
    startDate,
    endDate,
  })
  widgets.push(performanceWidget)

  // Average metrics widget
  const averageWidget = await generateAverageMetricsWidget(payload, {
    companyId: options.companyId,
    startDate,
    endDate,
  })
  widgets.push(averageWidget)

  // Time series chart widget
  if (options.includeCharts !== false) {
    const timeSeriesWidget = await generateTimeSeriesWidget(payload, {
      companyId: options.companyId,
      startDate,
      endDate,
    })
    widgets.push(timeSeriesWidget)
  }

  // Top posts table widget
  if (options.includeTables !== false) {
    const topPostsWidget = await generateTopPostsWidget(payload, {
      companyId: options.companyId,
      startDate,
      endDate,
    })
    widgets.push(topPostsWidget)
  }

  // Calculate summary statistics
  const summary = await calculateDashboardSummary(payload, {
    companyId: options.companyId,
    startDate,
    endDate,
  })

  return {
    widgets,
    summary,
    generatedAt: new Date(),
  }
}

/**
 * Generate summary widget
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @returns Summary widget
 */
async function generateSummaryWidget(
  payload: Payload,
  options: { companyId?: string; startDate: Date; endDate: Date }
): Promise<DashboardWidget> {
  const where: any = {}
  if (options.companyId) {
    where.company = { equals: options.companyId }
  }

  const posts = await payload.find({
    collection: 'generated-posts',
    where,
    limit: 1, // Just need count
  })

  const companies = options.companyId
    ? 1
    : await payload.find({
        collection: 'companies',
        limit: 1, // Just need count
      })

  const metrics = await payload.find({
    collection: 'post-analytics',
    limit: 1, // Just need count
  })

  return {
    id: 'summary',
    type: 'summary',
    title: 'Overview',
    data: {
      totalPosts: posts.totalDocs,
      totalCompanies: options.companyId ? 1 : companies.totalDocs,
      totalMetrics: metrics.totalDocs,
    },
  }
}

/**
 * Generate performance widget
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @returns Performance widget
 */
async function generatePerformanceWidget(
  payload: Payload,
  options: { companyId?: string; startDate: Date; endDate: Date }
): Promise<DashboardWidget> {
  const metrics = await calculatePerformanceMetrics(payload, {
    companyId: options.companyId,
    startDate: options.startDate,
    endDate: options.endDate,
  })

  return {
    id: 'performance',
    type: 'metric',
    title: 'Performance Metrics',
    data: {
      totalEngagement: metrics.totalEngagement,
      averageEngagementRate: metrics.averageEngagementRate,
      totalReach: metrics.totalReach,
      totalImpressions: metrics.totalImpressions,
      clickThroughRate: metrics.clickThroughRate,
    },
  }
}

/**
 * Generate average metrics widget
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @returns Average metrics widget
 */
async function generateAverageMetricsWidget(
  payload: Payload,
  options: { companyId?: string; startDate: Date; endDate: Date }
): Promise<DashboardWidget> {
  const averages = await calculateAverageMetrics(payload, {
    companyId: options.companyId,
    startDate: options.startDate,
    endDate: options.endDate,
  })

  return {
    id: 'averages',
    type: 'metric',
    title: 'Average Metrics',
    data: averages,
  }
}

/**
 * Generate time series widget
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @returns Time series widget
 */
async function generateTimeSeriesWidget(
  payload: Payload,
  options: { companyId?: string; startDate: Date; endDate: Date }
): Promise<DashboardWidget> {
  const timeSeries = await queryTimeRange(payload, {
    companyId: options.companyId,
    startDate: options.startDate,
    endDate: options.endDate,
    interval: 'day',
  })

  return {
    id: 'time-series',
    type: 'chart',
    title: 'Engagement Over Time',
    data: timeSeries,
    config: {
      chartType: 'line',
      xAxis: 'date',
      yAxis: 'value',
    },
  }
}

/**
 * Generate top posts widget
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @returns Top posts widget
 */
async function generateTopPostsWidget(
  payload: Payload,
  options: { companyId?: string; startDate: Date; endDate: Date }
): Promise<DashboardWidget> {
  const metrics = await calculatePerformanceMetrics(payload, {
    companyId: options.companyId,
    startDate: options.startDate,
    endDate: options.endDate,
  })

  return {
    id: 'top-posts',
    type: 'table',
    title: 'Top Performing Posts',
    data: metrics.topPerformers,
  }
}

/**
 * Calculate dashboard summary
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @returns Dashboard summary
 */
async function calculateDashboardSummary(
  payload: Payload,
  options: { companyId?: string; startDate: Date; endDate: Date }
): Promise<{
  totalPosts: number
  totalCompanies: number
  totalMetrics: number
  dateRange: {
    start: string
    end: string
  }
}> {
  const where: any = {}
  if (options.companyId) {
    where.company = { equals: options.companyId }
  }

  const posts = await payload.find({
    collection: 'generated-posts',
    where,
    limit: 1,
  })

  const companies = options.companyId
    ? 1
    : (
        await payload.find({
          collection: 'companies',
          limit: 1,
        })
      ).totalDocs

  const metricsWhere: any = {}
  if (options.companyId) {
    const generatedPosts = await payload.find({
      collection: 'generated-posts',
      where: {
        company: { equals: options.companyId },
      },
      limit: 1000,
      select: { id: true },
    })

    const postIds = generatedPosts.docs.map((post: any) => post.id)
    if (postIds.length > 0) {
      metricsWhere.generatedPost = { in: postIds }
    }
  }

  const startDateStr = options.startDate.toISOString().split('T')[0]
  const endDateStr = options.endDate.toISOString().split('T')[0]

  metricsWhere.date = {
    greater_than_equal: startDateStr,
    less_than_equal: endDateStr,
  }

  const metrics = await payload.find({
    collection: 'post-analytics',
    where: metricsWhere,
    limit: 1,
  })

  return {
    totalPosts: posts.totalDocs,
    totalCompanies: companies,
    totalMetrics: metrics.totalDocs,
    dateRange: {
      start: startDateStr,
      end: endDateStr,
    },
  }
}

/**
 * Get quick stats for dashboard
 * 
 * @param payload - Payload instance
 * @param options - Options
 * @returns Quick stats
 */
export async function getQuickStats(
  payload: Payload,
  options: { companyId?: string } = {}
): Promise<{
  today: {
    posts: number
    engagement: number
  }
  thisWeek: {
    posts: number
    engagement: number
  }
  thisMonth: {
    posts: number
    engagement: number
  }
}> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const thisWeek = new Date()
  thisWeek.setDate(thisWeek.getDate() - 7)

  const thisMonth = new Date()
  thisMonth.setMonth(thisMonth.getMonth() - 1)

  const endDate = new Date()

  const [todayData, weekData, monthData] = await Promise.all([
    getLastNDays(payload, 1, { companyId: options.companyId }),
    getLastNDays(payload, 7, { companyId: options.companyId }),
    getLastNDays(payload, 30, { companyId: options.companyId }),
  ])

  return {
    today: {
      posts: todayData.summary.totalRecords,
      engagement: todayData.series.reduce((sum, data) => sum + data.total, 0),
    },
    thisWeek: {
      posts: weekData.summary.totalRecords,
      engagement: weekData.series.reduce((sum, data) => sum + data.total, 0),
    },
    thisMonth: {
      posts: monthData.summary.totalRecords,
      engagement: monthData.series.reduce((sum, data) => sum + data.total, 0),
    },
  }
}
