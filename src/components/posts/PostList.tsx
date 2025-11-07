'use client'

import React from 'react'
import { PostListItem } from '@/app/actions/posts'
import { PostCard } from './PostCard'
import { EmptyState } from '@/components/shared/EmptyState'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'

interface PostListProps {
  posts: PostListItem[]
  isLoading?: boolean
  error?: string | null
  emptyMessage?: string
  emptyActionLabel?: string
  onEmptyAction?: () => void
}

export function PostList({
  posts,
  isLoading = false,
  error = null,
  emptyMessage = 'Noch keine Posts generiert',
  emptyActionLabel = 'Ersten Post generieren',
  onEmptyAction,
}: PostListProps) {
  // Ensure posts is always an array
  const safePosts = posts || []

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return <ErrorDisplay message={error} />
  }

  if (safePosts.length === 0) {
    return (
      <EmptyState
        title={emptyMessage}
        description="Erstellen Sie Ihren ersten Content Generation Request, um zu beginnen."
        actionLabel={emptyActionLabel}
        onAction={onEmptyAction}
        icon={
          <svg
            className="h-12 w-12 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        }
      />
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {safePosts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  )
}

