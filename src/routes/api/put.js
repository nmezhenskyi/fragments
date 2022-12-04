const { createSuccessResponse } = require('../../response')
const { Fragment } = require('../../model/fragment')
const { ApiError } = require('../../exceptions')
const logger = require('../../logger')

/**
 * Update existing fragment's data. New data must have
 * the same content type.
 */
const putFragment = async (req, res, next) => {
  if (!Buffer.isBuffer(req.body)) {
    logger.warn('PUT /fragments received unsupported media type')
    return next(ApiError.UnsupportedMediaType())
  }

  try {
    const fragment = await Fragment.byId(req.user, req.params.id)

    if (req.get('Content-Type') !== fragment.type) {
      throw ApiError.BadRequest(
        `Content-Type does not match existing fragment's content type`
      )
    }

    await fragment.setData(req.body)
    await fragment.save()

    return res.status(200).json(createSuccessResponse({ fragment }))
  } catch (err) {
    return next(err)
  }
}

module.exports.putFragment = putFragment
