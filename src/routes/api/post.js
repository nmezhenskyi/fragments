const { createSuccessResponse } = require('../../response')
const { Fragment } = require('../../model/fragment')
const { ApiError } = require('../../exceptions')
const logger = require('../../logger')

if (!process.env.API_URL) {
  throw new Error('missing env vars: API_URL not found')
}

/**
 * Creates a new fragment for current the user.
 */
const postFragment = async (req, res, next) => {
  if (!Buffer.isBuffer(req.body)) {
    logger.warn('POST /fragments received unsupported media type')
    return next(ApiError.UnsupportedMediaType())
  }

  try {
    const fragment = new Fragment({
      ownerId: req.user,
      type: req.get('Content-Type'),
    })

    await fragment.save()
    await fragment.setData(req.body)

    res.set('Location', `${process.env.API_URL}/v1/fragments/${fragment.id}`)
    return res.status(201).json(createSuccessResponse({ fragment }))
  } catch (err) {
    return next(err)
  }
}

module.exports.postFragment = postFragment
