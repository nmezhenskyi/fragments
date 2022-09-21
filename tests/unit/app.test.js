const request = require('supertest')
const app = require('../../src/app')

describe('GET non-existent route', () => {
  test('should return HTTP 404 response', () =>
    request(app).get('/abcd').expect(404))

  test("should return status 'error' in response", async () => {
    const res = await request(app).get('/abcd')
    expect(res.body.status).toEqual('error')
  })

  test('should return valid information in the error object', async () => {
    const res = await request(app).get('/abcd')
    expect(res.body.error).toMatchObject({ message: 'Not found', code: 404 })
  })
})
