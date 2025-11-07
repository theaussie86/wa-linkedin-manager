'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { PostDetail, UpdatePostParams } from '@/app/actions/posts'
import { WritingStyleTabs } from './WritingStyleTabs'
import { PostEditor } from './PostEditor'
import { PostStatusBadge } from './PostStatusBadge'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'
import { formatDate } from '@/lib/utils/formatting'

interface PostDetailProps {
  post: PostDetail | null
  variants: PostDetail[]
  activeVariant: PostDetail | null
  isLoading?: boolean
  error?: string | null
  isUpdating?: boolean
  updateError?: string | null
  onVariantChange: (variant: PostDetail) => void
  onUpdate: (data: UpdatePostParams) => Promise<void>
  canEdit?: boolean
}

const categoryLabels: Record<string, string> = {
  thought_leadership: 'Thought Leadership',
  industry_insights: 'Industry Insights',
  company_updates: 'Company Updates',
  educational: 'Educational',
  behind_scenes: 'Behind the Scenes',
  case_studies: 'Case Studies',
}

export function PostDetailComponent({
  post,
  variants,
  activeVariant,
  isLoading = false,
  error = null,
  isUpdating = false,
  updateError = null,
  onVariantChange,
  onUpdate,
  canEdit = false,
}: PostDetailProps) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [editedTitle, setEditedTitle] = useState('')
  const [editedContent, setEditedContent] = useState<any>(null)
  const [editedCategory, setEditedCategory] = useState<string>('')
  const [editedTags, setEditedTags] = useState<Array<{ tag: string; id?: string }>>([])

  // Initialize edit state when entering edit mode
  React.useEffect(() => {
    if (isEditMode && activeVariant) {
      setEditedTitle(activeVariant.title)
      setEditedContent(activeVariant.content)
      setEditedCategory(activeVariant.category)
      setEditedTags(activeVariant.tags || [])
    }
  }, [isEditMode, activeVariant])

  const handleSave = async () => {
    if (!activeVariant) return

    await onUpdate({
      title: editedTitle,
      content: editedContent,
      category: editedCategory,
      tags: editedTags,
    })

    setIsEditMode(false)
  }

  const handleCancel = () => {
    setIsEditMode(false)
    // Reset to original values
    if (activeVariant) {
      setEditedTitle(activeVariant.title)
      setEditedContent(activeVariant.content)
      setEditedCategory(activeVariant.category)
      setEditedTags(activeVariant.tags || [])
    }
  }

  const handleAddTag = () => {
    setEditedTags([...editedTags, { tag: '' }])
  }

  const handleTagChange = (index: number, value: string) => {
    const newTags = [...editedTags]
    newTags[index] = { ...newTags[index], tag: value }
    setEditedTags(newTags)
  }

  const handleRemoveTag = (index: number) => {
    setEditedTags(editedTags.filter((_, i) => i !== index))
  }

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

  if (!post || !activeVariant) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Post nicht gefunden</p>
      </div>
    )
  }

  const displayPost = isEditMode ? { ...activeVariant, title: editedTitle, content: editedContent, category: editedCategory, tags: editedTags } : activeVariant

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {isEditMode ? (
              <input
                type="text"
                value={editedTitle}
                onChange={(e) => setEditedTitle(e.target.value)}
                className="w-full text-2xl font-bold text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 bg-white dark:bg-gray-800"
                placeholder="Post-Titel"
              />
            ) : (
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {displayPost.title}
              </h1>
            )}
          </div>
          <div className="ml-4 flex items-center gap-3">
            <PostStatusBadge status={displayPost.status || 'draft'} />
            {canEdit && !isEditMode && displayPost.status === 'draft' && (
              <button
                onClick={() => setIsEditMode(true)}
                className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Bearbeiten
              </button>
            )}
            {(displayPost.status === 'review' ||
              displayPost.status === 'approved' ||
              displayPost.status === 'rejected') && (
              <Link
                href={`/review/${post.id}`}
                className="px-4 py-2 text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300"
              >
                Review
              </Link>
            )}
          </div>
        </div>

        {/* Writing Style Tabs */}
        {variants.length > 0 && (
          <WritingStyleTabs
            variants={variants}
            activeVariant={activeVariant}
            onVariantChange={onVariantChange}
          />
        )}
      </div>

      {/* Update Error */}
      {updateError && (
        <div className="mb-4">
          <ErrorDisplay message={updateError} />
        </div>
      )}

      {/* Content */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Inhalt</h2>
        {isEditMode ? (
          <div className="space-y-4">
            <PostEditor
              content={editedContent}
              onChange={setEditedContent}
              readOnly={false}
            />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Hinweis: Vollständige RichText-Bearbeitung wird in einer zukünftigen Version verfügbar sein.
            </p>
          </div>
        ) : (
          <PostEditor content={displayPost.content} readOnly={true} />
        )}
      </div>

      {/* Metadata Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Basic Info */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Grundinformationen
          </h3>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Unternehmen</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {post.company?.name || post.company?.id || 'N/A'}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Kategorie</dt>
              {isEditMode ? (
                <select
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                >
                  {Object.entries(categoryLabels).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              ) : (
                <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                  {categoryLabels[displayPost.category] || displayPost.category}
                </dd>
              )}
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Erstellt</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDate(post.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktualisiert</dt>
              <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                {formatDate(post.updatedAt)}
              </dd>
            </div>
          </dl>
        </div>

        {/* AI Metadata */}
        {(post.aiPrompt || post.aiModel || post.generatedAt) && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              AI-Metadaten
            </h3>
            <dl className="space-y-3">
              {post.aiModel && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Modell</dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">{post.aiModel}</dd>
                </div>
              )}
              {post.generatedAt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    Generiert am
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900 dark:text-gray-100">
                    {formatDate(post.generatedAt)}
                  </dd>
                </div>
              )}
              {post.aiPrompt && (
                <div>
                  <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">Prompt</dt>
                  <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-700">
                    {post.aiPrompt}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>

      {/* Tags */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Tags</h3>
        {isEditMode ? (
          <div className="space-y-2">
            {editedTags.map((tag, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={tag.tag}
                  onChange={(e) => handleTagChange(index, e.target.value)}
                  className="flex-1 rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="Tag eingeben"
                />
                <button
                  onClick={() => handleRemoveTag(index)}
                  className="px-3 py-1 text-sm text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  Entfernen
                </button>
              </div>
            ))}
            <button
              onClick={handleAddTag}
              className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              + Tag hinzufügen
            </button>
          </div>
        ) : (
          <div className="flex flex-wrap gap-2">
            {displayPost.tags && displayPost.tags.length > 0 ? (
              displayPost.tags.map((tag, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                >
                  {tag.tag}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">Keine Tags</p>
            )}
          </div>
        )}
      </div>

      {/* Images */}
      {displayPost.images && displayPost.images.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Bilder</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayPost.images.map((imageItem, index) => {
              const image = imageItem.image
              if (!image) return null

              const imageUrl =
                typeof image === 'string'
                  ? image
                  : image.url || image.filename || '/placeholder-image.png'

              return (
                <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`Post image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Edit Mode Actions */}
      {isEditMode && (
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={handleCancel}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            Abbrechen
          </button>
          <button
            onClick={handleSave}
            disabled={isUpdating}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
          >
            {isUpdating && <LoadingSpinner size="sm" />}
            Speichern
          </button>
        </div>
      )}
    </div>
  )
}

