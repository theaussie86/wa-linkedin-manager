'use client'

import React, { useState } from 'react'
import { PostDetail, UpdatePostParams } from '@/app/actions/posts'
import {
  validateStatusTransition,
  getAvailableTransitions,
  canUserTransition,
  getTransitionActionLabel,
  getTransitionButtonVariant,
  type UserRole,
} from '@/lib/utils/status-transitions'
import { LoadingSpinner } from '@/components/shared/LoadingSpinner'
import { ErrorDisplay } from '@/components/shared/ErrorDisplay'
import type { ContentStatus } from '@/services/content/status-workflow'

interface StatusTransitionProps {
  post: PostDetail
  userRole?: UserRole
  onStatusChange: (data: UpdatePostParams) => Promise<void>
  isUpdating?: boolean
  updateError?: string | null
}

export function StatusTransition({
  post,
  userRole,
  onStatusChange,
  isUpdating = false,
  updateError = null,
}: StatusTransitionProps) {
  const [showConfirmDialog, setShowConfirmDialog] = useState<ContentStatus | null>(null)
  const [reviewComments, setReviewComments] = useState('')
  const [scheduledFor, setScheduledFor] = useState('')
  const [showRejectForm, setShowRejectForm] = useState(false)
  const [showScheduleForm, setShowScheduleForm] = useState(false)
  const [transitionError, setTransitionError] = useState<string | null>(null)

  const currentStatus = (post.status || 'draft') as ContentStatus
  const availableTransitions = getAvailableTransitions(currentStatus, userRole)

  const handleTransition = async (toStatus: ContentStatus) => {
    setTransitionError(null)

    // Validate transition
    const validation = validateStatusTransition(currentStatus, toStatus, userRole)
    if (!validation.valid) {
      setTransitionError(validation.reason || 'Ungültige Status-Transition')
      return
    }

    // Check required fields
    if (validation.requiredFields) {
      if (toStatus === 'scheduled' && !scheduledFor) {
        setTransitionError('Bitte wählen Sie ein Datum für die Planung')
        return
      }
      if (toStatus === 'rejected' && !reviewComments.trim()) {
        setTransitionError('Bitte geben Sie einen Kommentar für die Ablehnung ein')
        return
      }
    }

    // Prepare update data
    const updateData: UpdatePostParams = {
      status: toStatus,
    }

    if (toStatus === 'rejected' && reviewComments.trim()) {
      updateData.reviewComments = reviewComments.trim()
    }

    if (toStatus === 'scheduled' && scheduledFor) {
      updateData.scheduledFor = scheduledFor
    }

    try {
      await onStatusChange(updateData)
      // Reset forms on success
      setReviewComments('')
      setScheduledFor('')
      setShowRejectForm(false)
      setShowScheduleForm(false)
      setShowConfirmDialog(null)
    } catch (error) {
      setTransitionError(
        error instanceof Error ? error.message : 'Fehler beim Ändern des Status'
      )
    }
  }

  const handleButtonClick = (toStatus: ContentStatus) => {
    // Show confirmation for critical actions
    if (toStatus === 'rejected' || toStatus === 'published') {
      if (toStatus === 'rejected') {
        setShowRejectForm(true)
      }
      setShowConfirmDialog(toStatus)
    } else if (toStatus === 'scheduled') {
      setShowScheduleForm(true)
      setShowConfirmDialog(toStatus)
    } else {
      handleTransition(toStatus)
    }
  }

  const handleConfirm = () => {
    if (showConfirmDialog) {
      handleTransition(showConfirmDialog)
    }
  }

  const handleCancel = () => {
    setShowConfirmDialog(null)
    setShowRejectForm(false)
    setShowScheduleForm(false)
    setReviewComments('')
    setScheduledFor('')
    setTransitionError(null)
  }

  // Don't show anything if no transitions are available
  if (availableTransitions.length === 0) {
    return null
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
        Status ändern
      </h3>

      {transitionError && (
        <div className="mb-4">
          <ErrorDisplay message={transitionError} />
        </div>
      )}

      {updateError && (
        <div className="mb-4">
          <ErrorDisplay message={updateError} />
        </div>
      )}

      <div className="space-y-3">
        {availableTransitions.map((toStatus) => {
          const label = getTransitionActionLabel(currentStatus, toStatus)
          const variant = getTransitionButtonVariant(currentStatus, toStatus)
          const canTransition = canUserTransition(currentStatus, toStatus, userRole)

          if (!canTransition) {
            return null
          }

          const buttonClasses = {
            primary:
              'bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600',
            success:
              'bg-green-600 hover:bg-green-700 text-white dark:bg-green-500 dark:hover:bg-green-600',
            danger:
              'bg-red-600 hover:bg-red-700 text-white dark:bg-red-500 dark:hover:bg-red-600',
            secondary:
              'bg-gray-600 hover:bg-gray-700 text-white dark:bg-gray-500 dark:hover:bg-gray-600',
          }

          return (
            <div key={toStatus}>
              <button
                onClick={() => handleButtonClick(toStatus)}
                disabled={isUpdating}
                className={`w-full px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${buttonClasses[variant]}`}
              >
                {isUpdating ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner size="sm" />
                    Wird verarbeitet...
                  </span>
                ) : (
                  label
                )}
              </button>

              {/* Reject Form */}
              {showRejectForm && showConfirmDialog === 'rejected' && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                  <label
                    htmlFor="reviewComments"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Ablehnungsgrund (erforderlich)
                  </label>
                  <textarea
                    id="reviewComments"
                    value={reviewComments}
                    onChange={(e) => setReviewComments(e.target.value)}
                    rows={4}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                    placeholder="Bitte geben Sie einen Grund für die Ablehnung ein..."
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleConfirm}
                      disabled={!reviewComments.trim() || isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Ablehnen
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}

              {/* Schedule Form */}
              {showScheduleForm && showConfirmDialog === 'scheduled' && (
                <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
                  <label
                    htmlFor="scheduledFor"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
                  >
                    Geplant für (erforderlich)
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduledFor"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                    className="w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-100"
                  />
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={handleConfirm}
                      disabled={!scheduledFor || isUpdating}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Planen
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isUpdating}
                      className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Confirmation Dialog for Published */}
      {showConfirmDialog === 'published' && (
        <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-md border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-3">
            Sind Sie sicher, dass Sie diesen Post jetzt veröffentlichen möchten?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 disabled:opacity-50"
            >
              Ja, veröffentlichen
            </button>
            <button
              onClick={handleCancel}
              disabled={isUpdating}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
            >
              Abbrechen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

