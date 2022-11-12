const mime = require('mime-types')
const { createSuccessResponse } = require('../../response')
const { Fragment } = require('../../model/fragment')
const { ApiError } = require('../../exceptions')

/**
 * Get a list of fragments for the current user.
 */
const getFragments = async (req, res, next) => {
  try {
    const expand = req.query.expand
    if (expand && expand !== '1') {
      return next(
        ApiError.BadRequest(
          `Invalid value for 'expand' query parameter. Expected '1', got '${req.query.expand}' instead.`
        )
      )
    }

    const fragments = await Fragment.byUser(req.user, req.query.expand === '1')
    return res.status(200).json(createSuccessResponse({ fragments }))
  } catch (err) {
    return next(err)
  }
}

/**
 * Get a single fragment by id for the current user.
 */
const getFragmentById = async (req, res, next) => {
  try {
    const [id, ext] = req.params.id.split('.')

    if (ext && !Fragment.isSupportedType(mime.lookup(ext))) {
      return next(ApiError.UnsupportedMediaType())
    }

    const fragment = await Fragment.byId(req.user, id)
    const contentType = ext ? mime.lookup(ext) : fragment.type
    const data = ext ? await fragment.convertTo(`.${ext}`) : await fragment.getData()

    return res.status(200).set('Content-Type', contentType).send(data)
  } catch (err) {
    return next(err)
  }
}

/**
 * Get a single fragment's metadata by id for the current user.
 */
const getFragmentMetadataById = async (req, res, next) => {
  try {
    const fragment = await Fragment.byId(req.user, req.params.id)
    return res.status(200).json(createSuccessResponse({ fragment }))
  } catch (err) {
    return next(err)
  }
}

module.exports.getFragments = getFragments
module.exports.getFragmentById = getFragmentById
module.exports.getFragmentMetadataById = getFragmentMetadataById
