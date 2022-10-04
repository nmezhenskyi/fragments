const passport = require('passport')

const { createErrorResponse } = require('../response')
const hash = require('../hash')
const logger = require('../logger')

/**
 *
 * @param {'bearer' | 'http'} strategyName the passport strategy to use
 * @returns {Function} the middleware function to use for authentication
 */
module.exports = (strategyName) => {
  return function (req, res, next) {
    /**
     * Callback to hash the user's email after authentication.
     * @param {Error} err an error object
     * @param {string} email an authenticated user's email address
     */
    function callback(err, email) {
      if (err) {
        logger.warn({ err }, 'error authenticating user')
        return next(createErrorResponse(500, 'Unable to authenticated user'))
      }
      if (!email) {
        return res.status(401).json(createErrorResponse(401, 'Unauthorized'))
      }
      req.user = hash(email)
      logger.debug({ email, hash: req.user }, 'Authenticated user')
      return next()
    }

    passport.authenticate(strategyName, { session: false }, callback)(req, res, next)
  }
}
