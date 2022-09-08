const stoppable = require('stoppable')
const logger = require('./logger')
const app = require('./app')

const PORT = parseInt(process.env.PORT || 8080, 10)

const server = stoppable(
  app.listen(PORT, () => {
    logger.info({ PORT }, 'Server started')
  })
)

module.exports = server
