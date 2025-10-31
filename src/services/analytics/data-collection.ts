/**
 * Analytics Data Collection Service
 * 
 * Provides functions to collect and store analytics data from various sources.
 * Handles data normalization, validation, and storage in PostAnalytics collection.
 */

import type { Payload } from 'payload'
import type { PostAnalytics } from '@/payload-types'

export interface AnalyticsDataInput {
  generatedPostId: string
  metricType: 'likes' | 'comments' | 'shares' | 'views' | 'clicks' | 'engagement_rate' | 'reach' | 'impressions'
  value: number
  date: Date | string
  period?: 'hourly' | 'daily' | 'weekly' | 'monthly'
  source?: 'linkedin' | 'manual' | 'api'
  metadata?: Record<string, any>
}

export interface BatchAnalyticsInput {
  analytics: AnalyticsDataInput[]
}

/**
 * Collect and store a single analytics metric
 * 
 * @param payload - Payload instance
 * @param data - Analytics data to collect
 * @returns Created analytics record
 */
export async function collectAnalyticsMetric(
  payload: Payload,
  data: AnalyticsDataInput
): Promise<PostAnalytics> {
  // Validate input data
  validateAnalyticsData(data)

  // Normalize date
  const normalizedDate = typeof data.date === 'string' ? new Date(data.date) : data.date

  // Create analytics record
  const result = await payload.create({
    collection: 'post-analytics',
    data: {
      generatedPost: data.generatedPostId,
      metricType: data.metricType,
      value: data.value,
      date: normalizedDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
      period: data.period || 'daily',
      source: data.source || 'manual',
      metadata: data.metadata || {},
    },
  })

  return result as PostAnalytics
}

/**
 * Collect multiple analytics metrics in batch
 * 
 * @param payload - Payload instance
 * @param batchData - Batch of analytics data to collect
 * @returns Created analytics records
 */
export async function collectAnalyticsBatch(
  payload: Payload,
  batchData: BatchAnalyticsInput
): Promise<PostAnalytics[]> {
  const results: PostAnalytics[] = []

  // Validate all records first
  batchData.analytics.forEach((data) => {
    validateAnalyticsData(data)
  })

  // Create all records
  for (const data of batchData.analytics) {
    const normalizedDate = typeof data.date === 'string' ? new Date(data.date) : data.date
    
    const result = await payload.create({
      collection: 'post-analytics',
      data: {
        generatedPost: data.generatedPostId,
        metricType: data.metricType,
        value: data.value,
        date: normalizedDate.toISOString().split('T')[0],
        period: data.period || 'daily',
        source: data.source || 'manual',
        metadata: data.metadata || {},
      },
    })

    results.push(result as PostAnalytics)
  }

  return results
}

/**
 * Collect analytics from LinkedIn API response
 * 
 * @param payload - Payload instance
 * @param generatedPostId - ID of the generated post
 * @param linkedInData - LinkedIn API response data
 * @returns Created analytics records
 */
export async function collectLinkedInAnalytics(
  payload: Payload,
  generatedPostId: string,
  linkedInData: {
    likes?: number
    comments?: number
    shares?: number
    views?: number
    clicks?: number
    reach?: number
    impressions?: number
    engagementRate?: number
    date?: Date | string
    metadata?: Record<string, any>
  }
): Promise<PostAnalytics[]> {
  const analytics: AnalyticsDataInput[] = []
  const date = linkedInData.date || new Date()

  // Map LinkedIn data to analytics metrics
  if (linkedInData.likes !== undefined) {
    analytics.push({
      generatedPostId,
      metricType: 'likes',
      value: linkedInData.likes,
      date,
      source: 'linkedin',
      metadata: linkedInData.metadata,
    })
  }

  if (linkedInData.comments !== undefined) {
    analytics.push({
      generatedPostId,
      metricType: 'comments',
      value: linkedInData.comments,
      date,
      source: 'linkedin',
      metadata: linkedInData.metadata,
    })
  }

  if (linkedInData.shares !== undefined) {
    analytics.push({
      generatedPostId,
      metricType: 'shares',
      value: linkedInData.shares,
      date,
      source: 'linkedin',
      metadata: linkedInData.metadata,
    })
  }

  if (linkedInData.views !== undefined) {
    analytics.push({
      generatedPostId,
      metricType: 'views',
      value: linkedInData.views,
      date,
      source: 'linkedin',
      metadata: linkedInData.metadata,
    })
  }

  if (linkedInData.clicks !== undefined) {
    analytics.push({
      generatedPostId,
      metricType: 'clicks',
      value: linkedInData.clicks,
      date,
      source: 'linkedin',
      metadata: linkedInData.metadata,
    })
  }

  if (linkedInData.reach !== undefined) {
    analytics.push({
      generatedPostId,
      metricType: 'reach',
      value: linkedInData.reach,
      date,
      source: 'linkedin',
      metadata: linkedInData.metadata,
    })
  }

  if (linkedInData.impressions !== undefined) {
    analytics.push({
      generatedPostId,
      metricType: 'impressions',
      value: linkedInData.impressions,
      date,
      source: 'linkedin',
      metadata: linkedInData.metadata,
    })
  }

  if (linkedInData.engagementRate !== undefined) {
    analytics.push({
      generatedPostId,
      metricType: 'engagement_rate',
      value: linkedInData.engagementRate,
      date,
      source: 'linkedin',
      metadata: linkedInData.metadata,
    })
  }

  // Collect all metrics
  return collectAnalyticsBatch(payload, { analytics })
}

/**
 * Validate analytics data before collection
 * 
 * @param data - Analytics data to validate
 * @throws Error if validation fails
 */
function validateAnalyticsData(data: AnalyticsDataInput): void {
  // Validate required fields
  if (!data.generatedPostId) {
    throw new Error('generatedPostId is required')
  }

  if (!data.metricType) {
    throw new Error('metricType is required')
  }

  if (data.value === undefined || data.value === null) {
    throw new Error('value is required')
  }

  if (!data.date) {
    throw new Error('date is required')
  }

  // Validate metric type
  const validMetricTypes = [
    'likes',
    'comments',
    'shares',
    'views',
    'clicks',
    'engagement_rate',
    'reach',
    'impressions',
  ]
  if (!validMetricTypes.includes(data.metricType)) {
    throw new Error(`Invalid metricType: ${data.metricType}`)
  }

  // Validate value based on metric type
  if (data.metricType === 'engagement_rate' && (data.value < 0 || data.value > 100)) {
    throw new Error('engagement_rate must be between 0 and 100')
  }

  if (data.value < 0) {
    throw new Error('value cannot be negative')
  }

  // Validate date
  const date = typeof data.date === 'string' ? new Date(data.date) : data.date
  if (isNaN(date.getTime())) {
    throw new Error('Invalid date format')
  }

  // Validate date is not in the future (allow 1 hour for timezone differences)
  const now = new Date()
  const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
  if (date > oneHourFromNow) {
    throw new Error('date cannot be in the future')
  }

  // Validate period if provided
  if (data.period) {
    const validPeriods = ['hourly', 'daily', 'weekly', 'monthly']
    if (!validPeriods.includes(data.period)) {
      throw new Error(`Invalid period: ${data.period}`)
    }
  }

  // Validate source if provided
  if (data.source) {
    const validSources = ['linkedin', 'manual', 'api']
    if (!validSources.includes(data.source)) {
      throw new Error(`Invalid source: ${data.source}`)
    }
  }
}
