const { createSuccessResponse } = require('../../response')

/**
 * Get a list of fragments for the current user.
 */
const getFragments = (req, res) => {
  // TODO: provide actual implementation
  res.status(200).json(createSuccessResponse({ fragments: [] }))
}

module.exports = getFragments
