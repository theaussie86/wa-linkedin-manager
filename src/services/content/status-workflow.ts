/**
 * Content Status Workflow Service
 * 
 * Provides workflow management for content status transitions.
 * Extends the existing status validation in GeneratedPost collection.
 */

export type ContentStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected'

export interface StatusTransition {
  from: ContentStatus
  to: ContentStatus
  requiredRoles?: string[]
  requiredFields?: string[]
  autoActions?: Array<{
    field: string
    value: any
    condition?: (data: any) => boolean
  }>
}

/**
 * Valid status transitions with their rules
 */
export const statusTransitions: Record<ContentStatus, StatusTransition[]> = {
  draft: [
    {
      from: 'draft',
      to: 'review',
      requiredRoles: ['admin', 'manager', 'content_creator'],
      requiredFields: ['title', 'content'],
    },
    {
      from: 'draft',
      to: 'rejected',
      requiredRoles: ['admin', 'manager'],
    },
  ],
  review: [
    {
      from: 'review',
      to: 'approved',
      requiredRoles: ['admin', 'manager', 'reviewer'],
      autoActions: [
        {
          field: 'reviewedBy',
          value: (data: any, user: any) => (user?.id ? user.id : null),
        },
        {
          field: 'reviewedAt',
          value: () => new Date().toISOString(),
        },
      ],
    },
    {
      from: 'review',
      to: 'rejected',
      requiredRoles: ['admin', 'manager', 'reviewer'],
      autoActions: [
        {
          field: 'reviewedBy',
          value: (data: any, user: any) => (user?.id ? user.id : null),
        },
        {
          field: 'reviewedAt',
          value: () => new Date().toISOString(),
        },
      ],
    },
    {
      from: 'review',
      to: 'draft',
      requiredRoles: ['admin', 'manager', 'content_creator'],
    },
  ],
  approved: [
    {
      from: 'approved',
      to: 'scheduled',
      requiredRoles: ['admin', 'manager'],
      requiredFields: ['scheduledFor'],
      autoActions: [
        {
          field: 'scheduledFor',
          condition: (data: any) => {
            const scheduled = new Date(data.scheduledFor)
            return scheduled > new Date()
          },
        },
      ],
    },
    {
      from: 'approved',
      to: 'draft',
      requiredRoles: ['admin', 'manager'],
    },
  ],
  scheduled: [
    {
      from: 'scheduled',
      to: 'published',
      requiredRoles: ['admin', 'manager'],
      autoActions: [
        {
          field: 'publishedAt',
          value: () => new Date().toISOString(),
        },
        {
          field: 'linkedinPublicationDate',
          value: () => new Date().toISOString(),
        },
      ],
    },
    {
      from: 'scheduled',
      to: 'draft',
      requiredRoles: ['admin', 'manager'],
    },
  ],
  published: [
    // Terminal state - no transitions allowed
  ],
  rejected: [
    {
      from: 'rejected',
      to: 'draft',
      requiredRoles: ['admin', 'manager', 'content_creator'],
    },
  ],
}

/**
 * Check if a status transition is valid
 * 
 * @param fromStatus - Current status
 * @param toStatus - Target status
 * @param userRole - User role attempting the transition
 * @returns Whether the transition is valid
 */
export function isValidTransition(
  fromStatus: ContentStatus,
  toStatus: ContentStatus,
  userRole?: string,
): {
  valid: boolean
  reason?: string
  transition?: StatusTransition
} {
  // Same status is always valid (no-op)
  if (fromStatus === toStatus) {
    return { valid: true }
  }

  // Published is a terminal state
  if (fromStatus === 'published') {
    return {
      valid: false,
      reason: 'Cannot transition from published status (terminal state)',
    }
  }

  // Find matching transition
  const transitions = statusTransitions[fromStatus] || []
  const transition = transitions.find((t) => t.to === toStatus)

  if (!transition) {
    return {
      valid: false,
      reason: `Invalid transition from ${fromStatus} to ${toStatus}. Valid transitions: ${transitions.map((t) => t.to).join(', ')}`,
    }
  }

  // Check role requirement
  if (transition.requiredRoles && userRole) {
    if (!transition.requiredRoles.includes(userRole)) {
      return {
        valid: false,
        reason: `Role ${userRole} is not allowed to transition from ${fromStatus} to ${toStatus}. Required roles: ${transition.requiredRoles.join(', ')}`,
        transition,
      }
    }
  }

  return {
    valid: true,
    transition,
  }
}

