const fs = require('fs').promises
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

  test('validate expand query parameter', async () => {
    const res = await request(app)
      .get(`/v1/fragments?expand=abcd`)
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(400)
    expect(res.body.status).toEqual('error')
    expect(res.body.error).toEqual({
      code: 400,
      message: `Invalid value for 'expand' query parameter. Expected '1', got 'abcd' instead.`,
    })
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

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/html support', async () => {
    const payload =
      '<!DOCTYPE html><html><head><title>Example</title></head><body><h1>Test</h1></body></html>'
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send(payload)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/html/)
    expect(res.body.toString()).toEqual(payload)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/markdown support', async () => {
    const payload = '# Markdown Document\n## Test'
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send(payload)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/markdown/)
    expect(res.body.toString()).toEqual(payload)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('application/json support', async () => {
    const payload = '{ key: "some_value" }'
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(payload)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^application\/json/)
    expect(res.body.toString()).toEqual(payload)
  })
})

describe('GET /v1/fragments/:id.ext', () => {
  beforeEach(async () => tearDown())

  /**
   * Depends on POST /v1/fragments.
   */
  test('unsupported conversion fails', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Some plain text')
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.html`)
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toEqual(415)
    expect(res.body).toMatchObject({
      status: 'error',
      error: { code: 415, message: 'Unsupported Media Type' },
    })
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/plain to .txt', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('Some text value')
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.txt`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/plain/)
    expect(res.body.toString()).toEqual('Some text value')
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/markdown to .md', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Markdown Document\n## Test')
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.md`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/markdown/)
    expect(res.body.toString()).toEqual('# Markdown Document\n## Test')
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/markdown to .html', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Markdown Document\n## Test')
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.html`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/html/)
    expect(res.body.toString()).toEqual(
      '<h1>Markdown Document</h1>\n<h2>Test</h2>\n'
    )
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/markdown to .txt', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# Markdown Document\n## Test')
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.txt`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/plain/)
    expect(res.body.toString()).toEqual('# Markdown Document\n## Test')
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/html to .html', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('<h1>Some html</h1>')
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.html`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/html/)
    expect(res.body.toString()).toEqual('<h1>Some html</h1>')
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('text/html to .txt', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/html')
      .send('<h1>Some html</h1>')
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.txt`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/plain/)
    expect(res.body.toString()).toEqual('<h1>Some html</h1>')
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('application/json to .json', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(`{ "key": "value" }`)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.json`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^application\/json/)
    expect(res.body.toString()).toEqual(`{ "key": "value" }`)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('application/json to .txt', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'application/json')
      .send(`{ "key": "value" }`)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.txt`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^text\/plain/)
    expect(res.body.toString()).toEqual(`{ "key": "value" }`)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/png to .png', async () => {
    const data = await fs.readFile('./tests/assets/test.png')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.png`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/png/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/png to .jpg', async () => {
    const data = await fs.readFile('./tests/assets/test.png')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.jpg`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/jpeg/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/png to .webp', async () => {
    const data = await fs.readFile('./tests/assets/test.png')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.webp`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/webp/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/png to .gif', async () => {
    const data = await fs.readFile('./tests/assets/test.png')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/png')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.gif`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/gif/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/jpeg to .png', async () => {
    const data = await fs.readFile('./tests/assets/test.jpg')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.png`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/png/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/jpeg to .jpg', async () => {
    const data = await fs.readFile('./tests/assets/test.jpg')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.jpg`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/jpeg/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/jpeg to .webp', async () => {
    const data = await fs.readFile('./tests/assets/test.jpg')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.webp`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/webp/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/jpeg to .gif', async () => {
    const data = await fs.readFile('./tests/assets/test.jpg')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/jpeg')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.gif`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/gif/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/webp to .png', async () => {
    const data = await fs.readFile('./tests/assets/test.webp')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/webp')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.png`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/png/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/webp to .jpg', async () => {
    const data = await fs.readFile('./tests/assets/test.webp')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/webp')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.jpg`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/jpeg/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/webp to .webp', async () => {
    const data = await fs.readFile('./tests/assets/test.webp')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/webp')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.webp`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/webp/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/webp to .gif', async () => {
    const data = await fs.readFile('./tests/assets/test.webp')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/webp')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.gif`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/gif/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/gif to .png', async () => {
    const data = await fs.readFile('./tests/assets/test.gif')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.png`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/png/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/gif to .jpg', async () => {
    const data = await fs.readFile('./tests/assets/test.gif')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.jpg`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/jpeg/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/gif to .webp', async () => {
    const data = await fs.readFile('./tests/assets/test.gif')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.webp`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/webp/)
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('image/gif to .gif', async () => {
    const data = await fs.readFile('./tests/assets/test.gif')
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'image/gif')
      .send(data)
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body.fragment?.id}.gif`)
      .auth('user1@email.com', 'password1')
      .buffer()
      .parse(binaryParser)
    expect(res.statusCode).toBe(200)
    expect(res.headers['content-type']).toMatch(/^image\/gif/)
  })
})

describe('GET /v1/fragments/:id/info', () => {
  beforeEach(async () => tearDown())

  test('unauthenticated requests are denied', () =>
    request(app).get('/v1/fragments/abcd/info').expect(401))

  test('incorrect credentials are denied', () =>
    request(app)
      .get('/v1/fragments/abcd/info')
      .auth('invalid@email.com', 'incorrect password')
      .expect(401))

  test("receive HTTP 404 not found if fragment doesn't exist", async () => {
    const res = await request(app)
      .get('/v1/fragments/abcd/info')
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(404)
    expect(res.body.status).toEqual('error')
    expect(res.body.error).toEqual({
      code: 404,
      message: 'Fragment abcd not found',
    })
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test('receive fragment metadata if fragment exists', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('8N5xWFj80a')
    const res = await request(app)
      .get(`/v1/fragments/${postRes.body?.fragment?.id}/info`)
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toEqual('ok')
    expect(res.body.fragment).toEqual(postRes.body.fragment)
  })
})
