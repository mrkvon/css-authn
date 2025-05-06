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
  provider: 'https://solidserver.example',
  webId: 'https://solidserver.example/person/profile/card#me', // (optional) if there are multiple webIds associated with the account, you need to specify which one to authenticate with
})

// in version 7, there's also a method to create account and pod
await v7.createAccount({
  username: 'username',
  password: 'password',
  email: 'email@example.com',
  provider: 'https://solidserver.example',
})
```

## License

MIT (c) 2024 mrkvon

### Notice

This code is substantially based on [Community Solid Server documentation](https://github.com/CommunitySolidServer/CommunitySolidServer/blob/main/documentation/markdown/usage/client-credentials.md) with [license](https://github.com/CommunitySolidServer/CommunitySolidServer/blob/main/LICENSE.md):

```md
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
```
