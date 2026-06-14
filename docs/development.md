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

### Bump CalVer release version and sync
```bash
node scripts/release.mjs
```
