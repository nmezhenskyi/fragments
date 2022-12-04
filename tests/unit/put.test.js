const request = require('supertest')
const app = require('../../src/app')
const hash = require('../../src/hash')

describe('PUT /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/abcd').expect(401))

  test('incorrect credentials are denied', () =>
    request(app)
      .delete('/v1/fragments/abcd')
      .auth('invalid@email.com', 'incorrect password')
      .expect(401))

  test(`receive HTTP 404 not found if fragment doesn't exist`, async () => {
    const res = await request(app)
      .put('/v1/fragments/abcd')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('8N5xWFj80a')
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
  test(`receive HTTP 400 if Content-Type doesn't match existing one`, async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('8N5xWFj80a')
    const res = await request(app)
      .put(`/v1/fragments/${postRes.body?.fragment?.id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/markdown')
      .send('# some markdown value')
    expect(res.statusCode).toBe(400)
    expect(res.body.status).toEqual('error')
    expect(res.body.error).toEqual({
      code: 400,
      message: `Content-Type does not match existing fragment's content type`,
    })
  })

  /**
   * Depends on POST /v1/fragments.
   */
  test(`successfully update existing fragment's data`, async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('8N5xWFj80a')
    const res = await request(app)
      .put(`/v1/fragments/${postRes.body?.fragment?.id}`)
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('some valid text/plain value')
    expect(res.statusCode).toBe(200)
    expect(res.body.fragment).not.toBe(undefined)
    expect(res.body.fragment.type).toEqual('text/plain')
    expect(res.body.fragment.size).toEqual('some valid text/plain value'.length)
    expect(res.body.fragment.ownerId).toEqual(hash('user1@email.com'))
    expect(typeof res.body.fragment.id === 'string').toBe(true)
    expect(typeof res.body.fragment.created === 'string').toBe(true)
    expect(typeof res.body.fragment.updated === 'string').toBe(true)
  })
})
