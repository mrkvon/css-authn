import css from '@solid/community-server'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import {
  after,
  afterEach,
  before,
  beforeEach,
  describe,
  it,
  Mock,
  mock,
} from 'node:test'
import { v7 } from '../index.js'
import { getRandomPort, startServer, stopServer } from './setup.js'

describe('v7 getAuthenticatedFetch', async () => {
  let port = -1
  let server: css.App
  let fetchSpy: Mock<typeof globalThis.fetch>

  before(async () => {
    port = getRandomPort()
    server = await startServer(port)
  })

  after(async () => {
    await stopServer(server)
  })

  beforeEach(() => {
    fetchSpy = mock.fn(globalThis.fetch)
  })

  afterEach(() => {
    fetchSpy.mock.restore()
  })

  const options = [
    {
      condition: 'without explicit webId',
      params: {
        get provider() {
          const url = new URL('http://localhost')
          url.port = String(port)
          return url.toString()
        },
        email: 'person@example',
        password: 'correcthorsebatterystaple',
      },
    },
    {
      condition: 'with explicit webId',
      params: {
        get provider() {
          const url = new URL('http://localhost')
          url.port = String(port)
          return url.toString()
        },
        email: 'person@example',
        password: 'correcthorsebatterystaple',
        get webId() {
          return new URL('person/profile/card#me', this.provider).toString()
        },
      },
    },
    {
      condition: 'with custom fetch',
      params: {
        get provider() {
          const url = new URL('http://localhost')
          url.port = String(port)
          return url.toString()
        },
        email: 'person@example',
        password: 'correcthorsebatterystaple',
        get fetch() {
          return fetchSpy
        },
      },
      assert: {
        prepared: () => {
          assert.ok(fetchSpy.mock.callCount() > 0)
          fetchSpy.mock.resetCalls()
        },
        finished: () => {
          assert.equal(fetchSpy.mock.callCount(), 2)
        },
      },
    },
  ]
  options.forEach(options => {
    it(`[${options.condition}] should produce functioning authenticated fetch`, async () => {
      const authFetch = await v7.getAuthenticatedFetch(options.params)

      options.assert?.prepared()

      const filename = randomUUID() + '.ttl'
      const testFile = new URL(filename, options.params.provider)

      const response = await authFetch(testFile, {
        method: 'PUT',
        body: '<#this> a <#test>.',
        headers: { 'content-type': 'text/turtle' },
      })

      assert.equal(response.status, 201)

      const responseGet = await authFetch(testFile, {
        headers: { accept: 'application/ld+json' },
      })
      const body = await responseGet.json()
      assert.deepStrictEqual(body, [
        {
          '@id': testFile + '#this',
          '@type': [testFile + '#test'],
        },
      ])

      options.assert?.finished()
    })
  })
})
