import { CollectionConfig } from 'payload/types'

export const PostAnalytics: CollectionConfig = {
  slug: 'post-analytics',
  admin: {
    useAsTitle: 'metricType',
    defaultColumns: ['generatedPost', 'metricType', 'value', 'date', 'period'],
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      return {
        generatedPost: {
          company: {
            equals: user?.company,
          },
        },
      }
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'content_creator'
    },
    update: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'manager'
    },
    delete: ({ req: { user } }) => {
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'generatedPost',
      type: 'relationship',
      relationTo: 'generated-posts',
      required: true,
    },
    {
      name: 'metricType',
      type: 'select',
      required: true,
      options: [
        { label: 'Likes', value: 'likes' },
        { label: 'Comments', value: 'comments' },
        { label: 'Shares', value: 'shares' },
        { label: 'Views', value: 'views' },
        { label: 'Clicks', value: 'clicks' },
        { label: 'Engagement Rate', value: 'engagement_rate' },
        { label: 'Reach', value: 'reach' },
        { label: 'Impressions', value: 'impressions' },
      ],
    },
    {
      name: 'value',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Metric value (e.g., number of likes, engagement rate percentage)',
      },
    },
    {
      name: 'date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when this metric was recorded',
      },
    },
    {
      name: 'period',
      type: 'select',
      options: [
        { label: 'Hourly', value: 'hourly' },
        { label: 'Daily', value: 'daily' },
        { label: 'Weekly', value: 'weekly' },
        { label: 'Monthly', value: 'monthly' },
      ],
      defaultValue: 'daily',
    },
    {
      name: 'source',
      type: 'select',
      options: [
        { label: 'LinkedIn', value: 'linkedin' },
        { label: 'Manual Entry', value: 'manual' },
        { label: 'API', value: 'api' },
      ],
      admin: {
        description: 'Source of this metric data',
      },
    },
    {
      name: 'metadata',
      type: 'json',
      admin: {
        description: 'Additional metric data and context',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeChange: [
      ({ data }) => {
        // Validate metric value based on type
        if (data.metricType === 'engagement_rate' && data.value > 100) {
          throw new Error('Engagement rate cannot exceed 100%')
        }

        // Ensure value is non-negative
        if (data.value < 0) {
          throw new Error('Metric value cannot be negative')
        }

        return data
      },
    ],
  },
}
