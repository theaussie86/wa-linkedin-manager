/**
 * Data Export Functionality
 * 
 * Provides functions to export analytics data in various formats (CSV, JSON, Excel).
 */

import type { Payload } from 'payload'
import type { PostAnalytics, GeneratedPost } from '@/payload-types'
import { queryTimeRange } from '../analytics/time-queries'
import type { TimeQueryOptions } from '../analytics/time-queries'

export type ExportFormat = 'csv' | 'json' | 'excel'

export interface ExportOptions extends Omit<TimeQueryOptions, 'interval'> {
  format: ExportFormat
  includeMetadata?: boolean
}

export interface ExportResult {
  format: ExportFormat
  filename: string
  data: string | Buffer
  mimeType: string
  size: number
}

/**
 * Export analytics data
 * 
 * @param payload - Payload instance
 * @param options - Export options
 * @returns Export result
 */
export async function exportAnalyticsData(
  payload: Payload,
  options: ExportOptions
): Promise<ExportResult> {
  // Fetch data
  const timeSeries = await queryTimeRange(payload, {
    ...options,
    interval: 'day',
  })

  // Generate filename
  const startDate = typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString().split('T')[0]
  const endDate = typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString().split('T')[0]
  const filename = `analytics_${startDate}_${endDate}.${options.format}`

  // Export based on format
  switch (options.format) {
    case 'csv':
      return exportToCSV(timeSeries, filename, options.includeMetadata)
    case 'json':
      return exportToJSON(timeSeries, filename, options.includeMetadata)
    case 'excel':
      return exportToExcel(timeSeries, filename, options.includeMetadata)
    default:
      throw new Error(`Unsupported export format: ${options.format}`)
  }
}

/**
 * Export to CSV format
 * 
 * @param timeSeries - Time series data
 * @param filename - Output filename
 * @param includeMetadata - Include metadata in export
 * @returns CSV export result
 */
function exportToCSV(
  timeSeries: any,
  filename: string,
  includeMetadata?: boolean
): ExportResult {
  const lines: string[] = []

  // Header
  const headers = ['Date', 'Metric Type', 'Value']
  if (includeMetadata) {
    headers.push('Metadata')
  }
  lines.push(headers.join(','))

  // Data rows
  timeSeries.series.forEach((data: any) => {
    Object.keys(data.metrics).forEach((metricType) => {
      const row = [
        data.date,
        metricType,
        data.metrics[metricType].toString(),
      ]
      if (includeMetadata) {
        row.push(JSON.stringify(data.metadata || {}))
      }
      lines.push(row.join(','))
    })
  })

  const csvData = lines.join('\n')

  return {
    format: 'csv',
    filename,
    data: csvData,
    mimeType: 'text/csv',
    size: Buffer.byteLength(csvData, 'utf8'),
  }
}

/**
 * Export to JSON format
 * 
 * @param timeSeries - Time series data
 * @param filename - Output filename
 * @param includeMetadata - Include metadata in export
 * @returns JSON export result
 */
function exportToJSON(
  timeSeries: any,
  filename: string,
  includeMetadata?: boolean
): ExportResult {
  const exportData = {
    summary: timeSeries.summary,
    series: timeSeries.series.map((data: any) => ({
      date: data.date,
      metrics: data.metrics,
      total: data.total,
      ...(includeMetadata && { metadata: data.metadata }),
    })),
  }

  const jsonData = JSON.stringify(exportData, null, 2)

  return {
    format: 'json',
    filename,
    data: jsonData,
    mimeType: 'application/json',
    size: Buffer.byteLength(jsonData, 'utf8'),
  }
}

/**
 * Export to Excel format (simplified - using CSV with .xlsx extension)
 * Note: For full Excel support, you would need a library like 'xlsx'
 * 
 * @param timeSeries - Time series data
 * @param filename - Output filename
 * @param includeMetadata - Include metadata in export
 * @returns Excel export result
 */
function exportToExcel(
  timeSeries: any,
  filename: string,
  includeMetadata?: boolean
): ExportResult {
  // For now, we'll export as CSV but with .xlsx extension
  // In production, you should use a library like 'xlsx' for proper Excel support
  const csvResult = exportToCSV(timeSeries, filename.replace('.xlsx', '.csv'), includeMetadata)

  return {
    format: 'excel',
    filename: filename.replace('.csv', '.xlsx'),
    data: csvResult.data,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    size: csvResult.size,
  }
}

