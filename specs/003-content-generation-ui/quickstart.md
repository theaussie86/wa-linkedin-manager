# Quickstart: Content Generation UI

**Feature**: 003-content-generation-ui  
**Date**: 2025-01-27

## Übersicht

Dieser Quickstart-Guide hilft bei der Implementierung der Content Generation UI für das LinkedIn Content Management System. Die UI ermöglicht es Content Creators, Content Generation Requests zu erstellen, generierte Posts zu verwalten und den Review-Prozess durchzuführen.

## Voraussetzungen

- ✅ Payload CMS läuft lokal oder remote
- ✅ GeneratedPost und Company Collections sind konfiguriert
- ✅ n8n Content Generation Workflow ist eingerichtet (siehe Feature 002)
- ✅ TypeScript und Next.js 15 App Router sind konfiguriert
- ✅ Tailwind CSS ist eingerichtet

## Schritt 1: API Endpoints erstellen

### 1.1 Posts API Endpoint

`src/app/api/posts/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const searchParams = req.nextUrl.searchParams
    const status = searchParams.get('status')
    const company = searchParams.get('company')
    const writingStyle = searchParams.get('writingStyle')
    const category = searchParams.get('category')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Build where clause
    const where: any = {}

    if (status) {
      where.status = { equals: status }
    }

    if (company) {
      where.company = { equals: company }
    }

    if (writingStyle) {
      where.writingStyle = { equals: writingStyle }
    }

    if (category) {
      where.category = { equals: category }
    }

    if (search) {
      where.or = [
        { title: { contains: search } },
        { content: { contains: search } },
      ]
    }

    // Execute query
    const result = await payload.find({
      collection: 'generated-posts',
      where,
      sort: `${sortOrder === 'desc' ? '-' : ''}${sortBy}`,
      page,
      limit,
    })

    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

### 1.2 Post Detail API Endpoint

`src/app/api/posts/[id]/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const post = await payload.findByID({
      collection: 'generated-posts',
      id: params.id,
    })

    // Find variants (posts with same referencePost)
    let variants = []
    if (post.referencePost) {
      const variantResult = await payload.find({
        collection: 'generated-posts',
        where: {
          referencePost: { equals: typeof post.referencePost === 'string' ? post.referencePost : post.referencePost.id },
        },
      })
      variants = variantResult.docs
    }

    return NextResponse.json({ post, variants })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    const data = await req.json()

    const updatedPost = await payload.update({
      collection: 'generated-posts',
      id: params.id,
      data,
    })

    return NextResponse.json({ post: updatedPost })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

### 1.3 Content Generation API Endpoint

`src/app/api/generate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { triggerContentGeneration } from '@/services/n8n/webhook-client'

export async function POST(req: NextRequest) {
  try {
    const payload = await getPayload({ config })
    const { user } = await payload.auth({ headers: req.headers })

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized', code: 'UNAUTHORIZED' },
        { status: 401 }
      )
    }

    // Check permissions
    if (!['admin', 'manager', 'content_creator'].includes(user.role)) {
      return NextResponse.json(
        { success: false, error: 'Forbidden', code: 'FORBIDDEN' },
        { status: 403 }
      )
    }

    const { inputType, company, youtubeUrl, blogUrl, memoText, customInstructions, callToAction, generateImage } = await req.json()

    // Validation
    if (!inputType || !company) {
      return NextResponse.json(
        { success: false, error: 'inputType and company are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (inputType === 'youtube' && !youtubeUrl) {
      return NextResponse.json(
        { success: false, error: 'youtubeUrl is required for youtube inputType', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (inputType === 'blog' && !blogUrl) {
      return NextResponse.json(
        { success: false, error: 'blogUrl is required for blog inputType', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    if (inputType === 'memo' && (!memoText || memoText.length < 50)) {
      return NextResponse.json(
        { success: false, error: 'memoText is required and must be at least 50 characters', code: 'VALIDATION_ERROR' },
        { status: 400 }
      )
    }

    // Verify company exists
    const companyDoc = await payload.findByID({
      collection: 'companies',
      id: company,
    })

    if (!companyDoc) {
      return NextResponse.json(
        { success: false, error: 'Company not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Create GeneratedPost entries for each writing style
    const writingStyles = ['story_based', 'insight_focused', 'engagement_focused']
    const posts = []

    for (const style of writingStyles) {
      const post = await payload.create({
        collection: 'generated-posts',
        data: {
          company,
          title: `Generated Post - ${style}`,
          content: { root: { children: [], direction: 'ltr', format: '', indent: 0, type: 'root', version: 1 } },
          writingStyle: style,
          category: 'thought_leadership',
          status: 'draft',
        },
      })
      posts.push(post)

      // Trigger n8n workflow (async)
      await triggerContentGeneration(String(post.id), generateImage || false, payload)
    }

    return NextResponse.json({
      success: true,
      posts,
      message: 'Content generation request created',
    }, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message, code: 'INTERNAL_ERROR' },
      { status: 500 }
    )
  }
}
```

