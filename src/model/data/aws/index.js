const s3Client = require('./s3Client')
const {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3')

const ddbDocClient = require('./ddbDocClient')
const {
  PutCommand,
  GetCommand,
  QueryCommand,
  DeleteCommand,
} = require('@aws-sdk/lib-dynamodb')

const logger = require('../../../logger')

/**
 * Write a fragment's metadata to memory db.
 *
 * @param {object} fragment
 * @return {Promise<PutCommandOutput>}
 */
function writeFragment(fragment) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Item: fragment,
  }

  const command = new PutCommand(params)

  try {
    return ddbDocClient.send(command)
  } catch (err) {
    logger.warn({ err, params, fragment }, 'error writing fragment to DynamoDB')
    throw err
  }
}

/**
 * Read a fragment's metadata from memory db.
 *
 * @param {string} ownerId
 * @param {string} id
 * @returns {Promise<Record<string, any> | undefined>}
 */
async function readFragment(ownerId, id) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    Key: { ownerId, id },
  }

  const command = new GetCommand(params)

  try {
    const data = await ddbDocClient.send(command)
    return data?.Item
  } catch (err) {
    logger.warn({ err, params }, 'error reading fragment from DynamoDB')
    throw err
  }
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
  const deleteMetadata = async (ownerId, id) => {
    const params = {
      TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
      Key: { ownerId, id },
    }

    const command = new DeleteCommand(params)

    try {
      await ddbDocClient.send(command)
    } catch (err) {
      logger.warn({ err, params }, 'failed to delete fragment metadata')
      throw err
    }
  }

  return Promise.all([deleteMetadata(ownerId, id), deleteFragmentData(ownerId, id)])
}

/**
 * Get a list of fragments ids/objects for the given user from memory db.
 * @param {string} ownerId
 * @param {string} expand
 * @returns {Promise<Array<Fragment>|Array<string>|undefined>}
 */
async function listFragments(ownerId, expand = false) {
  const params = {
    TableName: process.env.AWS_DYNAMODB_TABLE_NAME,
    KeyConditionExpression: 'ownerId = :ownerId',
    ExpressionAttributeValues: {
      ':ownerId': ownerId,
    },
  }
  if (!expand) {
    params.ProjectionExpression = 'id'
  }

  const command = new QueryCommand(params)

  try {
    const data = await command.send(params)
    return !expand ? data?.Items.map((item) => item.id) : data?.Items
  } catch (err) {
    logger.warn(
      { err, params },
      'error getting all fragments for the user from DynamoDB'
    )
    throw err
  }
}

module.exports.listFragments = listFragments
module.exports.writeFragment = writeFragment
module.exports.readFragment = readFragment
module.exports.writeFragmentData = writeFragmentData
module.exports.readFragmentData = readFragmentData
module.exports.deleteFragment = deleteFragment
