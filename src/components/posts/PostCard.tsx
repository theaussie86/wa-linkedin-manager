'use client'

import React from 'react'
import Link from 'next/link'
import { PostListItem } from '@/app/actions/posts'
import { PostStatusBadge } from './PostStatusBadge'
import { formatDate } from '@/lib/utils/formatting'

interface PostCardProps {
  post: PostListItem
}

const writingStyleLabels: Record<string, string> = {
  story_based: 'Story-basiert',
  insight_focused: 'Insight-fokussiert',
  engagement_focused: 'Engagement-fokussiert',
}

const categoryLabels: Record<string, string> = {
  thought_leadership: 'Thought Leadership',
  industry_insights: 'Industry Insights',
  company_updates: 'Company Updates',
  educational: 'Educational',
  behind_scenes: 'Behind the Scenes',
  case_studies: 'Case Studies',
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/posts/${post.id}`}
      className="block bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200"
    >
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 line-clamp-2">
            {post.title}
          </h3>
          <PostStatusBadge status={post.status} className="ml-2 flex-shrink-0" />
        </div>

        {post.contentPreview && (
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
            {post.contentPreview}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {post.company && (
            <div className="flex items-center">
              <span className="font-medium">Unternehmen:</span>
              <span className="ml-1">{post.company.name || post.company.id}</span>
            </div>
          )}

          <div className="flex items-center">
            <span className="font-medium">Stil:</span>
            <span className="ml-1">
              {writingStyleLabels[post.writingStyle] || post.writingStyle}
            </span>
          </div>

          <div className="flex items-center">
            <span className="font-medium">Kategorie:</span>
            <span className="ml-1">{categoryLabels[post.category] || post.category}</span>
          </div>

          <div className="flex items-center">
            <span className="font-medium">Erstellt:</span>
            <span className="ml-1">{formatDate(post.createdAt)}</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

