'use client'

import React from 'react'
import { CompanyInfo as CompanyInfoType } from '@/app/actions/companies'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'
import { formatDate } from '@/lib/utils/formatting'

interface CompanyInfoProps {
  company: CompanyInfoType | null
  isLoading?: boolean
  error?: string | null
}

const sizeLabels: Record<string, string> = {
  startup: 'Startup',
  small: 'Small (1-50 employees)',
  medium: 'Medium (51-200 employees)',
  large: 'Large (201-1000 employees)',
  enterprise: 'Enterprise (1000+ employees)',
}

const researchStatusLabels: Record<string, string> = {
  pending: 'Ausstehend',
  in_progress: 'In Bearbeitung',
  completed: 'Abgeschlossen',
  failed: 'Fehlgeschlagen',
}

const researchStatusColors: Record<string, string> = {
  pending: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  in_progress: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  failed: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export function CompanyInfo({ company, isLoading = false, error = null }: CompanyInfoProps) {
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

  if (!company) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Keine Unternehmensinformationen gefunden</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            {company.logo?.url && (
              <img
                src={company.logo.url}
                alt={company.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{company.name}</h1>
              {company.industry && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{company.industry}</p>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${researchStatusColors[company.researchStatus]}`}
            >
              {researchStatusLabels[company.researchStatus]}
            </span>
          </div>
        </div>

        {/* Basic Info */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {company.website && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Website</p>
              <a
                href={company.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {company.website}
              </a>
            </div>
          )}
          {company.linkedinUrl && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">LinkedIn</p>
              <a
                href={company.linkedinUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                {company.linkedinUrl}
              </a>
            </div>
          )}
          {company.size && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Unternehmensgröße</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">{sizeLabels[company.size]}</p>
            </div>
          )}
          {company.linkedinFollowerCount !== null && company.linkedinFollowerCount !== undefined && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">LinkedIn Follower</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {company.linkedinFollowerCount.toLocaleString()}
              </p>
            </div>
          )}
        </div>

        {company.description && (
          <div className="mt-6">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Beschreibung</p>
            <p className="text-sm text-gray-900 dark:text-gray-100 whitespace-pre-wrap">
              {company.description}
            </p>
          </div>
        )}
      </div>

      {/* AI-Generated Research Information */}
      {company.researchStatus === 'completed' && (
        <div className="space-y-6">
          {/* Business Overview */}
          {company.businessOverview && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Business Overview
              </h2>
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {company.businessOverview}
                </p>
              </div>
            </div>
          )}

          {/* Ideal Customer Profile */}
          {company.idealCustomerProfile && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Ideal Customer Profile (ICP)
              </h2>
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {company.idealCustomerProfile}
                </p>
              </div>
            </div>
          )}

          {/* Value Proposition */}
          {company.valueProposition && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Value Proposition
              </h2>
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {company.valueProposition}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Research Status Message */}
      {company.researchStatus !== 'completed' && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-yellow-400"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Research noch nicht abgeschlossen
              </h3>
              <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                <p>
                  Die AI-generierten Informationen (Business Overview, ICP, Value Proposition) werden
                  angezeigt, sobald der Research-Status "Abgeschlossen" ist.
                </p>
                {company.researchStatus === 'in_progress' && (
                  <p className="mt-2">Der Research-Prozess läuft derzeit...</p>
                )}
                {company.researchStatus === 'failed' && (
                  <p className="mt-2">
                    Der Research-Prozess ist fehlgeschlagen. Bitte versuchen Sie es erneut.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Metadata */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Metadaten</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Erstellt am</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {formatDate(company.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Aktualisiert am</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {formatDate(company.updatedAt)}
            </p>
          </div>
          {company.lastResearchAt && (
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Letztes Research</p>
              <p className="text-sm text-gray-900 dark:text-gray-100">
                {formatDate(company.lastResearchAt)}
              </p>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</p>
            <p className="text-sm text-gray-900 dark:text-gray-100">
              {company.isActive ? 'Aktiv' : 'Inaktiv'}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

