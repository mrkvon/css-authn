# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2025-05-06

### Added

- Setup tests with `node:test` runner. Usage: `yarn test` and `yarn test:watch`. (beb7a60f429743c84f8aba348c0c8bf6fd10f8a7)
- Add github workflows. (beb7a60f429743c84f8aba348c0c8bf6fd10f8a7)

### Changed

- **BREAKING CHANGE:**: Upgrade `@inrupt/solid-client-authn-core` to v2. (4b50e1fe2fa2261bb7b5482c327b0b97d82628f3)  
  Custom fetch is no longer supported.  
  Drop support for Node v16. Supported Node versions are 18, 20, 22.
- Switch from cookie to authorization header in `v7.createAccount`. (f9e172752bec6c3b269745b962ab73f012956980)

## [0.1.1] - 2025-03-26

### Fixed

- Return correct webId and podUrl for subdomain pods from `v7.createAccount`. (1adbbb1767adcae028096cf70dee9941e16c0fe8)

## [0.1.0] - 2025-01-30

### Added

- Add support for ESM and CJS builds. (55c8d850250d44857a35ed38afc2e650bb0cfea2)
- Start using [Conventional Commits](https://www.conventionalcommits.org/) for commit messages.
- Create a changelog using [Keep a Changelog](https://keepachangelog.com/) format. (cb0ba481fa0277448680c297af4c59d8901508dd)

### Changed

- Refactor `v7.getAuthenticatedFetch` to use auth header instead of a cookie. This improves compatibility with browser. (90ac826c98b6d5316bb7bd36c7331e15943d6021)
- **BREAKING CHANGE:** Remove default values from `v7.createAccount`. (cb0ba481fa0277448680c297af4c59d8901508dd)

## [0.0.16] - 2024-05-04

### Added

- All changes until this release. Do not conform to SemVer.
