require('dotenv').config()

const logger = require('./logger')

const unneededVariable = 'This variable is never used'

process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'uncaughtException')
  throw err
})

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'unhandledRejection')
  throw reason
})

require('./server')
