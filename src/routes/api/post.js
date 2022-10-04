const { createSuccessResponse, createErrorResponse } = require('../../response')
const { Fragment } = require('../../model/fragment')
const logger = require('../../logger')

if (!process.env.API_URL) {
  throw new Error('missing env vars: API_URL not found')
}

const postFragments = async (req, res) => {
  if (!Buffer.isBuffer(req.body)) {
    logger.warn('POST /fragments received unsupported media type')
    return res.status(415).json(createErrorResponse(415, 'Unsupported Media Type'))
  }

  const fragment = new Fragment({ ownerId: req.user, type: req.get('Content-Type') })
  await fragment.save()
  await fragment.setData(req.body)

  res.set('Location', `${process.env.API_URL}/v1/fragments/${fragment.id}`)
  return res.status(201).json(createSuccessResponse({ fragment }))
}

module.exports = postFragments
