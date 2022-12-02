const { DynamoDBClient } = require('@aws-sdk/client-dynamodb')
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb')
const logger = require('../../../logger')

/**
 * If AWS credentials are configured in the environment, use them.
 * @returns {object | undefined}
 */
const getCredentials = () => {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    }
    logger.debug('Using extra DynamoDB credentials')
    return credentials
  }
}

/**
 * If an AWS DynamoDB Endpoint is configured in the environment, use it.
 * @returns {string | undefined}
 */
const getDynamoDBEndpoint = () => {
  if (process.env.AWS_DYNAMODB_ENDPOINT_URL) {
    logger.debug(
      { endpoint: process.env.AWS_DYNAMODB_ENDPOINT_URL },
      'Using alternate DynamoDB endpoint'
    )
    return process.env.AWS_DYNAMODB_ENDPOINT_URL
  }
}

const ddbClient = new DynamoDBClient({
  region: process.env.AWS_REGION,
  endpoint: getDynamoDBEndpoint(),
  credentials: getCredentials(),
})

const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, {
  marshallOptions: {
    convertEmptyValues: false,
    removeUndefinedValues: false,
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    wrapNumbers: false,
  },
})

module.exports = ddbDocClient
