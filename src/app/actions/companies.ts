'use server'

/**
 * Server Actions for Companies
 * Replaces /api/companies endpoints
 */

import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { headers } from 'next/headers'

export interface CompanyLogo {
  id: string
  url?: string
  filename?: string
}

export interface CompanyInfo {
  id: string
  name: string
  website?: string | null
  linkedinUrl?: string | null
  linkedinCompanyId?: string | null
  linkedinFollowerCount?: number | null
  linkedinPageUrl?: string | null
  industry?: string | null
  size?: 'startup' | 'small' | 'medium' | 'large' | 'enterprise' | null
  description?: string | null
  logo?: CompanyLogo | null
  businessOverview?: string | null
  idealCustomerProfile?: string | null
  valueProposition?: string | null
  researchStatus: 'pending' | 'in_progress' | 'completed' | 'failed'
  lastResearchAt?: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

/**
 * Transform company for response
 */
function transformCompany(company: any): CompanyInfo {
  return {
    id: String(company.id),
    name: company.name,
    website: company.website,
    linkedinUrl: company.linkedinUrl,
    linkedinCompanyId: company.linkedinCompanyId,
    linkedinFollowerCount: company.linkedinFollowerCount,
    linkedinPageUrl: company.linkedinPageUrl,
    industry: company.industry,
    size: company.size,
    description: company.description,
    logo: company.logo
      ? {
          id:
            typeof company.logo === 'string' || typeof company.logo === 'number'
              ? String(company.logo)
              : String(company.logo.id),
          url:
            typeof company.logo === 'object' && company.logo && 'url' in company.logo
              ? company.logo.url
              : undefined,
          filename:
            typeof company.logo === 'object' && company.logo && 'filename' in company.logo
              ? company.logo.filename
              : undefined,
        }
      : null,
    businessOverview: company.businessOverview,
    idealCustomerProfile: company.idealCustomerProfile,
    valueProposition: company.valueProposition,
    researchStatus: company.researchStatus || 'pending',
    lastResearchAt: company.lastResearchAt,
    isActive: company.isActive !== undefined ? company.isActive : true,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  }
}

/**
 * Fetches company information by ID
 */
export async function getCompanyInfo(companyId: string): Promise<CompanyInfo> {
  const payload = await getPayload({ config: configPromise })
  const headersList = await headers()

  // Authenticate user
  const { user } = await payload.auth({ headers: headersList })

  if (!user) {
    throw new Error('Authentication required')
  }

  try {
    // Fetch the company with depth 2 to include related data (logo)
    const company = await payload.findByID({
      collection: 'companies',
      id: companyId,
      depth: 2,
      req: {
        user,
        headers: headersList,
      } as Parameters<typeof payload.findByID>[0]['req'],
    })

    // Access control: Check if user can access this company
    if (user.role !== 'admin' && user.role !== 'manager') {
      if (!user.company) {
        throw new Error('Access denied')
      }

      const userCompanyId =
        typeof user.company === 'string' || typeof user.company === 'number'
          ? user.company
          : String(user.company.id)

      if (String(companyId) !== String(userCompanyId)) {
        throw new Error('Access denied')
      }
    }

    // Transform company for response
    return transformCompany(company)
  } catch (error: any) {
    console.error('Error fetching company:', error)

    // Handle not found
    if (error.status === 404 || error.message?.includes('not found')) {
      throw new Error('Company not found')
    }

    throw error instanceof Error ? error : new Error('Failed to fetch company')
  }
}

