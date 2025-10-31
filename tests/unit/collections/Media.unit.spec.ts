import { describe, it, expect } from 'vitest'
import { Media } from '@/collections/Media'

describe('Media Collection', () => {
  describe('Configuration', () => {
    it('should have correct slug', () => {
      expect(Media.slug).toBe('media')
    })

    it('should have timestamps enabled', () => {
      expect(Media.timestamps).toBe(true)
    })
  })

  describe('Fields', () => {
    it('should have required alt field', () => {
      const altField = Media.fields?.find((f) => f.name === 'alt')
      expect(altField?.required).toBe(true)
      expect(altField?.type).toBe('text')
    })

    it('should have read-only metadata fields', () => {
      const filenameField = Media.fields?.find((f) => f.name === 'filename') as any
      expect(filenameField?.admin?.readOnly).toBe(true)

      const filesizeField = Media.fields?.find((f) => f.name === 'filesize') as any
      expect(filesizeField?.admin?.readOnly).toBe(true)

      const widthField = Media.fields?.find((f) => f.name === 'width') as any
      expect(widthField?.admin?.readOnly).toBe(true)

      const heightField = Media.fields?.find((f) => f.name === 'height') as any
      expect(heightField?.admin?.readOnly).toBe(true)

      const mimeTypeField = Media.fields?.find((f) => f.name === 'mimeType') as any
      expect(mimeTypeField?.admin?.readOnly).toBe(true)

      const urlField = Media.fields?.find((f) => f.name === 'url') as any
      expect(urlField?.admin?.readOnly).toBe(true)
    })
  })

  describe('Upload Configuration', () => {
    it('should have upload configuration', () => {
      expect(Media.upload).toBeDefined()
    })

    it('should have static directory configured', () => {
      expect(Media.upload?.staticDir).toBe('media')
    })

    it('should have image sizes configured', () => {
      const imageSizes = Media.upload?.imageSizes
      expect(imageSizes).toBeDefined()
      expect(imageSizes?.length).toBe(4)

      const thumbnail = imageSizes?.find((size) => size.name === 'thumbnail')
      expect(thumbnail?.width).toBe(400)
      expect(thumbnail?.height).toBe(300)

      const card = imageSizes?.find((size) => size.name === 'card')
      expect(card?.width).toBe(768)
      expect(card?.height).toBe(1024)

      const tablet = imageSizes?.find((size) => size.name === 'tablet')
      expect(tablet?.width).toBe(1024)
      expect(tablet?.height).toBeUndefined()

      const desktop = imageSizes?.find((size) => size.name === 'desktop')
      expect(desktop?.width).toBe(1920)
      expect(desktop?.height).toBeUndefined()
    })

    it('should have admin thumbnail configured', () => {
      expect(Media.upload?.adminThumbnail).toBe('thumbnail')
    })

    it('should allow images and videos', () => {
      const mimeTypes = Media.upload?.mimeTypes
      expect(mimeTypes).toEqual(['image/*', 'video/*'])
    })
  })

  describe('Hooks', () => {
    it('should normalize alt text and filename in beforeValidate', () => {
      const hook = Media.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          alt: '  Test Image  ',
          filename: '  test-image.jpg  ',
        }

        const result = hook({ data: mockData, operation: 'create', req: {} as any })
        expect(result?.alt).toBe('Test Image')
        expect(result?.filename).toBe('test-image.jpg')
      }
    })

    it('should validate filesize is non-negative', () => {
      const hook = Media.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        expect(() =>
          hook({
            data: {
              filesize: -1,
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('File size cannot be negative')
      }
    })

    it('should validate width and height are non-negative', () => {
      const hook = Media.hooks?.beforeValidate?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        expect(() =>
          hook({
            data: {
              width: -1,
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('Width cannot be negative')

        expect(() =>
          hook({
            data: {
              height: -1,
            },
            operation: 'create',
            req: {} as any,
          }),
        ).toThrow('Height cannot be negative')
      }
    })

    it('should set alt from filename if not provided in beforeChange', () => {
      const hook = Media.hooks?.beforeChange?.[0]
      expect(hook).toBeDefined()

      if (hook) {
        const mockData = {
          filename: 'test-image.jpg',
        }

        const result = hook({
          data: mockData,
          operation: 'create',
          req: {} as any,
          previousDoc: {} as any,
          doc: {} as any,
        })

        expect(result?.alt).toBe('test-image')
      }
    })
  })

  describe('Access Control', () => {
    it('should allow anyone to read media', () => {
      const access = Media.access?.read
      if (access) {
        expect(access({ req: {} as any })).toBe(true)
      }
    })

    it('should require authenticated user to create media', () => {
      const access = Media.access?.create
      if (access) {
        expect(access({ req: { user: { id: 'user-1' } } as any })).toBe(true)
        expect(access({ req: { user: null } as any })).toBe(false)
      }
    })

    it('should require authenticated user to update media', () => {
      const access = Media.access?.update
      if (access) {
        expect(access({ req: { user: { id: 'user-1' } } as any })).toBe(true)
        expect(access({ req: { user: null } as any })).toBe(false)
      }
    })

    it('should require authenticated user to delete media', () => {
      const access = Media.access?.delete
      if (access) {
        expect(access({ req: { user: { id: 'user-1' } } as any })).toBe(true)
        expect(access({ req: { user: null } as any })).toBe(false)
      }
    })
  })
})

