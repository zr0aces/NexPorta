# Changelog

All notable changes to NexPorta will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Calendar Versioning](https://calver.org/) in the format `YYYY.M.MINOR`.

## [2026.6.4] - 2026-06-14

### Added
- Search input clear button in the dashboard UI.
- Improved empty state messages for dashboard search.

### Changed
- Refactored code structure for improved readability and maintainability.
- Updated `.gitignore` to include agent memory and rules files.
- Configured docker-compose port to load from environment variable (`PORT`).

## [2026.6.3] - 2026-06-14

### Fixed
- Fixed release script to specify the `main` branch when pushing git tags.

## [2026.6.2] - 2026-06-14

### Changed
- Bumped version reference across package config files and `version.js`.

## [2026.6.1] - 2026-06-14

### Added
- First public release.
- CalVer version sync and release helper scripts (`scripts/sync-version.mjs`, `scripts/release.mjs`).
- Production Docker images support for indexer and web dashboard.
- GitHub Actions CI/CD workflow to auto-publish multi-arch images on release.
- Docker healthchecks for indexer and web services.
- Extracted and documented UI design system specs.
