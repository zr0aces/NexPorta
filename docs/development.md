# Development

## Setup
Local development requires Node.js 22 LTS or Docker.

## Run

### Run Indexer Locally (no Docker)
```bash
cd indexer
CONTENT_DIR=../content OUTPUT_FILE=/tmp/index.json node index.js
```

### Start Full Stack (Docker)
```bash
docker compose up -d
```

## Test

### Run All Tests
```bash
cd indexer && node --test tests/*.test.js
```

### Run Single Test File
```bash
cd indexer && node --test tests/extractor.test.js
```

## Build

### Rebuild after Dockerfile changes
```bash
docker compose build && docker compose up -d
```

## Operations & Debugging

### View Logs
```bash
docker compose logs indexer
docker compose logs web
```

### Full Reset (recreates volumes)
```bash
docker compose down -v && docker compose up -d
```

## Versioning Commands

### Sync Version from VERSION file
```bash
node scripts/sync-version.mjs
```

Sync is metadata-only: it never bumps, installs dependencies, builds, or changes Git.
Validate without writing:

```bash
node scripts/sync-version.mjs --check
node --test scripts/version-control.test.mjs
```

### Bump CalVer release version and sync
```bash
node scripts/release.mjs
```

Default release only prepares and checks the version. It uses the fixed GMT+7
calendar; same/future calendar prefixes increment their counter, later months
reset to 1. VERSION must already exist and be valid. An explicit target uses
`--version YYYY.M.N`, must be newer, and cannot name a future calendar month.
Positional versions, `-v`, leading `v`, and `patch` remain deprecated aliases.

`--tag` opts into an exact-path commit and annotated tag. It requires an empty
index, an attached branch, and no existing local tag; unrelated files are not
staged. NexPorta has no release build recipe, so `--build` fails unchanged. Build
the stack separately using the existing Docker commands above.

Preparation write/check failure rolls back file bytes. Later Git failure keeps
the prepared version; tag failure keeps the commit and reports its SHA. Recover
with exact manual commands rather than another auto bump. In-memory rollback
cannot survive power loss or SIGKILL.

No command pushes. Review the printed exact-path staging/commit/tag commands,
verify the exact remote tag is absent, then manually push the actual upstream
branch and that single tag separately. Missing upstream needs explicit selection.
