/**
 * These methods are based on CSS documentation
 * https://communitysolidserver.github.io/CommunitySolidServer/7.x/usage/client-credentials/
 *
 *
Original license:

MIT License

Copyright © 2019–2025 Inrupt Inc. and imec

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included
in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF
OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
  buildAuthenticatedFetch,
  createDpopHeader,
  generateDpopKeyPair,
  KeyPair,
} from '@inrupt/solid-client-authn-core'
import tough from 'tough-cookie'
import { toBase64 } from './utils.js'

interface AccountHandles {
  controls: {
    password: { login: string; create: string }
    account: { webId: string; pod: string; clientCredentials: string }
  }
}

const getAccountAuthorization = async ({
  provider,
  email,
  password,
  fetch: customFetch = globalThis.fetch,
}: {
  provider: string
  email: string
  password: string
  fetch?: typeof globalThis.fetch
}) => {
  // First we request the account API controls to find out where we can log in
  const indexResponse = await customFetch(new URL('.account/', provider))

  await throwIfResponseNotOk(indexResponse)

  const { controls } = (await indexResponse.json()) as AccountHandles

  // And then we log in to the account API
  const response = await customFetch(controls.password.login, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  await throwIfResponseNotOk(response)

  // This authorization value will be used to authenticate in the next step
  const { authorization } = (await response.json()) as { authorization: string }
  return authorization
}

const getIdAndSecret = async ({
  authorization,
  provider,
  webId,
  fetch: customFetch = globalThis.fetch,
}: {
  authorization: string
  provider: string
  webId?: string
  fetch?: typeof globalThis.fetch
}) => {
  // Now that we are logged in, we need to request the updated controls from the server.
  // These will now have more values than in the previous example.
  const indexResponse = await customFetch(new URL('.account/', provider), {
    headers: { authorization: `CSS-Account-Token ${authorization}` },
  })

  await throwIfResponseNotOk(indexResponse)

  const handles = (await indexResponse.json()) as AccountHandles

  // Here we request the server to generate a token on our account
  const response = await customFetch(
    handles.controls.account.clientCredentials,
    {
      method: 'POST',
      headers: {
        authorization: `CSS-Account-Token ${authorization}`,
        'content-type': 'application/json',
      },
      // The name field will be used when generating the ID of your token.
      // The WebID field determines which WebID you will identify as when using the token.
      // Only WebIDs linked to your account can be used.
      body: JSON.stringify({
        name: 'my-token',
        webId: await getWebId({
          webId,
          handles,
          authorization,
          fetch: customFetch,
        }),
      }),
    },
  )

  await throwIfResponseNotOk(response)

  // These are the identifier and secret of your token.
  // Store the secret somewhere safe as there is no way to request it again from the server!
  // The `resource` value can be used to delete the token at a later point in time.
  const { id, secret /*, resource*/ } = (await response.json()) as {
    id: string
    secret: string
    resource: string
  }

  return { id, secret }
}

const getWebId = async ({
  webId,
  handles,
  authorization,
  fetch: customFetch = globalThis.fetch,
}: {
  webId?: string
  handles: AccountHandles
  authorization: string
  fetch?: typeof globalThis.fetch
}) => {
  // now let's get all available webIds

  const webIdsResponse = await customFetch(handles.controls.account.webId, {
    headers: {
      authorization: `CSS-Account-Token ${authorization}`,
    },
  })

  await throwIfResponseNotOk(webIdsResponse)

  const webIdsBody = (await webIdsResponse.json()) as {
    webIdLinks: { [key: string]: string }
  }

  const webIds = Object.keys(webIdsBody.webIdLinks)

  if (webId) {
    if (webIds.includes(webId)) return webId
    else throw new Error("linked webIds don't include provided webId")
  }

  if (webIds.length === 0)
    throw new Error('no webId associated with this account')

  return webIds[0]
}

