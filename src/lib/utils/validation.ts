/**
 * Validation utilities for Content Generation UI
 */

/**
 * Validates YouTube URL format
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function validateYouTubeUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  const trimmedUrl = url.trim()

  // Standard YouTube watch URL
  const watchPattern = /^https?:\/\/(www\.)?(m\.)?youtube\.com\/watch\?v=[\w-]+/
  if (watchPattern.test(trimmedUrl)) {
    return true
  }

  // Short YouTube URL
  const shortPattern = /^https?:\/\/(www\.)?youtu\.be\/[\w-]+/
  if (shortPattern.test(trimmedUrl)) {
    return true
  }

  return false
}

/**
 * Validates Blog URL format
 * Must be a valid HTTP/HTTPS URL
 */
export function validateBlogUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  const trimmedUrl = url.trim()

  try {
    const urlObj = new URL(trimmedUrl)
    // Must be http or https
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Validates Memo text
 * Must be at least 50 characters long
 */
export function validateMemoText(text: string): boolean {
  if (!text || typeof text !== 'string') {
    return false
  }

  const trimmedText = text.trim()
  return trimmedText.length >= 50
}

/**
 * Gets validation error message for YouTube URL
 */
export function getYouTubeUrlError(url: string): string | null {
  if (!url || url.trim() === '') {
    return 'YouTube URL ist erforderlich'
  }
  if (!validateYouTubeUrl(url)) {
    return 'Ungültiges YouTube URL Format. Erwartet: https://www.youtube.com/watch?v=VIDEO_ID oder https://youtu.be/VIDEO_ID'
  }
  return null
}

/**
 * Gets validation error message for Blog URL
 */
export function getBlogUrlError(url: string): string | null {
  if (!url || url.trim() === '') {
    return 'Blog URL ist erforderlich'
  }
  if (!validateBlogUrl(url)) {
    return 'Ungültiges URL Format. Erwartet: https://example.com'
  }
  return null
}

/**
 * Gets validation error message for Memo text
 */
export function getMemoTextError(text: string): string | null {
  if (!text || text.trim() === '') {
    return 'Memo Text ist erforderlich'
  }
  if (!validateMemoText(text)) {
    return 'Memo Text muss mindestens 50 Zeichen lang sein'
  }
  return null
}

