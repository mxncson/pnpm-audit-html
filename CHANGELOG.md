# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.2.0] - 2026-07-15

### Added
- Support for pnpm v11+ audit format

### Fixed
- Handle missing `overview` field in audit data (pnpm v11)
- Normalize `cwe` field when emitted as string instead of array (pnpm v11)
- Render safety checks for optional fields in HTML templates

### Changed
- **Breaking:** Requires pnpm v8.0.0 or higher (was v6+)

## [0.1.13-alpha] - 2026-07-15
