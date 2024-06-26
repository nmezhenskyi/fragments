const MemoryDB = require('./memory-db')

/** raw data */
let data = new MemoryDB()
/** fragment metadata */
let metadata = new MemoryDB()

/**
 * Write a fragment's metadata to memory db.
 * @param {object} fragment
 * @returns {Promise<void>}
 */
function writeFragment(fragment) {
  return metadata.put(fragment.ownerId, fragment.id, fragment)
}

/**
 * Read a fragment's metadata from memory db.
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<any>}
 */
function readFragment(ownerId, id) {
  return metadata.get(ownerId, id)
}

/**
 * Write a fragment's data to memory db.
 * @param {string} ownerId
 * @param {string} id
 * @param {any} value
 * @returns {Promise<void>}
 */
function writeFragmentData(ownerId, id, value) {
  return data.put(ownerId, id, value)
}

/**
 * Read a fragment's data from memory db.
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<any>}
 */
function readFragmentData(ownerId, id) {
  return data.get(ownerId, id)
}

/**
 * Get a list of fragments ids/objects for the given user from memory db.
 * @param {string} ownerId
 * @param {string} expand
 * @returns {Promise<Array<any>>}
 */
async function listFragments(ownerId, expand = false) {
  const fragments = await metadata.query(ownerId)
  if (expand || !fragments) {
    return fragments
  }
  return fragments.map((fragment) => fragment.id)
}

/**
 * Delete a fragment's metadata and data from memory db.
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<void>}
 */
function deleteFragment(ownerId, id) {
  return Promise.all([metadata.del(ownerId, id), data.del(ownerId, id)])
}

/**
 * Clears all stored data for testing purposes.
 *
 * @warning Only use for unit tests.
 * @returns {Promise<void>}
 */
function tearDown() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('tearDown() can only be used in test environment')
  }
  data = new MemoryDB()
  metadata = new MemoryDB()
  return Promise.resolve()
}

module.exports.listFragments = listFragments
module.exports.writeFragment = writeFragment
module.exports.readFragment = readFragment
module.exports.writeFragmentData = writeFragmentData
module.exports.readFragmentData = readFragmentData
module.exports.deleteFragment = deleteFragment
module.exports.tearDown = tearDown
