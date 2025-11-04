import { s3Storage } from '@payloadcms/storage-s3'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { google } from 'googleapis'
import type SMTPConnection from 'nodemailer/lib/smtp-connection'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Company } from './collections/Company'
import { ReferencePost } from './collections/ReferencePost'
import { GeneratedPost } from './collections/GeneratedPost'
import { Campaign } from './collections/Campaign'
import { PostAnalytics } from './collections/PostAnalytics'
import { LinkedInCreator } from './collections/LinkedInCreator'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Initialize email adapter with support for both SMTP and OAuth2 (Service Account)
async function getEmailAdapter() {
  const fromAddress =
    process.env.SMTP_FROM_ADDRESS || process.env.SMTP_USER || process.env.OAUTH2_USER_EMAIL || ''
  const fromName = process.env.SMTP_FROM_NAME || 'LinkedIn Manager'

  // Check if OAuth2 with Service Account is configured
  const useOAuth2 =
    process.env.EMAIL_AUTH_TYPE === 'oauth2' ||
    (process.env.OAUTH2_SERVICE_ACCOUNT_KEY && process.env.OAUTH2_USER_EMAIL)

  if (useOAuth2) {
    // OAuth2 with Service Account (2-legged OAuth)
    try {
      interface ServiceAccountKey {
        type: string
        project_id: string
        private_key_id: string
        private_key: string
        client_email: string
        client_id: string
        auth_uri: string
        token_uri: string
        auth_provider_x509_cert_url: string
        client_x509_cert_url: string
      }

      let serviceAccountKey: ServiceAccountKey

      // Load service account key from environment variable (JSON string) or file path
      if (process.env.OAUTH2_SERVICE_ACCOUNT_KEY) {
        if (process.env.OAUTH2_SERVICE_ACCOUNT_KEY.startsWith('{')) {
          // JSON string in environment variable
          serviceAccountKey = JSON.parse(process.env.OAUTH2_SERVICE_ACCOUNT_KEY)
        } else {
          // File path
          const fs = await import('fs/promises')
          const keyPath = path.resolve(process.env.OAUTH2_SERVICE_ACCOUNT_KEY)
          const keyContent = await fs.readFile(keyPath, 'utf8')
          serviceAccountKey = JSON.parse(keyContent)
        }
      } else {
        throw new Error('OAUTH2_SERVICE_ACCOUNT_KEY is required for OAuth2 authentication')
      }

      const userEmail = process.env.OAUTH2_USER_EMAIL || fromAddress

      if (!userEmail) {
        throw new Error('OAUTH2_USER_EMAIL is required for OAuth2 authentication')
      }

      // Ensure private_key has proper newlines (replace escaped \n with actual newlines)
      const privateKey = serviceAccountKey.private_key.replace(/\\n/g, '\n')

      // Create JWT client for service account
      // Use options object format for better compatibility
      // According to Nodemailer docs: Gmail SMTP requires the https://mail.google.com/ scope
      const jwtClient = new google.auth.JWT({
        email: serviceAccountKey.client_email,
        key: privateKey,
        scopes: ['https://mail.google.com/'], // Required scope for Gmail SMTP
        subject: userEmail, // User email to impersonate (for domain-wide delegation)
      })

      // Get initial access token
      let tokens
      try {
        tokens = await jwtClient.authorize()
      } catch (error: unknown) {
        const err = error as { message?: string; code?: number }
        if (err.message?.includes('unauthorized_client')) {
          throw new Error(
            `Service Account is not authorized. Please ensure:
1. Domain-wide delegation is enabled in Google Workspace Admin Console
2. The Service Account Client ID (${serviceAccountKey.client_id}) is authorized in Admin Console → Security → API Controls → Domain-wide Delegation
3. The scope https://mail.google.com/ is granted in the delegation settings
4. OAUTH2_USER_EMAIL (${userEmail}) is a valid Google Workspace user
5. The user has permission to send emails`,
          )
        }
        throw error
      }

      if (!tokens.access_token) {
        throw new Error('Failed to obtain access token from service account')
      }

      // Configure nodemailer with OAuth2 2LO (2-legged OAuth) for Service Accounts
      // Nodemailer will automatically regenerate tokens using serviceClient and privateKey
      // According to https://nodemailer.com/smtp/oauth2#oauth-2lo
      // For Service Accounts, we use serviceClient and privateKey instead of clientId/clientSecret
      const expires = tokens.expiry_date
        ? tokens.expiry_date // Keep in milliseconds for Nodemailer
        : Date.now() + 3600 * 1000 // Default 1 hour from now

      return await nodemailerAdapter({
        defaultFromAddress: userEmail,
        defaultFromName: fromName,
        transportOptions: {
          host: 'smtp.gmail.com',
          port: 465,
          secure: true,
          auth: {
            type: 'OAuth2',
            user: userEmail, // Email address to send as (required for domain-wide delegation)
            serviceClient: serviceAccountKey.client_id, // Service account client_id (required for 2LO)
            privateKey: privateKey, // Service account private key (required for 2LO)
            accessToken: tokens.access_token, // Optional; Nodemailer will regenerate if needed
            expires, // UNIX expiration timestamp in milliseconds
          },
        } as SMTPConnection.Options,
      })
    } catch (error) {
      console.error('Error configuring OAuth2 email adapter:', error)
      throw error
    }
  } else {
    // Standard SMTP authentication
    return await nodemailerAdapter({
      defaultFromAddress: fromAddress,
      defaultFromName: fromName,
      transportOptions: {
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.SMTP_USER || '',
          pass: process.env.SMTP_PASS || '',
        },
      } as SMTPConnection.Options,
    })
  }
}

const emailAdapter = await getEmailAdapter()

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
    Users,
    Media,
    Company,
    ReferencePost,
    GeneratedPost,
    Campaign,
    PostAnalytics,
    LinkedInCreator,
  ],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString:
        process.env.DATABASE_URI ||
        'postgresql://postgres.your-tenant-id:your-super-secret-and-long-postgres-password@localhost:5432/postgres',
    },
  }),
  email: emailAdapter,
  sharp,
  plugins: [
    payloadCloudPlugin(),
    s3Storage({
      collections: {
        media: {
          prefix: 'media',
        },
      },
      bucket: process.env.S3_BUCKET || 'payload-media',
      config: {
        forcePathStyle: true,
        credentials: {
          accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
          secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        },
        region: process.env.S3_REGION || 'eu-central-1',
        endpoint: process.env.S3_ENDPOINT || '',
      },
    }),
  ],
})
