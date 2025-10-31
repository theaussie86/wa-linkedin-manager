import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    create: ({ req: { user } }) => Boolean(user),
    update: ({ req: { user } }) => Boolean(user),
    delete: ({ req: { user } }) => Boolean(user),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'text',
    },
    {
      name: 'filename',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'filesize',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'width',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'height',
      type: 'number',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'mimeType',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'url',
      type: 'text',
      admin: {
        readOnly: true,
      },
    },
  ],
  upload: {
    // Supabase Storage Integration
    staticDir: 'media',
    disableLocalStorage: false, // Keep local for development
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 80,
          },
        },
      },
      {
        name: 'card',
        width: 768,
        height: 1024,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 85,
          },
        },
      },
      {
        name: 'tablet',
        width: 1024,
        height: undefined,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 90,
          },
        },
      },
      {
        name: 'desktop',
        width: 1920,
        height: undefined,
        position: 'centre',
        formatOptions: {
          format: 'webp',
          options: {
            quality: 95,
          },
        },
      },
    ],
    adminThumbnail: 'thumbnail',
    mimeTypes: ['image/*', 'video/*'],
  },
  hooks: {
    beforeValidate: [
      ({ data, operation }) => {
        // Ensure alt text is trimmed
        if (data?.alt) {
          data.alt = data.alt.trim()
        }
        
        // Ensure filename is trimmed
        if (data?.filename) {
          data.filename = data.filename.trim()
        }
        
        // Validate filesize if provided
        if (data?.filesize !== undefined && data.filesize < 0) {
          throw new Error('File size cannot be negative')
        }
        
        // Validate width and height if provided
        if (data?.width !== undefined && data.width < 0) {
          throw new Error('Width cannot be negative')
        }
        
        if (data?.height !== undefined && data.height < 0) {
          throw new Error('Height cannot be negative')
        }
        
        return data
      },
    ],
    beforeChange: [
      ({ data }) => {
        // Ensure alt text is provided for accessibility
        if (!data.alt && data.filename) {
          data.alt = data.filename.replace(/\.[^/.]+$/, '') // Remove extension
        }
        return data
      },
    ],
    afterChange: [
      ({ doc, req, operation }) => {
        // Log media upload for analytics
        if (operation === 'create') {
          req.payload.logger.info(`Media uploaded: ${doc.filename} (${doc.filesize} bytes)`)
        } else if (operation === 'update') {
          req.payload.logger.info(`Media updated: ${doc.filename} (${doc.id})`)
        }
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Log media deletion
        req.payload.logger.warn(`Media deletion requested: ${id}`)
      },
    ],
  },
}
