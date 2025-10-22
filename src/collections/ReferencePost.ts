import { CollectionConfig } from 'payload/types'

export const ReferencePost: CollectionConfig = {
  slug: 'reference-posts',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'company', 'postType', 'category', 'engagementRate', 'publishedAt'],
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
      return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'content_creator'
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
      name: 'title',
      type: 'text',
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'author',
      type: 'text',
      admin: {
        description: 'LinkedIn author name',
      },
    },
    {
      name: 'authorProfile',
      type: 'text',
      validate: (val) => {
        if (val && !val.match(/^https:\/\/www\.linkedin\.com\/in\/.+/)) {
          return 'Please enter a valid LinkedIn profile URL (e.g., https://www.linkedin.com/in/username)'
        }
        return true
      },
      admin: {
        description: 'LinkedIn profile URL',
      },
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      required: true,
      unique: true,
      validate: (val) => {
        if (!val.match(/^https:\/\/www\.linkedin\.com\/posts\/.+/)) {
          return 'Please enter a valid LinkedIn post URL (e.g., https://www.linkedin.com/posts/username-activity-1234567890)'
        }
        return true
      },
    },
    {
      name: 'postType',
      type: 'select',
      required: true,
      options: [
        { label: 'Text', value: 'text' },
        { label: 'Image', value: 'image' },
        { label: 'Video', value: 'video' },
        { label: 'Article', value: 'article' },
        { label: 'Poll', value: 'poll' },
      ],
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Thought Leadership', value: 'thought_leadership' },
        { label: 'Industry Insights', value: 'industry_insights' },
        { label: 'Company Updates', value: 'company_updates' },
        { label: 'Educational', value: 'educational' },
        { label: 'Behind the Scenes', value: 'behind_scenes' },
        { label: 'Case Studies', value: 'case_studies' },
      ],
    },
    {
      name: 'tags',
      type: 'array',
      fields: [
        {
          name: 'tag',
          type: 'text',
        },
      ],
    },
    {
      name: 'images',
      type: 'array',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
        },
      ],
    },
    {
      name: 'videoUrl',
      type: 'text',
      validate: (val) => {
        if (val && !val.match(/^https?:\/\/.+/)) {
          return 'Please enter a valid video URL'
        }
        return true
      },
    },
    {
      name: 'articleUrl',
      type: 'text',
      validate: (val) => {
        if (val && !val.match(/^https?:\/\/.+/)) {
          return 'Please enter a valid article URL'
        }
        return true
      },
    },
    {
      name: 'likes',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'comments',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'shares',
      type: 'number',
      defaultValue: 0,
      min: 0,
    },
    {
      name: 'engagementRate',
      type: 'number',
      admin: {
        description: 'Calculated engagement rate (0-100)',
      },
      validate: (val) => {
        if (val && (val < 0 || val > 100)) {
          return 'Engagement rate must be between 0 and 100'
        }
        return true
      },
    },
    {
      name: 'reach',
      type: 'number',
      min: 0,
    },
    {
      name: 'impressions',
      type: 'number',
      min: 0,
    },
    {
      name: 'publishedAt',
      type: 'date',
      required: true,
    },
    {
      name: 'scrapedAt',
      type: 'date',
      admin: {
        description: 'When this post was scraped from LinkedIn',
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
    beforeChange: [
      ({ data }) => {
        // Calculate engagement rate if not provided
        if (data.likes !== undefined && data.comments !== undefined && data.shares !== undefined) {
          const totalEngagement = data.likes + data.comments + data.shares
          const reach = data.reach || 1 // Avoid division by zero
          data.engagementRate = Math.round((totalEngagement / reach) * 100)
        }
        return data
      },
    ],
  },
}