/**
 * Export raw analytics records
 * 
 * @param payload - Payload instance
 * @param options - Export options (without format)
 * @param format - Export format
 * @returns Export result
 */
export async function exportRawAnalytics(
  payload: Payload,
  options: Omit<ExportOptions, 'format'>,
  format: ExportFormat = 'json'
): Promise<ExportResult> {
  // Build where query
  const where: any = {}

  if (options.generatedPostId) {
    if (Array.isArray(options.generatedPostId)) {
      where.generatedPost = { in: options.generatedPostId }
    } else {
      where.generatedPost = { equals: options.generatedPostId }
    }
  }

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
      where.generatedPost = { in: postIds }
    } else {
      // No posts for this company
      const emptyResult = {
        format,
        filename: `analytics_raw_${Date.now()}.${format}`,
        data: format === 'json' ? '[]' : '',
        mimeType: format === 'json' ? 'application/json' : 'text/csv',
        size: format === 'json' ? 2 : 0,
      }
      return emptyResult
    }
  }

  if (options.metricType) {
    if (Array.isArray(options.metricType)) {
      where.metricType = { in: options.metricType }
    } else {
      where.metricType = { equals: options.metricType }
    }
  }

  const startDate = typeof options.startDate === 'string' ? options.startDate : options.startDate.toISOString().split('T')[0]
  const endDate = typeof options.endDate === 'string' ? options.endDate : options.endDate.toISOString().split('T')[0]

  where.date = {
    greater_than_equal: startDate,
    less_than_equal: endDate,
  }

  // Fetch all records
  const analytics = await payload.find({
    collection: 'post-analytics',
    where,
    limit: 10000,
    sort: 'date',
  })

  const filename = `analytics_raw_${startDate}_${endDate}.${format}`

  // Export based on format
  switch (format) {
    case 'csv':
      return exportRecordsToCSV(analytics.docs as PostAnalytics[], filename, options.includeMetadata)
    case 'json':
      return exportRecordsToJSON(analytics.docs as PostAnalytics[], filename, options.includeMetadata)
    case 'excel':
      const csvResult = exportRecordsToCSV(analytics.docs as PostAnalytics[], filename.replace('.xlsx', '.csv'), options.includeMetadata)
      return {
        format: 'excel',
        filename: filename.replace('.csv', '.xlsx'),
        data: csvResult.data,
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        size: csvResult.size,
      }
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Export records to CSV
 * 
 * @param records - Analytics records
 * @param filename - Output filename
 * @param includeMetadata - Include metadata
 * @returns CSV export result
 */
function exportRecordsToCSV(
  records: PostAnalytics[],
  filename: string,
  includeMetadata?: boolean
): ExportResult {
  const lines: string[] = []

  // Header
  const headers = ['ID', 'Generated Post', 'Metric Type', 'Value', 'Date', 'Period', 'Source']
  if (includeMetadata) {
    headers.push('Metadata')
  }
  lines.push(headers.join(','))

  // Data rows
  records.forEach((record) => {
    const row = [
      record.id || '',
      typeof record.generatedPost === 'string' ? record.generatedPost : (record.generatedPost as any)?.id || '',
      record.metricType || '',
      (record.value || 0).toString(),
      record.date || '',
      record.period || '',
      record.source || '',
    ]
    if (includeMetadata) {
      row.push(JSON.stringify(record.metadata || {}))
    }
    lines.push(row.join(','))
  })

  const csvData = lines.join('\n')

  return {
    format: 'csv',
    filename,
    data: csvData,
    mimeType: 'text/csv',
    size: Buffer.byteLength(csvData, 'utf8'),
  }
}

/**
 * Export records to JSON
 * 
 * @param records - Analytics records
 * @param filename - Output filename
 * @param includeMetadata - Include metadata
 * @returns JSON export result
 */
function exportRecordsToJSON(
  records: PostAnalytics[],
  filename: string,
  includeMetadata?: boolean
): ExportResult {
  const exportData = records.map((record) => ({
    id: record.id,
    generatedPost: typeof record.generatedPost === 'string' ? record.generatedPost : (record.generatedPost as any)?.id,
    metricType: record.metricType,
    value: record.value,
    date: record.date,
    period: record.period,
    source: record.source,
    ...(includeMetadata && { metadata: record.metadata }),
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  }))

  const jsonData = JSON.stringify(exportData, null, 2)

  return {
    format: 'json',
    filename,
    data: jsonData,
    mimeType: 'application/json',
    size: Buffer.byteLength(jsonData, 'utf8'),
  }
}
