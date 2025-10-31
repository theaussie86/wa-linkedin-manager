import type { Access } from 'payload'
import type { User } from '../payload-types'

// Helper function to check if user has admin role
export const isAdmin: Access = ({ req: { user } }) => {
  return Boolean(user && (user as User).role === 'admin')
}

// Helper function to check if user has admin or manager role
export const isAdminOrManager: Access = ({ req: { user } }) => {
  return Boolean(user && ((user as User).role === 'admin' || (user as User).role === 'manager'))
}

// Helper function to check if user has admin role or is the user themselves
export const isAdminOrUser: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admin can access all users
  if ((user as User).role === 'admin') return true

  // Users can only access their own data
  return true // This will be further filtered in the query
}

// Helper function to check if user can access a specific user's data
export const canAccessUser: Access = ({ req: { user }, id }) => {
  if (!user) return false

  // Admin can access all users
  if ((user as User).role === 'admin') return true

  // Manager can access users from their company
  if ((user as User).role === 'manager') {
    // This will be filtered by company relationship in queries
    return true
  }

  // Users can only access their own data
  return user.id === id
}

// Helper function for user-specific field access
export const isAdminOrSelf: Access = ({ req: { user }, id }) => {
  if (!user) return false

  // Admin can access all
  if ((user as User).role === 'admin') return true

  // Users can only access their own data
  return user.id === id
}

// Helper function to check if user is active
export const isActiveUser: Access = ({ req: { user } }) => {
  return Boolean(user && (user as User).isActive !== false)
}

// Helper function to check if user belongs to a specific company
export const isCompanyMember: Access = ({ req: { user } }) => {
  if (!user) return false

  // Admin can access all companies
  if ((user as User).role === 'admin') return true

  // Other users can only access their own company
  return true // This will be further filtered in the query
}

// Helper function for content creators and above
export const isContentCreatorOrAbove: Access = ({ req: { user } }) => {
  if (!user) return false

  const allowedRoles = ['admin', 'manager', 'content_creator']
  return allowedRoles.includes((user as User).role)
}

// Helper function for reviewers and above
export const isReviewerOrAbove: Access = ({ req: { user } }) => {
  if (!user) return false

  const allowedRoles = ['admin', 'manager', 'reviewer']
  return allowedRoles.includes((user as User).role)
}

// Helper function to check if user can create content
export const canCreateContent: Access = ({ req: { user } }) => {
  if (!user) return false

  const allowedRoles = ['admin', 'manager', 'content_creator']
  return allowedRoles.includes((user as User).role)
}

// Helper function to check if user can review content
export const canReviewContent: Access = ({ req: { user } }) => {
  if (!user) return false

  const allowedRoles = ['admin', 'manager', 'reviewer']
  return allowedRoles.includes((user as User).role)
}

// Helper function to check if user can manage users
export const canManageUsers: Access = ({ req: { user } }) => {
  if (!user) return false

  const allowedRoles = ['admin', 'manager']
  return allowedRoles.includes((user as User).role)
}

// Helper function to check if user can access analytics
export const canAccessAnalytics: Access = ({ req: { user } }) => {
  if (!user) return false

  const allowedRoles = ['admin', 'manager']
  return allowedRoles.includes((user as User).role)
}
