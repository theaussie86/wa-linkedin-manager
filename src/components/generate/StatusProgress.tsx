'use client'

import React from 'react'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'

export type ProgressStep = 'transcript' | 'content' | 'images' | 'completed' | 'error'

interface StatusProgressProps {
  currentStep?: ProgressStep
  progress?: number // 0-100
  message?: string
  className?: string
}

const stepLabels: Record<ProgressStep, string> = {
  transcript: 'Transkript wird verarbeitet...',
  content: 'AI generiert Content...',
  images: 'Bilder werden erstellt...',
  completed: 'Content-Generierung abgeschlossen',
  error: 'Fehler bei der Content-Generierung',
}

export function StatusProgress({
  currentStep,
  progress,
  message,
  className = '',
}: StatusProgressProps) {
  const steps: ProgressStep[] = ['transcript', 'content', 'images']
  const currentStepIndex = currentStep ? steps.indexOf(currentStep) : -1

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Status der Content-Generierung
      </h3>

      <div className="space-y-4">
        {steps.map((step, index) => {
          const isActive = currentStepIndex === index
          const isCompleted = currentStepIndex > index || currentStep === 'completed'
          const isError = currentStep === 'error' && isActive

          return (
            <div key={step} className="flex items-center gap-3">
              {/* Step Indicator */}
              <div className="flex-shrink-0">
                {isCompleted ? (
                  <div className="h-8 w-8 rounded-full bg-green-500 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                ) : isError ? (
                  <div className="h-8 w-8 rounded-full bg-red-500 flex items-center justify-center">
                    <svg
                      className="h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </div>
                ) : isActive ? (
                  <div className="h-8 w-8 flex items-center justify-center">
                    <LoadingSpinner size="sm" />
                  </div>
                ) : (
                  <div className="h-8 w-8 rounded-full border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                )}
              </div>

              {/* Step Label */}
              <div className="flex-1">
                <p
                  className={`text-sm font-medium ${
                    isActive
                      ? 'text-blue-600 dark:text-blue-400'
                      : isCompleted
                        ? 'text-green-600 dark:text-green-400'
                        : isError
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {stepLabels[step]}
                </p>
                {isActive && progress !== undefined && (
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{progress}%</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Custom Message */}
      {message && (
        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <p className="text-sm text-blue-800 dark:text-blue-200">{message}</p>
        </div>
      )}

      {/* Completed Message */}
      {currentStep === 'completed' && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
          <p className="text-sm text-green-800 dark:text-green-200">
            Alle Posts wurden erfolgreich generiert. Sie können sie jetzt in der Posts-Übersicht
            ansehen.
          </p>
        </div>
      )}

      {/* Error Message */}
      {currentStep === 'error' && (
        <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-md">
          <p className="text-sm text-red-800 dark:text-red-200">
            Ein Fehler ist bei der Content-Generierung aufgetreten. Bitte versuchen Sie es erneut.
          </p>
        </div>
      )}
    </div>
  )
}

