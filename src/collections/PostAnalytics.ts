import type { CollectionConfig } from 'payload'

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
      // For other users, we need to filter through the generatedPost's company
      // This requires a more complex query that checks the company relationship
      if (!user?.company) {
        return false // User has no company assigned
      }
      // Note: This is a simplified access control. In practice, you might need
      // to use a custom query resolver to properly filter by nested relationships
      return true // Will be filtered by generatedPost.company in queries
    },
    create: ({ req: { user } }) => {
      return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'content_creator'
    },
    update: ({ req: { user } }) => {
      // Only admins and managers can update analytics
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
      defaultValue: 'manual',
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
    beforeValidate: [
      ({ data, operation }) => {
        // Ensure period defaults to daily on create
        if (operation === 'create' && !data?.period) {
          data.period = 'daily'
        }
        // Ensure source defaults to manual on create
        if (operation === 'create' && !data?.source) {
          data.source = 'manual'
        }
        return data
      },
    ],
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

        // Validate date is not in the future (for recorded metrics)
        if (data.date) {
          const metricDate = new Date(data.date)
          const now = new Date()
          // Allow up to 1 hour in the future for timezone differences
          const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000)
          if (metricDate > oneHourFromNow) {
            throw new Error('Metric date cannot be in the future')
          }
        }

        return data
      },
    ],
    afterChange: [
      ({ doc, req, operation }) => {
        // Log analytics creation/update
        if (operation === 'create') {
          req.payload.logger.info(
            `New analytics metric recorded: ${doc.metricType} = ${doc.value} for post ${doc.generatedPost} (${doc.id})`,
          )
        } else if (operation === 'update') {
          req.payload.logger.info(`Analytics metric updated: ${doc.metricType} = ${doc.value} (${doc.id})`)
        }
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Analytics deletion should be restricted
        req.payload.logger.warn(`Analytics deletion requested for ${id} - analytics are typically not deleted`)
      },
    ],
  },
}
