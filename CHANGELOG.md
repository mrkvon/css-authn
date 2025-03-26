# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
- **BREAKING CHANGE**: Remove default values from `v7.createAccount`. (cb0ba481fa0277448680c297af4c59d8901508dd)

## [0.0.16] - 2024-05-04

### Added

- All changes until this release. Do not conform to SemVer.
