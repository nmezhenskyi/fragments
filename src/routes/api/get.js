const { createSuccessResponse } = require('../../response')
const { Fragment } = require('../../model/fragment')

/**
 * Get a list of fragments for the current user.
 */
const getFragments = async (req, res, next) => {
  try {
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
    const fragment = await Fragment.byId(req.user, req.params.id)
    const data = await fragment.getData()
    return res.status(200).send(data)
  } catch (err) {
    return next(err)
  }
}

module.exports.getFragments = getFragments
module.exports.getFragmentById = getFragmentById
