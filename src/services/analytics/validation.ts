/**
 * Analytics Data Validation Service
 * 
 * Provides validation functions for analytics data before storage.
 * Ensures data integrity and consistency.
 */

import type { PostAnalytics } from '@/payload-types'

export interface ValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

/**
 * Validate analytics data before storage
 * 
 * @param data - Analytics data to validate
 * @returns Validation result
 */
export function validateAnalyticsData(data: Partial<PostAnalytics>): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Required fields validation
  if (!data.generatedPost) {
    errors.push('generatedPost is required')
  }

  if (!data.metricType) {
    errors.push('metricType is required')
  } else {
    // Validate metric type enum
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
    if (!validMetricTypes.includes(data.metricType as string)) {
      errors.push(`Invalid metricType: ${data.metricType}`)
    }
  }

  if (data.value === undefined || data.value === null) {
    errors.push('value is required')
  } else {
    // Validate value based on metric type
    if (data.metricType === 'engagement_rate') {
      if (data.value < 0 || data.value > 100) {
        errors.push('engagement_rate must be between 0 and 100')
      }
    } else {
      if (data.value < 0) {
        errors.push('value cannot be negative')
      }
    }

    // Check for unusually high values
    if (data.metricType !== 'engagement_rate' && data.value > 1000000) {
      warnings.push(`Unusually high value for ${data.metricType}: ${data.value}`)
    }
  }

  if (!data.date) {
    errors.push('date is required')
  } else {
    // Validate date format
    const date = typeof data.date === 'string' ? new Date(data.date) : new Date(data.date)
    if (isNaN(date.getTime())) {
      errors.push('Invalid date format')
    } else {
      // Validate date is not in the future (allow 1 hour for timezone differences)
      const now = new Date()
      const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
      if (date > oneHourFromNow) {
        errors.push('date cannot be in the future')
      }

      // Warn if date is too old (more than 2 years)
      const twoYearsAgo = new Date()
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2)
      if (date < twoYearsAgo) {
        warnings.push('date is more than 2 years old')
      }
    }
  }

  // Validate period if provided
  if (data.period) {
    const validPeriods = ['hourly', 'daily', 'weekly', 'monthly']
    if (!validPeriods.includes(data.period as string)) {
      errors.push(`Invalid period: ${data.period}`)
    }
  }

  // Validate source if provided
  if (data.source) {
    const validSources = ['linkedin', 'manual', 'api']
    if (!validSources.includes(data.source as string)) {
      errors.push(`Invalid source: ${data.source}`)
    }
  }

  // Validate metadata if provided
  if (data.metadata) {
    if (typeof data.metadata !== 'object') {
      errors.push('metadata must be an object')
    } else {
      // Check metadata size (warn if too large)
      const metadataStr = JSON.stringify(data.metadata)
      if (metadataStr.length > 10000) {
        warnings.push('metadata is very large and may impact performance')
      }
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Validate batch of analytics data
 * 
 * @param dataArray - Array of analytics data to validate
 * @returns Validation results for each record
 */
export function validateAnalyticsBatch(
  dataArray: Partial<PostAnalytics>[]
): ValidationResult[] {
  return dataArray.map((data) => validateAnalyticsData(data))
}

/**
 * Check for duplicate analytics records
 * 
 * @param existingRecords - Existing analytics records
 * @param newRecord - New record to check
 * @returns True if duplicate found
 */
export function isDuplicateRecord(
  existingRecords: PostAnalytics[],
  newRecord: Partial<PostAnalytics>
): boolean {
  return existingRecords.some(
    (existing) =>
      existing.generatedPost === newRecord.generatedPost &&
      existing.metricType === newRecord.metricType &&
      existing.date === newRecord.date &&
      existing.period === newRecord.period
  )
}

/**
 * Validate date range for analytics queries
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Validation result
 */
export function validateDateRange(
  startDate: Date | string,
  endDate: Date | string
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  const start = typeof startDate === 'string' ? new Date(startDate) : startDate
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate

  if (isNaN(start.getTime())) {
    errors.push('Invalid startDate format')
  }

  if (isNaN(end.getTime())) {
    errors.push('Invalid endDate format')
  }

  if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
    if (start > end) {
      errors.push('startDate must be before endDate')
    }

    // Warn if range is too large
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    if (daysDiff > 365) {
      warnings.push(`Date range is very large (${daysDiff} days), may impact performance`)
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Sanitize analytics data (remove invalid fields, normalize values)
 * 
 * @param data - Analytics data to sanitize
 * @returns Sanitized data
 */
export function sanitizeAnalyticsData(
  data: Partial<PostAnalytics>
): Partial<PostAnalytics> {
  const sanitized: Partial<PostAnalytics> = { ...data }

  // Ensure value is a number
  if (sanitized.value !== undefined && sanitized.value !== null) {
    sanitized.value = Number(sanitized.value)
    if (isNaN(sanitized.value)) {
      sanitized.value = 0
    }
  }

  // Ensure date is properly formatted
  if (sanitized.date) {
    const date = typeof sanitized.date === 'string' ? new Date(sanitized.date) : new Date(sanitized.date)
    if (!isNaN(date.getTime())) {
      sanitized.date = date.toISOString().split('T')[0] // Format as YYYY-MM-DD
    }
  }

  // Ensure period has default
  if (!sanitized.period) {
    sanitized.period = 'daily'
  }

  // Ensure source has default
  if (!sanitized.source) {
    sanitized.source = 'manual'
  }

  // Ensure metadata is an object
  if (sanitized.metadata && typeof sanitized.metadata !== 'object') {
    sanitized.metadata = {}
  }

  return sanitized
}
