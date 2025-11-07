'use client'

import { useState, useEffect, useCallback } from 'react'
import { getCompanyInfo, CompanyInfo } from '@/app/actions/companies'

export interface UseCompanyOptions {
  autoFetch?: boolean
}

export interface UseCompanyReturn {
  company: CompanyInfo | null
  isLoading: boolean
  error: string | null
  fetchCompany: (companyId: string) => Promise<void>
  refetch: () => Promise<void>
}

export function useCompany(companyId?: string, options: UseCompanyOptions = {}): UseCompanyReturn {
  const { autoFetch = true } = options

  const [company, setCompany] = useState<CompanyInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanyData = useCallback(
    async (id: string) => {
      setIsLoading(true)
      setError(null)

      try {
        const fetchedCompany = await getCompanyInfo(id)
        setCompany(fetchedCompany)
      } catch (err) {
        const errorMessage =
          err instanceof Error
            ? err.message
            : 'Fehler beim Laden der Unternehmensinformationen. Bitte versuchen Sie es erneut.'
        setError(errorMessage)
        setCompany(null)
      } finally {
        setIsLoading(false)
      }
    },
    []
  )

  useEffect(() => {
    if (autoFetch && companyId) {
      fetchCompanyData(companyId)
    }
  }, [autoFetch, companyId, fetchCompanyData])

  return {
    company,
    isLoading,
    error,
    fetchCompany: fetchCompanyData,
    refetch: () => (companyId ? fetchCompanyData(companyId) : Promise.resolve()),
  }
}

