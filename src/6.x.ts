/**
 * These methods are based on CSS documentation
 * https://communitysolidserver.github.io/CommunitySolidServer/6.x/usage/client-credentials/
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
  KeyPair,
  buildAuthenticatedFetch,
  createDpopHeader,
  generateDpopKeyPair,
} from '@inrupt/solid-client-authn-core'
import { toBase64 } from './utils.js'

// https://communitysolidserver.github.io/CommunitySolidServer/6.x/usage/client-credentials/#generating-a-token
const generateToken = async ({
  oidcIssuer,
  email,
  password,
  tokenName = 'my-token',
  fetch: customFetch,
}: {
  oidcIssuer: string
  email: string
  password: string
  tokenName?: string
  fetch: typeof globalThis.fetch
}) => {
  // This assumes your server is started under http://localhost:3000/.
  // This URL can also be found by checking the controls in JSON responses when interacting with the IDP API,
  // as described in the Identity Provider section.
  const response = await customFetch(
    new URL('idp/credentials/', oidcIssuer).toString(),
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      // The email/password fields are those of your account.
      // The name field will be used when generating the ID of your token.
      body: JSON.stringify({ email, password, name: tokenName }),
    },
  )

  if (!response.ok) {
    throw new Error(
      `request failed with ${response.status} ${await response.text()}`,
    )
  }

  // These are the identifier and secret of your token.
  // Store the secret somewhere safe as there is no way to request it again from the server!
  const { id, secret } = (await response.json()) as {
    id: string
    secret: string
  }

  return { id, secret }
}

// https://communitysolidserver.github.io/CommunitySolidServer/6.x/usage/client-credentials/#requesting-an-access-token
const requestAccessToken = async ({
  oidcIssuer,
  id,
  secret,
  fetch: customFetch,
}: {
  oidcIssuer: string
  id: string
  secret: string
  fetch: typeof globalThis.fetch
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
  const tokenUrl = new URL('.oidc/token', oidcIssuer).toString()
  const response = await customFetch(tokenUrl, {
    method: 'POST',
    headers: {
      // The header needs to be in base64 encoding.
      authorization: `Basic ${toBase64(authString)}`,
      'content-type': 'application/x-www-form-urlencoded',
      dpop: await createDpopHeader(tokenUrl, 'POST', dpopKey),
    },
    body: 'grant_type=client_credentials&scope=webid',
  })

  if (!response.ok) {
    throw new Error(
      `request failed with ${response.status} ${await response.text()}`,
    )
  }

  // This is the Access token that will be used to do an authenticated request to the server.
  // The JSON also contains an "expires_in" field in seconds,
  // which you can use to know when you need request a new Access token.
  const { access_token: accessToken } = (await response.json()) as {
    access_token: string
  }

  return { accessToken, dpopKey }
}

// https://communitysolidserver.github.io/CommunitySolidServer/6.x/usage/client-credentials/#using-the-access-token-to-make-an-authenticated-request
const authenticateFetch = async ({
  dpopKey,
  accessToken,
  fetch: customFetch,
}: {
  dpopKey: KeyPair
  accessToken: string
  fetch: typeof globalThis.fetch
}) => {
  // The DPoP key needs to be the same key as the one used in the previous step.
  // The Access token is the one generated in the previous step.
  const authFetch = buildAuthenticatedFetch(accessToken, {
    dpopKey,
    fetch: customFetch,
  })
  // authFetch can now be used as a standard fetch function that will authenticate as your WebID.
  return authFetch
}

export const getAuthenticatedFetch = async ({
  provider,
  oidcIssuer: oidcIssuer_,
  email,
  password,
  fetch: customFetch = globalThis.fetch,
}:
  | {
      /** @deprecated Use oidcIssuer instead */
      provider: string
      oidcIssuer?: never
      email: string
      password: string
      fetch?: typeof globalThis.fetch
    }
  | {
      /** @deprecated Use oidcIssuer instead */
      provider?: never
      oidcIssuer: string
      email: string
      password: string
      fetch?: typeof globalThis.fetch
    }) => {
  const oidcIssuer = oidcIssuer_ ?? provider

  const { id, secret } = await generateToken({
    oidcIssuer,
    email,
    password,
    fetch: customFetch,
  })
  const { dpopKey, accessToken } = await requestAccessToken({
    oidcIssuer,
    id,
    secret,
    fetch: customFetch,
  })

  const authenticatedFetch = await authenticateFetch({
    dpopKey,
    accessToken,
    fetch: customFetch,
  })

  return authenticatedFetch
}
