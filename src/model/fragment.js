const { randomUUID } = require('crypto')
const contentType = require('content-type')
const { ApiError } = require('../exceptions')

const {
  readFragment,
  writeFragment,
  readFragmentData,
  writeFragmentData,
  listFragments,
  deleteFragment,
} = require('./data')

const logger = require('../logger')

const validTypes = {
  'text/plain': ['.txt'],
  // 'text/markdown': ['.md', '.html', '.txt'],
  // 'text/html': ['.html', '.txt'],
  // 'application/json': ['.json', '.txt'],
  // 'image/png': ['.png', '.jpg', '.webp', '.gif'],
  // 'image/jpeg': ['.png', '.jpg', '.webp', '.gif'],
  // 'image/webp': ['.png', '.jpg', '.webp', '.gif'],
  // 'image/gif': ['.png', '.jpg', '.webp', '.gif'],
}

class Fragment {
  constructor({ id, ownerId, created, updated, type, size = 0 }) {
    if (!(ownerId && type)) {
      logger.debug(
        { ownerId, type },
        'Got fragment with invalid ownerId and/or type'
      )
      throw new Error(
        `ownerId and type fields are required, got ownerId=${ownerId}, type=${type}`
      )
    }
    if (!Fragment.isSupportedType(type)) {
      logger.debug({ type }, 'Got fragment with invalid type')
      throw new Error('Invalid type')
    }
    if (typeof size !== 'number' || size < 0) {
      logger.debug({ size }, 'Got fragment with invalid size')
      throw new Error('size must be a non-negative number')
    }

    this.id = id || randomUUID()
    this.ownerId = ownerId
    this.created = created || new Date().toISOString()
    this.updated = updated || new Date().toISOString()
    this.type = type
    this.size = size
  }

  /**
   * Get all fragments (id or full) for the given user.
   * @param {string} ownerId user's hashed email
   * @param {boolean} expand whether to expand ids to full fragments
   * @returns {Promise<Array<string | Fragment>>} array of ids/fragments
   */
  static async byUser(ownerId, expand = false) {
    return listFragments(ownerId, expand)
  }

  /**
   * Gets a fragment for the user by the given id.
   * @param {string} ownerId users' hashed email
   * @param {string} id fragment's id
   * @returns {Promise<Fragment>} fragment
   *
   * @throws Will throw ApiError.NotFound if fragment does not exist.
   */
  static async byId(ownerId, id) {
    const fragment = await readFragment(ownerId, id)
    if (!fragment) {
      throw ApiError.NotFound(`Fragment ${id} not found`)
    }
    return fragment
  }

  /**
   * Deletes the user's fragment data and metadata for the given id.
   * @param {string} ownerId users' hashed email
   * @param {string} id fragment's id
   * @returns {Promise<void>}
   */
  static async delete(ownerId, id) {
    return deleteFragment(ownerId, id)
  }

  /**
   * Saves the current fragment to the database.
   * @returns {Promise<void>}
   */
  async save() {
    this.updated = new Date().toISOString()
    return writeFragment(this)
  }

  /**
   * Get's the fragment's data from the database.
   * @returns {Promise<Buffer>} fragment's data
   */
  async getData() {
    return readFragmentData(this.ownerId, this.id)
  }

  /**
   * Set's the fragment's data in the database.
   * @param {Buffer} data fragment's data in binary
   * @returns {Promise<void>}
   */
  async setData(data) {
    if (!(data instanceof Buffer)) {
      throw new Error('data must be of type Buffer')
    }
    this.updated = new Date().toISOString()
    this.size = data.byteLength
    return writeFragmentData(this.ownerId, this.id, data)
  }

  /**
   * Returns the mime type (e.g., without encoding) for the fragment's type:
   * "text/html; charset=utf-8" -> "text/html".
   * @returns {string} fragment's mime type (without encoding)
   */
  get mimeType() {
    const { type } = contentType.parse(this.type)
    return type
  }

  /**
   * Returns true if this fragment is a text/* mime type.
   * @returns {boolean} true if fragment's type is text/*
   */
  get isText() {
    return /text\/{1,}/gi.test(this.mimeType)
  }

  /**
   * Returns the formats into which this fragment type can be converted.
   * @returns {Array<string>} list of supported mime types
   */
  get formats() {
    return [this.mimeType]
  }

  /**
   * Returns true if the content type is supported.
   * @param {string} value a Content-Type value (e.g., 'text/plain' or 'text/plain: charset=utf-8')
   * @returns {boolean} true if this Content-Type (i.e., type/subtype) is supported
   */
  static isSupportedType(value) {
    try {
      const { type } = contentType.parse(value)
      return validTypes[type] !== undefined
    } catch (err) {
      return false
    }
  }
}

module.exports.Fragment = Fragment
