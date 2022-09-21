const request = require('supertest')
const app = require('../../src/app')

describe('GET /v1/fragments', () => {
  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments').expect(500))

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments')
      .auth('invalid@email.com', 'incorrect password')
      .expect(401))

  test('authenticated users get a fragments array', async () => {
    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toBe('ok')
    expect(Array.isArray(res.body.fragments)).toBe(true)
  })

  // TODO: add tests to check the contents of fragments array
})
