/**
 * Companies API Client
 * Re-exports Server Actions for consistency with other API clients
 * 
 * Note: This file exists for backward compatibility and type exports.
 * Client Components should use Server Actions directly via TanStack Query.
 */

export type {
  CompanyInfo,
  CompanyLogo,
} from '@/app/actions/companies'

export { getCompanyInfo } from '@/app/actions/companies'

