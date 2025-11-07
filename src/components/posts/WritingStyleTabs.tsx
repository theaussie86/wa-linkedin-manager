'use client'

import React from 'react'
import { PostDetail } from '@/app/actions/posts'

interface WritingStyleTabsProps {
  variants: PostDetail[]
  activeVariant: PostDetail | null
  onVariantChange: (variant: PostDetail) => void
  className?: string
}

const writingStyleLabels: Record<string, string> = {
  story_based: 'Story-basiert',
  insight_focused: 'Insight-fokussiert',
  engagement_focused: 'Engagement-fokussiert',
}

const writingStyleIcons: Record<string, React.ReactNode> = {
  story_based: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  ),
  insight_focused: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    </svg>
  ),
  engagement_focused: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
      />
    </svg>
  ),
}

export function WritingStyleTabs({
  variants,
  activeVariant,
  onVariantChange,
  className = '',
}: WritingStyleTabsProps) {
  // If no variants, don't show tabs
  if (variants.length === 0) {
    return null
  }

  // Sort variants by writing style order
  const sortedVariants = [...variants].sort((a, b) => {
    const order = ['story_based', 'insight_focused', 'engagement_focused']
    return order.indexOf(a.writingStyle) - order.indexOf(b.writingStyle)
  })

  return (
    <div className={`border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <nav className="-mb-px flex space-x-8" aria-label="Schreibstile">
        {sortedVariants.map((variant) => {
          const isActive = activeVariant?.id === variant.id
          return (
            <button
              key={variant.id}
              onClick={() => onVariantChange(variant)}
              className={`
                group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm
                ${
                  isActive
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
                }
                transition-colors duration-150
              `}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="mr-2">{writingStyleIcons[variant.writingStyle]}</span>
              <span>{writingStyleLabels[variant.writingStyle] || variant.writingStyle}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

