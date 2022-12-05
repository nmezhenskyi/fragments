const request = require('supertest')
const fs = require('fs').promises
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

  test('support text/html content type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(
        '<!DOCTYPE html><html><head><title>Example</title></head><body><h1>Test</h1></body></html>'
      )
    expect(res.statusCode).toBe(201)
  })

  test('support text/markdown content type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Markdown Document\n## Test')
    expect(res.statusCode).toBe(201)
  })

  test('support application/json content type', async () => {
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send('{ key: "some_value" }')
    expect(res.statusCode).toBe(201)
  })

  test('support image/png content type', async () => {
    const data = await fs.readFile('./tests/assets/test.png')
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(data)
    expect(res.statusCode).toBe(201)
    expect(res.body.status).toEqual('ok')
    expect(res.body?.fragment?.type).toEqual('image/png')
  })

  test('support image/jpeg content type', async () => {
    const data = await fs.readFile('./tests/assets/test.jpg')
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(data)
    expect(res.statusCode).toBe(201)
    expect(res.body.status).toEqual('ok')
    expect(res.body?.fragment?.type).toEqual('image/jpeg')
  })

  test('support image/webp content type', async () => {
    const data = await fs.readFile('./tests/assets/test.webp')
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/webp')
      .send(data)
    expect(res.statusCode).toBe(201)
    expect(res.body.status).toEqual('ok')
    expect(res.body?.fragment?.type).toEqual('image/webp')
  })

  test('support image/gif content type', async () => {
    const data = await fs.readFile('./tests/assets/test.gif')
    const res = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send(data)
    expect(res.statusCode).toBe(201)
    expect(res.body.status).toEqual('ok')
    expect(res.body?.fragment?.type).toEqual('image/gif')
  })
})
