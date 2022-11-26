const { createSuccessResponse } = require('../../response')
const { Fragment } = require('../../model/fragment')

/**
 * Delete a single fragment of the current user by fragment id.
 */
const deleteFragment = async (req, res, next) => {
  try {
    // Check if fragment exists, if not it'll throw ApiError.NotFound
    await Fragment.byId(req.user, req.params.id)

    await Fragment.delete(req.user, req.params.id)

    return res.status(200).json(createSuccessResponse())
  } catch (err) {
    return next(err)
  }
}

module.exports.deleteFragment = deleteFragment
