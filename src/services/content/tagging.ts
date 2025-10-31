/**
 * Content Tagging Service
 * 
 * Provides functionality for managing tags on content posts.
 * Supports tag extraction, normalization, suggestion, and management.
 */

export interface TagMetadata {
  tag: string
  count?: number
  lastUsed?: Date
  category?: string
}

export interface TagSuggestion {
  tag: string
  confidence: number // 0-1
  source: 'keyword' | 'category' | 'content' | 'popular'
}

/**
 * Common tags by category for suggestions
 */
const categoryTags: Record<string, string[]> = {
  thought_leadership: ['leadership', 'strategy', 'vision', 'innovation', 'executive'],
  industry_insights: ['trends', 'market-analysis', 'industry-news', 'research', 'data'],
  company_updates: ['news', 'announcement', 'milestone', 'growth', 'team'],
  educational: ['how-to', 'tips', 'best-practices', 'tutorial', 'learning'],
  behind_scenes: ['culture', 'team', 'workplace', 'values', 'people'],
  case_studies: ['success-story', 'customer', 'results', 'impact', 'transformation'],
}

/**
 * Popular/common tags across all content types
 */
const popularTags = [
  'linkedin',
  'business',
  'marketing',
  'strategy',
  'growth',
  'innovation',
  'leadership',
  'technology',
  'startup',
  'entrepreneurship',
]

/**
 * Normalize tag: lowercase, trim, remove special characters (except hyphens)
 * 
 * @param tag - Raw tag string
 * @returns Normalized tag
 */
export function normalizeTag(tag: string): string {
  return tag
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars except hyphens
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, '') // Remove leading/trailing hyphens
}

/**
 * Extract potential tags from content text
 * 
 * @param content - Content text to analyze
 * @param maxTags - Maximum number of tags to extract
 * @returns Array of extracted tags
 */
export function extractTags(content: string, maxTags: number = 5): string[] {
  if (!content || content.trim().length === 0) {
    return []
  }

  // Remove HTML tags if present (for richText)
  const textContent = content.replace(/<[^>]*>/g, ' ').toLowerCase()

  // Extract words (3+ characters, exclude common stop words)
  const stopWords = new Set([
    'the',
    'be',
    'to',
    'of',
    'and',
    'a',
    'in',
    'that',
    'have',
    'i',
    'it',
    'for',
    'not',
    'on',
    'with',
    'he',
    'as',
    'you',
    'do',
    'at',
    'this',
    'but',
    'his',
    'by',
    'from',
    'they',
    'we',
    'say',
    'her',
    'she',
    'or',
    'an',
    'will',
    'my',
    'one',
    'all',
    'would',
    'there',
    'their',
  ])

  const words = textContent
    .split(/\s+/)
    .map((word) => word.replace(/[^a-z0-9]/g, ''))
    .filter((word) => word.length >= 3 && !stopWords.has(word))

  // Count word frequencies
  const wordCounts = new Map<string, number>()
  words.forEach((word) => {
    wordCounts.set(word, (wordCounts.get(word) || 0) + 1)
  })

  // Sort by frequency and return top tags
  return Array.from(wordCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxTags)
    .map(([word]) => normalizeTag(word))
    .filter((tag) => tag.length > 0)
}

/**
 * Suggest tags based on content, category, and existing tags
 * 
 * @param content - Content text
 * @param category - Content category
 * @param existingTags - Already assigned tags
 * @param popularTagsList - List of popular tags from database
 * @param maxSuggestions - Maximum number of suggestions
 * @returns Array of tag suggestions
 */
export function suggestTags(
  content?: string,
  category?: string,
  existingTags: string[] = [],
  popularTagsList: string[] = [],
  maxSuggestions: number = 10,
): TagSuggestion[] {
  const suggestions: TagSuggestion[] = []
  const usedTags = new Set(existingTags.map((t) => normalizeTag(t)))

  // Add category-based tags
  if (category && category in categoryTags) {
    categoryTags[category].forEach((tag) => {
      const normalized = normalizeTag(tag)
      if (!usedTags.has(normalized)) {
        suggestions.push({
          tag: normalized,
          confidence: 0.8,
          source: 'category',
        })
      }
    })
  }

  // Add extracted tags from content
  if (content) {
    const extracted = extractTags(content, maxSuggestions)
    extracted.forEach((tag) => {
      if (!usedTags.has(tag)) {
        const existing = suggestions.find((s) => s.tag === tag)
        if (existing) {
          existing.confidence = Math.min(1, existing.confidence + 0.2)
        } else {
          suggestions.push({
            tag,
            confidence: 0.6,
            source: 'content',
          })
        }
      }
    })
  }

  // Add popular tags
  popularTagsList.slice(0, 5).forEach((tag) => {
    const normalized = normalizeTag(tag)
    if (!usedTags.has(normalized) && !suggestions.find((s) => s.tag === normalized)) {
      suggestions.push({
        tag: normalized,
        confidence: 0.4,
        source: 'popular',
      })
    }
  })

  // Sort by confidence and return top suggestions
  return suggestions
    .sort((a, b) => b.confidence - a.confidence)
    .slice(0, maxSuggestions)
}

/**
 * Validate and normalize array of tags
 * 
 * @param tags - Array of tag strings
 * @returns Array of normalized, unique tags
 */
export function normalizeTags(tags: string[]): string[] {
  const normalized = tags.map(normalizeTag).filter((tag) => tag.length > 0)
  return Array.from(new Set(normalized)) // Remove duplicates
}

/**
 * Get tag statistics from a collection of posts
 * 
 * @param posts - Array of posts with tags
 * @returns Map of tag to usage count and metadata
 */
export function getTagStatistics(
  posts: Array<{ tags?: Array<{ tag?: string } | string> }>,
): Map<string, TagMetadata> {
  const tagStats = new Map<string, TagMetadata>()

  posts.forEach((post) => {
    if (!post.tags) return

    post.tags.forEach((tagItem) => {
      const tag = typeof tagItem === 'string' ? tagItem : tagItem.tag || ''
      if (!tag) return

      const normalized = normalizeTag(tag)
      const existing = tagStats.get(normalized)

      tagStats.set(normalized, {
        tag: normalized,
        count: (existing?.count || 0) + 1,
        lastUsed: new Date(),
      })
    })
  })

  return tagStats
}

/**
 * Get most popular tags
 * 
 * @param tagStats - Tag statistics map
 * @param limit - Maximum number of tags to return
 * @returns Array of most popular tags sorted by count
 */
export function getPopularTags(tagStats: Map<string, TagMetadata>, limit: number = 20): string[] {
  return Array.from(tagStats.entries())
    .sort((a, b) => (b[1].count || 0) - (a[1].count || 0))
    .slice(0, limit)
    .map(([tag]) => tag)
}

/**
 * Merge tags from multiple sources
 * 
 * @param tagLists - Multiple arrays of tags to merge
 * @returns Merged, normalized, unique tags
 */
export function mergeTags(...tagLists: string[][]): string[] {
  const allTags = tagLists.flat()
  return normalizeTags(allTags)
}

