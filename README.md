# `css-authn`

[![GitHub License](https://img.shields.io/github/license/mrkvon/css-authn)](https://github.com/mrkvon/css-authn/blob/main/LICENSE)
[![NPM Version](https://img.shields.io/npm/v/css-authn)](https://npmjs.com/package/css-authn)
![NPM Type Definitions](https://img.shields.io/npm/types/css-authn)

Utilities to authenticate to Community Solid Server via its API

Supported versions are 6.x and 7.x.

This package is based on _Automating authentication with Client Credentials_ [v6](https://communitysolidserver.github.io/CommunitySolidServer/6.x/usage/client-credentials/) and [v7](https://communitysolidserver.github.io/CommunitySolidServer/7.x/usage/client-credentials/).

## Usage

```ts
import { v6, v7 } from 'css-authn'
// or import { createAccount, getAuthenticatedFetch } from 'css-authn/dist/7.x'

// the methods return a Promise, so you can wrap them in async function, and await them...
// get authenticated fetch
const authenticatedFetch = await v7.getAuthenticatedFetch({
  email: 'email@example',
  password: 'password',
  provider: 'https://solidserver.example', // no trailing slash!
  webId: 'https://solidserver.example/person/profile/card#me' // (optional) if there are multiple webIds associated with the account, you need to specify which one to authenticate with
  fetch, // (optional) you can also provide your own fetch compatible with native Node fetch
})

// in version 7, there's also a method to create account and pod
await v7.createAccount({
  username: 'username',
  password: 'password',
  email: 'email@example.com',
  provider: 'https://solidserver.example', // no trailing slash!
  fetch, // (optional) you can also provide your own fetch compatible with native Node fetch
})
```
