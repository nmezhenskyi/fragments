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

router.get('/fragments', require('./get'))
router.post('/fragments', rawBody(), require('./post'))

module.exports = router
