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
      ({ doc, req }) => {
        // Log media upload for analytics
        req.payload.logger.info(`Media uploaded: ${doc.filename} (${doc.filesize} bytes)`)
      },
    ],
  },
}
