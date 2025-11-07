'use client'

import React, { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { usePost } from '@/lib/hooks/usePost'
import { StatusTransition } from '@/components/review/StatusTransition'
import { ReviewPanel } from '@/components/review/ReviewPanel'
import { PostDetailComponent } from '@/components/posts/PostDetail'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'
import Link from 'next/link'
import type { UserRole } from '@/lib/utils/status-transitions'

export default function ReviewPage() {
  const params = useParams()
  const router = useRouter()
  const postId = params?.id as string

  const [userRole, setUserRole] = useState<UserRole | undefined>(undefined)
  const [accessDenied, setAccessDenied] = useState(false)

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
    refetch,
  } = usePost(postId)

  // Fetch user role (simplified - in production, this would come from auth context)
  // Payload CMS provides /api/users/me endpoint by default
  useEffect(() => {
    const fetchUserRole = async () => {
      try {
        // Try to get user from Payload CMS API
        const response = await fetch('/api/users/me', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        })

        if (response.ok) {
          const data = await response.json()
          if (data.user?.role) {
            setUserRole(data.user.role as UserRole)
          }
        } else if (response.status === 401) {
          // If not authenticated, redirect to login
          router.push('/login')
        }
      } catch (err) {
        console.error('Error fetching user role:', err)
        // For now, allow access but log error
        // The API will handle authentication checks
      }
    }

    fetchUserRole()
  }, [router])

  // Check access control
  useEffect(() => {
    if (userRole && activeVariant) {
      const currentStatus = activeVariant.status || 'draft'

      // Reviewers and Managers can access review page
      // Content Creators can only access if post is in draft status
      if (userRole === 'content_creator' && currentStatus !== 'draft') {
        setAccessDenied(true)
      } else if (
        userRole === 'reviewer' &&
        currentStatus !== 'review' &&
        currentStatus !== 'approved' &&
        currentStatus !== 'rejected'
      ) {
        // Reviewers can only see posts in review-related statuses
        // But allow access for now - the StatusTransition component will handle permissions
      }
    }
  }, [userRole, activeVariant])

  const handleVariantChange = (variant: NonNullable<typeof activeVariant>) => {
    setActiveVariant(variant)
  }

  const handleStatusChange = async (data: any) => {
    await updatePostData(data)
    // Refetch to get updated data
    await refetch()
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ErrorDisplay message={error} />
        </div>
      </div>
    )
  }

  if (accessDenied) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-lg font-semibold text-red-800 dark:text-red-200 mb-2">
              Zugriff verweigert
            </h2>
            <p className="text-red-600 dark:text-red-300 mb-4">
              Sie haben keine Berechtigung, diese Seite zu öffnen.
            </p>
            <Link
              href="/posts"
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Zurück zur Übersicht
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!post || !activeVariant) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">Post nicht gefunden</p>
          </div>
        </div>
      </div>
    )
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </li>
            <li>
              <Link
                href={`/posts/${postId}`}
                className="hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                {post.title}
              </Link>
            </li>
            <li>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </li>
            <li className="text-gray-900 dark:text-gray-100">Review</li>
          </ol>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content - Post Detail */}
          <div className="lg:col-span-2">
            <PostDetailComponent
              post={post}
              variants={variants}
              activeVariant={activeVariant}
              isLoading={false}
              error={null}
              isUpdating={isUpdating}
              updateError={updateError}
              onVariantChange={handleVariantChange}
              onUpdate={updatePostData}
              canEdit={false}
            />
          </div>

          {/* Sidebar - Review Actions */}
          <div className="space-y-6">
            {/* Status Transition */}
            <StatusTransition
              post={activeVariant}
              userRole={userRole}
              onStatusChange={handleStatusChange}
              isUpdating={isUpdating}
              updateError={updateError}
            />

            {/* Review Panel */}
            <ReviewPanel post={activeVariant} />
          </div>
        </div>
      </div>
    </div>
  )
}
