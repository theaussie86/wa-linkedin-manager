'use client'

import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { GenerateForm } from '@/components/generate/GenerateForm'
import { StatusProgress } from '@/components/generate/StatusProgress'
import { useGenerateContent } from '@/lib/hooks/useGenerateContent'
import { EmptyState } from '@/components/shared/EmptyState'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'

interface Company {
  id: string
  name: string
}

interface GeneratePageClientProps {
  companies: Company[]
  error?: string | null
}

export function GeneratePageClient({ companies, error }: GeneratePageClientProps) {
  const router = useRouter()
  const { state, submitForm, reset } = useGenerateContent()

  useEffect(() => {
    if (state.response && state.currentStep === 'completed') {
      // Redirect to posts page after successful generation
      const timer = setTimeout(() => {
        router.push('/posts')
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [state.response, state.currentStep, router])

  const handleSubmit = async (data: any) => {
    await submitForm(data)
  }

  // Show error if there was an error loading companies
  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
            Content generieren
          </h1>
        </div>
        <ErrorDisplay
          title="Fehler beim Laden der Companies"
          message={error}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  if (companies.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EmptyState
          title="Keine Companies verfügbar"
          description="Sie müssen zuerst eine Company erstellen, bevor Sie Content generieren können."
          actionLabel="Zur Admin-Seite"
          onAction={() => router.push('/admin/collections/companies')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Content generieren
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Erstellen Sie Content Generation Requests für LinkedIn Posts basierend auf YouTube-Videos,
          Blog-Posts oder Memos.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Section */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <GenerateForm
              companies={companies}
              onSubmit={handleSubmit}
              isLoading={state.isLoading}
            />
          </div>
        </div>

        {/* Status Progress Section */}
        <div className="lg:col-span-1">
          {state.currentStep && (
            <StatusProgress
              currentStep={state.currentStep}
              progress={state.progress}
              message={
                state.currentStep === 'completed'
                  ? 'Alle Posts wurden erfolgreich generiert!'
                  : state.error
                    ? state.error
                    : undefined
              }
            />
          )}
        </div>
      </div>
    </div>
  )
}

