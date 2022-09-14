/**
 * Get a list of fragments for the current user.
 */
const getFragments = (req, res) => {
  // TODO: provide actual implementation
  res.status(200).json({
    status: 'ok',
    fragments: [],
  })
}

module.exports = getFragments