### 1.4 Status Updates SSE Endpoint

`src/app/api/status/route.ts`:

```typescript
import { NextRequest } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(req: NextRequest) {
  const payload = await getPayload({ config })
  const { user } = await payload.auth({ headers: req.headers })

  if (!user) {
    return new Response('Unauthorized', { status: 401 })
  }

  const searchParams = req.nextUrl.searchParams
  const postId = searchParams.get('postId')

  if (!postId) {
    return new Response('postId is required', { status: 400 })
  }

  // Create SSE stream
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ postId })}\n\n`)
      )

      // Poll for status updates (simplified - in production, use proper event system)
      const interval = setInterval(async () => {
        try {
          const post = await payload.findByID({
            collection: 'generated-posts',
            id: postId,
          })

          // Send status update
          controller.enqueue(
            encoder.encode(
              `event: status_update\ndata: ${JSON.stringify({
                postId,
                status: post.status,
                timestamp: new Date().toISOString(),
              })}\n\n`
            )
          )

          // Close stream if post is completed or failed
          if (post.status === 'approved' || post.status === 'rejected') {
            clearInterval(interval)
            controller.close()
          }
        } catch (error) {
          controller.enqueue(
            encoder.encode(
              `event: error\ndata: ${JSON.stringify({ error: error.message })}\n\n`
            )
          )
          clearInterval(interval)
          controller.close()
        }
      }, 5000) // Poll every 5 seconds

      // Cleanup on close
      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
```

---

## Schritt 2: Frontend Komponenten erstellen

### 2.1 Posts Liste Komponente

`src/components/posts/PostList.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { PostCard } from './PostCard'
import { FilterBar } from '../shared/FilterBar'
import { SearchBar } from '../shared/SearchBar'
import { EmptyState } from '../shared/EmptyState'
import { LoadingSpinner } from '../shared/LoadingSpinner'
import type { GeneratedPost } from '@/payload-types'

export function PostList() {
  const [posts, setPosts] = useState<GeneratedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: null as string | null,
    company: null as string | null,
    writingStyle: null as string | null,
    category: null as string | null,
    search: '',
  })

  useEffect(() => {
    fetchPosts()
  }, [filters])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)
      if (filters.company) params.append('company', filters.company)
      if (filters.writingStyle) params.append('writingStyle', filters.writingStyle)
      if (filters.category) params.append('category', filters.category)
      if (filters.search) params.append('search', filters.search)

      const response = await fetch(`/api/posts?${params.toString()}`)
      const data = await response.json()
      setPosts(data.docs || [])
    } catch (error) {
      console.error('Error fetching posts:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner />
  }

  if (posts.length === 0) {
    return (
      <EmptyState
        message="Noch keine Posts generiert"
        actionLabel="Ersten Post generieren"
        onAction={() => window.location.href = '/generate'}
      />
    )
  }

  return (
    <div>
      <FilterBar filters={filters} onFiltersChange={setFilters} />
      <SearchBar value={filters.search} onChange={(value) => setFilters({ ...filters, search: value })} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  )
}
```

### 2.2 Post Detail Komponente mit Writing Style Tabs

`src/components/posts/PostDetail.tsx`:

```typescript
'use client'

import { useState, useEffect } from 'react'
import { WritingStyleTabs } from './WritingStyleTabs'
import { PostEditor } from './PostEditor'
import { StatusTransition } from '../review/StatusTransition'
import type { GeneratedPost } from '@/payload-types'

