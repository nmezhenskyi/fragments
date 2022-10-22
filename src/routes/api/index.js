const express = require('express')
const contentType = require('content-type')
const { Fragment } = require('../../model/fragment')

const router = express.Router()

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => {
      const { type } = contentType.parse(req)
      return Fragment.isSupportedType(type)
    },
  })

router.get('/fragments', require('./get').getFragments)
router.post('/fragments', rawBody(), require('./post').postFragment)
router.get('/fragments/:id', require('./get').getFragmentById)
router.get('/fragments/:id/info', require('./get').getFragmentMetadataById)

module.exports = router
