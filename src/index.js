require('dotenv').config()

const logger = require('./logger')

process.on('uncaughtException', (err, origin) => {
  logger.fatal({ err, origin }, 'uncaughtException')
  throw err
})

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'unhandledRejection')
  throw reason
})

const server = require('./server')

function closeGracefully(_signal) {
  server.stop(() => {
    logger.info('Fragments microservice has been stopped')
    process.exit()
  })
}

process.on('SIGINT', closeGracefully)
