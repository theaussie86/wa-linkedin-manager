import type { CollectionConfig } from 'payload'
import { isAdmin, canAccessUser } from '../access/access'
import type { User } from '../payload-types'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'firstName', 'lastName', 'role', 'isActive'],
  },
  auth: {
    tokenExpiration: 7200, // 2 hours
    verify: true,
    maxLoginAttempts: 5,
    lockTime: 600 * 1000, // 10 minutes
  },
  access: {
    create: isAdmin,
    read: canAccessUser,
    update: canAccessUser,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'firstName',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    {
      name: 'lastName',
      type: 'text',
      required: true,
      minLength: 2,
      maxLength: 50,
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'content_creator',
      options: [
        {
          label: 'Admin',
          value: 'admin',
        },
        {
          label: 'Manager',
          value: 'manager',
        },
        {
          label: 'Content Creator',
          value: 'content_creator',
        },
        {
          label: 'Reviewer',
          value: 'reviewer',
        },
      ],
      access: {
        update: ({ req: { user } }) =>
          Boolean(user && ((user as User).role === 'admin' || (user as User).role === 'manager')),
      },
    },
    {
      name: 'company',
      type: 'relationship',
      relationTo: 'companies',
      hasMany: false,
      access: {
        update: ({ req: { user } }) =>
          Boolean(user && ((user as User).role === 'admin' || (user as User).role === 'manager')),
      },
    },
    {
      name: 'permissions',
      type: 'json',
      admin: {
        description: 'Spezifische Berechtigungen für den Benutzer (optional)',
      },
      access: {
        read: ({ req: { user }, id }) => {
          if (!user) return false
          if ((user as User).role === 'admin') return true
          return user.id === id
        },
        update: ({ req: { user } }) => Boolean(user && (user as User).role === 'admin'),
      },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      defaultValue: true,
      access: {
        update: ({ req: { user } }) =>
          Boolean(user && ((user as User).role === 'admin' || (user as User).role === 'manager')),
      },
    },
    {
      name: 'lastLoginAt',
      type: 'date',
      admin: {
        readOnly: true,
        description: 'Letzter Login-Zeitpunkt',
      },
    },
    {
      name: 'preferences',
      type: 'json',
      admin: {
        description: 'UI/Workflow Präferenzen des Benutzers',
      },
      access: {
        read: ({ req: { user }, id }) => {
          if (!user) return false
          if ((user as User).role === 'admin') return true
          return user.id === id
        },
        update: ({ req: { user }, id }) => {
          if (!user) return false
          if ((user as User).role === 'admin') return true
          return user.id === id
        },
      },
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      admin: {
        description: 'Profilbild des Benutzers',
      },
    },
  ],
  hooks: {
    beforeValidate: [
      ({ data }) => {
        // Ensure email is lowercase and validate format
        if (data?.email) {
          data.email = data.email.toLowerCase().trim()

          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(data.email)) {
            throw new Error('Invalid email format')
          }
        }

        // Validate password strength if provided
        if (data?.password) {
          const password = data.password

          // Password length validation
          if (password.length < 8) {
            throw new Error('Password must be at least 8 characters long')
          }

          // Password strength validation: at least one uppercase, lowercase, number, and special character
          const hasUpperCase = /[A-Z]/.test(password)
          const hasLowerCase = /[a-z]/.test(password)
          const hasNumber = /[0-9]/.test(password)
          const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password)

          if (!hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecialChar) {
            throw new Error(
              'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
            )
          }
        }

        return data
      },
    ],
    beforeChange: [
      ({ data, operation }) => {
        // Email validation on change (for updates)
        if (data?.email && operation === 'update') {
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
          if (!emailRegex.test(data.email.toLowerCase().trim())) {
            throw new Error('Invalid email format')
          }
        }

        // Password will be automatically hashed by Payload
        // Additional validation is handled in beforeValidate hook

        return data
      },
    ],
    afterChange: [
      ({ doc, req, operation }) => {
        // Log user creation/update
        if (operation === 'create') {
          req.payload.logger.info(`New user created: ${doc.email} (${doc.role})`)
        } else if (operation === 'update') {
          req.payload.logger.info(`User updated: ${doc.email}`)
        }
      },
    ],
    afterLogin: [
      ({ user, req }) => {
        // Update last login time
        req.payload.update({
          collection: 'users',
          id: user.id,
          data: {
            lastLoginAt: new Date().toISOString(),
          },
        })
      },
    ],
  },
}
