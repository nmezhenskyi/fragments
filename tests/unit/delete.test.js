const request = require('supertest')
const app = require('../../src/app')

describe('DELETE /v1/fragments/:id', () => {
  test('unauthenticated requests are denied', () =>
    request(app).delete('/v1/fragments/abcd').expect(401))

  test('incorrect credentials are denied', () =>
    request(app)
      .delete('/v1/fragments/abcd')
      .auth('invalid@email.com', 'incorrect password')
      .expect(401))

  test("receive HTTP 404 not found if fragment doesn't exist", async () => {
    const res = await request(app)
      .delete('/v1/fragments/abcd')
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
  test('authenticated user can delete fragment', async () => {
    const postRes = await request(app)
      .post('/v1/fragments')
      .auth('user1@email.com', 'password1')
      .set('Content-Type', 'text/plain')
      .send('8N5xWFj80a')
    const res = await request(app)
      .delete(`/v1/fragments/${postRes.body?.fragment?.id}`)
      .auth('user1@email.com', 'password1')
    expect(res.statusCode).toBe(200)
    expect(res.body.status).toEqual('ok')
  })
})
