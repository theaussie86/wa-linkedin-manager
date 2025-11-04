import type { CollectionConfig } from 'payload'
import { linkedinProfileUrlValidator } from '../utils/linkedin/url-validator'

export const LinkedInCreator: CollectionConfig = {
  slug: 'linkedin-creators',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'company', 'profileLink', 'isActive'],
    description: 'LinkedIn Influencer-Konten, die mit einer Company verknüpft werden können',
  },
  access: {
    read: ({ req: { user } }) => {
      if (user?.role === 'admin') {
        // Admins können alle Creator sehen (auch inaktive)
        return true
      }
      if (user?.role === 'manager') {
        // Manager können alle Creator sehen (auch inaktive)
        return true
      }
      // Andere Benutzer können nur aktive Creator sehen, die zu ihrer Company gehören
      if (!user?.company) {
        return false // Benutzer hat keine Company zugewiesen
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
      return user?.role === 'admin' || user?.role === 'manager'
    },
    update: ({ req: { user } }) => {
      if (user?.role === 'admin') return true
      if (user?.role === 'manager') return true
      if (!user?.company) {
        return false // Benutzer hat keine Company zugewiesen
      }
      return {
        company: {
          equals: typeof user.company === 'string' ? user.company : user.company.id,
        },
      }
    },
    delete: ({ req: { user } }) => {
      // Soft delete: Empfehlung, update zu verwenden, um isActive=false zu setzen
      // Hard delete ist nur für Admins erlaubt
      return user?.role === 'admin'
    },
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      admin: {
        description: 'Name des LinkedIn Influencers',
      },
      validate: (val) => {
        if (!val || val.length < 2) {
          return 'Name muss mindestens 2 Zeichen lang sein'
        }
        return true
      },
    },
    {
      name: 'description',
      type: 'textarea',
      admin: {
        description: 'Beschreibung des Influencers (z.B. Tagline oder Expertise)',
      },
    },
    {
      name: 'profileLink',
      type: 'text',
      required: true,
      unique: true,
      admin: {
        description: 'LinkedIn Profil-URL des Influencers',
      },
      validate: linkedinProfileUrlValidator,
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      required: true,
      admin: {
        description: 'Verknüpfung zur Company',
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      admin: {
        description: 'Aktiv-Status des Influencer-Kontos',
      },
    },
  ],
  timestamps: true,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Normalisiere LinkedIn URL
        if (data?.profileLink) {
          data.profileLink = data.profileLink.trim()
        }
        // Normalisiere Name
        if (data?.name) {
          data.name = data.name.trim()
        }
        // Normalisiere Beschreibung
        if (data?.description) {
          data.description = data.description.trim()
        }
        return data
      },
    ],
    beforeChange: [
      ({ data, operation }) => {
        // Stelle sicher, dass isActive standardmäßig true ist beim Erstellen
        if (operation === 'create' && data?.isActive === undefined) {
          data.isActive = true
        }
        return data
      },
    ],
    afterChange: [
      async ({ doc, req, operation }) => {
        // Logge Erstellung/Update
        if (operation === 'create') {
          req.payload.logger.info(`Neuer LinkedIn Creator erstellt: ${doc.name} (${doc.id})`)
        } else if (operation === 'update') {
          req.payload.logger.info(`LinkedIn Creator aktualisiert: ${doc.name} (${doc.id})`)
        }
      },
    ],
    beforeDelete: [
      async ({ id, req }) => {
        // Soft delete: Statt hard delete, setze isActive auf false
        req.payload.logger.warn(
          `Soft delete für LinkedIn Creator ${id} angefordert - verwende update, um isActive=false zu setzen`,
        )
      },
    ],
  },
}
