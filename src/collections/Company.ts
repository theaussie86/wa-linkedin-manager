import type { CollectionConfig } from 'payload'

export const Company: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'industry', 'size', 'researchStatus', 'isActive'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') {
        // Admins can see all companies (including inactive ones)
        return true
      }
      if (user?.role === 'manager') {
        // Managers can see all companies (including inactive ones)
        return true
      }
      // Other users can only see active companies in their own company
      if (!user?.company) {
        return false // User has no company assigned
      }
      return {
        and: [
          {
            id: {
              equals: typeof user.company === 'string' ? user.company : user.company.id,
            },
          },
          {
            isActive: {
              equals: true,
            },
          },
        ],
      }
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'manager'
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      if (!user?.company) {
        return false // User has no company assigned
      }
      return {
        id: {
          equals: typeof user.company === 'string' ? user.company : user.company.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      // Soft delete: Recommend using update to set isActive=false instead
      // Hard delete is only allowed for admins, but soft delete via update is preferred
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      validate: (val) => {
        if (!val || val.length < 2) {
          return 'Company name must be at least 2 characters long'
        }
        return true
      },
    },
    {
      name: 'website',
      type: 'text',
      validate: (val) => {
        if (val && !val.match(/^https?:\/\/.+/)) {
          return 'Please enter a valid website URL (e.g., https://example.com)'
        }
        return true
      },
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      unique: true,
      validate: (val) => {
        if (val && !val.match(/^https:\/\/www\.linkedin\.com\/company\/.+/)) {
          return 'Please enter a valid LinkedIn company URL (e.g., https://www.linkedin.com/company/example)'
        }
        return true
      },
    },
    {
      name: 'industry',
      type: 'text',
    },
    {
      name: 'size',
      type: 'select',
      options: [
        { label: 'Startup', value: 'startup' },
        { label: 'Small (1-50 employees)', value: 'small' },
        { label: 'Medium (51-200 employees)', value: 'medium' },
        { label: 'Large (201-1000 employees)', value: 'large' },
        { label: 'Enterprise (1000+ employees)', value: 'enterprise' },
      ],
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media',
    },
    {
      name: 'businessOverview',
      type: 'richText',
      admin: {
        description: 'AI-generated business overview',
      },
    },
    {
      name: 'idealCustomerProfile',
      type: 'richText',
      admin: {
        description: 'AI-generated ideal customer profile',
      },
    },
    {
      name: 'valueProposition',
      type: 'richText',
      admin: {
        description: 'AI-generated value proposition',
      },
    },
    {
      name: 'researchStatus',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'In Progress', value: 'in_progress' },
        { label: 'Completed', value: 'completed' },
        { label: 'Failed', value: 'failed' },
      ],
      defaultValue: 'pending',
    },
    {
      name: 'lastResearchAt',
      type: 'date',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Ensure LinkedIn URL is normalized
        if (data?.linkedinUrl) {
          data.linkedinUrl = data.linkedinUrl.trim()
        }
        // Ensure website URL is normalized
        if (data?.website) {
          data.website = data.website.trim()
        }
        // Ensure name is trimmed
        if (data?.name) {
          data.name = data.name.trim()
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        // Update research status when research is completed
        if (data?.researchStatus === 'completed' && operation === 'update') {
          data.lastResearchAt = new Date().toISOString()
        }
        // Ensure isActive defaults to true on create
        if (operation === 'create' && data?.isActive === undefined) {
          data.isActive = true
        }
        return data
      },
    ],
    afterChange: [
      ({ doc, req, operation }) => {
        // Log company creation/update
        if (operation === 'create') {
          req.payload.logger.info(`New company created: ${doc.name} (${doc.id})`)
        } else if (operation === 'update') {
          req.payload.logger.info(`Company updated: ${doc.name} (${doc.id})`)
        }
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Soft delete: Instead of hard delete, set isActive to false
        // Note: In Payload CMS, we prevent deletion and recommend using update instead
        // This is handled via access control - admins can "delete" via update to set isActive=false
        req.payload.logger.warn(`Soft delete requested for company ${id} - use update to set isActive=false instead`)
        // Allow deletion but log it (actual soft delete should be done via update operation)
      },
    ],
  },
}
