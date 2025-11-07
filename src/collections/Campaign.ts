import type { CollectionConfig } from 'payload'

export const Campaign: CollectionConfig = {
  slug: 'campaigns',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'status', 'startDate', 'endDate', 'createdBy'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      if (!user?.company) {
        return false // User has no company assigned
      }
      const companyId =
        typeof user.company === 'string' || typeof user.company === 'number'
          ? user.company
          : user.company.id
      return {
        company: {
          equals: companyId,
        },
      }
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'content_creator'
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      if (!user?.company) {
        return false // User has no company assigned
      }
      const companyId =
        typeof user.company === 'string' || typeof user.company === 'number'
          ? user.company
          : user.company.id
      return {
        company: {
          equals: companyId,
        },
      }
    },
    delete: ({ req: { user } }) => {
      // Soft delete: Only admins can hard delete
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        description: 'Wählen Sie die Company für diese Campaign aus',
      },
      // @ts-expect-error - Payload CMS filterOptions type inference issue
      filterOptions: ({ user }) => {
        // Admins and managers can see all active companies
        if (user?.role === 'admin' || user?.role === 'manager') {
          return {
            isActive: {
              equals: true,
            },
          }
        }
        // Other users can only see their own company
        if (user?.company) {
          const companyId =
            typeof user.company === 'string' || typeof user.company === 'number'
              ? user.company
              : String((user.company as { id: string | number }).id)
          return {
            and: [
              {
                id: {
                  equals: companyId,
                },
              },
              {
                isActive: {
                  equals: true,
                },
              },
            ],
          }
        }
        // User has no company assigned - return empty filter (no companies available)
        return {
          id: {
            equals: 'nonexistent-id-that-will-never-match',
          },
        }
      },
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      validate: (val: unknown) => {
        if (!val || (typeof val === 'string' && val.length < 2)) {
          return 'Campaign name must be at least 2 characters long'
        }
        return true
      },
    },
    {
      name: 'description',
      type: 'textarea',
    },
    {
      name: 'startDate',
      type: 'date',
      required: true,
    },
    {
      name: 'endDate',
      type: 'date',
      validate: (
        val: unknown,
        { siblingData }: { siblingData?: { startDate?: string | Date } },
      ) => {
        if (val && siblingData?.startDate) {
          const endDate = val instanceof Date ? val : new Date(val as string)
          const startDate =
            siblingData.startDate instanceof Date
              ? siblingData.startDate
              : new Date(siblingData.startDate)
          if (endDate <= startDate) {
            return 'End date must be after start date'
          }
        }
        return true
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Active', value: 'active' },
        { label: 'Paused', value: 'paused' },
        { label: 'Completed', value: 'completed' },
        { label: 'Cancelled', value: 'cancelled' },
      ],
      defaultValue: 'draft',
    },
    {
      name: 'generatedPosts',
      type: 'relationship',
      relationTo: 'generated-posts',
      hasMany: true,
      admin: {
        description: 'Generated posts included in this campaign',
      },
    },
    {
      name: 'referencePosts',
      type: 'relationship',
      relationTo: 'reference-posts',
      hasMany: true,
      admin: {
        description: 'Reference posts used for this campaign',
      },
    },
    {
      name: 'goals',
      type: 'json',
      admin: {
        description: 'Campaign goals and KPIs',
      },
    },
    {
      name: 'targetAudience',
      type: 'textarea',
      admin: {
        description: 'Target audience for this campaign',
      },
    },
    {
      name: 'budget',
      type: 'number',
      min: 0,
      admin: {
        description: 'Campaign budget (optional)',
      },
    },
    {
      name: 'createdBy',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      defaultValue: ({ user }) => {
        // Auto-set createdBy to current user on create
        return user?.id
      },
      admin: {
        description: 'User who created this campaign',
      },
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
      ({ data, operation }) => {
        // Normalize name
        if (data?.name) {
          data.name = data.name.trim()
        }
        // Ensure status defaults to draft on create
        if (operation === 'create' && data && !data.status) {
          data.status = 'draft'
        }
        // Ensure isActive defaults to true on create
        if (operation === 'create' && data && data.isActive === undefined) {
          data.isActive = true
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation, req }) => {
        // Validate date range
        if (data.startDate && data.endDate) {
          const startDate = new Date(data.startDate)
          const endDate = new Date(data.endDate)

          if (endDate <= startDate) {
            throw new Error('End date must be after start date')
          }
        }

        // Validate budget
        if (data.budget !== undefined && data.budget < 0) {
          throw new Error('Budget cannot be negative')
        }

        // Auto-set createdBy if not provided and operation is create
        if (operation === 'create' && !data.createdBy && req.user) {
          data.createdBy = typeof req.user === 'string' ? req.user : req.user.id
        }

        return data
      },
    ],
    afterChange: [
      ({ doc, req, operation }) => {
        // Log campaign creation/update
        if (operation === 'create') {
          req.payload.logger.info(
            `New campaign created: ${doc.name} (${doc.id}) - Status: ${doc.status}`,
          )
        } else if (operation === 'update') {
          req.payload.logger.info(
            `Campaign updated: ${doc.name} (${doc.id}) - Status: ${doc.status}`,
          )
        }
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Soft delete: Log deletion request
        req.payload.logger.warn(
          `Soft delete requested for campaign ${id} - use update to set isActive=false instead`,
        )
      },
    ],
  },
}
