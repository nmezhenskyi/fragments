const { S3Client } = require('@aws-sdk/client-s3')
const logger = require('../../../logger')

/**
 * If AWS credentials are configured in the environment, use them.
 * Needed for local testing with LocalStack or MinIO.
 *
 * @returns {Object | undefined} object with credentials if present
 */
const getCredentials = () => {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    // See https://docs.aws.amazon.com/AWSJavaScriptSDK/v3/latest/clients/client-s3/modules/credentials.html
    const credentials = {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      sessionToken: process.env.AWS_SESSION_TOKEN,
    }
    logger.debug(
      'Using extra S3 Credentials AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY'
    )
    return credentials
  }
}

/**
 * If an AWS S3 Endpoint is configured in the environment, use it.
 *
 * @returns {string | undefined}
 */
const getS3Endpoint = () => {
  if (process.env.AWS_S3_ENDPOINT_URL) {
    logger.debug(
      { endpoint: process.env.AWS_S3_ENDPOINT_URL },
      'Using alternate S3 endpoint'
    )
    return process.env.AWS_S3_ENDPOINT_URL
  }
}

module.exports = new S3Client({
  region: process.env.AWS_REGION,
  credentials: getCredentials(),
  endpoint: getS3Endpoint(),
  forcePathStyle: true,
})
