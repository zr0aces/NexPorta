# Decisions

This document records the architectural decision records (ADR) for NexPorta.

## 2026-06-14 — Use CalVer for Versioning

- **Context**: Versioning scheme is needed to manage releases, Docker images, and sync with source code files.
- **Decision**: Adopt Calendar Versioning (CalVer) in the format `YYYY.M.MINOR` (e.g. `2026.6.4`).
- **Reason**: The project is lightweight, and releasing monthly updates based on calendar progression fits the low-maintenance, self-hosted deployment model.

## 2026-06-14 — Framework-Free Vanilla Frontend

- **Context**: Selecting a frontend framework (React, Vue, Svelte, etc.) for the dashboard.
- **Decision**: Build the dashboard using pure Vanilla HTML, CSS, and JS (ES Modules) without a framework.
- **Reason**: Keeps frontend memory usage and bundle size near zero. Avoids build tools/compilers for the frontend assets, matching the design principle of simplicity and longevity.

## 2026-06-14 — Regular Expression for Title Extraction

- **Context**: Parsing HTML files in the indexer to extract `<title>` and `<h1>`.
- **Decision**: Use regular expressions in [indexer/extractor.js](file:///home/san/workspace/NexPorta/indexer/extractor.js) rather than loading a heavy HTML parser library.
- **Reason**: The HTML files being indexed are trusted local files. A regex approach runs much faster and keeps dependencies down to zero.

## 2026-06-14 — Filesystem as Single Source of Truth (No Database)

- **Context**: Storing indexed file metadata.
- **Decision**: Index metadata directly into a static `/data/index.json` file shared between containers via a Docker volume. Do not introduce a database.
- **Reason**: Avoids database maintenance, reduces total system RAM requirements, and makes backups as simple as copying folders.
