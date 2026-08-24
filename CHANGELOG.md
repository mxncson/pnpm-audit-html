# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Refreshed every dependency to its newest CommonJS-compatible release: `marked` 14 -> 15,
  `ejs` 3 -> 6, `commander` 12 -> 14, `jest` 29 -> 30, `eslint` 9 -> 10, `@types/node` 22 -> 24,
  plus all remaining minors and patches. Report output is byte-identical.
- CI installs with pnpm 10, matching the version that writes the lockfile.
- `marked`, `commander` and `typescript` are deliberately held one major back: `marked` 16+ and
  `commander` 15 are ESM-only, and `typescript-eslint` does not support TypeScript 7. Moving to
  them requires converting the package to ESM.

### Removed
- `ts-node`, which nothing referenced.

### Security
- `pnpm.overrides` pins patched `brace-expansion` and `js-yaml` in the dev tree. `pnpm audit` on
  this repo now reports zero advisories, down from eight; the production tree was already clean.

## [0.4.0] - 2026-08-24

### Added
- `-f, --fail-on <severity>` gates CI: exits `2` when vulnerabilities at or above the given
  severity are found. Exit `1` stays reserved for the tool itself failing, so a pipeline can
  tell a broken audit from a failing one.
- `engines` now declares Node >= 20.

### Fixed
- **Advisory markdown can no longer inject HTML or scripts into the report.** Raw HTML in
  `overview`, `recommendation` and `references` was rendered verbatim; it is now dropped, and
  links with schemes other than `http`, `https` and `mailto` render as plain text.
- Reports no longer hot-link Bootswatch from a CDN. The theme is inlined, so a report renders
  offline, in airgapped CI, and years later as an archived artifact. Reports grow to ~230 KB.
- Duplicate `id` attributes: an advisory with several findings emitted one card and one
  severity anchor per finding, so the summary links jumped to a duplicated id. Advisories now
  render one card each, listing every installed version, which also makes the "N unique"
  count in the header match the number of cards.
- `info` severity rendered with the `success` badge on cards and `secondary` in the summary.
  Both now share one mapping.
- `generateHtml` no longer mutates the audit data it is handed.
- The references list is no longer wrapped in a second, redundant `<ul>`.
- The release workflow no longer fails when a GitHub release already exists for the tag.

### Changed
- Dates render as ISO (`2024-01-15`, `2026-08-24T12:00:00.000Z`) instead of the generating
  machine's locale, so a report reads the same everywhere and diffs cleanly.
- CI runs on Node 20, 22 and 24 (was 18 and 20).

### Removed
- `templates/reportTemplateAccordion.ejs`, which no code path ever loaded.

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
