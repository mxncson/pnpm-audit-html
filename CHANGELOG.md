# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Fixed
- The release workflow no longer fails when a GitHub release already exists for the tag.

## [0.3.0] - 2026-08-24

### Added
- `-v, --verbose` flag to print the full error stack on failure

### Fixed
- **Exit with code 1 when report generation fails.** The CLI previously exited 0 on any
  failure, so CI pipelines passed silently when the audit or report generation broke.
  **Breaking for consumers:** a pipeline whose audit was already failing goes from green
  to red on upgrade. A successful run still exits 0 even when vulnerabilities are found.

### Changed
- Only publish `dist/` and `templates/` to npm (`files` field). Previous releases shipped
  `src/`, test files, CI workflows and tooling configs.
- Stop dumping the full error stack by default; use `--verbose` instead.
- CI now runs `check-types` and `build` alongside lint and tests, and runs on pull
  requests targeting `main` (it previously excluded `main` as a base branch, so PRs into
  `main` had no checks of their own).
- Releases are now driven by the `v*` git tag instead of any change to `package.json`,
  so editing `package.json` without a version bump no longer attempts a duplicate publish.
- npm packages are published with provenance attestation.
- The release workflow now creates the GitHub release it was always named for.

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
