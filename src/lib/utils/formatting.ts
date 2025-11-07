/**
 * Formatting utilities for Content Generation UI
 */

/**
 * Formats a date to a readable string
 */
export function formatDate(date: Date | string | null | undefined): string {
  if (!date) {
    return ''
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(dateObj)
}

/**
 * Formats a date to a short string (date only)
 */
export function formatDateShort(date: Date | string | null | undefined): string {
  if (!date) {
    return ''
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat('de-DE', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(dateObj)
}

/**
 * Formats a relative time string (e.g., "vor 2 Stunden")
 */
export function formatRelativeTime(date: Date | string | null | undefined): string {
  if (!date) {
    return ''
  }

  const dateObj = typeof date === 'string' ? new Date(date) : date

  if (isNaN(dateObj.getTime())) {
    return ''
  }

  const now = new Date()
  const diffMs = now.getTime() - dateObj.getTime()
  const diffSeconds = Math.floor(diffMs / 1000)
  const diffMinutes = Math.floor(diffSeconds / 60)
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffSeconds < 60) {
    return 'gerade eben'
  } else if (diffMinutes < 60) {
    return `vor ${diffMinutes} ${diffMinutes === 1 ? 'Minute' : 'Minuten'}`
  } else if (diffHours < 24) {
    return `vor ${diffHours} ${diffHours === 1 ? 'Stunde' : 'Stunden'}`
  } else if (diffDays < 7) {
    return `vor ${diffDays} ${diffDays === 1 ? 'Tag' : 'Tagen'}`
  } else {
    return formatDateShort(dateObj)
  }
}

/**
 * Truncates text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) {
    return text
  }

  return text.substring(0, maxLength).trim() + '...'
}

/**
 * Capitalizes first letter of a string
 */
export function capitalizeFirst(text: string): string {
  if (!text) {
    return ''
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase()
}

/**
 * Formats writing style label
 */
export function formatWritingStyle(style: string): string {
  const styleMap: Record<string, string> = {
    story_based: 'Story Based',
    insight_focused: 'Insight Focused',
    engagement_focused: 'Engagement Focused',
  }

  return styleMap[style] || capitalizeFirst(style.replace(/_/g, ' '))
}

/**
 * Formats status label
 */
export function formatStatus(status: string): string {
  const statusMap: Record<string, string> = {
    draft: 'Entwurf',
    review: 'Review',
    approved: 'Genehmigt',
    scheduled: 'Geplant',
    published: 'Veröffentlicht',
    rejected: 'Abgelehnt',
  }

  return statusMap[status] || capitalizeFirst(status)
}

/**
 * Formats category label
 */
export function formatCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    thought_leadership: 'Thought Leadership',
    industry_insights: 'Industry Insights',
    company_updates: 'Company Updates',
    educational: 'Educational',
    behind_scenes: 'Behind the Scenes',
    case_studies: 'Case Studies',
  }

  return categoryMap[category] || capitalizeFirst(category.replace(/_/g, ' '))
}

