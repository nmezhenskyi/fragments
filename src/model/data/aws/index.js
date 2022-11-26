const MemoryDB = require('../memory/memory-db')
const s3Client = require('./s3Client')
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3')
const logger = require('../../../logger')

/** fragment metadata */
let metadata = new MemoryDB() // TODO: switch to DynamoDB

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
 * Write a fragment's data to an S3 Object in a Bucket.
 *
 * @param {string} ownerId
 * @param {string} id
 * @param {any} value
 * @returns {Promise<void>}
 * @throws Throws an error if the request to S3 fails
 */
async function writeFragmentData(ownerId, id, value) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
    Body: value,
  }

  const command = new PutObjectCommand(params)
  try {
    await s3Client.send(command)
  } catch (err) {
    const { Bucket, Key } = params
    logger.error({ err, Bucket, Key }, 'Error uploading fragment data to S3')
    throw new Error('unable to upload fragment data')
  }
}

// Convert a stream of data into a Buffer.
const streamToBuffer = (stream) =>
  new Promise((resolve, reject) => {
    const chunks = []
    stream.on('data', (chunk) => chunks.push(chunk))
    stream.on('error', reject)
    stream.on('end', () => resolve(Buffer.concat(chunks)))
  })

/**
 * Read a fragment's data from memory db.
 *
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<Buffer>}
 * @throws Throws an error if the request to S3 fails
 */
async function readFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  }

  const command = new GetObjectCommand(params)
  try {
    const data = await s3Client.send(command)
    return streamToBuffer(data.Body)
  } catch (err) {
    const { Bucket, Key } = params
    logger.error({ err, Bucket, Key }, 'Error streaming fragment data from S3')
    throw new Error('unable to read fragment data')
  }
}

/**
 * Delete fragment's data from S3.
 *
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<void>}
 * @throws Throws an error if the request to S3 fails
 */
async function deleteFragmentData(ownerId, id) {
  const params = {
    Bucket: process.env.AWS_S3_BUCKET_NAME,
    Key: `${ownerId}/${id}`,
  }

  const command = new DeleteObjectCommand(params)
  try {
    await s3Client.send(command)
  } catch (err) {
    const { Bucket, Key } = params
    logger.error({ err, Bucket, Key }, 'Error deleting fragment data from S3')
    throw new Error('unable to delete fragment data')
  }
}

/**
 * Delete a fragment's metadata and data from memory db.
 *
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<void>}
 */
function deleteFragment(ownerId, id) {
  return Promise.all([metadata.del(ownerId, id), deleteFragmentData(ownerId, id)])
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
 * Clears all stored data for testing purposes.
 *
 * @warning Only use for unit tests.
 * @returns {Promise<void>}
 */
function tearDown() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('tearDown() can only be used in test environment')
  }
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
