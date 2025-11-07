'use client'

import React from 'react'
import { PostDetail } from '@/app/actions/posts'
import { formatDate } from '@/lib/utils/formatting'

interface ReviewPanelProps {
  post: PostDetail
}

export function ReviewPanel({ post }: ReviewPanelProps) {
  // Only show review panel if post has been reviewed or has review comments
  const hasReviewInfo =
    post.reviewedBy || post.reviewedAt || post.reviewComments || post.status === 'rejected'

  if (!hasReviewInfo) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Review-Informationen
      </h3>

      <dl className="space-y-4">
        {/* Reviewed By */}
        {post.reviewedBy && (
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Geprüft von
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {typeof post.reviewedBy === 'object' && post.reviewedBy.name
                ? post.reviewedBy.name
                : post.reviewedBy.id || 'Unbekannt'}
            </dd>
          </div>
        )}

        {/* Reviewed At */}
        {post.reviewedAt && (
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Geprüft am
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(post.reviewedAt)}
            </dd>
          </div>
        )}

        {/* Review Comments */}
        {post.reviewComments && (
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
              Review-Kommentare
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100 bg-gray-50 dark:bg-gray-900 p-4 rounded-md border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
              {post.reviewComments}
            </dd>
          </div>
        )}

        {/* Scheduled For */}
        {post.scheduledFor && (
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Geplant für
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(post.scheduledFor)}
            </dd>
          </div>
        )}

        {/* Published At */}
        {post.publishedAt && (
          <div>
            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Veröffentlicht am
            </dt>
            <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
              {formatDate(post.publishedAt)}
            </dd>
          </div>
        )}
      </dl>
    </div>
  )
}

