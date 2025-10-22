import { CollectionConfig } from 'payload/types'

export const Company: CollectionConfig = {
  slug: 'companies',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'industry', 'size', 'researchStatus', 'isActive'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      return {
        company: {
          equals: user?.company,
        },
      }
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'manager'
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      return {
        company: {
          equals: user?.company,
        },
      }
    },
    delete: ({ req: { user } }) => {
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
}
