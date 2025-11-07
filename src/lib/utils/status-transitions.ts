/**
 * Status Transition Validation Logic
 * Provides client-side validation for status transitions based on business rules
 */

import type { ContentStatus } from '@/services/content/status-workflow'
import { isValidTransition, getValidNextStatuses } from '@/services/content/status-workflow'

export type UserRole = 'admin' | 'manager' | 'reviewer' | 'content_creator'

export interface StatusTransitionValidation {
  valid: boolean
  reason?: string
  requiredFields?: string[]
}

/**
 * Validates if a user can perform a status transition
 */
export function validateStatusTransition(
  fromStatus: ContentStatus,
  toStatus: ContentStatus,
  userRole?: UserRole
): StatusTransitionValidation {
  // Same status is always valid (no-op)
  if (fromStatus === toStatus) {
    return { valid: true }
  }

  // Check transition validity
  const validation = isValidTransition(fromStatus, toStatus, userRole)

  if (!validation.valid) {
    return {
      valid: false,
      reason: validation.reason,
    }
  }

  // Check required fields for specific transitions
  const requiredFields: string[] = []

  if (toStatus === 'scheduled' && fromStatus === 'approved') {
    requiredFields.push('scheduledFor')
  }

  if (toStatus === 'review' && fromStatus === 'draft') {
    requiredFields.push('title', 'content')
  }

  return {
    valid: true,
    requiredFields: requiredFields.length > 0 ? requiredFields : undefined,
  }
}

/**
 * Gets available status transitions for a given status and user role
 */
export function getAvailableTransitions(
  currentStatus: ContentStatus,
  userRole?: UserRole
): ContentStatus[] {
  return getValidNextStatuses(currentStatus, userRole)
}

/**
 * Checks if a user role can perform a specific transition
 */
export function canUserTransition(
  fromStatus: ContentStatus,
  toStatus: ContentStatus,
  userRole?: UserRole
): boolean {
  const validation = validateStatusTransition(fromStatus, toStatus, userRole)
  return validation.valid
}

/**
 * Gets the label for a status transition action
 */
export function getTransitionActionLabel(
  fromStatus: ContentStatus,
  toStatus: ContentStatus
): string {
  const labels: Record<string, string> = {
    'draft->review': 'Zur Review einreichen',
    'review->approved': 'Genehmigen',
    'review->rejected': 'Ablehnen',
    'approved->scheduled': 'Planen',
    'scheduled->published': 'Veröffentlichen',
    'rejected->draft': 'Zurück zu Entwurf',
    'review->draft': 'Zurück zu Entwurf',
    'approved->draft': 'Zurück zu Entwurf',
    'scheduled->draft': 'Zurück zu Entwurf',
  }

  const key = `${fromStatus}->${toStatus}`
  return labels[key] || `Status ändern zu ${toStatus}`
}

/**
 * Gets the button variant/style for a transition action
 */
export function getTransitionButtonVariant(
  fromStatus: ContentStatus,
  toStatus: ContentStatus
): 'primary' | 'success' | 'danger' | 'secondary' {
  if (toStatus === 'approved') return 'success'
  if (toStatus === 'rejected') return 'danger'
  if (toStatus === 'review') return 'primary'
  if (toStatus === 'scheduled') return 'primary'
  if (toStatus === 'published') return 'success'
  return 'secondary'
}

