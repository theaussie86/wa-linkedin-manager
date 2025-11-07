'use client'

import React from 'react'

export type PostStatus =
  | 'draft'
  | 'review'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'rejected'

interface PostStatusBadgeProps {
  status: PostStatus
  className?: string
}

const statusConfig: Record<PostStatus, { label: string; className: string }> = {
  draft: {
    label: 'Entwurf',
    className: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  },
  review: {
    label: 'Review',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  },
  approved: {
    label: 'Genehmigt',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  },
  scheduled: {
    label: 'Geplant',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  published: {
    label: 'Veröffentlicht',
    className: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  },
  rejected: {
    label: 'Abgelehnt',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  },
}

export function PostStatusBadge({ status, className = '' }: PostStatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className} ${className}`}
    >
      {config.label}
    </span>
  )
}

