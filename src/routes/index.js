const express = require('express')

const { version, author } = require('../../package.json')
const { hostname } = require('os')

const router = express.Router()
const { authenticate } = require('../authorization')
const { createSuccessResponse } = require('../response')

/**
 * Expose v1 API routes.
 */
router.use('/v1', authenticate(), require('./api'))

/**
 * Health check route. If the server is running, responds with 200 OK.
 */
router.get('/', (_req, res) => {
  res.setHeader('Cache-Control', 'no-cache')
  const body = createSuccessResponse({
    author,
    githubUrl: 'https://github.com/nmezhenskyi/fragments',
    version,
    hostname: hostname(),
  })
  res.status(200).json(body)
})

module.exports = router
