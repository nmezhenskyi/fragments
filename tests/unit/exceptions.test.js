const { ApiError } = require('../../src/exceptions')

describe('ApiError class', () => {
  test('BadRequest()', () => {
    const err = ApiError.BadRequest()
    expect(err instanceof Error).toBe(true)
    expect(err.status).toEqual(400)
    expect(err.message).toEqual('Bad Request')
  })

  test('Unauthorized()', () => {
    const err = ApiError.Unauthorized()
    expect(err instanceof Error).toBe(true)
    expect(err.status).toEqual(401)
    expect(err.message).toEqual('Unauthorized')
  })

  test('Forbidden()', () => {
    const err = ApiError.Forbidden()
    expect(err instanceof Error).toBe(true)
    expect(err.status).toEqual(403)
    expect(err.message).toEqual('Forbidden')
  })

  test('NotFound()', () => {
    const err = ApiError.NotFound()
    expect(err instanceof Error).toBe(true)
    expect(err.status).toEqual(404)
    expect(err.message).toEqual('Not Found')
  })

  test('UnsupportedMediaType()', () => {
    const err = ApiError.UnsupportedMediaType()
    expect(err instanceof Error).toBe(true)
    expect(err.status).toEqual(415)
    expect(err.message).toEqual('Unsupported Media Type')
  })

  test('InternalError()', () => {
    const err = ApiError.InternalError()
    expect(err instanceof Error).toBe(true)
    expect(err.status).toEqual(500)
    expect(err.message).toEqual('Unexpected Internal Error')
  })
})
