'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import { usePost } from '@/lib/hooks/usePost'
import { PostDetailComponent } from '@/components/posts/PostDetail'
import Link from 'next/link'

export default function PostDetailPage() {
  const params = useParams()
  const postId = params?.id as string

  const {
    post,
    variants,
    activeVariant,
    isLoading,
    error,
    isUpdating,
    updateError,
    setActiveVariant,
    updatePostData,
  } = usePost(postId)

  // Determine if user can edit (for now, allow editing if post is draft)
  // In a real implementation, this would check user role and permissions
  const canEdit = activeVariant?.status === 'draft'

  const handleVariantChange = (variant: NonNullable<typeof activeVariant>) => {
    setActiveVariant(variant)
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="mb-6" aria-label="Breadcrumb">
          <ol className="flex items-center space-x-2 text-sm text-gray-500 dark:text-gray-400">
            <li>
              <Link
                href="/posts"
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Posts
              </Link>
            </li>
            <li>
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </li>
            <li className="text-gray-900 dark:text-gray-100">
              {isLoading ? 'Laden...' : post?.title || 'Post'}
            </li>
          </ol>
        </nav>

        {/* Post Detail */}
        <PostDetailComponent
          post={post}
          variants={variants}
          activeVariant={activeVariant}
          isLoading={isLoading}
          error={error}
          isUpdating={isUpdating}
          updateError={updateError}
          onVariantChange={handleVariantChange}
          onUpdate={updatePostData}
          canEdit={canEdit}
        />
      </div>
    </div>
  )
}

