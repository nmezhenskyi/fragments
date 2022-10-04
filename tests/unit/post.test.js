const request = require('supertest')
const app = require('../../src/app')
const hash = require('../../src/hash')

describe('POST /v1/fragments', () => {
  test('unauthenticated requests are denied', () =>
    request(app).post('/v1/fragments').send('8N5xWFj80a').expect(401))

  test('incorrect credentials are denied', () =>
    request(app)
      .post('/v1/fragments')
      .auth('invalid@email.com', 'incorrect password')
      .send('8N5xWFj80a')
      .expect(401))

  test('invalid content type is rejected', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/efgh')
      .send('123')
    expect(res.statusCode).toBe(415)
    expect(res.body.status).toBe('error')
    expect(res.body.error.code).toBe(415)
    expect(res.body.error.message).toBe('Unsupported Media Type')
  })

  test('receive fragment metadata on success', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('8N5xWFj80a')
    expect(res.statusCode).toBe(201)
    expect(res.body.status).toBe('ok')
    expect(res.body.fragment).not.toBe(undefined)
    expect(res.body.fragment.type).toEqual('text/plain')
    expect(res.body.fragment.size).toEqual('8N5xWFj80a'.length)
    expect(res.body.fragment.ownerId).toEqual(hash('user1@email.com'))
    expect(typeof res.body.fragment.id === 'string').toBe(true)
    expect(typeof res.body.fragment.created === 'string').toBe(true)
    expect(typeof res.body.fragment.updated === 'string').toBe(true)
  })

  test('include Location header on success', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('8N5xWFj80a')
    expect(res.statusCode).toBe(201)
    expect(res.headers['location']).toBe(
      `${process.env.API_URL}/v1/fragments/${res.body.fragment.id}`
    )
  })
})
