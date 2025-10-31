import type { CollectionConfig } from 'payload'
import { linkedinPostUrlValidator, linkedinPostIdValidator, linkedinAuthorProfileValidator } from '../utils/linkedin'

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
      if (!user?.company) {
        return false // User has no company assigned
      }
      return {
        and: [
          {
            company: {
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
      return user?.role === 'admin' || user?.role === 'manager' || user?.role === 'content_creator'
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      if (!user?.company) {
        return false // User has no company assigned
      }
      return {
        company: {
          equals: typeof user.company === 'string' ? user.company : user.company.id,
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
      validate: linkedinAuthorProfileValidator,
      admin: {
        description: 'LinkedIn profile URL',
      },
    },
    {
      name: 'linkedinUrl',
      type: 'text',
      required: true,
      unique: true,
      validate: linkedinPostUrlValidator,
    },
    {
      name: 'linkedinPostId',
      type: 'text',
      validate: linkedinPostIdValidator,
      admin: {
        description: 'LinkedIn Post ID (numeric, for future API integration)',
      },
    },
    {
      name: 'linkedinAuthorId',
      type: 'text',
      admin: {
        description: 'LinkedIn Author ID (for future API integration)',
      },
    },
    {
      name: 'linkedinCompanyPageId',
      type: 'text',
      admin: {
        description: 'LinkedIn Company Page ID (for future API integration)',
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
    beforeValidate: [
      ({ data, operation }) => {
        // Normalize URLs
        if (data?.linkedinUrl) {
          data.linkedinUrl = data.linkedinUrl.trim()
        }
        if (data?.authorProfile) {
          data.authorProfile = data.authorProfile.trim()
        }
        if (data?.videoUrl) {
          data.videoUrl = data.videoUrl.trim()
        }
        if (data?.articleUrl) {
          data.articleUrl = data.articleUrl.trim()
        }
        // Set scrapedAt on create if not provided
        if (operation === 'create' && !data?.scrapedAt) {
          data.scrapedAt = new Date().toISOString()
        }
        // Ensure isActive defaults to true on create
        if (operation === 'create' && data?.isActive === undefined) {
          data.isActive = true
        }
        return data
      },
    ],
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
    afterChange: [
      ({ doc, req, operation }) => {
        // Log reference post creation/update
        if (operation === 'create') {
          req.payload.logger.info(`New reference post created: ${doc.linkedinUrl} (${doc.id})`)
        } else if (operation === 'update') {
          req.payload.logger.info(`Reference post updated: ${doc.linkedinUrl} (${doc.id})`)
        }
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Soft delete: Log deletion request
        req.payload.logger.warn(`Soft delete requested for reference post ${id} - use update to set isActive=false instead`)
      },
    ],
  },
}