/**
 * Validate required fields for a status transition
 * 
 * @param transition - Status transition
 * @param data - Content data
 * @returns Validation result
 */
export function validateTransitionFields(
  transition: StatusTransition,
  data: any,
): {
  valid: boolean
  missingFields?: string[]
} {
  if (!transition.requiredFields || transition.requiredFields.length === 0) {
    return { valid: true }
  }

  const missingFields = transition.requiredFields.filter((field) => {
    const value = data[field]
    return value === undefined || value === null || value === ''
  })

  return {
    valid: missingFields.length === 0,
    missingFields: missingFields.length > 0 ? missingFields : undefined,
  }
}

/**
 * Execute auto-actions for a status transition
 * 
 * @param transition - Status transition
 * @param data - Content data
 * @param user - User performing the transition
 * @returns Updated data with auto-actions applied
 */
export function applyTransitionActions(
  transition: StatusTransition,
  data: any,
  user?: any,
): any {
  if (!transition.autoActions || transition.autoActions.length === 0) {
    return data
  }

  const updatedData = { ...data }

  transition.autoActions.forEach((action) => {
    // Check condition if present
    if (action.condition && !action.condition(data)) {
      return // Skip this action
    }

    // Apply action value
    if (typeof action.value === 'function') {
      updatedData[action.field] = action.value(data, user)
    } else {
      updatedData[action.field] = action.value
    }
  })

  return updatedData
}

/**
 * Get valid next statuses for a given current status and user role
 * 
 * @param currentStatus - Current status
 * @param userRole - User role
 * @returns Array of valid next statuses
 */
export function getValidNextStatuses(currentStatus: ContentStatus, userRole?: string): ContentStatus[] {
  const transitions = statusTransitions[currentStatus] || []

  if (!userRole) {
    return transitions.map((t) => t.to)
  }

  return transitions
    .filter((t) => {
      if (!t.requiredRoles || t.requiredRoles.length === 0) {
        return true // No role requirement
      }
      return t.requiredRoles.includes(userRole)
    })
    .map((t) => t.to)
}

/**
 * Get workflow statistics for content collection
 * 
 * @param posts - Array of posts with status
 * @returns Statistics about status distribution
 */
export function getWorkflowStatistics(
  posts: Array<{ status?: ContentStatus | string }>,
): Record<ContentStatus, number> {
  const stats: Record<ContentStatus, number> = {
    draft: 0,
    review: 0,
    approved: 0,
    scheduled: 0,
    published: 0,
    rejected: 0,
  }

  posts.forEach((post) => {
    if (post.status && post.status in stats) {
      stats[post.status as ContentStatus]++
    }
  })

  return stats
}

/**
 * Get workflow progress for a post
 * 
 * @param status - Current status
 * @returns Progress percentage (0-100)
 */
export function getWorkflowProgress(status: ContentStatus): number {
  const progressMap: Record<ContentStatus, number> = {
    draft: 0,
    review: 25,
    approved: 50,
    scheduled: 75,
    published: 100,
    rejected: 0,
  }

  return progressMap[status] || 0
}

/**
 * Check if post can be published (all requirements met)
 * 
 * @param post - Post data
 * @returns Whether post is ready for publication
 */
export function canPublish(post: any): {
  canPublish: boolean
  reasons?: string[]
} {
  const reasons: string[] = []

  if (!post.title || post.title.trim().length === 0) {
    reasons.push('Title is required')
  }

  if (!post.content) {
    reasons.push('Content is required')
  }

  if (post.status !== 'approved' && post.status !== 'scheduled') {
    reasons.push(`Post must be approved or scheduled, current status: ${post.status}`)
  }

  if (post.status === 'scheduled' && post.scheduledFor) {
    const scheduled = new Date(post.scheduledFor)
    const now = new Date()
    if (scheduled > now) {
      reasons.push(`Post is scheduled for ${scheduled.toISOString()}, cannot publish before scheduled time`)
    }
  }

  return {
    canPublish: reasons.length === 0,
    reasons: reasons.length > 0 ? reasons : undefined,
  }
}

