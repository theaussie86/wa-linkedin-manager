import type { CollectionConfig } from 'payload'

export const Campaign: CollectionConfig = {
  slug: 'campaigns',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'status', 'startDate', 'endDate', 'createdBy'],
  },
  access: {
    read: ({ req: { user } }: { req: { user?: any } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      return {
        company: {
          equals: user?.company,
        },
      }
    },
    create: ({ req: { user } }: { req: { user?: any } }) => {
      return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'content_creator'
    },
    update: ({ req: { user } }: { req: { user?: any } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      return {
        company: {
          equals: user?.company,
        },
      }
    },
    delete: ({ req: { user } }: { req: { user?: any } }) => {
      return user?.role === 'admin' || user?.role === 'manager'
    },
  },
  fields: [
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
    },
    {
      name: 'name',
      type: 'text',
      required: true,
      validate: (val: any) => {
        if (!val || val.length < 2) {
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
      required: true,
      validate: (val: any, { siblingData }: { siblingData: any }) => {
        if (val && siblingData.startDate && new Date(val) <= new Date(siblingData.startDate)) {
          return 'End date must be after start date'
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
      admin: {
        description: 'User who created this campaign',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data }: { data: any }) => {
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

        return data
      },
    ],
  },
}
