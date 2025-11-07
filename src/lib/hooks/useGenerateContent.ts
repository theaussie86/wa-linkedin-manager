'use client'

import { useState, useCallback } from 'react'
import { generateContent, type ContentGenerationRequest, type ContentGenerationResponse } from '@/app/actions/generate'
import type { ProgressStep } from '@/components/generate/StatusProgress'

interface UseGenerateContentState {
  isLoading: boolean
  error: string | null
  response: ContentGenerationResponse | null
  currentStep: ProgressStep | undefined
  progress: number | undefined
}

interface UseGenerateContentReturn {
  state: UseGenerateContentState
  submitForm: (data: ContentGenerationRequest) => Promise<void>
  reset: () => void
}

export function useGenerateContent(): UseGenerateContentReturn {
  const [state, setState] = useState<UseGenerateContentState>({
    isLoading: false,
    error: null,
    response: null,
    currentStep: undefined,
    progress: undefined,
  })

  const submitForm = useCallback(async (data: ContentGenerationRequest) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      currentStep: 'transcript',
      progress: 0,
    }))

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setState((prev) => {
          if (prev.progress === undefined) return prev
          const newProgress = Math.min(prev.progress + 10, 90)
          let newStep: ProgressStep = prev.currentStep || 'transcript'

          if (newProgress >= 30 && prev.currentStep === 'transcript') {
            newStep = 'content'
          } else if (newProgress >= 70 && prev.currentStep === 'content') {
            newStep = 'images'
          }

          return {
            ...prev,
            progress: newProgress,
            currentStep: newStep,
          }
        })
      }, 500)

      const response = await generateContent(data)

      clearInterval(progressInterval)

      setState({
        isLoading: false,
        error: null,
        response,
        currentStep: 'completed',
        progress: 100,
      })
    } catch (error) {
      setState({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Ein Fehler ist aufgetreten',
        response: null,
        currentStep: 'error',
        progress: undefined,
      })
    }
  }, [])

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      response: null,
      currentStep: undefined,
      progress: undefined,
    })
  }, [])

  return {
    state,
    submitForm,
    reset,
  }
}