const getAccessToken = async ({
  id,
  secret,
  provider,
  fetch: customFetch = globalThis.fetch,
}: {
  id: string
  secret: string
  provider: string
  fetch?: typeof globalThis.fetch
}) => {
  // A key pair is needed for encryption.
  // This function from `solid-client-authn` generates such a pair for you.
  const dpopKey = await generateDpopKeyPair()

  // These are the ID and secret generated in the previous step.
  // Both the ID and the secret need to be form-encoded.
  const authString = `${encodeURIComponent(id)}:${encodeURIComponent(secret)}`
  // This URL can be found by looking at the "token_endpoint" field at
  // http://localhost:3000/.well-known/openid-configuration
  // if your server is hosted at http://localhost:3000/.
  const tokenUrl = new URL('.oidc/token', provider)
  const response = await customFetch(tokenUrl, {
    method: 'POST',
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${toBase64(authString)}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(tokenUrl.toString(), 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
  })

  await throwIfResponseNotOk(response)

  // This is the Access token that will be used to do an authenticated request to the server.
  // The JSON also contains an "expires_in" field in seconds,
  // which you can use to know when you need request a new Access token.
  const { access_token: accessToken } = (await response.json()) as {
    access_token: string
  }

  return { accessToken, dpopKey }
}

const generateAuthenticatedFetch = async ({
  accessToken,
  dpopKey,
  fetch: customFetch = globalThis.fetch,
}: {
  accessToken: string
  dpopKey: KeyPair
  fetch?: typeof globalThis.fetch
}) => {
  // The DPoP key needs to be the same key as the one used in the previous step.
  // The Access token is the one generated in the previous step.
  const authFetch = await buildAuthenticatedFetch(customFetch, accessToken, {
    dpopKey,
  })

  return authFetch
}

export const getAuthenticatedFetch = async ({
  provider,
  email,
  password,
  webId,
  fetch: customFetch = globalThis.fetch,
}: {
  provider: string
  email: string
  password: string
  webId?: string
  fetch?: typeof globalThis.fetch
}) => {
  const authorization = await getAccountAuthorization({
    provider,
    email,
    password,
    fetch: customFetch,
  })

  const { id, secret } = await getIdAndSecret({
    authorization,
    provider,
    webId,
    fetch: customFetch,
  })
  const { accessToken, dpopKey } = await getAccessToken({
    id,
    secret,
    provider,
    fetch: customFetch,
  })
  return await generateAuthenticatedFetch({
    accessToken,
    dpopKey,
    fetch: customFetch,
  })
}

const throwIfResponseNotOk = async (response: Response) => {
  if (!response.ok)
    throw new Error(
      `Query was not successful: ${response.status} ${await response.text()}`,
    )
}

// TODO get rid of the tough-cookie
// use CSS-Account-Token header instead
export const createAccount = async ({
  username,
  password,
  email,
  provider,
  fetch: customFetch = globalThis.fetch,
}: {
  username: string
  password: string
  email: string
  provider: string
  fetch?: typeof globalThis.fetch
}) => {
  const config = {
    idp: new URL('./', provider).toString(),
    podUrl: '',
    webId: '',
    username,
    password,
    email,
  }

  const accountEndpoint = new URL('.account/account/', provider).toString()

  // create the account
  const response = await customFetch(accountEndpoint, { method: 'post' })
  await throwIfResponseNotOk(response)

  const jar = new tough.CookieJar()
  const accountCookie = response.headers.get('set-cookie')

  if (!accountCookie)
    throw new Error('unexpectedly authorization cookie not available')
  await jar.setCookie(accountCookie, provider)

  // get account handles
  const response2 = await customFetch(
    new URL('.account/', provider).toString(),
    { headers: { cookie: await jar.getCookieString(provider) } },
  )
  await throwIfResponseNotOk(response2)

  const handles = (await response2.json()) as AccountHandles

  const createLoginResponse = await customFetch(
    handles.controls.password.create,
    {
      method: 'post',
      body: JSON.stringify({ email, password, confirmPassword: password }),
      headers: {
        'content-type': 'application/json',
        cookie: await jar.getCookieString(handles.controls.password.create),
      },
    },
  )
  await throwIfResponseNotOk(createLoginResponse)

  const response3 = await customFetch(handles.controls.account.pod, {
    method: 'post',
    headers: {
      cookie: await jar.getCookieString(handles.controls.account.pod),
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: username }),
  })

  await throwIfResponseNotOk(response3)

  const body = (await response3.json()) as { pod: string; webId: string }

  config.webId = body.webId
  config.podUrl = body.pod

  return config
}
