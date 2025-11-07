'use client'

import { useState, useEffect, useCallback } from 'react'
import { listPosts, PostsListParams, PostsListResponse } from '@/app/actions/posts'

export interface UsePostsOptions {
  initialFilters?: PostsListParams
  autoFetch?: boolean
}

export interface UsePostsReturn {
  posts: PostsListResponse['docs']
  isLoading: boolean
  error: string | null
  filters: PostsListParams
  setFilters: (filters: PostsListParams) => void
  search: string
  setSearch: (search: string) => void
  pagination: {
    page: number
    limit: number
    totalPages: number
    totalDocs: number
    hasPrevPage: boolean
    hasNextPage: boolean
  }
  setPage: (page: number) => void
  setLimit: (limit: number) => void
  refetch: () => Promise<void>
  clearFilters: () => void
}

export function usePosts(options: UsePostsOptions = {}): UsePostsReturn {
  const { initialFilters = {}, autoFetch = true } = options

  const [posts, setPosts] = useState<PostsListResponse['docs']>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<PostsListParams>(initialFilters)
  const [search, setSearch] = useState<string>(initialFilters.search || '')
  const [pagination, setPagination] = useState({
    page: initialFilters.page || 1,
    limit: initialFilters.limit || 20,
    totalPages: 0,
    totalDocs: 0,
    hasPrevPage: false,
    hasNextPage: false,
  })

  const fetchPosts = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const params: PostsListParams = {
        ...filters,
        search: search || undefined,
        page: pagination.page,
        limit: pagination.limit,
      }

      const response = await listPosts(params)

      setPosts(response.docs || [])
      setPagination({
        page: response.page,
        limit: response.limit,
        totalPages: response.totalPages,
        totalDocs: response.totalDocs,
        hasPrevPage: response.hasPrevPage,
        hasNextPage: response.hasNextPage,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error
          ? err.message
          : 'Fehler beim Laden der Posts. Bitte versuchen Sie es erneut.'
      setError(errorMessage)
      setPosts([])
    } finally {
      setIsLoading(false)
    }
  }, [filters, search, pagination.page, pagination.limit])

  useEffect(() => {
    if (autoFetch) {
      fetchPosts()
    }
  }, [autoFetch, fetchPosts])

  const handleSetFilters = useCallback((newFilters: PostsListParams) => {
    setFilters(newFilters)
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page when filters change
  }, [])

  const handleSetSearch = useCallback((newSearch: string) => {
    setSearch(newSearch)
    setPagination((prev) => ({ ...prev, page: 1 })) // Reset to first page when search changes
  }, [])

  const handleSetPage = useCallback((page: number) => {
    setPagination((prev) => ({ ...prev, page }))
  }, [])

  const handleSetLimit = useCallback((limit: number) => {
    setPagination((prev) => ({ ...prev, limit, page: 1 })) // Reset to first page when limit changes
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setSearch('')
    setPagination((prev) => ({ ...prev, page: 1 }))
  }, [])

  return {
    posts: posts || [],
    isLoading,
    error,
    filters,
    setFilters: handleSetFilters,
    search,
    setSearch: handleSetSearch,
    pagination,
    setPage: handleSetPage,
    setLimit: handleSetLimit,
    refetch: fetchPosts,
    clearFilters,
  }
}

