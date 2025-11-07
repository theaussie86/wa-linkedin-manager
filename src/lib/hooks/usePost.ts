'use client'

import { useState, useEffect, useCallback } from 'react'
import { getPost, updatePost, PostDetail, UpdatePostParams } from '@/app/actions/posts'

export interface UsePostOptions {
  autoFetch?: boolean
}

export interface UsePostReturn {
  post: PostDetail | null
  isLoading: boolean
  error: string | null
  isUpdating: boolean
  updateError: string | null
  variants: PostDetail[]
  activeVariant: PostDetail | null
  setActiveVariant: (variant: PostDetail | null) => void
  fetchPost: (postId: string) => Promise<void>
  updatePostData: (data: UpdatePostParams) => Promise<void>
  refetch: () => Promise<void>
}

export function usePost(postId?: string, options: UsePostOptions = {}): UsePostReturn {
  const { autoFetch = true } = options

  const [post, setPost] = useState<PostDetail | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)
  const [activeVariant, setActiveVariant] = useState<PostDetail | null>(null)

  const fetchPostData = useCallback(
    async (id: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const fetchedPost = await getPost(id)
        setPost(fetchedPost)

        // Set active variant to current post if variants exist
        if (fetchedPost.variants && fetchedPost.variants.length > 0) {
          // Find the variant that matches the current post's writing style
          const matchingVariant = fetchedPost.variants.find(
            (v) => v.writingStyle === fetchedPost.writingStyle
          )
          if (matchingVariant) {
            setActiveVariant(matchingVariant)
          } else {
            // If no matching variant, use the first one
            setActiveVariant(fetchedPost.variants[0])
          }
        } else {
          setActiveVariant(null)
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Fehler beim Laden des Posts. Bitte versuchen Sie es erneut.'
        setError(errorMessage)
        setPost(null)
        setActiveVariant(null)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  const handleUpdatePost = useCallback(
    async (data: UpdatePostParams) => {
      if (!post) {
        setUpdateError('Kein Post zum Aktualisieren')
        return
      }

      setIsUpdating(true)
      setUpdateError(null)

      try {
        const updatedPost = await updatePost(post.id, data)
        setPost(updatedPost)

        // Update active variant if it was updated
        if (activeVariant && updatedPost.id === activeVariant.id) {
          setActiveVariant(updatedPost)
        }

        // Update variants list if variants exist
        if (updatedPost.variants && updatedPost.variants.length > 0) {
          const updatedVariants = updatedPost.variants.map((v) =>
            v.id === updatedPost.id ? updatedPost : v
          )
          setPost((prev) => (prev ? { ...prev, variants: updatedVariants } : null))
        }
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Fehler beim Aktualisieren des Posts. Bitte versuchen Sie es erneut.'
        setUpdateError(errorMessage)
      } finally {
        setIsUpdating(false)
      }
    },
    [post, activeVariant]
  )

  const handleSetActiveVariant = useCallback((variant: PostDetail | null) => {
    setActiveVariant(variant)
  }, [])

  useEffect(() => {
    if (autoFetch && postId) {
      fetchPostData(postId)
    }
  }, [autoFetch, postId, fetchPostData])

  // Get variants list
  const variants = post?.variants || []

  return {
    post,
    isLoading,
    error,
    isUpdating,
    updateError,
    variants,
    activeVariant: activeVariant || post,
    setActiveVariant: handleSetActiveVariant,
    fetchPost: fetchPostData,
    updatePostData: handleUpdatePost,
    refetch: () => (postId ? fetchPostData(postId) : Promise.resolve()),
  }
}

