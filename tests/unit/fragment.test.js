const fs = require('fs').promises
const { Fragment } = require('../../src/model/fragment')

/** Wait for a certain number of ms. Returns a Promise. */
const wait = async (ms = 10) => new Promise((resolve) => setTimeout(resolve, ms))

const validTypes = [
  `text/plain`,
  `text/markdown`,
  `text/html`,
  `application/json`,
  `image/png`,
  `image/jpeg`,
  `image/webp`,
  `image/gif`,
]

describe('Fragment class', () => {
  test('common formats are supported', () => {
    validTypes.forEach((format) =>
      expect(Fragment.isSupportedType(format)).toBe(true)
    )
  })

  describe('Fragment()', () => {
    test('ownerId and type are required', () => {
      expect(() => new Fragment({})).toThrow()
    })

    test('ownerId is required', () => {
      expect(() => new Fragment({ type: 'text/plain', size: 1 })).toThrow()
    })

    test('type is required', () => {
      expect(() => new Fragment({ ownerId: '1234', size: 1 })).toThrow()
    })

    test('type can be a simple media type', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })
      expect(fragment.type).toEqual('text/plain')
    })

    test('type can include a charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      })
      expect(fragment.type).toEqual('text/plain; charset=utf-8')
    })

    test('size gets set to 0 if missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain' })
      expect(fragment.size).toBe(0)
    })

    test('size must be a number', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'text/plain', size: '1' })
      ).toThrow()
    })

    test('size can be 0', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })
      ).not.toThrow()
    })

    test('size cannot be negative', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'text/plain', size: -1 })
      ).toThrow()
    })

    test('invalid types throw', () => {
      expect(
        () => new Fragment({ ownerId: '1234', type: 'application/msword', size: 1 })
      ).toThrow()
    })

    test('valid types can be set', () => {
      validTypes.forEach((format) => {
        const fragment = new Fragment({ ownerId: '1234', type: format, size: 1 })
        expect(fragment.type).toEqual(format)
      })
    })

    test('fragments have an id', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 1 })
      expect(fragment.id).toMatch(
        /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/
      )
    })

    test('fragments use id passed in if present', () => {
      const fragment = new Fragment({
        id: 'id',
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      })
      expect(fragment.id).toEqual('id')
    })

    test('fragments get a created datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      })
      expect(Date.parse(fragment.created)).not.toBeNaN()
    })

    test('fragments get an updated datetime string', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain',
        size: 1,
      })
      expect(Date.parse(fragment.updated)).not.toBeNaN()
    })
  })

  describe('isSupportedType()', () => {
    test('common text types are supported, with and without charset', () => {
      expect(Fragment.isSupportedType('text/plain')).toBe(true)
      expect(Fragment.isSupportedType('text/plain; charset=utf-8')).toBe(true)
    })

    test('other types are not supported', () => {
      expect(Fragment.isSupportedType('application/octet-stream')).toBe(false)
      expect(Fragment.isSupportedType('application/msword')).toBe(false)
      expect(Fragment.isSupportedType('audio/webm')).toBe(false)
      expect(Fragment.isSupportedType('video/ogg')).toBe(false)
    })
  })

  describe('mimeType, isText, isImage', () => {
    test('mimeType returns the mime type without charset', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      })
      expect(fragment.type).toEqual('text/plain; charset=utf-8')
      expect(fragment.mimeType).toEqual('text/plain')
    })

    test('mimeType returns the mime type if charset is missing', () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })
      expect(fragment.type).toEqual('text/plain')
      expect(fragment.mimeType).toEqual('text/plain')
    })

    test('isText return expected results', () => {
      // Text fragment
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
      })
      expect(fragment.isText).toBe(true)
      fragment.type = 'image/png'
      expect(fragment.isText).toBe(false)
    })

    test('isImage return expected results', () => {
      // Text fragment
      const fragment = new Fragment({ ownerId: '1234', type: 'image/png' })
      expect(fragment.isImage).toBe(true)
      fragment.type = 'image/jpeg'
      expect(fragment.isImage).toBe(true)
      fragment.type = 'image/webp'
      expect(fragment.isImage).toBe(true)
      fragment.type = 'image/gif'
      expect(fragment.isImage).toBe(true)
      fragment.type = 'application/json'
      expect(fragment.isImage).toBe(false)
    })
  })

  describe('formats', () => {
    test('formats returns the expected result for plain text', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      })
      expect(fragment.formats).toEqual(['text/plain'])
    })

    test('isConvertableTo() returns true for text/plain to supported formats', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      })
      expect(fragment.isConvertableTo('.txt')).toEqual(true)
    })

    test('isConvertableTo() returns false for text/plain to unsupported formats', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
        size: 0,
      })
      expect(fragment.isConvertableTo('.md')).toEqual(false)
      expect(fragment.isConvertableTo('.html')).toEqual(false)
      expect(fragment.isConvertableTo('.json')).toEqual(false)
      expect(fragment.isConvertableTo('.png')).toEqual(false)
      expect(fragment.isConvertableTo('.jpg')).toEqual(false)
      expect(fragment.isConvertableTo('.webp')).toEqual(false)
      expect(fragment.isConvertableTo('.gif')).toEqual(false)
      expect(fragment.isConvertableTo('abcd')).toEqual(false)
      expect(fragment.isConvertableTo('')).toEqual(false)
    })

    test('isConvertableTo() returns true for text/markdown to for supported formats', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/markdown',
        size: 0,
      })
      expect(fragment.isConvertableTo('.md')).toEqual(true)
      expect(fragment.isConvertableTo('.html')).toEqual(true)
      expect(fragment.isConvertableTo('.txt')).toEqual(true)
    })

    test('isConvertableTo() returns false for text/markdown to for unsupported formats', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/markdown',
        size: 0,
      })
      expect(fragment.isConvertableTo('.json')).toEqual(false)
      expect(fragment.isConvertableTo('.png')).toEqual(false)
      expect(fragment.isConvertableTo('.jpg')).toEqual(false)
      expect(fragment.isConvertableTo('.webp')).toEqual(false)
      expect(fragment.isConvertableTo('.gif')).toEqual(false)
      expect(fragment.isConvertableTo('abcd')).toEqual(false)
      expect(fragment.isConvertableTo('')).toEqual(false)
    })

    test('isConvertableTo() returns true for text/html to for supported formats', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/html',
        size: 0,
      })
      expect(fragment.isConvertableTo('.html')).toEqual(true)
      expect(fragment.isConvertableTo('.txt')).toEqual(true)
    })

    test('isConvertableTo() returns false for text/html to for unsupported formats', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/html',
        size: 0,
      })
      expect(fragment.isConvertableTo('.md')).toEqual(false)
      expect(fragment.isConvertableTo('.json')).toEqual(false)
      expect(fragment.isConvertableTo('.png')).toEqual(false)
      expect(fragment.isConvertableTo('.jpg')).toEqual(false)
      expect(fragment.isConvertableTo('.webp')).toEqual(false)
      expect(fragment.isConvertableTo('.gif')).toEqual(false)
      expect(fragment.isConvertableTo('abcd')).toEqual(false)
      expect(fragment.isConvertableTo('')).toEqual(false)
    })

    test('isConvertableTo() returns true for application/json to for supported formats', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'application/json',
        size: 0,
      })
      expect(fragment.isConvertableTo('.json')).toEqual(true)
      expect(fragment.isConvertableTo('.txt')).toEqual(true)
    })

    test('isConvertableTo() returns false for application/json to for unsupported formats', () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'application/json',
        size: 0,
      })
      expect(fragment.isConvertableTo('.md')).toEqual(false)
      expect(fragment.isConvertableTo('.html')).toEqual(false)
      expect(fragment.isConvertableTo('.png')).toEqual(false)
      expect(fragment.isConvertableTo('.jpg')).toEqual(false)
      expect(fragment.isConvertableTo('.webp')).toEqual(false)
      expect(fragment.isConvertableTo('.gif')).toEqual(false)
      expect(fragment.isConvertableTo('abcd')).toEqual(false)
      expect(fragment.isConvertableTo('')).toEqual(false)
    })
  })

  describe('save(), getData(), setData(), byId(), byUser(), delete()', () => {
    test('byUser() returns an empty array if there are no fragments for this user', async () => {
      expect(await Fragment.byUser('1234')).toEqual([])
    })

    test('a fragment can be created and save() stores a fragment for the user', async () => {
      const data = Buffer.from('hello')
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })
      await fragment.save()
      await fragment.setData(data)

      const fragment2 = await Fragment.byId('1234', fragment.id)
      expect(fragment2).toEqual(fragment)
      expect(await fragment2.getData()).toEqual(data)
    })

    test('save() updates the updated date/time of a fragment', async () => {
      const ownerId = '7777'
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 })
      const modified1 = fragment.updated
      await wait()
      await fragment.save()
      const fragment2 = await Fragment.byId(ownerId, fragment.id)
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1))
    })

    test('setData() updates the updated date/time of a fragment', async () => {
      const data = Buffer.from('hello')
      const ownerId = '7777'
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 })
      await fragment.save()
      const modified1 = fragment.updated
      await wait()
      await fragment.setData(data)
      await wait()
      const fragment2 = await Fragment.byId(ownerId, fragment.id)
      expect(Date.parse(fragment2.updated)).toBeGreaterThan(Date.parse(modified1))
    })

    test("a fragment is added to the list of a user's fragments", async () => {
      const data = Buffer.from('hello')
      const ownerId = '5555'
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 })
      await fragment.save()
      await fragment.setData(data)

      expect(await Fragment.byUser(ownerId)).toEqual([fragment.id])
    })

    test('full fragments are returned when requested for a user', async () => {
      const data = Buffer.from('hello')
      const ownerId = '6666'
      const fragment = new Fragment({ ownerId, type: 'text/plain', size: 0 })
      await fragment.save()
      await fragment.setData(data)

      expect(await Fragment.byUser(ownerId, true)).toEqual([fragment])
    })

    test('setData() throws if not give a Buffer', () => {
      const fragment = new Fragment({ ownerId: '123', type: 'text/plain', size: 0 })
      expect(() => fragment.setData()).rejects.toThrow()
    })

    test('setData() updates the fragment size', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })
      await fragment.save()
      await fragment.setData(Buffer.from('a'))
      expect(fragment.size).toBe(1)

      await fragment.setData(Buffer.from('aa'))
      const { size } = await Fragment.byId('1234', fragment.id)
      expect(size).toBe(2)
    })

    test('a fragment can be deleted', async () => {
      const fragment = new Fragment({ ownerId: '1234', type: 'text/plain', size: 0 })
      await fragment.save()
      await fragment.setData(Buffer.from('a'))

      await Fragment.delete('1234', fragment.id)
      expect(() => Fragment.byId('1234', fragment.id)).rejects.toThrow()
    })
  })

  describe('convertTo()', () => {
    test('unsupported conversion throws ApiError.UnsupportedMediaType', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
      })
      await fragment.setData(Buffer.from('Some text value'))
      await expect(fragment.convertTo('.json')).rejects.toThrow(
        'Unsupported Media Type'
      )
    })

    test('convert from text/plain to .txt', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/plain; charset=utf-8',
      })
      await fragment.setData(Buffer.from('Some text value'))
      const result = await fragment.convertTo('.txt')
      expect(result.toString()).toEqual('Some text value')
    })

    test('convert from text/markdown to .txt', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/markdown; charset=utf-8',
      })
      await fragment.setData(Buffer.from('# Example markdown'))
      const result = await fragment.convertTo('.txt')
      expect(result.toString()).toEqual('# Example markdown')
    })

    test('convert from text/markdown to .html', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/markdown; charset=utf-8',
      })
      await fragment.setData(Buffer.from('# Example markdown'))
      const result = await fragment.convertTo('.html')
      expect(result.toString()).toEqual('<h1>Example markdown</h1>\n')
    })

    test('convert from text/html to .txt', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'text/html',
      })
      await fragment.setData(Buffer.from('<h1>Some html</h1>'))
      const result = await fragment.convertTo('.txt')
      expect(result.toString()).toEqual('<h1>Some html</h1>')
    })

    test('convert from application/json to .txt', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'application/json',
      })
      await fragment.setData(Buffer.from(`{ "key": "value" }`))
      const result = await fragment.convertTo('.txt')
      expect(result.toString()).toEqual(`{ "key": "value" }`)
    })

    test('convert from image/png to .jpg', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'image/png',
      })
      await fragment.setData(await fs.readFile('./tests/assets/test.png'))
      const result = await fragment.convertTo('.jpg')
      expect(result.byteLength).toBeGreaterThan(0)
    })

    test('convert from image/png to .webp', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'image/png',
      })
      await fragment.setData(await fs.readFile('./tests/assets/test.png'))
      const result = await fragment.convertTo('.jpg')
      expect(result.byteLength).toBeGreaterThan(0)
    })

    test('convert from image/png to .gif', async () => {
      const fragment = new Fragment({
        ownerId: '1234',
        type: 'image/png',
      })
      await fragment.setData(await fs.readFile('./tests/assets/test.png'))
      const result = await fragment.convertTo('.jpg')
      expect(result.byteLength).toBeGreaterThan(0)
    })
  })
})
