const request = require('supertest')
const app = require('../../src/app')
const { tearDown } = require('../../src/model/data/index')

/**
 * Parses response body to Buffer object.
 */
const binaryParser = (res, callback) => {
  res.setEncoding('binary')
  res.data = ''
  res.on('data', (chunk) => {
    res.data += chunk
  })
  res.on('end', () => {
    callback(null, Buffer.from(res.data))
  })
}

describe('GET /v1/fragments', () => {
  beforeEach(async () => tearDown())

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments').expect(401))

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
    expect(res.body.fragments.length).toEqual(0)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('receive array of correct length', async () => {
    const payloads = ['8N5xWFj80a', 'KRjj28UB0U', '4rabtpLZqP', 'VH2JxLFMbn']
    await Promise.all(
      payloads.map(async (payload) => {
        await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(payload)
      })
    )
    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body.fragments)).toBe(true)
    expect(res.body.fragments.length).toEqual(payloads.length)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('receive array of valid fragment ids when not expanded', async () => {
    const payloads = ['8N5xWFj80a', 'KRjj28UB0U', '4rabtpLZqP', 'VH2JxLFMbn']
    const postResponses = await Promise.all(
      payloads.map(async (payload) => {
        return await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(payload)
      })
    )

    /** Created fragment ids. */
    const ids = postResponses.map((res) => res.body?.fragment?.id)

    const res = await request(app)
      .get('/v1/fragments')
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body.fragments)).toBe(true)
    expect(res.body.fragments.length).toEqual(payloads.length)
    expect(res.body.fragments).toEqual(ids)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('receive array of valid fragments when expanded', async () => {
    const payloads = ['8N5xWFj80a', 'KRjj28UB0U', '4rabtpLZqP', 'VH2JxLFMbn']
    const postResponses = await Promise.all(
      payloads.map(async (payload) => {
        return await request(app)
          .post('/v1/fragments')
          .auth('user1@email.com', 'password1')
          .set('Content-Type', 'text/plain')
          .send(payload)
      })
    )

    /** Created fragments. */
    const fragments = postResponses.map((res) => res.body.fragment)

    const res = await request(app)
      .get('/v1/fragments?expand=1')
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.body.fragments)).toBe(true)
    expect(res.body.fragments.length).toEqual(payloads.length)
    expect(res.body.fragments).toEqual(fragments)
  })
})

describe('GET /v1/fragments/:id', () => {
  beforeEach(async () => tearDown())

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/abcd').expect(401))

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/abcd')
      .auth('invalid@email.com', 'incorrect password')
      .expect(401))

  test('receive HTTP 404 response if fragment does not exist', async () => {
    const res = await request(app)
      .get('/v1/fragments/abcd')
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(404)
    expect(res.body.status).toBe('error')
    expect(res.body.error).toMatchObject({
      message: 'Fragment abcd not found',
      code: 404,
    })
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/plain support', async () => {
    const payload = '8N5xWFj80a'
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send(payload)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/plain/)
    expect(res.body.toString()).toEqual(payload)
  })
})
