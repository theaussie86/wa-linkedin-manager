'use client'

import React, { useState, FormEvent } from 'react'
import { InputTypeSelector, type InputType } from './InputTypeSelector'
import { validateYouTubeUrl, validateBlogUrl, validateMemoText } from '@/lib/utils/validation'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import type { ContentGenerationRequest } from '@/app/actions/generate'

interface ContentGenerationError {
  message: string
  status?: number
  errors?: Record<string, string[]>
}

interface Company {
  id: string
  name: string
}

interface GenerateFormProps {
  companies: Company[]
  onSubmit: (data: ContentGenerationRequest) => Promise<void>
  isLoading?: boolean
}

interface FormErrors {
  inputType?: string
  youtubeUrl?: string
  blogUrl?: string
  memoText?: string
  company?: string
  general?: string
}

export function GenerateForm({ companies = [], onSubmit, isLoading = false }: GenerateFormProps) {
  const [inputType, setInputType] = useState<InputType>('youtube')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [blogUrl, setBlogUrl] = useState('')
  const [memoText, setMemoText] = useState('')
  const [company, setCompany] = useState('')
  const [customInstructions, setCustomInstructions] = useState('')
  const [callToAction, setCallToAction] = useState('')
  const [generateImage, setGenerateImage] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Safety check: don't render form if no companies available
  if (!companies || companies.length === 0) {
    return (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-4">
        <p className="text-sm text-red-700 dark:text-red-300">
          Keine Companies verfügbar. Bitte kontaktieren Sie einen Administrator.
        </p>
      </div>
    )
  }

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // Validate input type specific fields
    if (inputType === 'youtube') {
      if (!youtubeUrl.trim()) {
        newErrors.youtubeUrl = 'YouTube URL ist erforderlich'
      } else if (!validateYouTubeUrl(youtubeUrl)) {
        newErrors.youtubeUrl =
          'Ungültiges YouTube URL Format. Erwartet: https://www.youtube.com/watch?v=VIDEO_ID oder https://youtu.be/VIDEO_ID'
      }
    } else if (inputType === 'blog') {
      if (!blogUrl.trim()) {
        newErrors.blogUrl = 'Blog URL ist erforderlich'
      } else if (!validateBlogUrl(blogUrl)) {
        newErrors.blogUrl = 'Ungültiges URL Format. Erwartet: https://example.com'
      }
    } else if (inputType === 'memo') {
      if (!memoText.trim()) {
        newErrors.memoText = 'Memo Text ist erforderlich'
      } else if (!validateMemoText(memoText)) {
        newErrors.memoText = 'Memo Text muss mindestens 50 Zeichen lang sein'
      }
    }

    // Validate company
    if (!company) {
      newErrors.company = 'Company ist erforderlich'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitError(null)

    if (!validateForm()) {
      return
    }

    try {
      const requestData: ContentGenerationRequest = {
        inputType,
        company,
        customInstructions: customInstructions.trim() || undefined,
        callToAction: callToAction.trim() || undefined,
        generateImage,
      }

      if (inputType === 'youtube') {
        requestData.youtubeUrl = youtubeUrl.trim()
      } else if (inputType === 'blog') {
        requestData.blogUrl = blogUrl.trim()
      } else if (inputType === 'memo') {
        requestData.memoText = memoText.trim()
      }

      await onSubmit(requestData)
    } catch (error) {
      const apiError = error as ContentGenerationError
      setSubmitError(apiError.message || 'Ein Fehler ist aufgetreten')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Input Type Selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Content-Quelle
        </label>
        <InputTypeSelector value={inputType} onChange={setInputType} />
      </div>

      {/* YouTube URL Input */}
      {inputType === 'youtube' && (
        <div>
          <label htmlFor="youtubeUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            YouTube URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="youtubeUrl"
            value={youtubeUrl}
            onChange={(e) => {
              setYoutubeUrl(e.target.value)
              if (errors.youtubeUrl) {
                setErrors({ ...errors, youtubeUrl: undefined })
              }
            }}
            placeholder="https://www.youtube.com/watch?v=..."
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
              ${errors.youtubeUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            `}
            disabled={isLoading}
          />
          {errors.youtubeUrl && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.youtubeUrl}</p>
          )}
        </div>
      )}

      {/* Blog URL Input */}
      {inputType === 'blog' && (
        <div>
          <label htmlFor="blogUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Blog URL <span className="text-red-500">*</span>
          </label>
          <input
            type="url"
            id="blogUrl"
            value={blogUrl}
            onChange={(e) => {
              setBlogUrl(e.target.value)
              if (errors.blogUrl) {
                setErrors({ ...errors, blogUrl: undefined })
              }
            }}
            placeholder="https://example.com/blog/post"
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
              ${errors.blogUrl ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            `}
            disabled={isLoading}
          />
          {errors.blogUrl && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.blogUrl}</p>
          )}
        </div>
      )}

      {/* Memo Text Input */}
      {inputType === 'memo' && (
        <div>
          <label htmlFor="memoText" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Memo Text <span className="text-red-500">*</span>
          </label>
          <textarea
            id="memoText"
            value={memoText}
            onChange={(e) => {
              setMemoText(e.target.value)
              if (errors.memoText) {
                setErrors({ ...errors, memoText: undefined })
              }
            }}
            placeholder="Geben Sie hier Ihren Memo-Text ein (mindestens 50 Zeichen)..."
            rows={6}
            className={`
              w-full px-3 py-2 border rounded-md shadow-sm
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
              dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
              ${errors.memoText ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
            `}
            disabled={isLoading}
          />
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {memoText.length} Zeichen (mindestens 50 erforderlich)
          </p>
          {errors.memoText && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.memoText}</p>
          )}
        </div>
      )}

      {/* Company Select */}
      <div>
        <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Company <span className="text-red-500">*</span>
        </label>
        <select
          id="company"
          value={company}
          onChange={(e) => {
            setCompany(e.target.value)
            if (errors.company) {
              setErrors({ ...errors, company: undefined })
            }
          }}
          className={`
            w-full px-3 py-2 border rounded-md shadow-sm
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            dark:bg-gray-800 dark:border-gray-600 dark:text-gray-100
            ${errors.company ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'}
          `}
          disabled={isLoading}
        >
          <option value="">-- Company auswählen --</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        {errors.company && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.company}</p>
        )}
      </div>

      {/* Custom Instructions */}
      <div>
        <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Custom Instructions (optional)
        </label>
        <textarea
          id="customInstructions"
          value={customInstructions}
          onChange={(e) => setCustomInstructions(e.target.value)}
          placeholder="Zusätzliche Anweisungen für die Content-Generierung..."
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
          disabled={isLoading}
        />
      </div>

      {/* Call-to-Action */}
      <div>
        <label htmlFor="callToAction" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Call-to-Action (optional)
        </label>
        <input
          type="text"
          id="callToAction"
          value={callToAction}
          onChange={(e) => setCallToAction(e.target.value)}
          placeholder="z.B. 'Mehr erfahren', 'Jetzt kontaktieren', etc."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-gray-100"
          disabled={isLoading}
        />
      </div>

      {/* Generate Image Checkbox */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="generateImage"
          checked={generateImage}
          onChange={(e) => setGenerateImage(e.target.checked)}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label htmlFor="generateImage" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
          Bilder für Posts generieren
        </label>
      </div>

      {/* Submit Error */}
      {submitError && (
        <ErrorDisplay message={submitError} onRetry={() => setSubmitError(null)} />
      )}

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isLoading}
          className={`
            w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${
              isLoading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }
          `}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" />
              Content wird generiert...
            </>
          ) : (
            'Content generieren'
          )}
        </button>
      </div>
    </form>
  )
}

