const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')

const logger = require('./logger')
const pino = require('pino-http')({ logger })

const passport = require('passport')
const authorization = require('./authentication')

const app = express()

app.use(pino)
app.use(helmet())
app.use(cors())
app.use(compression()) // gzip/deflate compression middleware

passport.use(authorization.strategy())
app.use(passport.initialize())

app.use('/', require('./routes'))

/**
 * Not found handler.
 */
app.use((_req, res) => {
  res.status(404).json({
    status: 'error',
    error: {
      message: 'Not found',
      code: 404,
    },
  })
})

/**
 * Error handler
 */
app.use((err, _req, res, _next) => {
  const status = err.status || 500
  const message = err.message || 'unable to process request'

  if (status > 499) {
    logger.error({ err }, 'Error processing request')
  }

  res.status(status).json({
    status: 'error',
    error: {
      message,
      code: status,
    },
  })
})

module.exports = app
