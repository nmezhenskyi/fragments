const express = require('express')

const { version, author } = require('../../package.json')

const router = express.Router()
const { authenticate } = require('../authentication')

/**
 * Expose v1 API routes.
 */
router.use('/v1', authenticate(), require('./api'))

/**
 * Health check route. If the server is running, responds with 200 OK.
 */
router.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  res.status(200).json({
    status: 'ok',
    author,
    githubUrl: 'https://github.com/nmezhenskyi/fragments',
    version,
  })
})

module.exports = router
