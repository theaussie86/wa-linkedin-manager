import { Metadata } from 'next'
import { headers as getHeaders } from 'next/headers'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { GeneratePageClient } from './GeneratePageClient'

export const metadata: Metadata = {
  title: 'Content generieren | LinkedIn Manager',
  description: 'Erstellen Sie Content Generation Requests für LinkedIn Posts',
}

async function fetchCompanies() {
  try {
    const payload = await getPayload({ config: configPromise })
    const headers = await getHeaders()

    // Authenticate user from headers
    const { user } = await payload.auth({ headers })

    // Build where clause - respect access control
    const where: {
      isActive: { equals: boolean }
      id?: { equals: string | number }
    } = {
      isActive: {
        equals: true,
      },
    }

    // If user is not admin/manager, only show their own company
    if (user && user.role !== 'admin' && user.role !== 'manager') {
      if (user.company) {
        const companyId =
          typeof user.company === 'string' || typeof user.company === 'number'
            ? user.company
            : String(user.company.id)
        where.id = {
          equals: companyId,
        }
      } else {
        // User has no company assigned, return empty list
        return { companies: [], error: null }
      }
    }

    // Fetch companies with user context for access control
    const result = await payload.find({
      collection: 'companies',
      where,
      limit: 100,
      sort: 'name',
      req: {
        user,
        headers,
      } as Parameters<typeof payload.find>[0]['req'],
    })

    return {
      companies: result.docs.map((company) => ({
        id: String(company.id),
        name: company.name,
      })),
      error: null,
    }
  } catch (error) {
    console.error('Error fetching companies:', error)
    const errorMessage =
      error instanceof Error ? error.message : 'Ein Fehler ist beim Laden der Companies aufgetreten'
    return {
      companies: [],
      error: errorMessage,
    }
  }
}

export default async function GeneratePage() {
  const { companies, error } = await fetchCompanies()

  return <GeneratePageClient companies={companies} error={error} />
}
