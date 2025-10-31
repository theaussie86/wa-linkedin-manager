/**
 * Content Categorization Service
 * 
 * Provides logic for automatic and manual categorization of content posts.
 * Supports categorization based on content analysis, keywords, and patterns.
 */

export type ContentCategory =
  | 'thought_leadership'
  | 'industry_insights'
  | 'company_updates'
  | 'educational'
  | 'behind_scenes'
  | 'case_studies'

export type PostType = 'text' | 'image' | 'video' | 'article' | 'poll'

export interface CategorizationResult {
  category: ContentCategory
  confidence: number // 0-1
  reasoning?: string
}

/**
 * Category keywords mapping for automatic categorization
 */
const categoryKeywords: Record<ContentCategory, string[]> = {
  thought_leadership: [
    'leadership',
    'vision',
    'strategy',
    'insight',
    'perspective',
    'opinion',
    'viewpoint',
    'philosophy',
    'belief',
    'principles',
  ],
  industry_insights: [
    'trend',
    'market',
    'industry',
    'analysis',
    'research',
    'data',
    'statistics',
    'report',
    'study',
    'forecast',
    'prediction',
  ],
  company_updates: [
    'announcement',
    'launch',
    'release',
    'news',
    'milestone',
    'achievement',
    'award',
    'partnership',
    'expansion',
    'growth',
  ],
  educational: [
    'learn',
    'tutorial',
    'guide',
    'how to',
    'tips',
    'best practices',
    'lesson',
    'training',
    'skill',
    'knowledge',
    'explain',
  ],
  behind_scenes: [
    'team',
    'culture',
    'day in the life',
    'workspace',
    'office',
    'process',
    'how we work',
    'meet the team',
    'values',
    'mission',
  ],
  case_studies: [
    'case study',
    'success story',
    'customer story',
    'testimonial',
    'result',
    'outcome',
    'impact',
    'transformation',
    'solution',
  ],
}

/**
 * Automatically categorize content based on text analysis
 * 
 * @param content - The content text to analyze (plain text or rich text)
 * @param postType - Type of post (text, image, video, etc.)
 * @returns Categorization result with category and confidence
 */
export function categorizeContent(
  content: string,
  postType?: PostType,
): CategorizationResult {
  if (!content || content.trim().length === 0) {
    return {
      category: 'company_updates',
      confidence: 0,
      reasoning: 'Empty content defaults to company_updates',
    }
  }

  // Normalize content to lowercase for keyword matching
  const normalizedContent = content.toLowerCase()

  // Count keyword matches for each category
  const categoryScores: Record<ContentCategory, number> = {
    thought_leadership: 0,
    industry_insights: 0,
    company_updates: 0,
    educational: 0,
    behind_scenes: 0,
    case_studies: 0,
  }

  // Score each category based on keyword matches
  Object.entries(categoryKeywords).forEach(([category, keywords]) => {
    keywords.forEach((keyword) => {
      const matches = (normalizedContent.match(new RegExp(keyword, 'gi')) || []).length
      categoryScores[category as ContentCategory] += matches
    })
  })

  // Find category with highest score
  const maxScore = Math.max(...Object.values(categoryScores))
  const bestCategory = Object.entries(categoryScores).reduce((prev, curr) =>
    curr[1] > prev[1] ? curr : prev,
  )[0] as ContentCategory

  // Calculate confidence (0-1) based on score relative to content length
  const contentLength = normalizedContent.split(/\s+/).length
  const confidence = Math.min(1, maxScore / Math.max(1, contentLength / 10))

  // Adjust confidence based on post type
  let adjustedConfidence = confidence
  if (postType === 'video' && bestCategory === 'behind_scenes') {
    adjustedConfidence = Math.min(1, confidence * 1.2)
  } else if (postType === 'article' && bestCategory === 'educational') {
    adjustedConfidence = Math.min(1, confidence * 1.2)
  }

  return {
    category: bestCategory,
    confidence: Math.min(1, adjustedConfidence),
    reasoning: `Matched ${maxScore} keywords for ${bestCategory}`,
  }
}

/**
 * Suggest category based on title and content
 * 
 * @param title - Post title
 * @param content - Post content
 * @param postType - Type of post
 * @returns Suggested category with reasoning
 */
export function suggestCategory(
  title?: string,
  content?: string,
  postType?: PostType,
): CategorizationResult {
  const combinedText = [title, content].filter(Boolean).join(' ')
  
  if (!combinedText) {
    return {
      category: 'company_updates',
      confidence: 0.1,
      reasoning: 'No content provided, defaulting to company_updates',
    }
  }

  return categorizeContent(combinedText, postType)
}

/**
 * Validate category against content
 * 
 * @param category - Proposed category
 * @param content - Content to validate against
 * @param postType - Type of post
 * @returns Whether the category is appropriate for the content
 */
export function validateCategory(
  category: ContentCategory,
  content: string,
  postType?: PostType,
): {
  isValid: boolean
  suggestedCategory?: ContentCategory
  confidence: number
  message?: string
} {
  const suggested = categorizeContent(content, postType)

  // Category is valid if it matches suggestion or if confidence is low (user override acceptable)
  const isValid = suggested.category === category || suggested.confidence < 0.5

  return {
    isValid,
    suggestedCategory: suggested.confidence > 0.5 ? suggested.category : undefined,
    confidence: suggested.confidence,
    message: isValid
      ? undefined
      : `Suggested category: ${suggested.category} (confidence: ${Math.round(suggested.confidence * 100)}%)`,
  }
}

/**
 * Get category statistics for content collection
 * 
 * @param posts - Array of posts with category information
 * @returns Statistics about category distribution
 */
export function getCategoryStatistics(
  posts: Array<{ category?: ContentCategory | string }>,
): Record<ContentCategory, number> {
  const stats: Record<ContentCategory, number> = {
    thought_leadership: 0,
    industry_insights: 0,
    company_updates: 0,
    educational: 0,
    behind_scenes: 0,
    case_studies: 0,
  }

  posts.forEach((post) => {
    if (post.category && post.category in stats) {
      stats[post.category as ContentCategory]++
    }
  })

  return stats
}

