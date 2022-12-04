const express = require('express')
const { Fragment } = require('../../model/fragment')

const router = express.Router()

const rawBody = () =>
  express.raw({
    inflate: true,
    limit: '5mb',
    type: (req) => Fragment.isSupportedType(req),
  })

router.get('/fragments', require('./get').getFragments)
router.post('/fragments', rawBody(), require('./post').postFragment)
router.get('/fragments/:id', require('./get').getFragmentById)
router.put('/fragments/:id', rawBody(), require('./put').putFragment)
router.delete('/fragments/:id', require('./delete').deleteFragment)
router.get('/fragments/:id/info', require('./get').getFragmentMetadataById)

module.exports = router
