'use client'

import React, { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { usePosts } from '@/lib/hooks/usePosts'
import { PostList } from '@/components/posts/PostList'
import { FilterBar, FilterOptions } from '@/components/shared/FilterBar'
import { SearchBar } from '@/components/shared/SearchBar'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

interface PostsPageClientProps {
  companies: Array<{ id: string; name: string }>
}

export function PostsPageClient({ companies }: PostsPageClientProps) {
  const router = useRouter()
  const {
    posts,
    isLoading,
    error,
    filters,
    setFilters,
    search,
    setSearch,
    pagination,
    setPage,
    clearFilters,
  } = usePosts()

  const filterOptions: FilterOptions = useMemo(
    () => ({
      status: filters.status,
      company: filters.company,
      writingStyle: filters.writingStyle,
      category: filters.category,
    }),
    [filters]
  )

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters({
      status: newFilters.status,
      company: newFilters.company,
      writingStyle: newFilters.writingStyle as any,
      category: newFilters.category,
    })
  }

  const handleCreatePost = () => {
    router.push('/generate')
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Generierte Posts
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Verwalten Sie Ihre generierten LinkedIn Posts
            </p>
          </div>
          <button
            onClick={handleCreatePost}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <svg
              className="mr-2 h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Neuen Post generieren
          </button>
        </div>

        <div className="mb-6">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Nach Titel oder Inhalt suchen..."
            className="max-w-md"
          />
        </div>

        <FilterBar
          filters={filterOptions}
          onFilterChange={handleFilterChange}
          companies={companies}
        />
      </div>

      {isLoading && (!posts || posts.length === 0) ? (
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      ) : (
        <>
          <PostList
            posts={posts || []}
            isLoading={isLoading}
            error={error}
            emptyMessage="Noch keine Posts generiert"
            emptyActionLabel="Ersten Post generieren"
            onEmptyAction={handleCreatePost}
          />

          {pagination.totalPages > 1 && (
            <div className="mt-8 flex items-center justify-between">
              <div className="text-sm text-gray-700 dark:text-gray-300">
                Zeige {posts?.length || 0} von {pagination.totalDocs} Posts (Seite {pagination.page} von{' '}
                {pagination.totalPages})
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Zurück
                </button>
                <button
                  onClick={() => setPage(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Weiter
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