interface PostDetailProps {
  postId: string
}

export function PostDetail({ postId }: PostDetailProps) {
  const [post, setPost] = useState<GeneratedPost | null>(null)
  const [variants, setVariants] = useState<GeneratedPost[]>([])
  const [activeStyle, setActiveStyle] = useState<string>('story_based')

  useEffect(() => {
    fetchPost()
  }, [postId])

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${postId}`)
      const data = await response.json()
      setPost(data.post)
      setVariants(data.variants || [])
      if (data.post) {
        setActiveStyle(data.post.writingStyle)
      }
    } catch (error) {
      console.error('Error fetching post:', error)
    }
  }

  if (!post) {
    return <div>Loading...</div>
  }

  const activePost = variants.find(v => v.writingStyle === activeStyle) || post

  return (
    <div>
      <WritingStyleTabs
        activeStyle={activeStyle}
        onStyleChange={setActiveStyle}
        variants={variants}
      />
      <PostEditor post={activePost} onUpdate={fetchPost} />
      <StatusTransition post={activePost} onStatusChange={fetchPost} />
    </div>
  )
}
```

### 2.3 Content Generation Form

`src/components/generate/GenerateForm.tsx`:

```typescript
'use client'

import { useState } from 'react'
import { InputTypeSelector } from './InputTypeSelector'
import { validateYouTubeUrl, validateBlogUrl, validateMemoText } from '@/lib/utils/validation'

export function GenerateForm() {
  const [inputType, setInputType] = useState<'youtube' | 'blog' | 'memo'>('youtube')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [blogUrl, setBlogUrl] = useState('')
  const [memoText, setMemoText] = useState('')
  const [company, setCompany] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [callToAction, setCallToAction] = useState('')
  const [generateImage, setGenerateImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (inputType === 'youtube' && !validateYouTubeUrl(youtubeUrl)) {
      setError('Ungültige YouTube URL')
      return
    }

    if (inputType === 'blog' && !validateBlogUrl(blogUrl)) {
      setError('Ungültige Blog URL')
      return
    }

    if (inputType === 'memo' && !validateMemoText(memoText)) {
      setError('Memo Text muss mindestens 50 Zeichen lang sein')
      return
    }

    if (!company) {
      setError('Company ist erforderlich')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputType,
          company,
          youtubeUrl: inputType === 'youtube' ? youtubeUrl : undefined,
          blogUrl: inputType === 'blog' ? blogUrl : undefined,
          memoText: inputType === 'memo' ? memoText : undefined,
          customInstructions,
          callToAction,
          generateImage,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Fehler beim Erstellen des Content Generation Requests')
      }

      const data = await response.json()
      // Redirect to posts list or first post
      window.location.href = `/posts/${data.posts[0].id}`
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <InputTypeSelector value={inputType} onChange={setInputType} />
      
      {inputType === 'youtube' && (
        <input
          type="url"
          placeholder="YouTube URL"
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          required
        />
      )}

      {inputType === 'blog' && (
        <input
          type="url"
          placeholder="Blog URL"
          value={blogUrl}
          onChange={(e) => setBlogUrl(e.target.value)}
          required
        />
      )}

      {inputType === 'memo' && (
        <textarea
          placeholder="Memo Text (mindestens 50 Zeichen)"
          value={memoText}
          onChange={(e) => setMemoText(e.target.value)}
          minLength={50}
          required
        />
      )}

      <select value={company} onChange={(e) => setCompany(e.target.value)} required>
        <option value="">Company auswählen</option>
        {/* Company options */}
      </select>

      <textarea
        placeholder="Custom Instructions (optional)"
        value={customInstructions}
        onChange={(e) => setCustomInstructions(e.target.value)}
      />

      <input
        type="text"
        placeholder="Call-to-Action (optional)"
        value={callToAction}
        onChange={(e) => setCallToAction(e.target.value)}
      />

      <label>
        <input
          type="checkbox"
          checked={generateImage}
          onChange={(e) => setGenerateImage(e.target.checked)}
        />
        Generate Image
      </label>

      {error && <div className="text-red-500">{error}</div>}

      <button type="submit" disabled={loading}>
        {loading ? 'Wird erstellt...' : 'Content generieren'}
      </button>
    </form>
  )
}
```

---

## Schritt 3: Frontend Seiten erstellen

### 3.1 Posts Liste Seite

`src/app/(frontend)/posts/page.tsx`:

```typescript
import { PostList } from '@/components/posts/PostList'

export default function PostsPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Generated Posts</h1>
      <PostList />
    </div>
  )
}
```

### 3.2 Post Detail Seite

`src/app/(frontend)/posts/[id]/page.tsx`:

```typescript
import { PostDetail } from '@/components/posts/PostDetail'

export default function PostDetailPage({ params }: { params: { id: string } }) {
  return (
    <div className="container mx-auto py-8">
      <PostDetail postId={params.id} />
    </div>
  )
}
```

### 3.3 Content Generation Seite

`src/app/(frontend)/generate/page.tsx`:

```typescript
import { GenerateForm } from '@/components/generate/GenerateForm'

export default function GeneratePage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Neuen Post generieren</h1>
      <GenerateForm />
    </div>
  )
}
```

---

## Schritt 4: Testing Setup

### 4.1 Unit Tests

`tests/unit/components/PostList.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react'
import { PostList } from '@/components/posts/PostList'

describe('PostList', () => {
  it('renders empty state when no posts', () => {
    render(<PostList />)
    expect(screen.getByText('Noch keine Posts generiert')).toBeInTheDocument()
  })
})
```

### 4.2 Integration Tests

`tests/integration/api/posts.test.ts`:

```typescript
import { describe, it, expect } from 'vitest'

describe('Posts API', () => {
  it('returns posts list with filters', async () => {
    const response = await fetch('http://localhost:3000/api/posts?status=draft')
    const data = await response.json()
    expect(data.docs).toBeDefined()
    expect(Array.isArray(data.docs)).toBe(true)
  })
})
```

### 4.3 E2E Tests

`tests/e2e/posts.spec.ts`:

```typescript
import { test, expect } from '@playwright/test'

test('user can create content generation request', async ({ page }) => {
  await page.goto('/generate')
  await page.selectOption('select[name="inputType"]', 'youtube')
  await page.fill('input[name="youtubeUrl"]', 'https://www.youtube.com/watch?v=test')
  await page.selectOption('select[name="company"]', 'company-id')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL(/\/posts\/[a-z0-9-]+/)
})
```

---

## Schritt 5: Real-time Status Updates Hook

`src/lib/hooks/useStatusUpdates.ts`:

```typescript
import { useEffect, useState } from 'react'

interface StatusUpdate {
  postId: string
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  step?: string
  progress?: number
  error?: string
  timestamp: string
}

export function useStatusUpdates(postId: string) {
  const [status, setStatus] = useState<StatusUpdate | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!postId) return

    const eventSource = new EventSource(`/api/status?postId=${postId}`)

    eventSource.addEventListener('status_update', (event) => {
      const data = JSON.parse(event.data)
      setStatus(data)
    })

    eventSource.addEventListener('error', (event) => {
      const data = JSON.parse(event.data)
      setError(data.error)
      eventSource.close()
    })

    eventSource.addEventListener('completed', () => {
      eventSource.close()
    })

    return () => {
      eventSource.close()
    }
  }, [postId])

  return { status, error }
}
```

---

## Zusammenfassung

Die Implementierung umfasst:

1. ✅ **API Endpoints**: Posts Liste, Post Detail, Content Generation, Status Updates (SSE)
2. ✅ **Frontend Komponenten**: PostList, PostDetail, GenerateForm, WritingStyleTabs, PostEditor
3. ✅ **Frontend Seiten**: Posts Liste, Post Detail, Content Generation
4. ✅ **Real-time Updates**: SSE-basierte Status-Updates während Content-Generierung
5. ✅ **Testing**: Unit, Integration und E2E Tests

**Nächste Schritte**:
- Implementierung der restlichen Komponenten (FilterBar, SearchBar, EmptyState, etc.)
- Styling mit Tailwind CSS
- Error Handling und Loading States
- Access Control UI-Anpassungen basierend auf User-Rolle

