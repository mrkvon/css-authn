import css from '@solid/community-server'
import assert from 'node:assert'
import { randomUUID } from 'node:crypto'
import { after, before, describe, it, mock } from 'node:test'
import { foaf, solid } from 'rdf-namespaces'
import { v7 } from '../index.js'
import { getRandomPort, startServer, stopServer } from './setup.js'

describe('v7 createAccount', {}, async () => {
  let port = -1
  let server: css.App

  before(async () => {
    port = getRandomPort()
    server = await startServer(port)
  })

  after(async () => {
    await stopServer(server)
  })

  it('should create account', async () => {
    const serverUrl = `http://localhost:${port}`

    const username = randomUUID()
    const email = username + '@example'
    const password = 'correcthorsebatterystaples'
    const result = await v7.createAccount({
      username,
      email,
      password,
      oidcIssuer: serverUrl,
    })

    assert.deepStrictEqual(result, {
      email,
      username,
      password,
      idp: new URL('/', serverUrl).toString(),
      oidcIssuer: new URL('/', serverUrl).toString(),
      podUrl: new URL(username + '/', serverUrl).toString(),
      webId: new URL(username + '/profile/card#me', serverUrl).toString(),
    })

    // fetch webId and see that it exists
    const response = await fetch(result.webId, {
      headers: { accept: 'application/ld+json' },
    })
    const profileDocument = await response.json()
    assert.deepStrictEqual(profileDocument[1], {
      '@id': result.webId,
      '@type': [foaf.Person],
      [solid.oidcIssuer]: [{ '@id': result.oidcIssuer }],
    })
  })

  it('should create account using custom fetch', async () => {
    const fetchSpy = mock.fn(fetch)

    const serverUrl = `http://localhost:${port}`

    const username = randomUUID()
    const email = username + '@example'
    const password = 'correcthorsebatterystaples'
    const result = await v7.createAccount({
      username,
      email,
      password,
      oidcIssuer: serverUrl,
      fetch: fetchSpy,
    })

    assert.deepStrictEqual(result, {
      email,
      username,
      password,
      idp: new URL('/', serverUrl).toString(),
      oidcIssuer: new URL('/', serverUrl).toString(),
      podUrl: new URL(username + '/', serverUrl).toString(),
      webId: new URL(username + '/profile/card#me', serverUrl).toString(),
    })

    assert.ok(fetchSpy.mock.callCount() > 0)

    // fetch webId and see that it exists
    const response = await fetch(result.webId, {
      headers: { accept: 'application/ld+json' },
    })
    const profileDocument = await response.json()
    assert.deepStrictEqual(profileDocument[1], {
      '@id': result.webId,
      '@type': [foaf.Person],
      [solid.oidcIssuer]: [{ '@id': result.oidcIssuer }],
    })
  })
})
